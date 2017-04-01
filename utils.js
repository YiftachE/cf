/**
 * Created by Eden on 31/03/2017.
 */
const fs = require('fs');
const URL = require('url');
const utils = {};
utils.selenium = {};
utils.exceptions = {};
utils.other = {};

utils.selenium.takeScreenshot = function (browser,name) {
    return new Promise(function (resolve, reject) {
        browser.takeScreenshot().then(function(data){
            const base64Data = data.replace(/^data:image\/png;base64,/,"");
            fs.writeFile(`${name}.png`, base64Data, 'base64', function(err) {
                 err ? reject(err) : resolve();
            });
        });
    });
};

utils.exceptions.NoFormException = function NoFormException(internal_exception) {
    this.text = "Couldn't find form";
    this.internalException = internal_exception;
};
utils.exceptions.NoContactException = function NoContactException(internal_exception) {
    this.text = "Couldn't find contact us";
    this.internalException = internal_exception;
};
utils.exceptions.SubmitExcpetion = function NoContactException(moreInfo,internal_exception) {
    this.text = `Couldn't submit form-${moreInfo}`;
    this.internalException = internal_exception;
};
utils.exceptions.NoMoreResultsException = function NoMoreResultsException(results) {
    this.results = results;
};

utils.other.getHostName = function (url) {
    const hostname = URL.parse(url).hostname;
    return hostname.indexOf('www.') && hostname || hostname.replace('www.', '');
};

module.exports = utils;