/**
 * Created by Eden on 31/03/2017.
 */
const fs = require('fs');
const URL = require('url');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const utils = {};
const winston = require('winston');
utils.selenium = {};
utils.promise = {};
utils.exceptions = {};
utils.other = {};
utils.selenium.retryOnStale = function (browser, selector, callback) {
    return browser.findElement(selector).then(callback)
        .thenCatch(function (err) {
            if (err.name === 'StaleElementReferenceError')
                return retryOnStale(selector, callback);

            throw err;
        });
}
utils.ReportData = function (keyword) {
    this.cfSentNumber = 0;
    this.noCfNumber = 0;
    this.blockedByBLNumber = 0;
    this.sitesVisitedNumber = 0;
    if (keyword) {
        this.keyword = keyword;
    } else {
        this.keyword = "";
    }
};
utils.promise.tryAtMost = function (otherArgs, maxRetries, promise) {
    return new Promise(function (resolve, reject) {
        promise().then(res => resolve(res)).catch(function (e) {
            if (maxRetries > 0) {
                // Try again if we haven't reached maxRetries yet
                setTimeout(function () {
                    resolve(utils.promise.tryAtMost(otherArgs, maxRetries - 1, promise));
                }, 200);
            } else {
                reject(e);
            }
        })
    });


}
utils.selenium.takeScreenshot = function (browser, name) {
    return new Promise(function (resolve, reject) {
        browser.getTitle().then(() =>
            browser.takeScreenshot().then(function (data) {
                const base64Data = data.replace(/^data:image\/png;base64,/, "");
                mkdirp(getDirName(name), function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        fs.writeFile(`${name}.png`, base64Data, 'base64', function (err) {
                            err ? reject(err) : resolve();
                        });
                    }
                });

            }).catch(function (err) {
                winston.error(err);
                reject(err);
            })).catch(e =>
            reject(e)
        );
    });
};
utils.selenium.logUrl = function LogUrl(browser) {
    browser.getCurrentUrl().then(url =>
        console.log(url)
    );
}
utils.exceptions.NoFormException = function NoFormException(internal_exception) {
    this.text = "Couldn't find form";
    this.internalException = internal_exception;
};
utils.exceptions.NoContactException = function NoContactException(internal_exception) {
    this.text = "Couldn't find contact us";
    this.internalException = internal_exception;
};
utils.exceptions.SubmitExcpetion = function NoContactException(moreInfo, internal_exception) {
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

utils.promise.promisesAllLimit = function parallelLimit(promiseFactories, limit) {
    let result = [];
    let cnt = 0;

    function chain(promiseFactories) {
        if (!promiseFactories.length) return;
        let i = cnt++; // preserve order in result
        return promiseFactories.shift()().then((res) => {
            result[i] = res; // save result
            return chain(promiseFactories); // append next promise
        });
    }

    let arrChains = [];
    while (limit-- > 0 && promiseFactories.length > 0) {
        // create `limit` chains which run in parallel
        arrChains.push(chain(promiseFactories));
    }

    // return when all arrChains are finished
    return Promise.all(arrChains).then(() => result);
}


utils.promise.reflect = function reflect(promise) {
    if (typeof promise === "function") {
        return promise().then(function (v) {
            return {
                v: v,
                status: "resolved"
            }
        }).catch(function (e) {
            return {
                e: e,
                status: "rejected"
            }
        });
    } else
        return promise.then(function (v) {
            return {
                v: v,
                status: "resolved"
            }
        }).catch(function (e) {
            return {
                e: e,
                status: "rejected"
            }
        });
}

utils.other.promiseSerial = funcs =>
    funcs.reduce((promise, func) =>
        promise.then(result => utils.promise.reflect(func()).then(Array.prototype.concat.bind(result))),
        Promise.resolve([]));
utils.other.promiseSerialNonFunc = funcs =>
    funcs.reduce((promise, func) =>
        promise.then(result => func.then(Array.prototype.concat.bind(result))),
        Promise.resolve([]));

utils.other.createReport = function (reportData, curTime, title) {
    mkdirp("./reports", function (err) {
        if (err)
            winston.error(err);
    });
    fs.writeFile(`./reports/${title}-${curTime}-report.txt`,
        `Number of sites visited: ${reportData.sitesVisitedNumber}
         Number of CF sent: ${reportData.cfSentNumber}
         Number of sites with no CF: ${reportData.noCfNumber}
         Number of sites that got blocked by Blacklist: ${reportData.blockedByBLNumber}
         Keywords done: ${reportData.keyword}`,
        function (err) {
            if (err) {
                winston.error(err);
            }
        }
    );
};
module.exports = utils;