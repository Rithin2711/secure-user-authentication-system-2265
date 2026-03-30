/**
 * Simple dependency-free hash-based routing hook.
 * Uses window.location.hash for navigation without react-router.
 */
import { useEffect, useState } from 'react';

/** Valid route keys */
export type RouteKey =
  | 'login'
  | 'signup'
  | 'upload'
  | 'input-validation'
  | 'orchestrator'
  | 'agent-ingestion';

function getRoute(): RouteKey {
  const hash = window.location.hash || '#/login';
  if (hash.startsWith('#/signup'))            return 'signup';
  if (hash.startsWith('#/upload'))            return 'upload';
  if (hash.startsWith('#/input-validation'))  return 'input-validation';
  if (hash.startsWith('#/orchestrator'))      return 'orchestrator';
  if (hash.startsWith('#/agent/ingestion'))   return 'agent-ingestion';
  return 'login';
}

/**
 * PUBLIC_INTERFACE
 * Returns the current hash-based route key and updates on hashchange events.
 */
export function useHashRoute(): RouteKey {
  const [route, setRoute] = useState<RouteKey>(getRoute);

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
