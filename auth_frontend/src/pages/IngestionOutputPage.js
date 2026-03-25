import React, { useEffect, useState } from "react";
import { fetchMockRequiredIngestionFields } from "../services/ingestionApi";
import JsonTable from "../components/JsonTable";

/**
 * Workflow -> Ingestion layer page (backend-integrated).
 *
 * Subtask requirement:
 * - Show ONLY the JSON-as-tables under the heading.
 * - Hide/remove all other non-JSON status/help blocks.
 */

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  /**
   * Workflow ingestion output page that displays the backend /mock response
   * without reshaping it (renders exact JSON structure).
   *
   * UI note:
   * We still fetch asynchronously, but we intentionally do NOT render loading/error/help
   * blocks in the UI; only the JSON tables appear below the heading.
   */
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await fetchMockRequiredIngestionFields();
        if (cancelled) return;
        // IMPORTANT: do not reshape. Render exactly what backend returns.
        setPayload(data);
      } catch {
        // Intentionally suppress error UI for this subtask (hide status blocks).
        // Leaving payload as null will render nothing under the heading.
        if (cancelled) return;
        setPayload(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion mock output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Mock ingestion payload">
        <div className="auth-wide-content ingestion-output">
          <header className="ingestion-output__header">
            <h1 className="auth-title ingestion-output__title">Workflow · Ingestion (/mock)</h1>
          </header>

          {/* Only render the JSON tables under the heading (no other blocks). */}
          {payload === null || payload === undefined ? null : (
            <div className="ingestion-output__tableWrap" aria-label="Mock payload table">
              <JsonTable value={payload} minWidth={840} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
