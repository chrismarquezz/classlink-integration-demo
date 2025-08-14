# Code Samples with Explanations

This document highlights key code snippets from the project and explains their purpose and design.

---

## 1. Backend: Data Ingestion Lambda (`classlink-data-ingestion`)

This function is a server-to-server process that syncs the roster database.

### Sample 1: Creating a Composite User ID for Multi-Tenancy

```python
# Inside the data ingestion lambda_handler
users_data = fetch_data(base_url, access_token, '/users')
items_written_users = 0
with users_table.batch_writer() as batch:
    for user in users_data:
        sourced_id = user.get('sourcedId')
        # The tenantId is extracted from the user's primary organization
        orgs = user.get('orgs')
        tenant_id = orgs[0].get('sourcedId') if orgs and len(orgs) > 0 else None

        if sourced_id and tenant_id and user.get('role'):
            # The composite key ensures every user is globally unique
            composite_user_id = f"{tenant_id}_{sourced_id}"
            batch.put_item(
                Item={
                    'userId': composite_user_id,
                    'sourcedId': sourced_id,
                    'tenantId': tenant_id,
                    # ... other user attributes
                }
            )
            items_written_users += 1
print(f"Users table populated with {items_written_users} items.")
```

**Explanation:**
This snippet solves a critical data integrity problem. The `sourcedId` from the Roster Server API is only unique *within* a specific tenant (a school district). To create a globally unique primary key for our database, we combine the `tenantId` (extracted from the user's primary organization) with their `sourcedId`. This composite key (`tenantId_sourcedId`) ensures that we can accurately store and retrieve data for users from any number of different tenants without conflicts.

---

## 2. Backend: Secure User API (`get-user-data`)

This function handles the user login flow and fetches data for the authenticated user.

### Sample 2: The OAuth 2.0 Token Exchange

```python
def get_access_token(code, client_id, client_secret):
    """Exchanges a one-time code for an access token."""
    token_url = "[https://launchpad.classlink.com/oauth2/v2/token](https://launchpad.classlink.com/oauth2/v2/token)"
    launch_url = "..." # The full authorization URL
    
    payload = {
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'authorization_code',
        'launch_url': launch_url 
    }
    
    response = requests.post(token_url, data=payload)
    response.raise_for_status()
    return response.json()['access_token']

def get_user_info(access_token):
    """Uses an access token to get the user's info."""
    info_url = "[https://nodeapi.classlink.com/v2/my/info](https://nodeapi.classlink.com/v2/my/info)"
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(info_url, headers=headers)
    response.raise_for_status()
    return response.json()
```
**Explanation:**
This is the core of the secure authentication flow. The `get_access_token` function performs the critical backend token exchange. It takes the temporary `code` from the frontend and sends it to the ClassLink `/token` endpoint, along with the application's secret credentials, to receive a real `access_token`. The `get_user_info` function then uses that token to securely fetch the logged-in user's definitive `tenantId` and `sourcedId` from the `/my/info` endpoint.

### Sample 3: Teacher-Specific Roster Enrichment
```
# Inside the get-user-data lambda_handler
if user_profile.get('role') == 'teacher':
    for course in class_details:
        # Query the GSI to find all enrollments for a specific class
        roster_response = enrollments_table.query(
            IndexName='classId-userId-index',
            KeyConditionExpression=Key('classId').eq(course['classId'])
        )
        roster = roster_response.get('Items', [])
        
        # Enrich the roster with student names
        for student_enrollment in roster:
            user_id = student_enrollment.get('userId')
            if user_id:
                user_resp = users_table.get_item(Key={'userId': user_id})
                user_item = user_resp.get('Item', {})
                student_enrollment['firstName'] = user_item.get('firstName', 'Unknown')
                student_enrollment['lastName'] = user_item.get('lastName', 'Unknown')

        course['roster'] = roster
```
**Explanation:**
This logic provides a better user experience for teachers. After fetching a teacher's classes, the code checks if the user's role is `teacher`. If it is, it performs an additional query for each class to get the full student roster. It then enriches this roster by looking up each student's first and last name from the `Users` table. This ensures the frontend can display a meaningful roster with names, not just IDs.

---

## 3. Frontend: React Application

### Sample 4: Handling the SSO Redirect

```jsx
// Inside App.jsx
useEffect(() => {
  const API_URL = import.meta.env.VITE_SECURE_API_URL;

  const exchangeCodeForData = async (code) => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code }),
      });
      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }
      const data = await response.json();
      setUser(data);
    } catch (e) {
      setError(e.message);
    } finally {
      // Clean the code from the URL so it's not used again
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    exchangeCodeForData(code);
  } else {
    setLoading(false);
  }
}, []); // Empty array ensures this runs only once on page load
```
**Explanation:**
This React `useEffect` hook handles the entire post-login redirect flow. When the component first loads, it checks the browser's URL for a `code` query parameter. If one is found, it immediately sends that `code` to our secure backend API in a `POST` request. The backend then completes the token exchange and returns the user's specific data, which is used to render the dashboard. This hook is the critical link between the frontend and the backend in the authentication process.









