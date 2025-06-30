import boto3
import json
import requests

secrets_manager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')

def get_api_details():
    """Retrieves API details from AWS Secrets Manager."""
    secret_name = "classlink-api-credentials"
    print("Getting API details from Secrets Manager...")
    response = secrets_manager.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])
    print("API details retrieved successfully.")
    return secret['base_url'], secret['access_token']

def fetch_data(base_url, access_token, endpoint, limit=500):
    """Fetches a specified number of records from a given API endpoint."""
    url = f"{base_url}{endpoint}?limit={limit}"
    print(f"Requesting data from: {url}")
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(url, headers=headers, timeout=60)
    response.raise_for_status() 
    
    print(f"Successfully fetched data for endpoint: {endpoint}")
    return response.json()

def lambda_handler(event, context):
    """
    Fetches data from the ClassLink API and populates the Users, Enrollments,
    and Classes tables in DynamoDB.
    """
    try:
        base_url, access_token = get_api_details()

        users_response = fetch_data(base_url, access_token, '/users', limit=500)
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

        enrollments_response = fetch_data(base_url, access_token, '/enrollments', limit=500)
        enrollments_data = enrollments_response.get('enrollments', [])
        print(f"Populating {len(enrollments_data)} enrollments into DynamoDB...")
        with enrollments_table.batch_writer() as batch:
            for enrollment in enrollments_data:
                user_id = enrollment.get('user', {}).get('sourcedId')
                class_id = enrollment.get('class', {}).get('sourcedId')
                if user_id and class_id:
                    batch.put_item(
                        Item={
                            'userId': user_id,
                            'classId': class_id,
                            'role': enrollment.get('role', 'N/A')
                        }
                    )
        print("Enrollments table populated.")

        classes_response = fetch_data(base_url, access_token, '/classes', limit=500)
        classes_data = classes_response.get('classes', [])
        print(f"Populating {len(classes_data)} classes into DynamoDB...")
        with classes_table.batch_writer() as batch:
            for course in classes_data:
                if course.get('sourcedId'):
                    batch.put_item(
                        Item={
                            'classId': course.get('sourcedId'),
                            'className': course.get('title', 'N/A'),
                            'courseCode': course.get('courseCode', 'N/A')
                        }
                    )
        print("Classes table populated.")


        return {'statusCode': 200, 'body': json.dumps('Data ingestion successful!')}

    except requests.exceptions.HTTPError as http_err:
        print(f"An HTTP error occurred: {http_err}")
        return {'statusCode': 500, 'body': json.dumps(f"An HTTP error occurred: {str(http_err)}")}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {'statusCode': 500, 'body': json.dumps(f"An error occurred: {str(e)}")}
