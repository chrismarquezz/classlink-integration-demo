import json
import os
import boto3
import requests
from jose import jwt, JWTError
from boto3.dynamodb.conditions import Key

# DynamoDB Tables
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')

# CORS headers (adjust your frontend origin accordingly)
CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS, GET'
}

# Read Cognito config from environment variables (no hardcoding)
COGNITO_REGION = os.environ['COGNITO_REGION']
COGNITO_USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
COGNITO_APP_CLIENT_ID = os.environ['COGNITO_APP_CLIENT_ID']

def get_public_key(token):
    """Fetches the JWKS and returns the public key that matches the token's kid."""
    jwks_url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    jwks = requests.get(jwks_url).json()

    headers = jwt.get_unverified_header(token)
    kid = headers.get('kid')
    if not kid:
        raise Exception("No kid found in token header")

    key = next((k for k in jwks['keys'] if k['kid'] == kid), None)
    if not key:
        raise Exception("Public key not found in JWKS")

    return key

def lambda_handler(event, context):
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }

    headers = event.get('headers', {})
    auth_header = headers.get('Authorization') or headers.get('authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Unauthorized: Missing or malformed token'})
        }

    token = auth_header.split(' ')[1]

    try:
        key = get_public_key(token)
        claims = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}'
        )
    except JWTError as e:
        return {
            'statusCode': 401,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Invalid token: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 401,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Auth error: {str(e)}'})
        }

    user_sub = claims.get('sub')
    if not user_sub:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Invalid token claims: no sub'})
        }

    user_id = user_sub

    try:
        # Fetch user profile
        user_profile_response = users_table.get_item(Key={'userId': user_id})
        user_profile = user_profile_response.get('Item')
        if not user_profile:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'User not found in roster database.'})
            }

        # Fetch enrollments
        enrollments_response = enrollments_table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        user_enrollments = enrollments_response.get('Items', [])

        # Fetch class details for each enrollment
        class_details = []
        for enrollment in user_enrollments:
            class_id = enrollment['classId']
            class_response = classes_table.get_item(Key={'classId': class_id})
            class_item = class_response.get('Item')
            if class_item:
                class_details.append(class_item)

        # If user is a teacher, include roster per class
        if user_profile.get('role') == 'teacher':
            for course in class_details:
                roster_response = enrollments_table.query(
                    IndexName='classId-userId-index',
                    KeyConditionExpression=Key('classId').eq(course['classId'])
                )
                course['roster'] = roster_response.get('Items', [])

        response_data = {
            "userProfile": user_profile,
            "enrollments": user_enrollments,
            "classes": class_details
        }

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps(response_data)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Unhandled error: {str(e)}'})
        }
