import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UploadPage from "./pages/UploadPage";
import InputValidationPage from "./pages/InputValidationPage";

/**
 * Simple, dependency-free routing to avoid adding react-router.
 * Uses hash-based navigation: #/login, #/signup, #/upload, and #/input-validation.
 */
function useHashRoute() {
  const getRoute = () => {
    const hash = window.location.hash || "#/login";
    if (hash.startsWith("#/signup")) return "signup";
    if (hash.startsWith("#/upload")) return "upload";
    if (hash.startsWith("#/input-validation")) return "input-validation";
    return "login";
  };

  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

// PUBLIC_INTERFACE
function App() {
  /** Keeps the existing template theme capability without forcing it into the auth UI. */
  const [theme, setTheme] = useState("light");
  const route = useHashRoute();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const content = useMemo(() => {
    if (route === "signup") return <SignupPage />;
    if (route === "upload") return <UploadPage />;
    if (route === "input-validation") return <InputValidationPage />;
    return <LoginPage />;
  }, [route]);

  return (
    <div className="App auth-shell">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      {content}
    </div>
  );
}

export default App;
