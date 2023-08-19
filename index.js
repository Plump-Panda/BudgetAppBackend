const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const {MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const modules = require("./modules")

// Plaid setup
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(configuration);

const uri = "mongodb+srv://"+process.env.DB_USER+":"+process.env.DB_PASSWORD+"@accounts.nrahwy2.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = null;
let accountsCollection = null;

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
) {
  const publicToken = request.body.public_token;
  try {
    const createTokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    // These values should be saved to a persistent database and
    // associated with the currently signed-in user
    const accessToken = createTokenResponse.data.access_token;
    // const itemID = createTokenResponse.data.item_id;
   
    // add access token to user
    const filter = { email: request.body.email };
    const updateItem = {
      $set: {
          accessToken: accessToken,
      },
    };
    modules.updateItemInCollection(accountsCollection,filter,updateItem);

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

// TODO: Implement JWTs for more security
app.post('/api/login', async function(request, response){
  try{
    const users = await accountsCollection.find({
      email: request.body.email,
    }).toArray();

    if(users.length === 1){
      if(users[0].accessToken){
        response.json({password: users[0].password, access_token: users[0].accessToken}).status(200);
      }else{
        response.json({password: password}).status(200);
      }
    }else{
      response.sendStatus(401);
    }
  }catch(err){
    console.log(err);
    response.sendStatus(500);
  }
});

// TODO: Implement JWTs for more security
app.post('/api/createaccount', async function(request, response){
  const user = {email: request.body.email, password: request.body.password}
  try{
    accountsCollection.insertOne(user, function(err, res) {
      if (err) throw err;
      console.log("Inserted user into Accounts table", user);
    });
    response.sendStatus(200);
  }catch(err){
    response.sendStatus(500).send({error: err});
  }
});

app.get('/api/getmaindata', async function (request, response){
  try{
    const users = accountsCollection.find({email: response.body.email}).toArray();
    if(users.length === 1){
      if(users[0].accessToken){        
        response.json({password: users[0].password, access_token: users[0].accessToken}).status(200);
      }else{
        response.json({password: password}).status(200);
      }
    }else{
      response.sendStatus(500);
    }
  }catch(err){

  };
});

async function setupDatabase() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("BudgetApp").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    db = client.db('BudgetApp');
    accountsCollection = db.collection('Accounts');
  } catch(err){
    console.error("Error connecting to DB",err);
    await client.close();
  }
}
// startDBConnection().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  setupDatabase();
});