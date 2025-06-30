# Code Samples with Explanations

This document highlights key code snippets from the project and explains their purpose and design.

---

## 1. Backend: Data Ingestion Lambda (`classlink-data-ingestion`)

This serverless function is responsible for populating our database with data from the ClassLink API.

### Sample 1: Securely Fetching API Credentials

```python
import boto3
import json

secrets_manager = boto3.client('secretsmanager')

def get_api_details():
    """Retrieves API details from AWS Secrets Manager."""
    secret_name = "classlink-api-credentials"
    print("Getting API details from Secrets Manager...")
    response = secrets_manager.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])
    print("API details retrieved successfully.")
    return secret['base_url'], secret['access_token']
```

**Explanation:**
This function demonstrates a critical security best practice. Instead of hardcoding the API `access_token` or `base_url` in the source code, it retrieves them at runtime from **AWS Secrets Manager**. The `boto3` library (the AWS SDK for Python) is used to make a secure call to the Secrets Manager service. The function's IAM role grants it permission to perform this action. This ensures that sensitive credentials are never exposed in the source code repository.

### Sample 2: Populating DynamoDB Efficiently

### Sample 2: Populating DynamoDB Efficiently

```python
import boto3

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')

def lambda_handler(event, context):
    # ... (fetching logic is above) ...
    users_data = users_response.get('users', [])
    print(f"Populating {len(users_data)} users into DynamoDB...")
    
    with users_table.batch_writer() as batch:
        for user in users_data:
            if user.get('sourcedId') and user.get('role'):
                batch.put_item(
                    Item={
                        'userId': user.get('sourcedId'),
                        'role': user.get('role'),
                        'firstName': user.get('givenName', 'N/A'),
                        'lastName': user.get('familyName', 'N/A'),
                        'email': user.get('email', 'N/A')
                    }
                )
    print("Users table populated.")
    # ...
```

**Explanation:**
This snippet shows how we write a large number of items to DynamoDB. Instead of writing items one by one (which would be slow and inefficient), we use `batch_writer()`. This is a high-level feature of `boto3` that automatically handles the complexity of grouping items into batches, sending them in parallel, and even performing retries for failed items. This is the most efficient and resilient way to perform bulk write operations in DynamoDB. We also use `.get(key, 'N/A')` to gracefully handle cases where an optional field (like `email`) might be missing from a record.
---

## 2. Frontend: React Application (`App.jsx`)

The main `App.jsx` component is the controller for the entire frontend application.

### Sample 3: Fetching Data and Handling State

```jsx
import { useState, useEffect } from 'react';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({ /* ... */ });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        processData(data); // A separate function to handle business logic
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // The empty dependency array [] ensures this runs only once.
  
  // ...
}
```

**Explanation:**
This snippet demonstrates the modern way to handle data fetching and component state in React using **hooks**.
-   `useState`: We declare state variables to track the `loading` status, any `error` messages, and the final `dashboardData`. When these state variables are updated (e.g., `setLoading(false)`), React automatically re-renders the component to reflect the new state.
-   `useEffect`: This hook is used to perform "side effects," such as fetching data. The code inside `useEffect` runs after the component has rendered. By providing an empty dependency array (`[]`), we tell React to run this effect only once when the component first mounts, which is the perfect place to fetch our initial data.
-   `import.meta.env.VITE_API_URL`: We securely access our API endpoint URL from an environment variable rather than hardcoding it.

### Sample 4: Conditional Rendering Based on State

```jsx
function App() {
  // ... state and data fetching logic ...

  const renderDashboard = () => {
    if (!loggedInUser) return null;

    if (loggedInUser.role === 'teacher') {
      return <TeacherDashboard {...dashboardData} />;
    }
    
    return <StudentDashboard classData={dashboardData.classData} />;
  };

  return (
    // ...
    <main className="dashboard-main">
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      {!loading && !error && renderDashboard()}
    </main>
    // ...
  );
}
```

**Explanation:**
This snippet showcases **conditional rendering**, a core concept in React. Instead of using complex `if/else` blocks to show or hide parts of the UI, we use simple boolean logic directly within our JSX.
-   `loading && <p>...</p>`: The "Loading..." message is only rendered if the `loading` state is `true`.
-   `error && <p>...</p>`: The error message is only rendered if the `error` state is not `null`.
-   The main dashboard is only rendered when loading is finished and there is no error.
-   Inside `renderDashboard`, we further check the `role` of the logged-in user to determine whether to render the `<TeacherDashboard />` or the `<StudentDashboard />` component. This makes the UI dynamic and responsive to the application's state.
