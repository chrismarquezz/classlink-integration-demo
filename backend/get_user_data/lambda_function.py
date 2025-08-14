import boto3
import json
import requests
from urllib.parse import urlencode
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

secrets_manager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

def get_oidc_credentials():
    secret_name = "classlink-oidc-credentials"
    response = secrets_manager.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])

    return secret['oidc_client_id'], secret['oidc_client_secret']

def get_access_token(code, client_id, client_secret):
    token_url = "https://launchpad.classlink.com/oauth2/v2/token"
    
    redirect_uri = "http://localhost:5173/callback"
    
    auth_params = {
        'scope': 'openid',
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'response_type': 'code'
    }
    launch_url = f"https://launchpad.classlink.com/oauth2/v2/auth?{urlencode(auth_params)}"
    
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
    info_url = "https://nodeapi.classlink.com/v2/my/info"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    response = requests.get(info_url, headers=headers)
    
    response.raise_for_status()
    user_info = response.json()
    return user_info

def lambda_handler(event, context):
    if event['requestContext']['http']['method'] == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        
        body = json.loads(event.get('body', '{}'))
        
        code = body.get('code')    
        
        if not code:
            raise ValueError("Authorization code not provided.")

        client_id, client_secret = get_oidc_credentials()

        access_token = get_access_token(code, client_id, client_secret)

        user_info = get_user_info(access_token)
        sourced_id = user_info.get('SourcedId')
        tenant_id = user_info.get('TenantId')

        if not sourced_id or not tenant_id:
            raise ValueError("SourcedId or TenantId not found in user info response.")

        composite_user_id = f"{tenant_id}_{sourced_id}"
        
        user_profile_response = users_table.get_item(Key={'userId': composite_user_id})
        user_profile = user_profile_response.get('Item')

        if not user_profile:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'User not found in roster database.'}, cls=DecimalEncoder)}

        enrollments_response = enrollments_table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(composite_user_id))
        user_enrollments = enrollments_response.get('Items', [])
        
        class_details = []
        if user_enrollments:
            for enrollment in user_enrollments:
                class_id = enrollment['classId']
                class_response = classes_table.get_item(Key={'classId': class_id})
                if class_response.get('Item'):
                    class_details.append(class_response['Item'])
        
        if user_profile.get('role') == 'teacher':
            for course in class_details:
                roster_response = enrollments_table.query(
                    IndexName='classId-userId-index',
                    KeyConditionExpression=boto3.dynamodb.conditions.Key('classId').eq(course['classId'])
                )
                roster = roster_response.get('Items', [])

                for enrollment in roster:
                    user_id = enrollment.get('userId')
                    if user_id:
                        user_resp = users_table.get_item(Key={'userId': user_id})
                        user_item = user_resp.get('Item', {})
                        enrollment['firstName'] = user_item.get('firstName', 'Unknown')
                        enrollment['lastName'] = user_item.get('lastName', 'Unknown')

                course['roster'] = roster


        response_data = {
            "userProfile": user_profile,
            "enrollments": user_enrollments,
            "classes": class_details
        }
        
        def find_decimals(obj, path=""):
            if isinstance(obj, Decimal):
                print(f"DEBUG: Found Decimal at {path}: {obj}")
            elif isinstance(obj, dict):
                for key, value in obj.items():
                    find_decimals(value, f"{path}.{key}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    find_decimals(item, f"{path}[{i}]")
        
        find_decimals(response_data)

        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(response_data, cls=DecimalEncoder)}

    except Exception as e:
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': str(e)}, cls=DecimalEncoder)}