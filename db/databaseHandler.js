let handler = {};
let Sequelize = require('sequelize');
let DataTypes = require('sequelize/lib/data-types');
const Promise = require('promise');

  handler.create = function(){
    return new Promise(function(fulfill, reject){
      let sequelize = new Sequelize('ctform', 'root', 'mysqlzhd123Q!@#', {
        host: '162.243.8.121',
        dialect: 'mysql',
        pool: {
          max: 50,
          min: 1,
          idle: 10000
        }
      });
      if(sequelize){
        fulfill(sequelize);
      }else{
        reject();
      }
    });
  };

  // handler.createCampaignsModel = function(){
  //     return new Promise(function(fulfill, reject){
  //       handler.create().then(function(sequelize){
  //         console.log('created sequelize');
  //         // sequelize = sequelize;
  //
  //         var CampaignModel = sequelize.define('campaignsModel', {
  //           title: {
  //             type: DataTypes.STRING
  //           },
  //           sites: {
  //             type: DataTypes.STRING
  //           },
  //           firstName: {
  //             type: DataTypes.STRING
  //           },
  //           lastName: {
  //             type: DataTypes.STRING
  //           },
  //           email: {
  //             type: DataTypes.STRING
  //           },
  //           phoneNumber: {
  //             type: DataTypes.STRING
  //           },
  //           company: {
  //             type: DataTypes.STRING
  //           },
  //           address: {
  //             type: DataTypes.STRING
  //           },
  //           city: {
  //             type: DataTypes.STRING
  //           },
  //           url: {
  //             type: DataTypes.STRING
  //           },
  //           job: {
  //             type: DataTypes.STRING
  //           },
  //           messageTitle: {
  //             type: DataTypes.STRING
  //           },
  //           inquiry: {
  //             type: DataTypes.STRING
  //           }
  //         }, {
  //           freezeTableName: true // Model tableName will be the same as the model name
  //         });
  //
  //       var SearchWordsModel = sequelize.define('searchWordsModel', {
  //             word: {
  //                 type: DataTypes.STRING
  //             },
  //             campaignsModelId: {
  //                 type: DataTypes.INTEGER
  //             }
  //           }, {
  //               freezeTableName: true // Model tableName will be the same as the model name
  //           });
  //
  //         sequelize.sync().then(function() {
  //           if(CampaignModel && SearchWordsModel){
  //             console.log('campaignModel and SearchWordsModel created!');
  //             CampaignModel.hasMany( SearchWordsModel, {as:'searchWords'});
  //             SearchWordsModel.hasOne( CampaignModel, {as:'campaignModel'});
  //
  //             fulfill({CampaignModel:CampaignModel, SearchWordsModel:SearchWordsModel});
  //           }else {
  //             reject('couldnt create campaign & searchWords model');
  //           }
  //         });
  //       });
  //     });
  //   }

  handler.createBlackListModel = function(){
    return new Promise(function(fulfill, reject){
        handler.create().then(function(sequelize){
        console.log('created sequelize');

        var BlackListModel = sequelize.define('blackList', {
          site: {
            type: DataTypes.STRING
          }
        }, {
          freezeTableName: true // Model tableName will be the same as the model name
        });

        sequelize.sync().then(function() {
          if(BlackListModel){
            fulfill(BlackListModel);
          }else {
            reject('couldnt create campaign & searchWords model');
          }
        })
        .catch(function (err) {
            reject(err);
            console.log(err);
        });
    });
    });
  }

  handler.addToBlackList = function (BlackListModel, data) {
      return new Promise(function(fulfill, reject) {
        if(BlackListModel){
            BlackListModel.create({
                site: data.site
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
      return new Promise(function(fulfill, reject) {
          BlackListModel.findOne({where: {site: site}}).then(function (project) {
              if (project) {
                fulfill(true);
              }else{
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
      return new Promise(function(fulfill, reject) {
          BlackListModel.findAll({})
              .then(function (sites) {
                  console.log(sites);
                  justSites = sites.map(function (site) {
                      return site.site;
                  });
                  fulfill(justSites );
              })
              .catch(function (err) {
                  console.log(err);
                  reject(err);
              });
      });
  }

handler.createPrivateBlackList = function(){
    return new Promise(function(fulfill, reject){
        handler.create().then(function(sequelize){
            console.log('created sequelize');

            var PrivateBlackListModel = sequelize.define('privateBlackList', {
                site: {
                    type: DataTypes.STRING
                },
                campaign: {
                    type: DataTypes.STRING
                }
            }, {
                freezeTableName: true // Model tableName will be the same as the model name
            });

            sequelize.sync().then(function() {
                if(PrivateBlackListModel){
                    fulfill(PrivateBlackListModel);
                }else {
                    reject('couldnt create campaign & searchWords model');
                }
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });
    });
};

handler.addToPrivateBlackList= function (PrivateBlackListModel, data) {
    return new Promise(function(fulfill, reject) {
        if(PrivateBlackListModel){
            PrivateBlackListModel.create({
                site: data.site,
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


handler.checkIfSiteBlockedForCampaign = function (PrivateBlackListModel, site, campaign) {
    return new Promise(function(fulfill, reject) {
            PrivateBlackListModel.findAll({
                where: {
                    campaign: campaign,
                    site: site
                }
            })
            .then(function (site) {
                console.log(site);
                if(site.length > 0){
                    fulfill(true);
                }else{
                    fulfill(false);
                }
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
    });
}
  // handler.addNewCampaign = function(CampaignModel ,data){
  //   return new Promise(function(fulfill, reject){
  //     if(CampaignModel){
  //       CampaignModel
  //         .create({
  //           title: data.title,
  //           sites: data.sites,
  //           firstName: data.firstName,
  //           lastName: data.lastName,
  //           email: data.email,
  //           phoneNumber: data.phoneNumber,
  //           company: data.company,
  //           address: data.address,
  //           city: data.city,
  //           url: data.url,
  //           job: data.job,
  //           messageTitle: data.messageTitle,
  //           inquiry: data.inquiry
  //         })
  //         .then(function(newCampaign) {
  //           fulfill(newCampaign);
  //         });
  //     }else {
  //       console.log('campaign model was not created');
  //     }
  //   });
  // }
  
  // handler.addSearchWordsToCampaign = function (searchWordsModel, campaignInstance, searchWords) {
  //     return new Promise(function(fulfill, reject) {
  //         let searchDataArray = [];
  //         searchWords.forEach(function (word) {
  //             searchDataArray.push({
  //                 word: word
  //             });
  //         });
  //
  //         // searchWordsModel.create({word:searchWords[0]}).then(function (instance) {
  //         //   console.log(instance);
  //         //     campaignInstance.setSearchWords([instance]).then(function (temp) {
  //         //                 console.log(temp);
  //         //             })
  //         //             .catch(function(err){
  //         //                 if(err){
  //         //                   console.log(err);
  //         //                 }
  //         //             });
  //         // });
  //         searchWordsModel.bulkCreate(searchDataArray).then(function (searchWordsCreated) {
  //             campaignInstance.setSearchWords(searchWordsCreated).then(function (temp) {
  //                 console.log(temp);
  //                 fulfill(temp);
  //             })
  //             .catch(function(err){
  //                 if(err){
  //                   console.log(err);
  //                 }
  //             });
  //         });
  //     });
  // };

module.exports = handler;
