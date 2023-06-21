from flask import Flask, jsonify, request
import plaid
from plaid.api import plaid_api
from dotenv import load_dotenv
import os
import requests

load_dotenv()


# Get the value of the PLAID_API_KEY environment variable
plaid_api_key = os.environ.get('PLAID_API_KEY')

app = Flask(__name__)

# set Plaid API credentials
PLAID_CLIENT_ID = os.environ.get('PLAID_CLIENT_ID')
PLAID_SECRET_KEY = os.environ.get('PLAID_ENVIRONMENT_KEY')

# Available environments are
# 'Production'
# 'Development'
# 'Sandbox'
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET_KEY,
    }
)

# Set up Plaid client
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)


@app.route('/plaid/getToken')
def request_public_token():
    request = ItemPublicTokenExchangeRequest(public_token=public_token)
    response = client.item_public_token_exchange(request)
    access_token = response['access_token']
    item_id = response['item_id']

# define route for Plaid authentication
@app.route('/plaid/authenticate', methods=['POST'])
def authenticate():
    # get user's Plaid access token
    public_token = request.form['public_token']
    response = client.Item.public_token.exchange(public_token)
    access_token = response['access_token']

    # return Plaid access token to client
    return jsonify({'access_token': access_token})


# Define the /plaid/transactions endpoint
@app.route('/plaid/transactions', methods=['POST'])
def get_transactions():
    # Parse the request body to get the user_id parameter
    user_id = request.json.get('user_id')
    # get user's Plaid access token and date range
    access_token = request.form['access_token']
    start_date = request.form['start_date']
    end_date = request.form['end_date']

    # retrieve transaction history from Plaid API
    transactions_response = client.Transactions.get(access_token, start_date, end_date)
    transactions = transactions_response['transactions']

    # Filter the transaction data based on the user_id parameter
    filtered_transactions = [t for t in transactions['transactions'] if t['account_owner'] == user_id]

    # Return the filtered transaction data as a JSON response
    return jsonify({'transactions': filtered_transactions})

@app.route('/', methods=['GET'])
def bruh():
    return 'Wah'

if __name__ == '__main__':
    app.run(debug=True)
