import React from 'react';

function Login() {
  const handleLogin = () => {
    const authorizationUrl = 'https://launchpad.classlink.com/oauth2/v2/auth?scope=openid&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcallback&client_id=c17373284925108e6fe96b5e6a8e2b619edfc90d9504&response_type=code';

    window.location.href = authorizationUrl;
  };

  return (
    <div className="login-page-container">
      <div className="login-branding-panel">
        <div className="branding-content">
          <div className="branding-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h2>ClassLink Integration</h2>
          <p>A demonstration of SSO and API data provisioning.</p>
        </div>
      </div>
      <div className="login-form-panel">
        <div className="login-box">
          <h1>Welcome Back</h1>
          <p>Please sign in with your provider to continue.</p>
          <button 
            className="login-button"
            onClick={handleLogin}
          >
            Sign in with ClassLink
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;