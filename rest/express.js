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
app.use(bodyParser.urlencoded({
    extended: true
}));

var handler = {};
var db = new CampaignsDb();
app.get('/', function (req, res) {
    database.create();
});

app.post('/start', function (req, res) {
    winston.info("/start called");
    const campaign = req.body.campaign;
    const limit = req.body.limit;
    runner.run(campaign, limit);
    res.sendStatus(200);
});

app.post('/newProject', function (req, res) {
    winston.info("/newProject called");
    database.createCampaignsModel().then(function (models) {
        console.log('model created, calling newCampaign');
        var campaignModel = models.CampaignModel,
            searchWordsModel = models.SearchWordsModel;
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

app.post('/addToBlackList', function (req, res) {
    let connection = database.create();
    database.createBlackListModel(connection).then(function (model) {
        console.log('created black list model');
        database.addToBlackList(model, {
            site: req.body.site
        }).then(function (newSite) {
            console.log('added succefully to the black list');
            res.send(newSite);
        });
    });
});

app.get('/checkExists', function (req, res) {
    let connection = database.create();

    database.createBlackListModel(connection).then(function (model) {
        console.log('created black list model');
        database.checkExists(model, req.query.site).then(function (exists) {
            console.log(exists);
            res.send(exists);
        });
    });
});

app.get('/getAllBlackList', function (req, res) {
    let connection = database.create();

    database.createBlackListModel(connection).then(function (model) {
        console.log('created black list model');
        database.getAllBlackList(model).then(function (sites) {
            console.log(sites);
            res.send(sites);
        });
    });
});

app.post('/addToPrivateBlackList', function (req, res) {
    database.createPrivateBlackList().then(function (model) {
        console.log('created private black list model');
        database.addToPrivateBlackList(model, {
            site: req.body.site,
            campaign: req.body.campaign
        }).then(function () {
            console.log('added succefully to the private black list');
            res.send('ok');
        });
    });
});

app.get('/checkIfSiteBlockedForCampaign', function (req, res) {
    database.createPrivateBlackList().then(function (model) {
        console.log('created private black list model');
        database.checkIfSiteBlockedForCampaign(model, req.query.site, req.query.campaign).then(function (exists) {
            console.log('added succefully to the private black list');
            res.send(exists);
        });
    });
});

handler.listen = function () {
    app.listen(3001);
    console.log('server is listening on port 3001');
}

module.exports = handler;