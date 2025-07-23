import boto3
import json
import requests

# Initialize AWS clients outside handler for reuse
secrets_manager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')

def get_api_credentials():
    secret_name = "classlink-api-credentials"
    response = secrets_manager.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])
    return secret['base_url'], secret['admin_api_key']

def fetch_all_paged_data(base_url, bearer_token, endpoint, object_key, limit=1000):
    all_data = []
    offset = 0
    headers = {'Authorization': f'Bearer {bearer_token}'}

    while True:
        full_url = f"{base_url}{endpoint}?limit={limit}&offset={offset}"
        response = requests.get(full_url, headers=headers, timeout=60)
        response.raise_for_status()
        page_data = response.json().get(object_key, [])

        all_data.extend(page_data)

        if len(page_data) < limit:
            break  # No more data
        offset += limit

    return all_data

def clear_table(table, key_names):
    scan = table.scan(ProjectionExpression=', '.join(key_names))
    with table.batch_writer() as batch:
        for item in scan.get('Items', []):
            batch.delete_item(Key={k: item[k] for k in key_names})

def lambda_handler(event, context):
    try:
        base_url, admin_api_key = get_api_credentials()

        # Step 1: Fetch applications list
        apps_url = f"{base_url}/applications"
        headers = {'Authorization': f'Bearer {admin_api_key}'}
        apps_response = requests.get(apps_url, headers=headers, timeout=30)
        apps_response.raise_for_status()
        apps = apps_response.json().get('applications', [])

        if len(apps) < 3:
            raise Exception("Less than 3 applications available.")

        app = apps[2]  # 3rd application (0-based index)
        oneroster_app_id = app.get('oneroster_application_id')
        tenant_id = app.get('tenant_id')
        bearer_token = app.get('bearer')

        if not oneroster_app_id or not tenant_id or not bearer_token:
            raise Exception("Missing oneroster_application_id, tenant_id, or bearer token in 3rd application.")

        # Base API path for user/org/class endpoints includes oneroster_application_id
        base_api_path = f"/{oneroster_app_id}/ims/oneroster/v1p1"

        # Step 2: Fetch users
        users_endpoint = f"{base_api_path}/users"
        users_data = fetch_all_paged_data(base_url, bearer_token, users_endpoint, 'users', limit=1000)

        # Clear Users table and write new users
        clear_table(users_table, ['userId'])
        with users_table.batch_writer() as batch:
            for user in users_data:
                sourced_id = user.get('sourcedId')
                status = user.get('status', '').lower()
                if sourced_id and user.get('role') and status == 'active':
                    composite_user_id = f"{tenant_id}_{sourced_id}"
                    batch.put_item(
                        Item={
                            'userId': composite_user_id,
                            'sourcedId': sourced_id,
                            'tenantId': tenant_id,
                            'role': user.get('role'),
                            'firstName': user.get('givenName', 'N/A'),
                            'lastName': user.get('familyName', 'N/A')
                        }
                    )

        # Step 3: Fetch enrollments
        enrollments_endpoint = f"{base_api_path}/enrollments"
        enrollments_data = fetch_all_paged_data(base_url, bearer_token, enrollments_endpoint, 'enrollments', limit=1000)

        # Clear Enrollments table and write new enrollments
        clear_table(enrollments_table, ['userId', 'classId'])
        with enrollments_table.batch_writer() as batch:
            for enrollment in enrollments_data:
                user_sourced_id = enrollment.get('user', {}).get('sourcedId')
                class_id = enrollment.get('class', {}).get('sourcedId')
                if user_sourced_id and class_id:
                    composite_user_id = f"{tenant_id}_{user_sourced_id}"
                    batch.put_item(
                        Item={
                            'userId': composite_user_id,
                            'classId': class_id,
                            'role': enrollment.get('role', 'N/A')
                        }
                    )

        # Step 4: Fetch classes
        classes_endpoint = f"{base_api_path}/classes"
        classes_data = fetch_all_paged_data(base_url, bearer_token, classes_endpoint, 'classes', limit=1000)

        # Clear Classes table and write new classes
        clear_table(classes_table, ['classId'])
        with classes_table.batch_writer() as batch:
            for course in classes_data:
                sourced_id = course.get('sourcedId')
                if sourced_id:
                    batch.put_item(
                        Item={
                            'classId': sourced_id,
                            'className': course.get('title', 'N/A'),
                            'courseCode': course.get('courseCode', 'N/A')
                        }
                    )

        return {
            'statusCode': 200,
            'body': json.dumps('Data ingestion successful!')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
