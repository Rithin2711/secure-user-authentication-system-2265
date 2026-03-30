#!/usr/bin/env python3
"""
Helper script to write all TypeScript/TSX source files for the Vite revamp.
Run with: python3 write_src_files.py
"""
import os

def w(path, content):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f'Written: {path}')


# ── src/index.css ──────────────────────────────────────────────────────────
w('src/index.css', """\
/* Tailwind CSS v4 - single import directive */
@import "tailwindcss";

:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --auth-canvas-1: #0b1020;
  --auth-canvas-2: #0a1a2f;
  --auth-canvas-3: #2b1b5a;
  --auth-text:         rgba(255,255,255,0.92);
  --auth-muted:        rgba(255,255,255,0.70);
  --auth-card-bg:      rgba(255,255,255,0.08);
  --auth-card-border:  rgba(255,255,255,0.16);
  --auth-input-bg:     rgba(255,255,255,0.06);
  --auth-input-border: rgba(255,255,255,0.18);
  --auth-primary:   #3b82f6;
  --auth-primary-2: #06b6d4;
  --auth-danger:    #ef4444;
  --auth-radius-lg: 18px;
  --auth-radius-md: 12px;
  --auth-shadow: 0 18px 60px rgba(0,0,0,0.45);
}

*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f9fafb;
  color: #111827;
}

.auth-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  min-height: 100vh;
  background:
    radial-gradient(900px circle at 12% 14%, rgba(59,130,246,0.35), transparent 52%),
    radial-gradient(800px circle at 88% 12%, rgba(6,182,212,0.28),  transparent 55%),
    radial-gradient(900px circle at 60% 92%, rgba(168,85,247,0.20), transparent 50%),
    linear-gradient(160deg, var(--auth-canvas-1), var(--auth-canvas-2) 45%, var(--auth-canvas-3));
  color: var(--auth-text);
  overflow: hidden;
}
.auth-shell::before {
  content: "";
  position: absolute; inset: 0;
  background:
    linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)),
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 35%);
  opacity: 0.7;
  pointer-events: none;
}

.auth-page { width: 100%; max-width: 460px; position: relative; z-index: 1; }
.auth-page--wide { max-width: none; width: 100%; padding: 0 20px; box-sizing: border-box; }

.auth-card {
  width: 100%; text-align: left;
  border-radius: var(--auth-radius-lg);
  padding: 28px 24px;
  background: var(--auth-card-bg);
  border: 1px solid var(--auth-card-border);
  box-shadow: var(--auth-shadow);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}
.auth-card--flat {
  max-width: 1200px; margin: 0 auto; padding: 22px 0;
  border: none; box-shadow: none; background: transparent;
  -webkit-backdrop-filter: none; backdrop-filter: none;
}
.auth-wide-content { padding: 0 8px; }

.auth-title { margin: 0; font-size: 26px; font-weight: 750; letter-spacing: -0.03em; color: var(--auth-text); }
.auth-subtitle { margin: 8px 0 0; font-size: 13px; line-height: 1.4; color: var(--auth-muted); }
.auth-form { margin-top: 18px; display: flex; flex-direction: column; gap: 12px; }
.auth-field label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600; color: var(--auth-muted); }

.auth-input {
  width: 100%; box-sizing: border-box;
  border-radius: var(--auth-radius-md);
  border: 1px solid var(--auth-input-border);
  background: var(--auth-input-bg);
  color: var(--auth-text);
  padding: 12px; font-size: 14px; font-family: var(--font-sans); outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
select.auth-input { color: var(--auth-text); }
select.auth-input option { color: #111827; background-color: #ffffff; }
.auth-input::placeholder { color: rgba(255,255,255,0.45); }
.auth-input:focus { border-color: rgba(59,130,246,0.8); box-shadow: 0 0 0 4px rgba(59,130,246,0.18); background: rgba(255,255,255,0.075); }

.auth-button {
  margin-top: 8px; width: 100%; border: none;
  border-radius: var(--auth-radius-md);
  background: linear-gradient(135deg, var(--auth-primary), var(--auth-primary-2));
  color: rgba(255,255,255,0.95); padding: 12px 14px; font-size: 15px; font-weight: 750;
  cursor: pointer; font-family: var(--font-sans);
  box-shadow: 0 10px 26px rgba(59,130,246,0.26);
  transition: transform 0.08s ease, opacity 0.2s ease, filter 0.2s ease;
}
.auth-button:hover  { filter: brightness(1.03); }
.auth-button:active { transform: translateY(1px); }
.auth-button:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

.auth-row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.auth-link { color: rgba(255,255,255,0.88); text-decoration: none; font-size: 13px; }
.auth-link:hover { text-decoration: underline; opacity: 0.95; }
.auth-footer { margin-top: 16px; text-align: center; font-size: 13px; color: var(--auth-muted); }
.auth-message { margin: 10px 0 0; font-size: 13px; line-height: 1.35; }
.auth-message.error   { color: rgba(255,210,210,0.95); }
.auth-message.success { color: rgba(193,255,220,0.95); }

.ingestion-output { padding-top: 10px; }
.ingestion-output__header { margin-top: 10px; }
.ingestion-output__title { margin-top: 0; }
.ingestion-output__tableWrap {
  margin-top: 14px; padding: 14px; border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.14);
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.10));
}

@media (max-width: 520px) {
  .auth-shell { padding: 34px 14px; }
  .auth-card { padding: 22px 18px; border-radius: 16px; }
  .auth-title { font-size: 24px; }
  .auth-page--wide { padding: 0 14px; }
  .auth-card--flat { padding: 16px 0; }
  .auth-wide-content { padding: 0; }
  .ingestion-output__tableWrap { padding: 10px; border-radius: 14px; }
}
""")


