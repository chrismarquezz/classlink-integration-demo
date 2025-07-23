import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_0VYziM7It',
      userPoolClientId: '2s9aedlljf2jhfav0up5d7b23d',
      loginWith: {
        oauth: {
          domain: 'us-east-10vyzim7it.auth.us-east-1.amazoncognito.com',
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
