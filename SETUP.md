# Project Setup Guide

This guide provides step-by-step instructions to set up and deploy the ClassLink Integration Demonstrator project on your local machine and in your own AWS account.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

-   [Node.js](https://nodejs.org/) (which includes `npm`)
-   [Python 3](https://www.python.org/)
-   [AWS CLI](https://aws.amazon.com/cli/) configured with your AWS account credentials.
-   [Git](https://git-scm.com/)

---

## Part 1: Backend Setup (AWS)

This section covers the creation of all necessary AWS resources.

### Step 1: Create DynamoDB Tables & Index

1.  Navigate to the **DynamoDB** service in the AWS Console.
2.  Create the following three tables:
    -   **Table 1:** `Users` (Partition key: `userId` (String))
    -   **Table 2:** `Enrollments` (Partition key: `userId` (String), Sort key: `classId` (String))
    -   **Table 3:** `Classes` (Partition key: `classId` (Type: String))
3.  **Create a Global Secondary Index (GSI):**
    -   Select the `Enrollments` table and go to the **Indexes** tab.
    -   Click **Create index**.
    -   **Partition key:** `classId` (String)
    -   **Index name:** `classId-userId-index`
    -   Click **Create index**.

### Step 2: Store API Credentials in Secrets Manager

1.  Navigate to **AWS Secrets Manager**.
2.  Store a new secret with the name `classlink-api-credentials`.
3.  Select **"Other type of secret"** and add two key/value pairs:
    -   `base_url`: (Your ClassLink Proxy URL)
    -   `access_token`: (Your ClassLink Access Token)

### Step 3: Set Up AWS Cognito for SSO

1.  Navigate to the **AWS Cognito** service.
2.  **Create a User Pool:** Give it a generic, descriptive name like `classlink-app-users`.
3.  **Create a Cognito Domain:** In the **App integration** tab, create a free Cognito domain prefix (e.g., `my-classlink-app-1234`).
4.  **Create an App Client:**
    -   In the **App integration** tab, create a new app client (e.g., `classlink-app-client`).
    -   Note the **Client ID** that is generated.
5.  **Create an OIDC Identity Provider via AWS CLI:**
    -   Using the AWS CLI is the most reliable method. Open your terminal and use the command template below.
    -   You must replace the three placeholder values: `[YOUR_USER_POOL_ID]`, `[YOUR_CLIENT_ID]`, and `[YOUR_CLIENT_SECRET]`.

    ```bash
    aws cognito-idp create-identity-provider \
    --user-pool-id "[YOUR_USER_POOL_ID]" \
    --provider-name "ClassLink" \
    --provider-type "OIDC" \
    --provider-details "{\"client_id\":\"[YOUR_CLIENT_ID]\",\"client_secret\":\"[YOUR_CLIENT_SECRET]\",\"attributes_request_method\":\"GET\",\"oidc_issuer\":\"[https://launchpad.classlink.com](https://launchpad.classlink.com)\",\"authorize_scopes\":\"openid\"}" \
    --attribute-mapping "{\"email\":\"email\"}"
    ```
6.  **Enable the Provider for Your App Client:**
    -   In the AWS Console, navigate to your App Client's settings page.
    -   In the **"Identity providers"** section, check the box next to **`ClassLink`**.
    -   Click **Save changes**.
    
### Step 4: Deploy the Data Ingestion Lambda

1.  Create a Lambda function named `classlink-data-ingestion` (Python 3.11+).
2.  Attach the `AmazonDynamoDBFullAccess` and `SecretsManagerReadWrite` policies to its execution role.
3.  Prepare and upload the deployment package containing the code from `backend/data_ingestion/` and the `requests` library.
4.  Increase the function **Timeout** to `2 minutes`.
5.  Run a test to populate your database.

### Step 5: Deploy the Secure Data API

1.  Create a Lambda function named `get-user-specific-data` (Python 3.11+).
2.  Attach the `AmazonDynamoDBReadOnlyAccess` policy to its execution role.
3.  Copy the code from `backend/get_data/lambda_function.py` into the Lambda console and deploy.
4.  **Add a secure API Gateway Trigger:**
    -   Choose **HTTP API** type.
    -   For **Security**, select **JWT Authorizer**.
    -   **Issuer URL:** `https://cognito-idp.[your-region].amazonaws.com/[your-user-pool-id]`
    -   **Audience:** (Your App Client ID)
    -   **Identity Source:** `$request.header.Authorization`
5.  Note the **API endpoint URL** that is generated.

---

## Part 2: Frontend Setup (Local)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/chrismarquezz/ClassLink-Internship-Project.git](https://github.com/chrismarquezz/ClassLink-Internship-Project.git)
    cd ClassLink-Internship-Project/frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Create Environment File:** In the `frontend` directory, create a `.env` file.
4.  Add the **new, secure** API Gateway endpoint URL to this file:
    ```
    VITE_SECURE_API_URL="PASTE_YOUR_SECURE_API_ENDPOINT_URL_HERE"
    ```
5.  **Configure Amplify:** Open `frontend/src/main.jsx` and ensure the `userPoolId`, `userPoolClientId`, and `domain` values match your Cognito setup.
6.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

Your application should now be running locally, connected to your live, secure AWS backend and ready for SSO login.