# ── src/App.tsx ───────────────────────────────────────────────────────────
w('src/App.tsx', """\
import React, { useEffect, useMemo } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UploadPage from './pages/UploadPage';
import InputValidationPage from './pages/InputValidationPage';
import IngestionOutputPage from './pages/IngestionOutputPage';
import OrchestratorResultsPage from './pages/OrchestratorResultsPage';

// PUBLIC_INTERFACE
/**
 * Root application component for WBD Frontend.
 * Uses dependency-free hash routing to render the correct page.
 */
function App(): React.ReactElement {
  const route = useHashRoute();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const content = useMemo((): React.ReactElement => {
    switch (route) {
      case 'signup':           return <SignupPage />;
      case 'upload':           return <UploadPage />;
      case 'input-validation': return <InputValidationPage />;
      case 'orchestrator':     return <OrchestratorResultsPage />;
      case 'agent-ingestion':  return <IngestionOutputPage />;
      default:                 return <LoginPage />;
    }
  }, [route]);

  return <div className="auth-shell">{content}</div>;
}

export default App;
""")


# ── src/api/apiClient.ts ──────────────────────────────────────────────────
w('src/api/apiClient.ts', """\
/**
 * Minimal fetch helper. Returns ApiResult<T> - never undefined.
 */
import type { ApiResult } from '../types';

function joinUrl(base: string, path: string): string {
  return base + path.replace(/^\\/+/, '');
}
function normalizeEndpoint(url: string): string {
  const u = String(url || '').trim();
  return u.endsWith('/') ? u : u + '/';
}
async function tryReadText(resp: Response): Promise<string> {
  try { return await resp.text(); } catch { return ''; }
}
function toErrorMessage(json: unknown, text: string, status: number): string {
  if (json && typeof json === 'object') {
    const j = json as Record<string, unknown>;
    if (typeof j['detail'] === 'string' && j['detail'].trim()) return j['detail'].trim();
    if (typeof j['message'] === 'string' && j['message'].trim()) return j['message'].trim();
    if (typeof j['error'] === 'string' && j['error'].trim()) return j['error'].trim();
  }
  if (text && text.trim() && text.trim().length < 240) return text.trim();
  return 'Request failed (' + status + ')';
}

// PUBLIC_INTERFACE
export function getBackendBaseUrl(): string {
  const base =
    (import.meta.env['VITE_BACKEND_URL'] as string | undefined) ||
    (import.meta.env['VITE_API_BASE'] as string | undefined);
  return base ? normalizeEndpoint(base) : '';
}

// PUBLIC_INTERFACE
export async function apiFetchText(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: unknown; baseUrl?: string; allowRelative?: boolean } = {},
): Promise<ApiResult<string>> {
  const { method = 'GET', headers, body, baseUrl, allowRelative = false } = options;
  const normalizedBase = baseUrl ? normalizeEndpoint(baseUrl) : '';
  const normalizedPath = String(path || '');
  if (!normalizedBase && !allowRelative) {
    return { ok: false, status: 0, data: null, error: { message: 'Backend URL is not configured. Set VITE_BACKEND_URL.' }, url: normalizedPath };
  }
  const url = normalizedBase ? joinUrl(normalizedBase, normalizedPath) : normalizedPath;
  const finalHeaders: Record<string, string> = { ...(headers || {}) };
  let finalBody: string | undefined;
  if (body !== undefined && body !== null && typeof body !== 'string') {
    finalBody = JSON.stringify(body);
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
  } else if (typeof body === 'string') { finalBody = body; }
  try {
    const resp = await fetch(url, { method, headers: finalHeaders, body: finalBody });
    const text = await tryReadText(resp);
    if (resp.ok) return { ok: true, status: resp.status, data: text ?? '', error: null, url };
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }
    return { ok: false, status: resp.status, data: text ?? '', error: { message: toErrorMessage(json, text, resp.status) + ' (' + url + ')' }, url };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: { message: 'Unable to reach server (' + url + '). Please try again.', details: e instanceof Error ? e.message : String(e) }, url };
  }
}

// PUBLIC_INTERFACE
export async function apiFetchJson<T = unknown>(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: unknown; baseUrl?: string; allowRelative?: boolean } = {},
): Promise<ApiResult<T>> {
  const { method = 'GET', headers, body, baseUrl, allowRelative = false } = options;
  const normalizedBase = baseUrl ? normalizeEndpoint(baseUrl) : '';
  const normalizedPath = String(path || '');
  if (!normalizedBase && !allowRelative) {
    return { ok: false, status: 0, data: null, error: { message: 'Backend URL is not configured. Set VITE_BACKEND_URL.' }, url: normalizedPath };
  }
  const url = normalizedBase ? joinUrl(normalizedBase, normalizedPath) : normalizedPath;
  const finalHeaders: Record<string, string> = { ...(headers || {}) };
  let finalBody: string | undefined;
  if (body !== undefined && body !== null && typeof body !== 'string') {
    finalBody = JSON.stringify(body);
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
  } else if (typeof body === 'string') { finalBody = body; }
  try {
    const resp = await fetch(url, { method, headers: finalHeaders, body: finalBody });
    let json: T | null = null;
    try { json = (await resp.json()) as T; } catch { /* ignore */ }
    if (resp.ok) {
      if (json === null) return { ok: false, status: resp.status, data: null, error: { message: 'Unexpected non-JSON response from ' + url }, url };
      return { ok: true, status: resp.status, data: json, error: null, url };
    }
    const text = json === null ? '' : '';
    return { ok: false, status: resp.status, data: json, error: { message: toErrorMessage(json, text, resp.status) + ' (' + url + ')' }, url };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: { message: 'Unable to reach server (' + url + '). Please try again.', details: e instanceof Error ? e.message : String(e) }, url };
  }
}
""")


