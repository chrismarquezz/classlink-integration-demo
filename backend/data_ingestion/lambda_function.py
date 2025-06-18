import boto3
import json
import requests

secrets_manager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')

def get_api_details():
    secret_name = "classlink-api-credentials"
    print("Getting API details from Secrets Manager...")
    response = secrets_manager.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])
    print("API details retrieved successfully.")
    return secret['base_url'], secret['access_token']

def fetch_data(base_url, access_token, endpoint):
    url = f"{base_url}{endpoint}"
    print(f"Requesting data from: {url}")
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(url, headers=headers, timeout=30)
    
    response.raise_for_status() 
    
    print(f"Successfully fetched data for endpoint: {endpoint}")
    return response.json()

def lambda_handler(event, context):
    try:
        base_url, access_token = get_api_details()

        users_response = fetch_data(base_url, access_token, '/users')
        users_data = users_response.get('users', [])
        print(f"Populating {len(users_data)} users into DynamoDB...")
        with users_table.batch_writer() as batch:
            for user in users_data:
                batch.put_item(
                    Item={
                        'userId': user.get('sourcedId'),
                        'role': user.get('role'),
                        'firstName': user.get('givenName'),
                        'lastName': user.get('familyName'),
                        'email': user.get('email')
                    }
                )
        print("Users table populated.")

        enrollments_response = fetch_data(base_url, access_token, '/enrollments')
        enrollments_data = enrollments_response.get('enrollments', [])
        print(f"Populating {len(enrollments_data)} enrollments into DynamoDB...")
        with enrollments_table.batch_writer() as batch:
            for enrollment in enrollments_data:
                batch.put_item(
                    Item={
                        'userId': enrollment.get('user', {}).get('sourcedId'),
                        'classId': enrollment.get('class', {}).get('sourcedId'),
                        'role': enrollment.get('role')
                    }
                )
        print("Enrollments table populated.")

        return {'statusCode': 200, 'body': json.dumps('Data ingestion successful!')}

    except requests.exceptions.HTTPError as http_err:
        print(f"An HTTP error occurred: {http_err}")
        return {'statusCode': 500, 'body': json.dumps(f"An HTTP error occurred: {str(http_err)}")}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {'statusCode': 500, 'body': json.dumps(f"An error occurred: {str(e)}")}
