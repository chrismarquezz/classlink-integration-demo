# Project Setup Guide

This guide outlines the required steps to set up and deploy the ClassLink Integration Demonstrator project both locally and on AWS.

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

1. Navigate to **DynamoDB** in the AWS Console.
2. Create three tables:

   - **Users**
     - Partition key: `userId` (String)
   - **Enrollments**
     - Partition key: `userId` (String)
     - Sort key: `classId` (String)
   - **Classes**
     - Partition key: `classId` (String)

3. Add a **Global Secondary Index (GSI)** to the `Enrollments` table:

   - Partition key: `classId` (String)
   - Index name: `classId-userId-index`

---

### Step 2: Store API Credentials in AWS Secrets Manager

1. Navigate to **Secrets Manager** in the AWS Console.
2. Create a new secret:
   - Type: **Other type of secret**
   - Name: `classlink-api-credentials`
   - Key-value pairs:
     - `base_url`: Your ClassLink proxy URL
     - `admin_api_key`: Your ClassLink API key

---

### Step 3: Deploy the Data Ingestion Lambda

1. Create a Lambda function named `classlink-data-ingestion` using **Python**.
2. Attach the following permissions to the Lambda's execution role:
   - `AmazonDynamoDBFullAccess`
   - `SecretsManagerReadWrite`
3. Package the code from `backend/data_ingestion/` along with dependencies (`requests`, etc.) into a ZIP archive and upload it.
4. Set the function timeout to **2 minutes**.
5. Execute a manual test to populate DynamoDB with data from the ClassLink API.

---

### Step 4: Deploy the Roster Data API

1. Create a Lambda function named `get-user-data` using **Python**.
2. Attach the `SecretsManagerReadWrite` and `AmazonDynamoDBFullAccess` policies to the Lambda’s execution role.
3. Use the code from `backend/get_data/lambda_function.py` and deploy it in the Lambda Console.
4. Add an **HTTP API Gateway trigger**:
   - API type: **HTTP API**
   - Stage: `$default`
   - Enable **CORS** (for development use: `Access-Control-Allow-Origin: *`)
   - Authentication: **None** (secured via access token passed manually)
5. Note the auto-generated API Gateway URL. This is the secure endpoint to be used by the frontend.

---

## Part 2: Frontend Setup (Local Development)

1. Clone the repository:

   ```bash
   git clone https://github.com/chrismarquezz/ClassLink-Internship-Project.git
   cd ClassLink-Internship-Project/frontend