# ── src/api/authApi.ts ────────────────────────────────────────────────────
w('src/api/authApi.ts', """\
/**
 * Auth API client for WBD Frontend.
 */
import type { AuthResponse, SignupPayload, LoginPayload } from '../types';

function normalizeBase(base: string | undefined): string {
  return String(base || '').trim().replace(/\\/*$/, '');
}
function isLikelyFrontendOrigin(url: string): boolean {
  try { return Boolean(url && window?.location?.origin && new URL(url).origin === window.location.origin); }
  catch { return false; }
}
const ENV_BASE = normalizeBase(
  (import.meta.env['VITE_API_BASE'] as string | undefined) ||
  (import.meta.env['VITE_BACKEND_URL'] as string | undefined),
);
const API_BASE = ENV_BASE && !isLikelyFrontendOrigin(ENV_BASE) ? ENV_BASE : '';

async function readErrorMessage(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as Record<string, unknown>;
    if (typeof data['detail'] === 'string') return data['detail'];
    if (typeof data['message'] === 'string') return data['message'];
    return 'Request failed (' + resp.status + ')';
  } catch { return 'Request failed (' + resp.status + ')'; }
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch { throw new Error('Unable to reach server. Please try again.'); }
  if (!resp.ok) throw new Error(await readErrorMessage(resp));
  try { return (await resp.json()) as T; } catch { throw new Error('Unexpected server response.'); }
}

// PUBLIC_INTERFACE
/** Register a new user account. POST /api/signup */
export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>(API_BASE + '/api/signup', payload);
}

// PUBLIC_INTERFACE
/** Login with email and password. POST /api/login */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>(API_BASE + '/api/login', payload);
}

// PUBLIC_INTERFACE
/** Persist auth response data to localStorage. */
export function persistAuth(authResponse: Partial<AuthResponse>): void {
  if (!authResponse || typeof authResponse !== 'object') return;
  if (authResponse.access_token) localStorage.setItem('auth_access_token', authResponse.access_token);
  if (authResponse.email) localStorage.setItem('auth_email', authResponse.email);
  if (authResponse.user_id !== undefined && authResponse.user_id !== null) {
    localStorage.setItem('auth_user_id', String(authResponse.user_id));
  }
}
""")


