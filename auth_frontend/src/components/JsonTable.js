import React, { useMemo, useState } from "react";

/**
 * Nested JSON table renderer.
 *
 * Renders:
 * - Plain objects as a Key/Value table
 * - Arrays as a multi-row table (union of keys) if items are objects, otherwise as an indexed list
 * - Primitives as text
 *
 * This component is intentionally dependency-free and matches the existing inline table styling
 * used in OrchestratorResultsPage.
 */

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function primitivePreview(value) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") return value.trim() ? value : "—";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (typeof value === "object") return safeStringify(value);
  return String(value);
}

function unionKeysForObjectArray(items) {
  const set = new Set();
  for (const it of items) {
    if (!isPlainObject(it)) continue;
    for (const k of Object.keys(it)) set.add(String(k));
  }
  return Array.from(set);
}

function tableShellStyle({ minWidth = 520 } = {}) {
  return {
    marginTop: 8,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.14)",
    overflow: "hidden",
  };
}

function tableStyle({ minWidth = 520 } = {}) {
  return {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth,
  };
}

function headerCellStyle() {
  return {
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
    whiteSpace: "nowrap",
  };
}

function bodyCellStyle() {
  return {
    padding: "12px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "top",
  };
}

// PUBLIC_INTERFACE
export default function JsonTable({ value, label, defaultExpanded = true, minWidth = 520, maxDepth = 6 }) {
  /**
   * Render a nested JSON value into table form.
   *
   * @param {object} props
   * @param {any} props.value - Any JSON-compatible value.
   * @param {string=} props.label - Optional label for the block.
   * @param {boolean=} props.defaultExpanded - Whether nested blocks should start expanded.
   * @param {number=} props.minWidth - Minimum table width for horizontal scroll.
   * @param {number=} props.maxDepth - Safety limit to prevent excessive recursion.
   */
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));

  const content = useMemo(() => {
    if (maxDepth <= 0) {
      return (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
          {primitivePreview(value)}
        </div>
      );
    }

    // Primitive
    if (!isPlainObject(value) && !Array.isArray(value)) {
      return (
        <div style={{ fontSize: 12, fontWeight: 850, color: "rgba(255,255,255,0.90)", wordBreak: "break-word" }}>
          {primitivePreview(value)}
        </div>
      );
    }

    // Array
    if (Array.isArray(value)) {
      const items = value;
      const objectArray = items.every((x) => isPlainObject(x));
      const rowBgFor = (idx) => (idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)");

      if (items.length === 0) {
        return <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>—</div>;
      }

      if (!objectArray) {
        // Indexed list table: [index, value]
        return (
          <div style={tableShellStyle({ minWidth })}>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle({ minWidth })}>
                <thead>
                  <tr>
                    <th align="left" style={headerCellStyle()}>#</th>
                    <th align="left" style={headerCellStyle()}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ background: rowBgFor(idx) }}>
                      <td style={bodyCellStyle()}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.86)" }}>{idx}</div>
                      </td>
                      <td style={bodyCellStyle()}>
                        <JsonTable
                          value={it}
                          defaultExpanded={false}
                          minWidth={minWidth}
                          maxDepth={maxDepth - 1}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      const columns = unionKeysForObjectArray(items);
      const orderedColumns = columns.sort((a, b) => a.localeCompare(b));

      return (
        <div style={tableShellStyle({ minWidth: Math.max(minWidth, 560) })}>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle({ minWidth: Math.max(minWidth, 560) })}>
              <thead>
                <tr>
                  {orderedColumns.map((col) => (
                    <th key={col} align="left" style={headerCellStyle()}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} style={{ background: rowBgFor(idx) }}>
                    {orderedColumns.map((col) => (
                      <td key={col} style={bodyCellStyle()}>
                        <JsonTable
                          value={row?.[col]}
                          defaultExpanded={false}
                          minWidth={minWidth}
                          maxDepth={maxDepth - 1}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Object (Key/Value table)
    const entries = Object.entries(value).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    const rowBgFor = (idx) => (idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)");

    if (entries.length === 0) {
      return <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>—</div>;
    }

    return (
      <div style={tableShellStyle({ minWidth })}>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle({ minWidth })}>
            <thead>
              <tr>
                <th align="left" style={headerCellStyle()}>Key</th>
                <th align="left" style={headerCellStyle()}>Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k, v], idx) => (
                <tr key={String(k)} style={{ background: rowBgFor(idx) }}>
                  <td style={bodyCellStyle()}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.86)" }}>{String(k)}</div>
                  </td>
                  <td style={bodyCellStyle()}>
                    <JsonTable value={v} defaultExpanded={false} minWidth={minWidth} maxDepth={maxDepth - 1} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [value, minWidth, maxDepth]);

  // Optional label + collapse for large nested blocks
  if (!label) return content;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.92)",
          padding: "10px 10px",
          fontSize: 12,
          fontWeight: 950,
          letterSpacing: "-0.01em",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span aria-hidden="true" style={{ opacity: 0.9, flex: "0 0 auto" }}>
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded ? <div style={{ marginTop: 8 }}>{content}</div> : null}
    </div>
  );
}
