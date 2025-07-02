import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_d1sfPaYBB',
      userPoolClientId: '4v37u1m7i7t675ms2pgt9p5je9',
      loginWith: {
        oauth: {
          domain: 'us-east-1d1sfpaybb.auth.us-east-1.amazoncognito.com',
          // FIX: Request only the 'openid' scope
          scopes: ['openid'],
          redirectSignIn: ['http://localhost:5173'],
          redirectSignOut: ['http://localhost:5173'],
          responseType: 'code'
        }
      }
    }
  }
};

Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
