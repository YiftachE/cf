var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var CampaignsDb = require('../db/Campaigns');
let database = require('../db/databaseHandler');
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var handler = {};
var db = new CampaignsDb();
app.get('/', function(req, res){
  database.create();
});

app.post('/newProject', function(req, res){
  database.createCampaignsModel().then(function(models){
      console.log('model created, calling newCampaign');
      var campaignModel = models.CampaignModel, searchWordsModel = models.SearchWordsModel;
      database.addNewCampaign(campaignModel, req.body.data).then(function(campaign){
        console.log('new campaign created');
        // calling search words creator
        database.addSearchWordsToCampaign(searchWordsModel, campaign,req.body.data.searchWords)
            .then(function (searchWordsModel) {
                console.log('search words models created!!');
            });
        res.send('ok');
      });
  });
});

handler.listen = function(){
  app.listen(3001);
  console.log('server is listening on port 3001');
}

module.exports = handler;
