var solver = require('./2captchaSolver.js');
const driver = require('selenium-webdriver');
const {Builder, By, until} = require('selenium-webdriver');


// DeathByCaptcha = require("deathbycaptcha");
// var dbc = new DeathByCaptcha("Jsinger@zdhconsulting.com", "67araydeathbycaptcha");

var options = {
  limit: 100,
  solver:solver
};

var searcher = {};
searcher.search = function(keyword) {
  options.query = keyword;
  return new Promise(function(resolve,reject) {
    let browser = new Builder()
        .forBrowser('chrome')
        .build();
    browser.get("http://www.google.com");
    browser.findElement(By.name('q')).sendKeys(keyword,driver.Key.RETURN);
    var chain = Promise.resolve([]);
      for(let i = 0; i < (options.limit/9);i++) {
          chain = chain.then(function (allLinks) {
              console.log(i)
              return new Promise(function(resolve,reject) {
                findLinks(browser).then(function (links) {
                    browser.findElement(By.css("td.navend > a.pn")).click();
                    resolve(allLinks.concat(links));
                }).catch(function(err){
                    reject(err);
                })
            });
        }).catch(function (err) {
            reject(err);
          });
    }
    chain.then(function(links){
        browser.quit();
        console.log(links);
        resolve(links)
    }).catch(function (err) {
        reject(err);
    });
  });
};

var findLinks = function (browser) {
        browser.wait(until.elementLocated(By.css("h3.r > a")),30000);
        return browser.findElements(By.css("h3.r > a")).then(function(elems){
            const linksPromises = elems.map(elem =>elem.getAttribute("href"));
            return Promise.all(linksPromises)
        });
};
module.exports = searcher;
