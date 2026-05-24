import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <svg style={{ width: 56, height: 56, color: '#791F1F', margin: '0 auto' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p style={{ fontSize: 32, fontWeight: 700, color: '#791F1F', marginBottom: 6 }}>403</p>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: '#111827', marginBottom: 10 }}>Access Denied</h2>
        <p style={{ fontSize: 13, color: '#9EA3B0', lineHeight: 1.6, marginBottom: 24 }}>
          You don't have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link to="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
          className="hover:opacity-90 transition-opacity">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
