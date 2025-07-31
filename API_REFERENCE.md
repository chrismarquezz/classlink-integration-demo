# API Reference

This document provides detailed specifications for all API endpoints used in the ClassLink Integration Demonstrator project.

---

## 1. Exchange Authorization Code for Access Token

Exchanges a ClassLink authorization code for an access token.

- **Endpoint:** `https://launchpad.classlink.com/oauth2/v2/token`
- **Method:** `POST`
- **Authentication:** Requires a client ID and client secret from ClassLink.
- **Content-Type:** `application/x-www-form-urlencoded`

### Request Body Parameters

| Parameter        | Type   | Required | Description                                             |
|------------------|--------|----------|---------------------------------------------------------|
| `code`           | string | Yes      | One-time authorization code from ClassLink.            |
| `client_id`      | string | Yes      | OIDC client ID for the application.                    |
| `client_secret`  | string | Yes      | OIDC client secret.                                    |
| `grant_type`     | string | Yes      | Must be `authorization_code`.                          |
| `launch_url`     | string | Yes      | Must match original launch URL used to obtain code.    |

### Successful Response (`200 OK`)

```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid"
}
```

---

## 2. Get User Info From ClassLink

Retrieves information about the authenticated user.

- **Endpoint:** `https://nodeapi.classlink.com/v2/my/info`
- **Method:** `GET`
- **Authentication:** Requires a valid Bearer token obtained from the `/token` endpoint.

### Headers

```
Authorization: Bearer <ACCESS_TOKEN>
Accept: application/json
```

### Successful Response (`200 OK`)

```json
{
  "SourcedId": "string",
  "TenantId": "string",
  "FirstName": "string",
  "LastName": "string",
  "Email": "string",
  "OrgSourcedId": "string",
  ...
}
```

---

## 3. Ingest Roster Data (Backend Lambda)

Fetches and ingests roster data (users, classes, enrollments) from ClassLink's Roster Server API using a bearer token retrieved from `/applications`.

- **Endpoint Example:**  
  - `GET https://api.classlink.com/v2/users?limit=1000&offset=0`  
  - `GET https://api.classlink.com/v2/classes?limit=1000&offset=0`  
  - `GET https://api.classlink.com/v2/enrollments?limit=1000&offset=0`
- **Authentication:** Bearer token retrieved by authenticating the application via the `/applications` endpoint.

### Request Headers

```
Authorization: Bearer <APPLICATION_TOKEN>
```

---

## 4. Get User-Specific Roster Data

Returns the profile, class list, and enrollment data for the currently authenticated user.

- **Endpoint:** `/` (Root path of the deployed Lambda via API Gateway)
- **Method:** `POST`
- **Authentication:** Requires a valid ClassLink OAuth2 authorization code in the request body

### Request Header

```
Authorization: Bearer <ID_TOKEN>
```

### Request Body

```json
{
  "code": "authorization_code_from_classlink"
}
```

### Successful Response (`200 OK`)

```json
{
  "userProfile": {
    "userId": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  },
  "enrollments": [
    {
      "userId": "string",
      "classId": "string",
      "role": "string"
    }
  ],
  "classes": [
    {
      "classId": "string",
      "className": "string",
      "courseCode": "string",
      "roster": [
        {
          "userId": "string",
          "classId": "string",
          "role": "string",
          "firstName": "string",
          "lastName": "string"
        }
      ]
    }
  ]
}
```

> Note: The `roster` array with full student names is only included for teacher-role users.

---

## Error Responses

### 401 Unauthorized

Returned if the request is missing or contains an invalid `Authorization` header.

```json
{
  "error": "Unauthorized"
}
```

---

### 404 Not Found

Returned if the user ID (constructed from ClassLink `TenantId_SourcedId`) does not exist in the `Users` table in DynamoDB.

```json
{
  "error": "User not found in roster database."
}
```

---

### 500 Internal Server Error

Returned if an unexpected error occurs in the Lambda handler, such as a failure to decode the token or query DynamoDB.

```json
{
  "error": "Unexpected error message"
}
```

---

## Summary

| Endpoint Type              | Endpoint (Base or Example)                                | Method |
|----------------------------|------------------------------------------------------------|--------|
| Token Exchange             | `https://launchpad.classlink.com/oauth2/v2/token`         | POST   |
| User Info (ClassLink)      | `https://nodeapi.classlink.com/v2/my/info`                | GET    |
| ClassLink Data Ingestion   | `https://api.classlink.com/v2/users` (and `/classes`, `/enrollments`) | GET    |
| Custom User Data Lambda    | `/` (via API Gateway)                                      | POST   |

All endpoints are secured either with a **Bearer token** or **JWT token** depending on the context (OIDC or API Gateway).
