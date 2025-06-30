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

### Step 1: Create DynamoDB Tables

We need three tables to store our roster data.

1.  Navigate to the **DynamoDB** service in the AWS Console.
2.  Create the following three tables, one by one:
    -   **Table 1:**
        -   Table name: `Users`
        -   Partition key: `userId` (Type: String)
    -   **Table 2:**
        -   Table name: `Enrollments`
        -   Partition key: `userId` (Type: String)
        -   **Sort key:** `classId` (Type: String)
    -   **Table 3:**
        -   Table name: `Classes`
        -   Partition key: `classId` (Type: String)

### Step 2: Store API Credentials in Secrets Manager

1.  Navigate to the **AWS Secrets Manager** service.
2.  Click **"Store a new secret"**.
3.  Select **"Other type of secret"**.
4.  Create two key/value pairs:
    -   `base_url`: (Paste your ClassLink Proxy URL here)
    -   `access_token`: (Paste your ClassLink Access Token here)
5.  Set the **Secret name** to `classlink-api-credentials`.
6.  Proceed through the remaining steps and store the secret.

### Step 3: Deploy the Data Ingestion Lambda

This function fetches data from ClassLink and populates your database.

1.  Navigate to the **AWS Lambda** service and click **"Create function"**.
2.  Configure as follows:
    -   **Function name:** `classlink-data-ingestion`
    -   **Runtime:** Python 3.11 (or newer)
3.  Once created, go to **Configuration > Permissions**. Click the role name to open IAM.
4.  **Attach Policies:** Attach the following two AWS managed policies to the role:
    -   `AmazonDynamoDBFullAccess`
    -   `SecretsManagerReadWrite`
5.  **Prepare Deployment Package:** This function requires the `requests` library. On your local machine, create a temporary folder named `lambda-package`.
    -   Run `pip install requests -t .` inside the folder.
    -   Copy the source code from your project's `backend/data_ingestion/lambda_function.py` file into the `lambda-package` folder.
    -   Zip the *contents* of the `lambda-package` folder into a file named `deployment-package.zip`.
6.  **Upload Code:** In the Lambda's **Code** tab, select **Upload from > .zip file** and upload your `deployment-package.zip`.
7.  **Increase Timeout:** Go to **Configuration > General configuration**. Edit and set the **Timeout** to `2 minutes`.
8.  **Run the Function:** Go to the **Test** tab, create a new test event, and click **Test** to run the function and populate your database.

### Step 4: Deploy the Data Serving API

This function provides the data to your frontend.

1.  Navigate to **AWS Lambda** and click **"Create function"**.
2.  Configure as follows:
    -   **Function name:** `classlink-get-data`
    -   **Runtime:** Python 3.11 (or newer)
3.  Once created, attach the `AmazonDynamoDBReadOnlyAccess` policy to its execution role in IAM.
4.  **Copy Code:** Go to the Lambda's **Code** tab and paste the code from your project's `backend/get_data/lambda_function.py` file. Click **Deploy**.
5.  **Add API Gateway Trigger:**
    -   In the "Function overview" section, click **"+ Add trigger"**.
    -   Select **API Gateway**.
    -   Choose **"Create a new API"** with the **HTTP API** type.
    -   **IMPORTANT:** Under "Additional settings", check the box for **Cross-origin resource sharing (CORS)**.
    -   Click **Add**.
6.  Note the **API endpoint URL** that is generated. You will need it for the frontend.

---

## Part 2: Frontend Setup (Local)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/chrismarquezz/ClassLink-Internship-Project.git](https://github.com/chrismarquezz/ClassLink-Internship-Project.git)
    cd ClassLink-Internship-Project/frontend
    ```
2.  **Create Environment File:** In the `frontend` directory, create a new file named `.env`.
3.  Add your API Gateway endpoint URL to this file:
    ```
    VITE_API_URL="PASTE_YOUR_API_ENDPOINT_URL_HERE"
    ```
4.  **Install Dependencies:**
    ```bash
    npm install
    ```
5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

Your application should now be running locally, connected to your live AWS backend.