# ── src/api/ingestionApi.ts ───────────────────────────────────────────────
w('src/api/ingestionApi.ts', """\
/**
 * Ingestion API client for WBD Frontend.
 */
import { apiFetchText, getBackendBaseUrl } from './apiClient';
import type { IngestionResult } from '../types';

const ENDPOINT = getBackendBaseUrl();

function tryParseJson(text: string): unknown {
  const t = text.trim();
  if (!t) return undefined;
  try { return JSON.parse(t); } catch { return undefined; }
}

// PUBLIC_INTERFACE
/** Fetch ingestion workspace response from GET /mock. */
export async function fetchIngestionWorkspaceResponse(): Promise<IngestionResult> {
  const res = await apiFetchText('mock', { method: 'GET', baseUrl: ENDPOINT, allowRelative: false });
  if (!res || typeof res !== 'object') throw new Error('Unable to load ingestion response.');
  if (!res.ok) throw new Error(res.error?.message || 'Ingestion request failed.');
  const rawText = String(res.data ?? '').trim();
  const parsed = tryParseJson(rawText);
  if (parsed !== undefined) return { kind: 'json', data: parsed };
  return { kind: 'text', text: rawText };
}

// PUBLIC_INTERFACE
/** Submit user input for ingestion (UI-only stub). */
export async function submitIngestionWorkspaceInput(userText: string): Promise<IngestionResult> {
  const text = String(userText ?? '').trim();
  if (!text) return { kind: 'text', text: 'Please enter a value before submitting.' };
  return { kind: 'text', text: 'Submitted input: ' + text };
}

// PUBLIC_INTERFACE
/** Fetch backend /error-message plain text. */
export async function fetchBackendErrorMessage(): Promise<string> {
  const res = await apiFetchText('error-message', { method: 'GET', baseUrl: ENDPOINT, allowRelative: false });
  if (!res || typeof res !== 'object') throw new Error('Unable to load /error-message.');
  if (!res.ok) throw new Error(res.error?.message || 'Unable to load /error-message.');
  return String(res.data || '').trim();
}

// PUBLIC_INTERFACE
/** Backward-compatible: fetch ingestion JSON or throw. */
export async function fetchIngestionResult(): Promise<unknown> {
  const r = await fetchIngestionWorkspaceResponse();
  if (r.kind !== 'json') throw new Error((r as { kind: 'text'; text: string }).text || 'Ingestion returned non-JSON.');
  return r.data;
}
""")


# ── src/api/uploadSessionStore.ts ─────────────────────────────────────────
w('src/api/uploadSessionStore.ts', """\
/**
 * sessionStorage-backed state store for the Upload page.
 */
import type { DocType, FileMeta, PersistedUploadState } from '../types';

const STORAGE_KEY = 'upload_page_state_v1';

function safeJsonParse(raw: string | null): PersistedUploadState | null {
  try { if (!raw) return null; return JSON.parse(raw) as PersistedUploadState; }
  catch { return null; }
}
function serializeFileMeta(file: File | null): FileMeta | null {
  if (!file) return null;
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

// PUBLIC_INTERFACE
export function loadUploadPageState(): PersistedUploadState | null {
  try { return safeJsonParse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

// PUBLIC_INTERFACE
export function saveUploadPageState(state: PersistedUploadState): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// PUBLIC_INTERFACE
export function clearUploadPageState(): void {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// PUBLIC_INTERFACE
export function buildPersistedUploadState(params: {
  docType: DocType; file: File | null; emailContents: string;
  hasSubmitted: boolean; extractedJsonRaw: string | null;
}): PersistedUploadState {
  const { docType, file, emailContents, hasSubmitted, extractedJsonRaw } = params;
  return {
    docType: docType || 'excel', emailContents: emailContents || '',
    hasSubmitted: Boolean(hasSubmitted), fileMeta: serializeFileMeta(file),
    extractedJsonRaw: typeof extractedJsonRaw === 'string' ? extractedJsonRaw : null,
    updatedAt: Date.now(),
  };
}
""")


