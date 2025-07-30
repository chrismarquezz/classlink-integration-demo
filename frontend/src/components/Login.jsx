import React from 'react';

function Login() {
  const handleLogin = () => {
    // These are the parameters for the Cognito Authorization URL.
    // They must match the configuration of your App Client.
    const cognitoDomain = 'https://us-east-10vyzim7it.auth.us-east-1.amazoncognito.com';
    const clientId = '2s9aedlljf2jhfav0up5d7b23d'; // Your App Client ID
    const redirectUri = 'http://localhost:5173';
    const scope = 'openid'; // The scope we confirmed works
    const responseType = 'code';
    const provider = 'ClassLink'; // The exact name of our Identity Provider

    // Construct the full URL for the Cognito Hosted UI
    const authorizationUrl = 
      `${cognitoDomain}/oauth2/authorize?identity_provider=${provider}` +
      `&client_id=${clientId}` +
      `&response_type=${responseType}` +
      `&scope=${scope}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Redirect the user's browser to the login page
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
