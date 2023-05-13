from flask import Flask, jsonify, request
import plaid
from dotenv import load_dotenv
import os

load_dotenv()

# Get the value of the PLAID_API_KEY environment variable
plaid_api_key = os.environ.get('PLAID_API_KEY')

app = Flask(__name__)

# set Plaid API credentials
PLAID_CLIENT_ID = os.environ.get('PLAID_CLIENT_ID')
PLAID_SECRET = os.environ.get('PLAID_SECRET_KEY')
PLAID_PUBLIC_KEY = os.environ.get('PLAID_PUBLIC_KEY')
PLAID_ENV = os.environ.get('sandbox')  # set to 'development' or 'production' in production

# create Plaid API client object
client = plaid.Client(client_id=PLAID_CLIENT_ID, secret=PLAID_SECRET, public_key=PLAID_PUBLIC_KEY, environment=PLAID_ENV)

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

if __name__ == '__main__':
    app.run(debug=True)
