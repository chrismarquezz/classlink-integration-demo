# Project Setup Guide

This guide outlines the required steps to set up and deploy the ClassLink Integration Demo project both locally and on AWS.

---

## Prerequisites

Ensure the following tools are installed:

- [Node.js](https://nodejs.org/) (includes `npm`)
- [Python 3](https://www.python.org/)
- [AWS CLI](https://aws.amazon.com/cli/) with credentials configured
- [Git](https://git-scm.com/)

---

## Part 1: Backend Setup (AWS)

### Step 1: Create DynamoDB Tables and Index

1.  Navigate to **DynamoDB** in the AWS Console
2.  Create three tables:
    -   **Users**: Partition key `userId` (String)
    -   **Enrollments**: Partition key `userId` (String), Sort key `classId` (String)
    -   **Classes**: Partition key `classId` (String)
3.  Add a **Global Secondary Index (GSI)** to the `Enrollments` table:
    -   Partition key: `classId` (String)
    -   Index name: `classId-userId-index`

---

### Step 2: Store Credentials in AWS Secrets Manager

You will need to create **two** separate secrets.

1.  **For Data Ingestion:**
    -   Name: `classlink-api-credentials`
    -   Key-value pairs:
        -   `base_url`: Your ClassLink proxy URL
        -   `admin_api_key`: Your ClassLink Roster Server API key

2.  **For User SSO Login:**
    -   Name: `classlink-oidc-credentials`
    -   Key-value pairs:
        -   `oidc_client_id`: Your OIDC Client ID from the ClassLink portal
        -   `oidc_client_secret`: Your OIDC Client Secret from the ClassLink portal

---

### Step 3: Deploy the Data Ingestion Lambda

1.  Create a Lambda function named `classlink-data-ingestion` using **Python**
2.  Attach `AmazonDynamoDBFullAccess` and `SecretsManagerReadWrite` policies to its execution role
3.  **Prepare Deployment Package:**
    -   Create a temporary folder (e.g., `ingestion-package`)
    -   Copy the `lambda_function.py` from `backend/data_ingestion/` into it
    -   Install dependencies into the folder: `pip install -r backend/data_ingestion/requirements.txt -t .`
    -   Zip the *contents* of the folder and upload it to Lambda
4.  Set the function timeout to **2 minutes**
5.  Run a manual test to populate your DynamoDB tables

---

### Step 4: Deploy the Secure User Data API

1.  Create a Lambda function named `get-user-data` using **Python**
2.  Attach `AmazonDynamoDBFullAccess` and `SecretsManagerReadWrite` policies to its execution role
3.  **Prepare Deployment Package:**
    -   Create a temporary folder (e.g., `get-data-package`)
    -   Copy the `lambda_function.py` from `backend/get_data/` into it
    -   Install dependencies into the folder: `pip install -r backend/get_data/requirements.txt -t .`
    -   Zip the *contents* of the folder and upload it to Lambda
4.  Add an **API Gateway trigger** with the following configuration:
    -   Type: **HTTP API**
    -   Method: **POST**
    -   Path: `/get-user-data`
    -   Authentication: **None**
5.  Note the **Invoke URL** for the API's `default` stage

---

## Part 2: Frontend Setup (Local Development)

1.  Clone the repository:
    ```bash
    git clone [https://github.com/chrismarquezz/classlink-integration-demo.git](https://github.com/chrismarquezz/classlink-integration-demo.git)
    cd classlink-integration-demo/frontend
    ```
2.  Install all dependencies:
    ```bash
    npm install
    ```
3.  Create an environment file named `.env` in the `frontend` directory
4.  Add the full Invoke URL for your `get-user-data` API to this file:
    ```
    VITE_GET_USER_DATA_ENDPOINT="PASTE_YOUR_API_ENDPOINT_URL_HERE"
    ```
5.  Run the development server:
    ```bash
    npm run dev
    ```
