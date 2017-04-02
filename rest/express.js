var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var CampaignsDb = require('../db/Campaigns');
let database = require('../db/databaseHandler');
const runner = require('../campaignRunner.js');
const winston = require('winston');


var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var handler = {};
var db = new CampaignsDb();
app.get('/', function (req, res) {
    database.create();
});

app.get('/start', function (req, res) {
    winston.info("/start called");
    runner.run(['eden', 'king']);
});

app.post('/newProject', function (req, res) {
    winston.info("/newProject called");
    database.createCampaignsModel().then(function (models) {
        console.log('model created, calling newCampaign');
        var campaignModel = models.CampaignModel, searchWordsModel = models.SearchWordsModel;
        database.addNewCampaign(campaignModel, req.body.data).then(function (campaign) {
            console.log('new campaign created');
            // calling search words creator
            database.addSearchWordsToCampaign(searchWordsModel, campaign, req.body.data.searchWords)
                .then(function (searchWordsModel) {
                    console.log('search words models created!!');
                }).catch(function (err) {
                winston.error(err);
            });
            res.send('ok');
        }).catch(function (err) {
            winston.error(err);
        });
    });
});

handler.listen = function () {
    app.listen(3001);
    console.log('server is listening on port 3001');
};

module.exports = handler;
