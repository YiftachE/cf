const driver = require('selenium-webdriver');
const {
    Builder,
    By,
    until
} = require('selenium-webdriver');
const utils = require('./utils.js');

let finder = {};

finder.find = function (url, campaign) {
    return new Promise(function (resolve, reject) {
        
        let browser = new Builder()
            .forBrowser('chrome')
            .build();
        browser.get(url);
        
        browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"), 200)
            .then(function (elements) {
                if (elements.length === 0) {
                    const pictureName = `./sc/${campaign.name}/NoContact-${utils.other.getHostName(url)}`;
                    utils.selenium.takeScreenshot(browser, pictureName)
                        .then(function () {
                            browser.quit();
                            reject(new utils.exceptions.NoFormException());
                        }).catch(function (err) {
                            browser.quit();
                            reject(new utils.exceptions.NoFormException(err));
                        });
                } else {
                    let promises = [];
                    for (let i = 0; i < elements.length; i++) {
                        promises.push(goToContact.bind(this, elements[i], browser, url, campaign));
                    }
                    Promise.all(promises.map(utils.promise.reflect)).then(function (results) {
                        var success = results.filter(x => x.status === "resolved");
                        const pictureName = `./sc/Success-${utils.other.getHostName(url)}`;
                        utils.selenium.takeScreenshot(browser, pictureName)
                            .then(function () {
                                browser.quit();
                                console.log('url:' + url + " success!");
                                resolve()
                            }).catch(function (err) {
                                finder.logger.error(err);
                                browser.quit();
                                console.log('url:' + url + " success!");
                                resolve()
                            });
                    }).catch(function (err) {
                        browser.quit();
                        reject(new utils.exceptions.NoContactException(err));
                    });
                }
            })
            .catch(function (err) {
                browser.quit();
                reject(err);
            });
    });
}

const searchForm = function (browser, campaign) {
    return new Promise(function (resolve, reject) {
        browser.findElements(By.css("form")).then(function (elements) {
            if (elements.length === 0) {
                reject(new utils.exceptions.NoFormException());
            } else {
                // Check what happens when theres multiple forms
                browser.findElements(By.css("form input,form textarea")).then(function (inputs) {
                    fillForm(inputs, campaign);
                    inputs[0].submit().then(function () {
                        // TODO : try to avoid this setTimeout
                        setTimeout(function () {
                            browser.navigate().back()
                                .then(function () {
                                    resolve();
                                }).catch(function (err) {
                                    reject(err);
                                });
                        }, 3000);
                    }).catch(function (err) {
                        reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err));
                    });
                }).catch(function (err) {
                    reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", err));
                })
            }
        }).catch(function (err) {
            reject(err)
        });
    });

};
const fillForm = function (inputs, campaign) {
    let promises = [];
    for (let input of inputs) {
        promises.push(function () {
            return new Promise(function (resolve, reject) {
                input.getTagName().then(function (tagName) {
                    if (tagName === "textarea") {
                        input.sendKeys(campaign.message);
                    } else {
                        input.getAttribute("type").then(function (type) {
                            if (type === "text") {
                                input.getAttribute("name").then(function (name) {
                                    const lcName = name.toLowerCase();
                                    if (lcName.includes("name")) {
                                        input.sendKeys(campaign.firstName);
                                    } else if (lcName.includes("email")) {
                                        input.sendKeys(campaign.email)
                                    } else {
                                        console.log('input didn\'t match anything:' + name);
                                    }
                                    resolve();
                                }).catch(function (err) {
                                    reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                                });
                            } else if (type === "checkbox") {
                                input.click();
                            }
                        }).catch(function (err) {
                            reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                        });
                    }
                }).catch(function (err) {
                    reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                })
            })
        });
    }
    return utils.other.promiseSerial(promises);
};
const goToContact = function (element, browser, url, campaign) {
    return new Promise(function (resolve, reject) {
        element.click().then(function () {;
            searchForm(browser, campaign).then(_ => resolve()).catch(err => {
                const pictureName = `./sc/${campaign.name}/NoForm-${utils.other.getHostName(url)}`;
                utils.selenium.takeScreenshot(browser, pictureName).then(_ => reject(err)).catch(_ => reject(err));
            });
        }).catch(e =>
            reject(e)
        );
    });
};

module.exports = finder;