import React, { useMemo, useState } from 'react';

/**
 * Nested JSON table renderer.
 *
 * Renders:
 * - Plain objects as a Key/Value table
 * - Arrays as multi-row table (union of keys) if items are objects, otherwise indexed list
 * - Primitives as text
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function primitivePreview(value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') return value.trim() ? value : '—';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (typeof value === 'object') return safeStringify(value);
  return String(value);
}

function unionKeysForObjectArray(items: unknown[]): string[] {
  const set = new Set<string>();
  for (const it of items) {
    if (!isPlainObject(it)) continue;
    for (const k of Object.keys(it)) set.add(String(k));
  }
  return Array.from(set);
}

const tableShellStyle: React.CSSProperties = {
  marginTop: 8,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(0,0,0,0.14)',
  overflow: 'hidden',
};

function tableStyle(minWidth: number): React.CSSProperties {
  return { width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth };
}

const headerCellStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: '12px',
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: '-0.01em',
  color: 'rgba(255,255,255,0.86)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
  borderBottom: '1px solid rgba(255,255,255,0.10)',
  whiteSpace: 'nowrap',
};

const bodyCellStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  verticalAlign: 'top',
};

const rowBgFor = (idx: number): string =>
  idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)';

// ─── Props ────────────────────────────────────────────────────────────────

interface JsonTableProps {
  /** Any JSON-compatible value */
  value: unknown;
  /** Optional label for collapsible blocks */
  label?: string;
  /** Whether nested blocks start expanded */
  defaultExpanded?: boolean;
  /** Minimum table width for horizontal scroll */
  minWidth?: number;
  /** Safety limit to prevent excessive recursion */
  maxDepth?: number;
}

// PUBLIC_INTERFACE
/**
 * Renders a nested JSON value as a table.
 * Supports objects, arrays, and primitives.
 */
export default function JsonTable({
  value,
  label,
  defaultExpanded = true,
  minWidth = 520,
  maxDepth = 6,
}: JsonTableProps): React.ReactElement {
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));

  const content = useMemo((): React.ReactElement => {
    if (maxDepth <= 0) {
      return <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>{primitivePreview(value)}</div>;
    }

    // Primitive
    if (!isPlainObject(value) && !Array.isArray(value)) {
      return (
        <div style={{ fontSize: 12, fontWeight: 850, color: 'rgba(255,255,255,0.90)', wordBreak: 'break-word' }}>
          {primitivePreview(value)}
        </div>
      );
    }

    // Array
    if (Array.isArray(value)) {
      const items = value as unknown[];
      if (items.length === 0) {
        return <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>—</div>;
      }

      const objectArray = items.every((x) => isPlainObject(x));

      if (!objectArray) {
        return (
          <div style={tableShellStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle(minWidth)}>
                <thead>
                  <tr>
                    <th align="left" style={headerCellStyle}>#</th>
                    <th align="left" style={headerCellStyle}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ background: rowBgFor(idx) }}>
                      <td style={bodyCellStyle}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: 'rgba(255,255,255,0.86)' }}>{idx}</div>
                      </td>
                      <td style={bodyCellStyle}>
                        <JsonTable value={it} defaultExpanded={false} minWidth={minWidth} maxDepth={maxDepth - 1} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      const orderedColumns = unionKeysForObjectArray(items);
      const tableMin = Math.max(minWidth, 560);

      return (
        <div style={tableShellStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle(tableMin)}>
              <thead>
                <tr>
                  {orderedColumns.map((col) => (
                    <th key={col} align="left" style={headerCellStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} style={{ background: rowBgFor(idx) }}>
                    {orderedColumns.map((col) => (
                      <td key={col} style={bodyCellStyle}>
                        <JsonTable
                          value={(row as Record<string, unknown>)?.[col]}
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
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>—</div>;
    }

    return (
      <div style={tableShellStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle(minWidth)}>
            <thead>
              <tr>
                <th align="left" style={headerCellStyle}>Key</th>
                <th align="left" style={headerCellStyle}>Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k, v], idx) => (
                <tr key={String(k)} style={{ background: rowBgFor(idx) }}>
                  <td style={bodyCellStyle}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: 'rgba(255,255,255,0.86)' }}>{String(k)}</div>
                  </td>
                  <td style={bodyCellStyle}>
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

  if (!label) return content;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.92)',
          padding: '10px',
          fontSize: 12,
          fontWeight: 950,
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span aria-hidden="true" style={{ opacity: 0.9, flex: '0 0 auto' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded ? <div style={{ marginTop: 8 }}>{content}</div> : null}
    </div>
  );
}
