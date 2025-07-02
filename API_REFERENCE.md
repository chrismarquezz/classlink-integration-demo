# API Reference

This document provides details on the custom API endpoint created for the ClassLink Integration Demonstrator frontend application.

---

## Get User-Specific Roster Data

Retrieves the profile, class list, and enrollment data for the currently authenticated user.

-   **Endpoint:** `/` (The specific path is part of the auto-generated API Gateway URL for the `get-user-specific-data` function).
-   **Method:** `GET`
-   **Authentication:** **This is a protected endpoint.** It requires a valid JWT ID Token from the user's Cognito session to be included in the request headers.

    **Header Format:**
    `Authorization: Bearer <ID_TOKEN>`

### Successful Response (`200 OK`)

If the request is successful and the token is valid, the API will return a JSON object with a `200 OK` status code. The body of the response will contain the data associated with the user identified by the token.

#### Response Body Structure
```json
{
  "userProfile": {
    "userId": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  },
  "enrollments": [
    {
      "userId": "string",
      "classId": "string",
      "role": "string"
    }
  ],
  "classes": [
    {
      "classId": "string",
      "className": "string",
      "courseCode": "string",
      "roster": [
        {
          "userId": "string",
          "classId": "string",
          "role": "string"
        }
      ]
    }
  ]
}
```
**Note:** The roster array within each class object is only populated if the authenticated user's role is teacher.

## Error Responses

- **401 Unauthorized:** This error is returned by API Gateway if the request does not include a valid Authorization header with a signed JWT ID Token from Cognito.

- **404 Not Found:** This error is returned by the Lambda function if the userId from the token does not correspond to a user found in the DynamoDB Users table.

- **500 Internal Server Error:** This error is returned if the Lambda function encounters an unexpected issue while querying the database.

