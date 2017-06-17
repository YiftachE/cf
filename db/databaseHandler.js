let handler = {};
let Sequelize = require('sequelize');
let DataTypes = require('sequelize/lib/data-types');
const Promise = require('promise');

function DbConnectionFailException(message) {
    this.message = message;
    this.name = "DbConnectionFailException"
}

handler.create = function () {
    // let sequelize = new Sequelize('ctform', 'root', 'mysqlzhd123Q!@#', {
       let sequelize = new Sequelize('ctform', 'root', 'mysqlzhd123Q!@#', {
        host: '198.199.123.131',
        dialect: 'mysql',
        pool: {
            max: 50,
            min: 1,
            idle: 1000
        }
    });
    if (sequelize) {
        return sequelize;
    } else {
        throw new DbConnectionFailException("Connection to " + sequelize.config.host + " failed")
    }
};
handler.createBlackListModel = function (connection) {
    return new Promise(function (fulfill, reject) {
        var BlackListModel = connection.define('blackList', {
            site: {
                type: DataTypes.STRING
            }
        }, {
            freezeTableName: true // Model tableName will be the same as the model name
        });

        connection.sync().then(function () {
                if (BlackListModel) {
                    fulfill(BlackListModel);
                } else {
                    reject('couldnt create campaign & searchWords model');
                }
            })
            .catch(function (err) {
                reject(err);
                console.log(err);
            });
    });

}

handler.addToBlackList = function (BlackListModel, data) {
    return new Promise(function (fulfill, reject) {
        if (BlackListModel) {
            BlackListModel.create({
                    site: data.site,
                })
                .then(function (blackListedSite) {
                    fulfill(blackListedSite);
                })
                .catch(function (err) {
                    reject(err);
                });
        }
    });
}


handler.checkExists = function (BlackListModel, site) {
    return new Promise(function (fulfill, reject) {
        BlackListModel.findOne({
                where: {
                    site: site
                }
            }).then(function (project) {
                if (project) {
                    fulfill(true);
                } else {
                    fulfill(false);
                }
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
    });
}

handler.getAllBlackList = function (BlackListModel) {
    return new Promise(function (fulfill, reject) {
        BlackListModel.findAll({})
            .then(function (sites) {
                console.log(sites);
                justSites = sites.map(function (site) {
                    return site.site;
                });
                fulfill(justSites);
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
    });
}

handler.createPrivateBlackList = function (connection) {
    return new Promise(function (fulfill, reject) {

        var PrivateBlackListModel = connection.define('privateBlackList', {
            site: {
                type: DataTypes.STRING
            },
            campaign: {
                type: DataTypes.STRING
            },
            didFail: {
                type: DataTypes.BOOLEAN
            }
        }, {
            freezeTableName: true // Model tableName will be the same as the model name
        });

        connection.sync().then(function () {
                if (PrivateBlackListModel) {
                    fulfill(PrivateBlackListModel);
                } else {
                    reject('couldnt create campaign & searchWords model');
                }
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
    });
};

handler.addToPrivateBlackList = function (PrivateBlackListModel, data) {
    return new Promise(function (fulfill, reject) {
        if (PrivateBlackListModel) {
            PrivateBlackListModel.create({
                    site: data.site,
                    didFail: data.didFail,
                    campaign: data.campaign
                })
                .then(function (PrivateBlackListModel) {
                    fulfill();
                })
                .catch(function (err) {
                    reject(err);
                });
        }
    });
}


handler.checkIfSiteBlockedForCampaign = function (PrivateBlackListModel, site, campaign, reflowFailures) {
    return new Promise(function (fulfill, reject) {
        let resPromise;

        PrivateBlackListModel.findAll({
                where: {
                    campaign: campaign,
                    site: site,

                }
            }).then(function (sites) {
                console.log(site);
                if (sites.length > 0) {
                    if (reflowFailures && sites.filter(site => site.dataValues.didFail).length > 0) {
                        fulfill(false);
                    } else
                        fulfill(true);
                } else {
                    fulfill(false);
                }
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
    });
}

module.exports = handler;