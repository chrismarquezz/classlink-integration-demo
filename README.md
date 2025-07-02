# ClassLink Integration Demonstrator

This project is a lightweight, full-stack web application designed to demonstrate a complete, end-to-end integration with the ClassLink ecosystem.

## Core Purpose

The goal is to showcase three key functionalities:

-   **Data Ingestion & Provisioning:** Connect to the ClassLink Roster Server API, fetch user, class, and enrollment data, and provision it into a cloud database.
-   **SSO Authentication:** Implement Single Sign-On (SSO) using industry-standard protocols like OAuth2 and OIDC, allowing users to sign in with their existing ClassLink credentials.
-   **User-Facing Application:** A functional web interface that displays roster data in a dashboard format, with different views for different user roles.

## Architecture Overview

This application is built using a modern, **serverless architecture** on Amazon Web Services (AWS). This approach is scalable, cost-effective, and minimizes infrastructure management. The system is split into two distinct parts: a backend API and a frontend user interface.

-   **Backend:** A set of cloud functions and services responsible for all data handling and authentication.
-   **Frontend:** A separate Single-Page Application (SPA) that runs in the user's web browser and communicates with the backend via a secure HTTP API.

---

## Backend Components

The backend is the data engine of the project. It consists of several key AWS components working together:

### 1. Data Ingestion

-   **Service:** AWS Lambda (`classlink-data-ingestion`)
-   **Runtime:** Python
-   **Function:** This serverless function acts as our primary data-syncing tool. It securely retrieves API credentials from **AWS Secrets Manager**, makes authenticated requests to the ClassLink Roster Server API, fetches data, and populates our DynamoDB tables.

### 2. Database

-   **Service:** Amazon DynamoDB
-   **Details:** A NoSQL serverless database used to store our roster information. It requires zero server management and scales automatically. We use **three** main tables:
    -   `Users`: Stores student, teacher, and administrator profiles.
    -   `Classes`: Stores details for each class, such as the class name.
    -   `Enrollments`: Stores the relationships between users and classes.

### 3. Authentication & Secure API

-   **Services:** AWS Cognito, AWS Lambda (`get-user-specific-data`), & Amazon API Gateway
-   **Function:** This is the core of our secure data flow.
    -   **AWS Cognito** acts as our identity broker. It is configured with a User Pool and an OIDC Identity Provider to manage the SSO handshake with ClassLink.
    -   **API Gateway** provides a secure HTTP endpoint that is protected by a **JWT Authorizer**. This authorizer automatically validates the ID Token sent from the frontend, ensuring only authenticated users can access the API.
    -   When a valid request is received, it triggers the `get-user-specific-data` Lambda function. This function uses the user's ID from the validated token to query DynamoDB and return only the data relevant to that specific user.

---

## Frontend Components

The frontend is the visible part of the application that a user interacts with.

### 1. Technology

-   **Framework:** React
-   **Build Tool:** Vite
-   **Authentication Library:** AWS Amplify
-   **Description:** We built a modern Single-Page Application using React. The AWS Amplify library is used to handle the entire user authentication lifecycle, including redirecting to the ClassLink SSO page, managing user sessions, and retrieving secure tokens for API calls.

---

## Project Status & Getting Started

### Current Status

The backend data pipeline, frontend UI, and the end-to-end SSO authentication flow are all complete and functional.

### Getting Started

To set up and run this project in your own environment, please follow the instructions in the [**SETUP.md**](./SETUP.md) file.
