# Code Samples with Explanations

This document highlights key code snippets from the project and explains their purpose and design.

---

## 1. Backend: Data Ingestion Lambda (`classlink-data-ingestion`)

This serverless function is responsible for populating the database with data from the ClassLink Roster Server API.

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
This function demonstrates a critical security best practice. Instead of hardcoding the API `access_token` or `base_url` in the source code, it retrieves them at runtime from **AWS Secrets Manager**. The `boto3` library (the AWS SDK for Python) is used to make a secure call to Secrets Manager. The function's IAM role grants it permission to perform this action, ensuring that credentials are kept safe and out of version control.

---

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
```

**Explanation:**  
This snippet uses DynamoDB’s `batch_writer()` to efficiently insert multiple user records in one operation. It automatically handles retries and batch size limits under the hood. Optional fields like `firstName` or `email` are safely handled with `.get(..., 'N/A')` in case they're missing from the API response. This improves robustness and prevents crashes on missing data.

---

## 2. Backend: Authentication + Roster Retrieval Lambda (`get-user-data`)

This function handles the ClassLink OAuth flow and returns user-specific class and enrollment data.

### Sample 3: Exchanging Code for Token and Fetching User Info

```python
def get_access_token(code, client_id, client_secret):
    token_url = "https://launchpad.classlink.com/oauth2/v2/token"
    redirect_uri = "http://localhost:5173/callback"
    
    payload = {
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'authorization_code',
        'launch_url': f"https://launchpad.classlink.com/oauth2/v2/auth?redirect_uri={redirect_uri}"
    }

    response = requests.post(token_url, data=payload)
    response.raise_for_status()
    return response.json()['access_token']

def get_user_info(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get("https://nodeapi.classlink.com/v2/my/info", headers=headers)
    response.raise_for_status()
    return response.json()
```

**Explanation:**  
This shows how we implement OAuth 2.0 **authorization code exchange** manually (instead of relying on AWS Cognito). After the frontend receives an authorization code, this backend exchanges it for an access token and uses that token to fetch user information from ClassLink. These values (e.g. `sourcedId`, `tenantId`) are used to construct the unique user ID in the DynamoDB schema.

---

### Sample 4: Teacher-Specific Roster Enrichment

```python
if user_profile.get('role') == 'teacher':
    for course in class_details:
        roster_response = enrollments_table.query(
            IndexName='classId-userId-index',
            KeyConditionExpression=Key('classId').eq(course['classId'])
        )
        roster = roster_response.get('Items', [])
        
        # Enrich with names
        for student in roster:
            student_profile = users_table.get_item(Key={'userId': student['userId']}).get('Item', {})
            student['firstName'] = student_profile.get('firstName', 'Unknown')
            student['lastName'] = student_profile.get('lastName', 'Unknown')

        course['roster'] = roster
```

**Explanation:**  
This logic enriches the teacher’s roster view with human-readable names for each student. After retrieving all student IDs enrolled in a class, there is a fetch for their individual profiles from the `Users` table and attach the `firstName` and `lastName` fields. This allows the frontend to display meaningful student information, not just raw IDs.

---

## 3. Frontend: React Application

The frontend is a Vite-powered React SPA that consumes the backend’s JSON response and renders dashboards based on the user's role.

---

### Sample 5: Fetching Data After ClassLink OAuth Redirect

```jsx
useEffect(() => {
  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) return;

  const fetchUserData = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/get-user-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    setDashboardData(data);
  };

  fetchUserData();
}, []);
```

**Explanation:**  
This React `useEffect` hook runs once on page load and checks the URL for an authorization `code` (returned from ClassLink). It sends the code to the backend to retrieve user data. The resulting dashboard data includes the user profile, classes, and enrollments—all ready to be rendered.

---

### Sample 6: Teacher Roster Modal

```jsx
<Modal title={`Student Roster for ${rosterClass?.className}`}>
  <table className="class-table">
    <thead>
      <tr>
        <th>Student Name</th>
        <th>Student ID</th>
      </tr>
    </thead>
    <tbody>
      {rosterClass?.roster?.map(student => (
        <tr key={student.userId}>
          <td>{student.firstName} {student.lastName}</td>
          <td>{student.userId}</td>
        </tr>
      ))}
    </tbody>
  </table>
</Modal>
```

**Explanation:**  
This frontend component dynamically renders the roster of a selected class in a modal. The backend already attached `firstName` and `lastName` to each student in the `roster` array, so the frontend can cleanly display the full name alongside the user ID.

---

## Summary

This project demonstrates:

- Secure credential handling via AWS Secrets Manager.
- Efficient serverless data ingestion using `batch_writer`.
- Manual OAuth 2.0 authentication with ClassLink.
- Dynamic role-based rendering with React.
- Clean separation between frontend and backend responsibilities.

See [README.md](./README.md) and [SETUP.md](./SETUP.md) for architecture and deployment details.
