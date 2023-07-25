const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Plaid setup
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': "",
      'PLAID-SECRET': "",
    },
  },
});
const plaidClient = new PlaidApi(configuration);

// Server setup
const app = express()
const port = 8090
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());



app.post('/hello', (req, res) => {
  res.json({message: "Hello world~"});
});


app.post('/api/create_link_token', async function (request, response) {
    // Get the client_user_id by searching for the current user
    // const user = await User.find(...);
    const clientUserId = "josh";
    const tokenRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: clientUserId,
      },
      client_name: 'Plaid Test App',
      products: ['auth'],
      language: 'en',
      redirect_uri: 'http://localhost:3000/',
      country_codes: ['US'],
    };
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(tokenRequest);
      response.json(createTokenResponse.data);
    } catch (error) {
      response.status(500).send("Something went wrong");
    }
  });

app.post('/api/exchange_public_token', async function (
  request,
  response,
  next,
) {
  const publicToken = request.body.public_token;
  try {
    const createTokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    // These values should be saved to a persistent database and
    // associated with the currently signed-in user
    const accessToken = createTokenResponse.data.access_token;
    const itemID = createTokenResponse.data.item_id;

    response.json({ status: 200, access_token: accessToken });
  } catch (err) {
    // handle error
    console.error(err);
    response.status(500).send(err);
  }
});


app.post("/api/auth", async function (request, response) {
  const access_token = request.body.access_token;
  try {
    const plaidRequest = {
        access_token: access_token,
    };
    const plaidResponse = await plaidClient.authGet(plaidRequest);
    response.json(plaidResponse.data);
  } catch (e) {
      console.log("access token", access_token);
      response.status(500).send("failed");
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});