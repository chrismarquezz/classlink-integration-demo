import React from 'react';
import { signInWithRedirect } from 'aws-amplify/auth';

function Login() {
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
          <h1>Welcome</h1>
          <p>Please click the button below to continue.</p>
          <button 
            className="login-button"
            onClick={() => signInWithRedirect({ provider: { custom: 'ClassLink' } })}
          >
            Sign in with ClassLink
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
