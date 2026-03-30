/**
 * Ingestion API client for WBD Frontend.
 *
 * Supports backends that return either:
 * - JSON (application/json) → render as tables
 * - plain text → show text + input box + submit button
 */
import { apiFetchText, getBackendBaseUrl } from './apiClient';
import type { IngestionResult } from '../types';

const ENDPOINT = getBackendBaseUrl();

/** Attempt to parse a string as JSON; returns undefined on failure. */
function tryParseJson(text: string): unknown {
  const t = text.trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

/**
 * PUBLIC_INTERFACE
 * Fetch the ingestion workspace response from backend GET /mock.
 * Returns { kind: 'json', data } or { kind: 'text', text }.
 */
export async function fetchIngestionWorkspaceResponse(): Promise<IngestionResult> {
  const res = await apiFetchText('mock', { method: 'GET', baseUrl: ENDPOINT, allowRelative: false });

  if (!res || typeof res !== 'object') {
    throw new Error('Unable to load ingestion response (unexpected client response).');
  }

  if (!res.ok) {
    throw new Error(res.error?.message || 'Ingestion request failed.');
  }

  const rawText = String(res.data ?? '').trim();
  const parsed = tryParseJson(rawText);

  if (parsed !== undefined) {
    return { kind: 'json', data: parsed };
  }

  return { kind: 'text', text: rawText };
}

/**
 * PUBLIC_INTERFACE
 * Submit user input for ingestion workspace.
 * Note: The backend does not define a submit endpoint for ingestion,
 * so this is a UI-only stub that returns a confirmation message.
 */
export async function submitIngestionWorkspaceInput(userText: string): Promise<IngestionResult> {
  const text = String(userText ?? '').trim();
  if (!text) {
    return { kind: 'text', text: 'Please enter a value before submitting.' };
  }
  return { kind: 'text', text: `Submitted input: ${text}` };
}

/**
 * PUBLIC_INTERFACE
 * Fetch the backend /error-message endpoint (plain text).
 * Used by OrchestratorResultsPage for the Ingestion tab.
 */
export async function fetchBackendErrorMessage(): Promise<string> {
  const res = await apiFetchText('error-message', { method: 'GET', baseUrl: ENDPOINT, allowRelative: false });

  if (!res || typeof res !== 'object') {
    throw new Error('Unable to load /error-message (unexpected client response).');
  }

  if (!res.ok) {
    throw new Error(res.error?.message || 'Unable to load /error-message.');
  }

  return String(res.data || '').trim();
}

/**
 * PUBLIC_INTERFACE
 * Backward-compatible helper: fetch ingestion JSON or throw if backend returned text.
 */
export async function fetchIngestionResult(): Promise<unknown> {
  const r = await fetchIngestionWorkspaceResponse();
  if (r.kind !== 'json') {
    throw new Error((r as { kind: 'text'; text: string }).text || 'Ingestion returned non-JSON response.');
  }
  return r.data;
}
