'use client';

export default function LoadingOverlay() {
  return (
    <div className="auth-loading" id="authLoading">
      <div className="auth-loading-inner">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Lekha Tracker</span>
        </div>
        <div className="spinner" style={{ marginTop: 24 }} />
      </div>
    </div>
  );
}