# ── src/data/intakeAgentSample.ts ─────────────────────────────────────────
w('src/data/intakeAgentSample.ts', """\
/**
 * Sample intake-agent extracted JSON payload for UI demonstration.
 */

export const intakeAgentSample = {
  advertiser_and_product_information: {
    advertiser_name: 'Globex Media', agency_name: 'StarCom',
    billing_entity: ['CPM'], brand_name: 'Initech',
  },
  campaign_details: {
    campaign_name: 'Brand Refresh 2026', campaign_start_date: '04/12/2026',
    campaign_end_date: '', // intentionally empty for HITL demo
    currency: 'USD', audience_segments: ['Age;20+'],
    additional_info: ['mid-roll'], ad_types: 'mid-roll',
    media_environment_ids: ['1(Linear)', '2(Digital)', '3(Hi-Tech)'],
    number_of_flight_codes: 3,
  },
  budget_and_financials: {
    budget_order_value: 900000, rate_card_agreed_rate: 700,
    linear_budget: 300000, digital_budget: 300000, catchup_budget: 300000,
  },
  linear_details: {
    channel_network: ['1 Magic'], ad_duration: 30,
    creative_id: 'GLOB/012/01/E/H', ad_file_asset_link: ['asset_link2.mp4'],
    number_of_packages: 1, package_catalog_ids: [10],
  },
  digital_details: {
    total_line_items: 3, number_of_spots: 5100,
    line_items: [
      { platform: 'Google', ad_unit: '18(Live Ad Insertion Mid Roll- Live Sport)', creative_id: 'GLOB/012/01/E/H', ad_file_asset_link: ['asset_link2.mp4'], line_item_quantity: 1700, line_item_scheduling_type: 'LIVE', devices: 'STREAMING', line_item_creative_type: '1;video', line_item_duration_sec: 30, billable_metric: 'CPM', deal_type: 'Programmatic (PG and PD)', calculated_rate: 1190 },
      { platform: 'Youtube', ad_unit: '32(Video Pre-roll - Unskip 20)', creative_id: 'NA', ad_file_asset_link: ['asset_link3.mp4'], line_item_quantity: 1700, line_item_scheduling_type: 'VOD', devices: 'MOBILE', line_item_creative_type: '2;Display', line_item_duration_sec: 30, billable_metric: 'CPM', deal_type: 'DR', calculated_rate: 1190 },
      { platform: 'Google', ad_unit: '12(Video Pre-roll - skip 20)', creative_id: 'GLOB/012/03/G/H', ad_file_asset_link: ['asset_link1.mp4'], line_item_quantity: 1700, line_item_scheduling_type: 'VOD', devices: 'MOBILE', line_item_creative_type: '1;video', line_item_duration_sec: 30, billable_metric: 'CPM', deal_type: 'Sponsorship', calculated_rate: 1190 },
    ],
  },
} as const;

export const requiredFieldPaths: string[] = [
  'advertiser_and_product_information.advertiser_name',
  'advertiser_and_product_information.agency_name',
  'advertiser_and_product_information.billing_entity',
  'advertiser_and_product_information.brand_name',
  'campaign_details.campaign_name',
  'campaign_details.campaign_start_date',
  'campaign_details.campaign_end_date',
  'campaign_details.currency',
  'campaign_details.media_environment_ids',
  'campaign_details.number_of_flight_codes',
  'budget_and_financials.budget_order_value',
  'linear_details.channel_network',
  'linear_details.ad_duration',
  'linear_details.creative_id',
  'digital_details.total_line_items',
  'digital_details.number_of_spots',
  'digital_details.line_items',
];
""")

print('All files written successfully!')
