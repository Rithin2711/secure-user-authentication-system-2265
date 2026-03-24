import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchMockRequiredIngestionFields } from "../services/ingestionApi";

/**
 * Work Flow Results Page (UI-only + small backend call on ingestion TAB click).
 *
 * Responsibilities:
 * - Provide a dashboard-like header (matching Upload page top bar styling).
 * - Render 4 agent selector blocks: Ingestion, Validation, Inventory, Pricing.
 * - Allow selecting an agent; the selected agent is visually highlighted.
 * - Render the selected agent output below:
 *   - Ingestion TAB: calls backend GET /mock on tab click and renders:
 *        - heading: "Required Ingestion field"
 *        - key/value pairs in a table
 *   - Others: placeholders for now.
 *
 * Routing:
 * - Accessible via hash route: #/orchestrator
 */

function toKeyValueRows(payload) {
  if (payload === null || payload === undefined) return [];
  if (typeof payload !== "object") return [["value", String(payload)]];

  // Prefer stable ordering for predictable UI.
  return Object.entries(payload)
    .map(([k, v]) => [String(k), v])
    .sort((a, b) => a[0].localeCompare(b[0]));
}

function previewValue(value) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") return value.trim() ? value : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// PUBLIC_INTERFACE
export default function OrchestratorResultsPage() {
  /** Orchestrator results shell with agent selectors + output area. */
  const [selectedAgent, setSelectedAgent] = useState("ingestion"); // ingestion | validation | inventory | pricing

  // Ingestion TAB data (from /mock)
  const [mockStatus, setMockStatus] = useState("idle"); // idle | loading | success | error
  const [mockData, setMockData] = useState(null);
  const [mockError, setMockError] = useState("");

  // Top dashboard user menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuWrapRef = useRef(null);

  const displayName = useMemo(() => {
    try {
      const email = localStorage.getItem("auth_email");
      if (email && String(email).trim()) return String(email).trim();
    } catch {
      // ignore
    }
    return "User";
  }, []);

  // Close user menu on outside click / Escape for expected UX.
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const onDocMouseDown = (ev) => {
      const wrap = userMenuWrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(ev.target)) setIsUserMenuOpen(false);
    };

    const onDocKeyDown = (ev) => {
      if (ev.key === "Escape") setIsUserMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [isUserMenuOpen]);

  const agents = useMemo(
    () => [
      {
        key: "ingestion",
        title: "Ingestion",
        subtitle: "Required ingestion fields (from /mock)",
        status: "success",
      },
      {
        key: "validation",
        title: "Validation",
        subtitle: "Validate extracted payload (placeholder)",
        status: "idle",
      },
      {
        key: "inventory",
        title: "Inventory",
        subtitle: "Check inventory availability (placeholder)",
        status: "idle",
      },
      {
        key: "pricing",
        title: "Pricing",
        subtitle: "Compute pricing & totals (placeholder)",
        status: "idle",
      },
    ],
    []
  );

  const outputHeader = useMemo(() => {
    const a = agents.find((x) => x.key === selectedAgent);
    return a ? a.title : "Output";
  }, [agents, selectedAgent]);

  const onLogout = () => {
    // PUBLIC_INTERFACE
    /** Clears stored auth info and returns user to the Login page. */
    try {
      localStorage.removeItem("auth_access_token");
      localStorage.removeItem("auth_email");
      localStorage.removeItem("auth_user_id");
    } catch {
      // ignore
    }

    try {
      sessionStorage.removeItem("intake_agent_extracted_json");
    } catch {
      // ignore
    }

    setIsUserMenuOpen(false);
    window.location.hash = "#/login";
  };

  const onOpenSettings = () => {
    // PUBLIC_INTERFACE
    /** UI-only placeholder for settings. */
    setIsUserMenuOpen(false);
    // eslint-disable-next-line no-alert
    alert("Settings (coming soon)");
  };

  const selectedStylesFor = (status, isSelected) => {
    const base = {
      border: "1px solid rgba(255,255,255,0.14)",
      bg: "rgba(255,255,255,0.06)",
      dot: "rgba(255,255,255,0.65)",
      glow: "transparent",
    };

    if (status === "success") {
      base.border = "1px solid rgba(34,197,94,0.28)";
      base.bg = "linear-gradient(180deg, rgba(34,197,94,0.14), rgba(255,255,255,0.04))";
      base.dot = "rgba(34,197,94,0.95)";
      base.glow = "rgba(34,197,94,0.14)";
    }

    if (!isSelected) return base;

    // "Selected" highlight: brighter border + subtle inner highlight and gradient.
    return {
      ...base,
      border: "1px solid rgba(255,255,255,0.22)",
      bg:
        "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))," +
        "linear-gradient(180deg, rgba(59,130,246,0.14), rgba(6,182,212,0.06))",
      dot: "rgba(255,255,255,0.92)",
      glow: "rgba(59,130,246,0.22)",
    };
  };

  const AgentSelector = ({ agent }) => {
    const isSelected = agent.key === selectedAgent;
    const s = selectedStylesFor(agent.status, isSelected);

    return (
      <button
        type="button"
        onClick={() => {
          // Fetch /mock *on tab click* (only for ingestion).
          if (agent.key === "ingestion") {
            setMockStatus("loading");
            setMockError("");
            fetchMockRequiredIngestionFields()
              .then((data) => {
                setMockData(data);
                setMockStatus("success");
              })
              .catch((e) => {
                setMockData(null);
                setMockError(e instanceof Error ? e.message : "Failed to load required ingestion fields.");
                setMockStatus("error");
              });
          }

          setSelectedAgent(agent.key);
        }}
        aria-pressed={isSelected}
        aria-label={`Select ${agent.title} agent`}
        style={{
          textAlign: "left",
          cursor: "pointer",

          width: "100%",
          minWidth: 220,

          borderRadius: 16,
          border: s.border,
          background: s.bg,
          boxShadow: isSelected ? `0 18px 48px ${s.glow}` : "0 10px 28px rgba(0,0,0,0.20)",

          padding: "14px 14px",
          color: "rgba(255,255,255,0.92)",
          transform: isSelected ? "translateY(-1px)" : "translateY(0px)",
          transition: "transform 120ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: s.dot,
                boxShadow: `0 0 0 4px rgba(255,255,255,0.06), 0 0 24px ${s.dot}`,
                flex: "0 0 auto",
              }}
            />
            <div
              style={{
                fontWeight: 950,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {agent.title}
            </div>
          </div>

          <span
            aria-hidden="true"
            style={{
              width: 30,
              height: 30,
              display: "grid",
              placeItems: "center",
              borderRadius: 999,
              border: isSelected ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.14)",
              background: isSelected ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
              color: "rgba(255,255,255,0.78)",
              flex: "0 0 auto",
              boxShadow: isSelected ? "inset 0 1px 0 rgba(255,255,255,0.10)" : "none",
            }}
            title="Selected"
          >
            {isSelected ? "✓" : "→"}
          </span>
        </div>

        {agent.subtitle ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 8, lineHeight: 1.35 }}>{agent.subtitle}</div>
        ) : null}
      </button>
    );
  };

  const renderIngestionTabOutput = () => {
    const rows = toKeyValueRows(mockData);

    return (
      <div
        role="region"
        aria-label="Required ingestion fields"
        style={{
          marginTop: 14,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.12)",
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>Required Ingestion field</div>
        <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.66)" }}>
          Source: <code style={{ color: "rgba(255,255,255,0.82)" }}>/mock</code>
        </div>

        {mockStatus === "idle" ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
            Click the <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 900 }}>Ingestion</span> tab to load required fields.
          </div>
        ) : null}

        {mockStatus === "loading" ? (
          <div
            role="status"
            style={{
              marginTop: 12,
              padding: "12px 12px",
              borderRadius: 14,
              border: "1px solid rgba(59,130,246,0.28)",
              background: "rgba(59,130,246,0.10)",
            }}
          >
            <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Loading…</div>
            <div style={{ marginTop: 6, color: "rgba(255,255,255,0.80)", fontSize: 13, lineHeight: 1.45 }}>
              Fetching required ingestion fields from the backend.
            </div>
          </div>
        ) : null}

        {mockStatus === "error" ? (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: "12px 12px",
              borderRadius: 14,
              border: "1px solid rgba(239,68,68,0.40)",
              background: "rgba(239,68,68,0.12)",
            }}
          >
            <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Unable to load required fields</div>
            <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
              {mockError || "Request failed."}
            </div>
          </div>
        ) : null}

        {mockStatus === "success" ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.66)" }}>{rows.length} fields</div>
              <button
                type="button"
                onClick={() => {
                  setMockStatus("loading");
                  setMockError("");
                  fetchMockRequiredIngestionFields()
                    .then((data) => {
                      setMockData(data);
                      setMockStatus("success");
                    })
                    .catch((e) => {
                      setMockData(null);
                      setMockError(e instanceof Error ? e.message : "Failed to load required ingestion fields.");
                      setMockStatus("error");
                    });
                }}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                }}
                aria-label="Refresh required ingestion fields"
              >
                Refresh
              </button>
            </div>

            <div
              style={{
                marginTop: 10,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.14)",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th
                        align="left"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          padding: "12px 12px",
                          fontSize: 12,
                          fontWeight: 950,
                          letterSpacing: "-0.01em",
                          color: "rgba(255,255,255,0.86)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                          borderBottom: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        Key
                      </th>
                      <th
                        align="left"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          padding: "12px 12px",
                          fontSize: 12,
                          fontWeight: 950,
                          letterSpacing: "-0.01em",
                          color: "rgba(255,255,255,0.86)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                          borderBottom: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([k, v], idx) => {
                      const rowBg = idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
                      return (
                        <tr key={k} style={{ background: rowBg }}>
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", verticalAlign: "top" }}>
                            <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.86)" }}>{k}</div>
                          </td>
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", verticalAlign: "top" }}>
                            <div style={{ fontSize: 12, fontWeight: 850, color: "rgba(255,255,255,0.90)", wordBreak: "break-word" }}>
                              {previewValue(v)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderOutput = () => {
    if (selectedAgent === "ingestion") {
      return renderIngestionTabOutput();
    }

    const placeholderTitle =
      selectedAgent === "validation"
        ? "Validation output"
        : selectedAgent === "inventory"
          ? "Inventory output"
          : "Pricing output";

    return (
      <div
        role="region"
        aria-label={placeholderTitle}
        style={{
          marginTop: 14,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.12)",
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>{placeholderTitle}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.70)", lineHeight: 1.5 }}>
          This agent is not wired yet. Select <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 850 }}>Ingestion</span>{" "}
          to view the implemented output.
        </div>
      </div>
    );
  };

  return (
    <main className="auth-page auth-page--wide" aria-label="Orchestrator results page">
      {/* Dashboard-style top bar (same style as Upload) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,

          padding: "12px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.10)",

          background: "linear-gradient(90deg, rgba(75, 62, 120, 0.52), rgba(59, 57, 112, 0.38), rgba(10, 26, 47, 0.26))",
          boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
        role="banner"
        aria-label="Dashboard header"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.10)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              flex: "0 0 auto",
              fontSize: 15,
              lineHeight: 1,
            }}
            title="Tool"
          >
            ⬆︎
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 950,
                letterSpacing: "-0.02em",
                color: "rgba(255,255,255,0.92)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "50vw",
              }}
              title="Tool Name"
            >
              Agentic Ecosystem
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.66)" }}>Work Flow results</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              window.location.hash = "#/upload";
            }}
            aria-label="Back to upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.12)",
              color: "rgba(255,255,255,0.92)",
              padding: "9px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden="true">←</span>
            Upload
          </button>

          <div ref={userMenuWrapRef} style={{ position: "relative", display: "inline-flex" }}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-label="Open user menu"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(0,0,0,0.12)",
                color: "rgba(255,255,255,0.92)",
                padding: "9px 12px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                maxWidth: 280,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                  flex: "0 0 auto",
                  fontSize: 14,
                  lineHeight: 1,
                }}
                title="User"
              >
                👤
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 190,
                }}
                title={displayName}
              >
                {displayName}
              </span>
              <span aria-hidden="true" style={{ opacity: 0.9 }}>
                ▾
              </span>
            </button>

            {isUserMenuOpen ? (
              <div
                role="menu"
                aria-label="User menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  minWidth: 220,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(16, 24, 39, 0.78)",
                  boxShadow: "0 18px 60px rgba(0, 0, 0, 0.45)",
                  padding: 8,
                  zIndex: 60,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <div
                  style={{
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.72)",
                    borderBottom: "1px solid rgba(255,255,255,0.10)",
                    marginBottom: 6,
                  }}
                >
                  Signed in as <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950 }}>{displayName}</span>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={onOpenSettings}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.92)",
                    padding: "10px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 850,
                    letterSpacing: "-0.01em",
                    marginBottom: 8,
                  }}
                >
                  Settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={onLogout}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: 12,
                    border: "1px solid rgba(239,68,68,0.35)",
                    background: "rgba(239,68,68,0.12)",
                    color: "rgba(255,255,255,0.92)",
                    padding: "10px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 950,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="auth-card auth-card--flat" role="region" aria-label="Orchestrator content">
        {/* spacing so content starts below fixed bar */}
        <div className="auth-wide-content" style={{ paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 className="auth-title" style={{ margin: 0 }}>
                Work Flow
              </h1>
              <p className="auth-subtitle" style={{ marginTop: 8 }}>
                Select an agent to view its output.
              </p>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.70)",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.12)",
                padding: "8px 10px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              Selected: <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950 }}>{outputHeader}</span>
            </div>
          </div>

          {/* Agent selectors */}
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            {agents.map((a) => (
              <AgentSelector key={a.key} agent={a} />
            ))}
          </div>

          {/* Output */}
          <div style={{ marginTop: 16 }}>{renderOutput()}</div>
        </div>
      </section>
    </main>
  );
}
