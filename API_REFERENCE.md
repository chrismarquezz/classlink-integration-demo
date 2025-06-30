# API Reference

This document provides details on the custom API endpoint created for the ClassLink Integration Demonstrator frontend application.

---

## Get All Roster Data

Retrieves a comprehensive list of all users, enrollments, and classes from the DynamoDB database.

-   **Endpoint:** `/` (The specific path is part of the auto-generated API Gateway URL).
-   **Method:** `GET`
-   **Authentication:** This endpoint is currently public and requires no authentication headers. Access is open for development purposes. *Note: This will be updated to require an Authorization token after SSO is implemented.*

### Successful Response (`200 OK`)

If the request is successful, the API will return a JSON object with a `200 OK` status code. The body of the response will have the following structure, containing arrays of objects for `users`, `enrollments`, and `classes`.

#### Response Body Structure
```json
{
  "users": [
    {
      "userId": "string",
      "role": "string (e.g., 'student', 'teacher')",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    }
  ],
  "enrollments": [
    {
      "userId": "string",
      "classId": "string",
      "role": "string (e.g., 'student', 'teacher')"
    }
  ],
  "classes": [
    {
      "classId": "string",
      "className": "string",
      "courseCode": "string"
    }
  ]
}

Error Response (500 Internal Server Error)
If the Lambda function encounters an issue connecting to or reading from DynamoDB, it will return a 500 status code with a generic error message in the body.

{
    "body": "Error fetching data from DynamoDB"
}
