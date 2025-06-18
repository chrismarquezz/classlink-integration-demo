import boto3
import json

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
enrollments_table = dynamodb.Table('Enrollments')

def lambda_handler(event, context):
    try:
        users_response = users_table.scan()
        enrollments_response = enrollments_table.scan()

        data = {
            "users": users_response.get('Items', []),
            "enrollments": enrollments_response.get('Items', [])
        }

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps(data)
        }
    except Exception as e:
        print(e)
        return {'statusCode': 500, 'body': json.dumps('Error fetching data from DynamoDB')}