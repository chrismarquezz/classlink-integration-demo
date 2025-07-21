import json
import os
import boto3
import requests
from jose import jwt, JWTError
from boto3.dynamodb.conditions import Key

# DynamoDB Tables
print("Setting up DynamoDB tables...")
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')
print("DynamoDB tables set.")

# CORS headers (adjust your frontend origin accordingly)
CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS, GET'
}

print("Reading environment variables...")
COGNITO_REGION = os.environ.get('COGNITO_REGION')
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID')
print(f"COGNITO_REGION: {COGNITO_REGION}")
print(f"COGNITO_USER_POOL_ID: {COGNITO_USER_POOL_ID}")
print(f"COGNITO_APP_CLIENT_ID: {COGNITO_APP_CLIENT_ID}")

def get_public_key(token):
    print("Getting public key from JWKS...")
    jwks_url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    print(f"JWKS URL: {jwks_url}")
    jwks = requests.get(jwks_url).json()
    print(f"JWKS keys fetched: {len(jwks.get('keys', []))}")

    headers = jwt.get_unverified_header(token)
    kid = headers.get('kid')
    print(f"Token header kid: {kid}")
    if not kid:
        raise Exception("No kid found in token header")

    key = next((k for k in jwks['keys'] if k['kid'] == kid), None)
    if not key:
        raise Exception("Public key not found in JWKS")
    print("Matching public key found.")
    return key

def lambda_handler(event, context):
    print(f"Event received: {event}")

    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        print("Handling CORS preflight OPTIONS request.")
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }

    headers = event.get('headers', {})
    print(f"Request headers: {headers}")
    auth_header = headers.get('Authorization') or headers.get('authorization')
    print(f"Authorization header: {auth_header}")
    if not auth_header or not auth_header.startswith('Bearer '):
        print("Missing or malformed Authorization header.")
        return {
            'statusCode': 401,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Unauthorized: Missing or malformed token'})
        }

    token = auth_header.split(' ')[1]
    print(f"Token extracted: {token}")

    try:
        key = get_public_key(token)
        print(f"Public key obtained: {key}")
        claims = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}'
        )
        print(f"Token claims: {claims}")
    except JWTError as e:
        print(f"JWTError during token decode: {str(e)}")
        return {
            'statusCode': 401,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Invalid token: {str(e)}'})
        }
    except Exception as e:
        print(f"Exception during token validation: {str(e)}")
        return {
            'statusCode': 401,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Auth error: {str(e)}'})
        }

    user_sub = claims.get('sub')
    print(f"User sub claim: {user_sub}")
    if not user_sub:
        print("No sub claim in token.")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Invalid token claims: no sub'})
        }

    user_id = user_sub

    try:
        print(f"Fetching user profile for userId={user_id}")
        user_profile_response = users_table.get_item(Key={'userId': user_id})
        user_profile = user_profile_response.get('Item')
        print(f"User profile: {user_profile}")
        if not user_profile:
            print("User profile not found.")
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'User not found in roster database.'})
            }

        print("Fetching user enrollments...")
        enrollments_response = enrollments_table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        user_enrollments = enrollments_response.get('Items', [])
        print(f"User enrollments: {user_enrollments}")

        class_details = []
        for enrollment in user_enrollments:
            class_id = enrollment['classId']
            print(f"Fetching class details for classId={class_id}")
            class_response = classes_table.get_item(Key={'classId': class_id})
            class_item = class_response.get('Item')
            print(f"Class details: {class_item}")
            if class_item:
                class_details.append(class_item)

        if user_profile.get('role') == 'teacher':
            print("User is a teacher, fetching roster for each class.")
            for course in class_details:
                print(f"Fetching roster for classId={course['classId']}")
                roster_response = enrollments_table.query(
                    IndexName='classId-userId-index',
                    KeyConditionExpression=Key('classId').eq(course['classId'])
                )
                course['roster'] = roster_response.get('Items', [])
                print(f"Roster: {course['roster']}")

        response_data = {
            "userProfile": user_profile,
            "enrollments": user_enrollments,
            "classes": class_details
        }
        print("Returning successful response.")
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps(response_data)
        }

    except Exception as e:
        print(f"Unhandled exception: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Unhandled error: {str(e)}'})
        }
