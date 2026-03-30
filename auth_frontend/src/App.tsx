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
 *
 * Uses hash-based routing (no react-router dependency) to render the
 * appropriate page component based on the current URL hash.
 *
 * Routes:
 *  #/login            → LoginPage
 *  #/signup           → SignupPage
 *  #/upload           → UploadPage
 *  #/input-validation → InputValidationPage
 *  #/orchestrator     → OrchestratorResultsPage
 *  #/agent/ingestion  → IngestionOutputPage
 */
function App(): React.ReactElement {
  const route = useHashRoute();

  /* Set stable light theme attribute so CSS variables remain consistent. */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const content = useMemo((): React.ReactElement => {
    switch (route) {
      case 'signup':          return <SignupPage />;
      case 'upload':          return <UploadPage />;
      case 'input-validation': return <InputValidationPage />;
      case 'orchestrator':    return <OrchestratorResultsPage />;
      case 'agent-ingestion': return <IngestionOutputPage />;
      default:                return <LoginPage />;
    }
  }, [route]);

  return (
    <div className="auth-shell">
      {content}
    </div>
  );
}

export default App;
