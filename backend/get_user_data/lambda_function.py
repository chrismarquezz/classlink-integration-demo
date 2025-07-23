import json
import boto3
import requests
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB tables
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')

# CORS config
CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST'
}

def get_oauth_credentials():
    secrets_manager = boto3.client('secretsmanager')
    secret = secrets_manager.get_secret_value(SecretId='classlink-oauth-credentials')
    creds = json.loads(secret['SecretString'])
    return (
        creds['client_id'],
        creds['client_secret'],
        creds['token_url'],
        creds['myinfo_url'],
        creds['redirect_uri']
    )

def exchange_code_for_token(code, client_id, client_secret, token_url, redirect_uri):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri
    }
    response = requests.post(token_url, headers=headers, data=data, timeout=10)
    response.raise_for_status()
    return response.json()['access_token']

def get_user_info(access_token, myinfo_url):
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(myinfo_url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()

def lambda_handler(event, context):
    print("Event received:", json.dumps(event))

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        body = json.loads(event.get('body', '{}'))
        code = body.get('code')
        if not code:
            raise ValueError("Missing 'code' in request body.")
    except Exception as e:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': str(e)})}

    try:
        # Get secrets
        client_id, client_secret, token_url, myinfo_url, redirect_uri = get_oauth_credentials()

        # Token exchange + user info
        access_token = exchange_code_for_token(code, client_id, client_secret, token_url, redirect_uri)
        user_info = get_user_info(access_token, myinfo_url)

        tenant_id = user_info.get('tenantId')
        sourced_id = user_info.get('sourcedId')
        if not tenant_id or not sourced_id:
            raise ValueError("Missing tenantId or sourcedId in user info.")

        user_id = f"{tenant_id}_{sourced_id}"

        # Get user from Users table
        user = users_table.get_item(Key={'userId': user_id}).get('Item')
        if not user:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'User not found'})}

        # Get user's enrollments
        enrollments = enrollments_table.query(KeyConditionExpression=Key('userId').eq(user_id)).get('Items', [])

        # Get class info
        classes = []
        for enrollment in enrollments:
            class_id = enrollment.get('classId')
            class_item = classes_table.get_item(Key={'classId': class_id}).get('Item')
            if class_item:
                classes.append(class_item)

        # If teacher, get rosters for their classes
        if user.get('role') == 'teacher':
            for cls in classes:
                class_id = cls.get('classId')
                roster = enrollments_table.query(
                    IndexName='classId-userId-index',
                    KeyConditionExpression=Key('classId').eq(class_id)
                ).get('Items', [])
                cls['roster'] = roster

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'userProfile': user,
                'enrollments': enrollments,
                'classes': classes
            })
        }

    except requests.HTTPError as e:
        print("HTTPError:", e)
        return {
            'statusCode': 502,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'External request failed', 'details': str(e)})
        }
    except Exception as e:
        print("Unhandled error:", e)
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
