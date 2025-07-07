import boto3
import json

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')
classes_table = dynamodb.Table('Classes')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
}

def lambda_handler(event, context):
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')

    if http_method == 'OPTIONS':
        return { 'statusCode': 200, 'headers': CORS_HEADERS, 'body': '' }

    try:
        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']

        if not user_id:
            raise Exception("User ID (sub) not found in JWT claims.")

        print(f"Handling GET request for authenticated user: {user_id}")

        user_profile_response = users_table.get_item(Key={'userId': user_id})
        user_profile = user_profile_response.get('Item')

        if not user_profile:
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'error': f"User with ID {user_id} not found in the roster database.",
                    'userProfile': None,
                    'classes': []
                })
    }


        enrollments_response = enrollments_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(user_id)
        )
        user_enrollments = enrollments_response.get('Items', [])
        
        class_details = []
        for enrollment in user_enrollments:
            class_id = enrollment['classId']
            class_response = classes_table.get_item(Key={'classId': class_id})
            if class_response.get('Item'):
                class_details.append(class_response['Item'])

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
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
