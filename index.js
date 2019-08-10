const express = require('express');
const Datastore = require('nedb');
require('dotenv').config();

const app = express();
app.listen(8000, () => console.log('listening at 8000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));

let accounts_database = new Datastore('accounts.db');
accounts_database.loadDatabase();

const obucks_database = new Datastore('obucks.db');
obucks_database.loadDatabase();

let user_account = {};

app.get('/users/:user/:password', (request, response) => {

  let data_params = request.params;
  let user_name = data_params.user;
  let password = data_params.password;

  accounts_database.find({name: user_name}, (err, data) => {

    if(data.length == 0) {
      response.json({success: false});
    } else if(data[0].password == password) {

      user_account = data[0];
      let isAdmin = data[0].isAdmin;
      let money = data[0].money;
      let obucks = data[0].obucks;

      response.json({isAdmin: isAdmin,
                      money: money,
                      obucks: obucks});

    } else {
      response.json({success: false});
    }

  });

});

app.post('/add_user', (request, response) => {

  let data = request.body;
  let name = data.name;
  let password = data.password;

  accounts_database.find({name: name}, (err, data) => {

    let name_in_database = data.length;
    if(!name_in_database) {

      let isAdmin = (password == process.env.ADMIN_PASSWORD);

      let account = {
        name: name,
        password: password,
        isAdmin: isAdmin,
        money: 15000,
        obucks: 0
      }
      accounts_database.insert(account);
      response.json({success: true,
                      isAdmin: isAdmin});

    } else response.json({success: false});

  });

});

app.get('/get_user', (request, response) => {
  response.json({money: user_account.money, obucks: user_account.obucks});
});

app.get('/buy/:amount/:price', (request, response) => {

  let data = request.params;
  let amount = parseInt(data.amount);
  if(amount <= 0) response.json({success: false});

  let price = parseFloat(data.price);
  let afford = Math.floor(user_account.money / price);

  if(amount > afford) response.json({success: false});
  else {
    user_account.money -= price * amount;
    user_account.obucks += amount;
    response.json({success: true});
  }
  update_user();

});

app.get('/sell/:amount/:price', (request, response) => {

  let data = request.params;
  let amount = parseInt(data.amount);
  if(amount <= 0) response.json({success: false});
  let price = parseFloat(data.price);

  if(amount > user_account.obucks) response.json({success: false});
  else {
    user_account.money += price * amount;
    user_account.obucks -= amount;
    response.json({success: true});
  }
  update_user();

});

function update_user() {

  let money = user_account.money;
  let obucks = user_account.obucks;

  accounts_database.update({_id: user_account._id}, {$set: {money: money, obucks: obucks}}, {}, err => {
    if(err) console.error(err);
    accounts_database = new Datastore('accounts.db');
    accounts_database.loadDatabase();
  });

}
