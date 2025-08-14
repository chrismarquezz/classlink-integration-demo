# API Reference

This document provides detailed specifications for all API endpoints used in the ClassLink Integration Demo project.

---

## 1. Exchange Authorization Code for Access Token

*This is an external ClassLink endpoint called by our backend Lambda.*

Exchanges a ClassLink authorization code for an access token.

- **Endpoint:** `https://launchpad.classlink.com/oauth2/v2/token`
- **Method:** `POST`

### Request Body Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `code` | string | Yes | One-time authorization code from ClassLink. |
| `client_id` | string | Yes | OIDC client ID for the application. |
| `client_secret` | string | Yes | OIDC client secret. |
| `grant_type` | string | Yes | Must be `authorization_code`. |
| `launch_url` | string | Yes | Must match the original launch URL. |

---

## 2. Get User Info From ClassLink

*This is an external ClassLink endpoint called by our backend Lambda.*

Retrieves information about the authenticated user.

- **Endpoint:** `https://nodeapi.classlink.com/v2/my/info`
- **Method:** `GET`
- **Authentication:** Requires a valid Bearer token from the `/token` endpoint

---

## 3. Custom API: Get User-Specific Roster Data

*This is our custom backend API, implemented with AWS Lambda and API Gateway.*

Receives a one-time code from the frontend, exchanges it for tokens with ClassLink, gets the user's identity, and then retrieves that user's specific roster data from DynamoDB.

- **Endpoint:** `/get-user-data` (Full URL is the API Gateway Invoke URL)
- **Method:** `POST`
- **Authentication:** The security is handled by the one-time `code` exchange. The endpoint itself is public, but it will fail if a valid, unused `code` is not provided in the body

### Request Body

```json
{
  "code": "one_time_authorization_code_from_frontend"
}
