# ClassLink Integration Demonstrator

This project is a lightweight, full-stack web application designed to demonstrate a complete, end-to-end integration with the ClassLink ecosystem.

---

## Core Purpose

The goal is to showcase three key functionalities:

- **Data Ingestion & Provisioning:** Connect to the ClassLink Roster Server API, fetch user, class, and enrollment data in batches, and provision it into a cloud database.
- **SSO Authentication:** Implement Single Sign-On (SSO) using OAuth2 and OIDC, allowing users to sign in with their ClassLink credentials through LaunchPad.
- **User-Facing Application:** A functional web interface that displays roster data in a dashboard format, with different views for different user roles.

---

## Architecture Overview

This application is built using a **serverless architecture** on Amazon Web Services (AWS), designed for scalability and minimal infrastructure management. The system is split into two parts:

- **Backend:** A set of cloud functions and services for data handling and authentication.
- **Frontend:** A React-based Single Page Application (SPA) that interacts with the backend via secure HTTP APIs.

---

## Backend Components

### 1. Data Ingestion Pipeline

- **Service:** AWS Lambda (`classlink-data-ingestion`)
- **Runtime:** Python
- **Functionality:**
  - Retrieves ClassLink API credentials from **AWS Secrets Manager**.
  - Authenticates with ClassLink using `/applications` to obtain a **Bearer token** for a specific application.
  - Uses this token to fetch **paginated** user, class, and enrollment data from ClassLink's Roster Server API.
  - Supports **offset-based paging** to ingest data in chunks (e.g., 1000 users at a time).
  - Inserts the ingested data into **DynamoDB**.

#### Pagination Example:
To ingest users in batches:

`GET /v2/users?limit=1000&offset=0`
`GET /v2/users?limit=1000&offset=1000`
`GET /v2/users?limit=1000&offset=2000`


The `offset` tells the API where to start returning results from. For example, `offset=1000` skips the first 1000 users.

---

### 2. Database

- **Service:** Amazon DynamoDB
- **Tables:**
  - `Users`: Stores student, teacher, and administrator profiles.
  - `Classes`: Stores class metadata (e.g., name, teacher).
  - `Enrollments`: Maps users to classes.

DynamoDB provides a flexible, serverless NoSQL database that scales on demand and integrates easily with Lambda.

---

### 3. Authentication & Secure API

- **Services:** AWS Cognito, Amazon API Gateway, AWS Lambda (`get-user-data`)
- **Functionality:**
  - **AWS Cognito** handles SSO login via ClassLink using an **OIDC Identity Provider** and a configured **User Pool**.
  - **API Gateway** acts as the secure interface for frontend-to-backend communication, protected with a **JWT authorizer** using Cognito-issued tokens.
  - Upon successful authentication, Cognito redirects back to a predefined frontend URL with an authorization code. AWS Amplify exchanges this for a token.
  - Authenticated API calls pass the **JWT** token in headers to API Gateway, which triggers the `get-user-data` Lambda to return personalized data from DynamoDB.

---

## Frontend Components

### 1. Technology Stack

- **Framework:** React
- **Build Tool:** Vite
- **Auth Library:** AWS Amplify
- **Routing:** React Router DOM

### 2. Key Features

- Implements **SSO login** by redirecting users to ClassLink LaunchPad.
- After successful login, users are redirected **back to the app (localhost or hosted domain)** using the Cognito callback URL (e.g., `http://localhost:3000/`).
- The user's session and tokens are managed automatically by AWS Amplify.
- Uses secure **authenticated API requests** to retrieve only the current user’s roster data.

---

## API Authentication Flow (SSO)

1. **User clicks "Sign in with ClassLink"** in the frontend.
2. Redirected to AWS Cognito hosted UI → OIDC provider → ClassLink LaunchPad.
3. User authenticates with ClassLink.
4. On success, user is redirected **back to the frontend** (e.g., `http://localhost:3000`) with an **authorization code**.
5. AWS Amplify uses the code to retrieve tokens and store them in session.
6. Authenticated API calls (e.g., `/get-user-data`) use the token in headers.

---

## Getting Started

To run this project locally or deploy it in your own AWS environment, see [**SETUP.md**](./SETUP.md) for installation, environment variables, and infrastructure configuration instructions.
