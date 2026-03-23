import React, { useMemo, useState } from "react";

/**
 * Upload page UI only.
 * - Matches existing auth theme via shared auth-* classes.
 * - Uses dropdown to select document type.
 * - Conditionally shows file input (Excel/PDF) or textarea (Email).
 */

// PUBLIC_INTERFACE
export default function UploadPage() {
  const [docType, setDocType] = useState("excel"); // excel | pdf | email
  const [file, setFile] = useState(null);
  const [emailContents, setEmailContents] = useState("");

  const isFileType = docType === "excel" || docType === "pdf";

  const accept = useMemo(() => {
    if (docType === "excel") return ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (docType === "pdf") return "application/pdf,.pdf";
    return undefined;
  }, [docType]);

  const helperText = useMemo(() => {
    if (docType === "excel") return "Upload an Excel file (.xls or .xlsx).";
    if (docType === "pdf") return "Upload a PDF document (.pdf).";
    return "Paste the email contents below (including subject/body if available).";
  }, [docType]);

  const onChangeType = (e) => {
    const nextType = e.target.value;
    setDocType(nextType);

    // Reset previous inputs when switching modes to avoid accidental submission of stale data.
    setFile(null);
    setEmailContents("");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // UI-only validation before navigating to results page.
    if (isFileType && !file) {
      // eslint-disable-next-line no-alert
      alert("Please choose a file to upload.");
      return;
    }
    if (!isFileType && !emailContents.trim()) {
      // eslint-disable-next-line no-alert
      alert("Please paste the email contents.");
      return;
    }

    // Navigate to the new Input Validation results page (hash routing, no react-router).
    window.location.hash = "#/input-validation";
  };

  return (
    <main className="auth-page" aria-label="Upload page">
      <section className="auth-card" role="region" aria-label="Upload box">
        <h1 className="auth-title">Upload</h1>
        <p className="auth-subtitle">Choose a document type and provide the content to upload.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="upload-type">Document format</label>
            <select id="upload-type" className="auth-input" value={docType} onChange={onChangeType}>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
              <option value="email">Email</option>
            </select>
            <p className="auth-subtitle" style={{ marginTop: 8 }}>
              {helperText}
            </p>
          </div>

          {isFileType ? (
            <div className="auth-field">
              <label htmlFor="upload-file">Choose file</label>
              <input
                id="upload-file"
                className="auth-input"
                type="file"
                accept={accept}
                onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              />
              {file ? (
                <p className="auth-subtitle" style={{ marginTop: 8 }}>
                  Selected: <span style={{ color: "rgba(255,255,255,0.92)" }}>{file.name}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="upload-email-contents">Email contents</label>
              <textarea
                id="upload-email-contents"
                className="auth-input"
                placeholder="Paste email contents here..."
                value={emailContents}
                onChange={(e) => setEmailContents(e.target.value)}
                rows={8}
                style={{ resize: "vertical" }}
              />
            </div>
          )}

          <button className="auth-button" type="submit">
            Submit
          </button>

          <div className="auth-footer">
            <a className="auth-link" href="#/login">
              Back to Login
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
