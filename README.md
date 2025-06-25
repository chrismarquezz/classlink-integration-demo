# ClassLink Integration Demonstrator

This project is a lightweight, full-stack web application designed to demonstrate a complete, end-to-end integration with the ClassLink ecosystem, as required by the internship program.

The core purpose is to showcase three key functionalities:

-   **Data Ingestion & Provisioning:** Connect to the ClassLink Roster Server API, fetch user and enrollment data, and provision it into a cloud database.
-   **SSO Authentication:** Implement Single Sign-On (SSO) using industry-standard protocols like OAuth2 and OIDC, allowing users to sign in with their existing ClassLink credentials.
-   **User-Facing Application:** A functional web interface that displays roster data in a meaningful way, with different views for different user roles.

## Architecture Overview

This application is built using a modern, **serverless architecture** on Amazon Web Services (AWS). This approach is scalable, cost-effective, and minimizes infrastructure management. The system is split into two distinct parts: a backend API and a frontend user interface.

-   **Backend:** A set of cloud functions and services responsible for all data handling.
-   **Frontend:** A separate Single-Page Application (SPA) that runs in the user's web browser and communicates with the backend via a secure HTTP API.

---

## Backend Components

The backend is the data engine of the project. It consists of several key AWS components working together:

### 1. Data Ingestion

-   **Service:** AWS Lambda (`classlink-data-ingestion`)
-   **Runtime:** Python
-   **Function:** This serverless function acts as our primary data-syncing tool. It securely retrieves API credentials from **AWS Secrets Manager**, makes authenticated requests to the ClassLink Roster Server API, fetches user and enrollment data, and populates our DynamoDB tables.

### 2. Database

-   **Service:** Amazon DynamoDB
-   **Details:** A NoSQL serverless database used to store our roster information. It requires zero server management and scales automatically. We use two main tables:
    -   `Users`: Stores student, teacher, and administrator profiles.
    -   `Enrollments`: Stores the relationships between users and the classes they are in.

### 3. Data Serving API

-   **Services:** AWS Lambda (`classlink-get-data`) & Amazon API Gateway
-   **Function:** This combination provides the bridge between our database and the frontend.
    -   **API Gateway** provides a simple, public HTTP endpoint (a URL). It is configured with CORS to securely grant our frontend permission to access the API.
    -   When a request hits the endpoint, it triggers the `classlink-get-data` Python Lambda function, which scans the DynamoDB tables and returns the roster data as a single JSON object.

---

## Frontend Components

The frontend is the visible part of the application that a user interacts with.

### 1. Technology

-   **Framework:** React
-   **Build Tool:** Vite
-   **Description:** We built a modern Single-Page Application using React, the industry-standard library for building component-based user interfaces. Vite provides a fast and efficient development experience.
