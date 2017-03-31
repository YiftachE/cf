const driver = require('selenium-webdriver');
const {Builder, By, until} = require('selenium-webdriver');

let finder = {};

finder.find = function (url) {
    return new Promise(function (resolve, reject) {
        let browser = new Builder()
            .forBrowser('chrome')
            .build();
        browser.get(url);
        browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"))
            .then(function (elements) {
                if (elements.length > 0) {
                    let promises = [];
                    for (let i = 0; i < elements.length; i++) {
                        promises.push(goToContact.bind(this, i, browser));
                    }
                    promiseSerial(promises)
                        .then(function () {
                            browser.quit();
                            resolve()
                        }).catch(function (err) {
                        browser.quit();
                        reject(err);
                    });
                } else {
                    browser.quit();
                    reject('Couldn\'t find contact us');
                }

            }).catch(function (err) {
            browser.quit();
            reject(err);
        });
    })
};

let searchForm = function (browser) {
    return new Promise(function (resolve, reject) {
        browser.findElements(By.css("form[id*='contact']")).then(function (elements) {
            if (elements.length === 0) {
                reject("Couldn't find form");
            } else {
                // Check what happens when theres multiple forms
                browser.findElements(By.css("form[id*='contact'] input,form[id*='contact'] textarea")).then(function (inputs) {
                    fillForm(inputs);
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
                        reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                })
            }
        }).catch(function (err) {
            reject(err)
        });
    });

};
let fillForm = function (inputs) {
    let promises = [];
    for (let input of inputs) {
        promises.push(new Promise(function (resolve, reject) {
            input.getTagName().then(function (tagName) {
                if (tagName === "textarea") {
                    input.sendKeys("hello this is me");
                } else {
                    input.getAttribute("type").then(function (type) {
                        if (type === "text") {
                            input.getAttribute("name").then(function (name) {
                                const lcName = name.toLowerCase();
                                if (lcName.includes("name")) {
                                    input.sendKeys("test");
                                } else if (lcName.includes("email")) {
                                    input.sendKeys("test@test.com")
                                } else {
                                    console.log('input didn\'t match anything:' + name);
                                }
                                resolve();
                            }).catch(function (err) {
                                reject(err);
                            });
                        } else if (type === "checkbox") {
                            input.click();
                        }
                    }).catch(function (err) {
                        reject(err);
                    });
                }
            }).catch(function (err) {
                reject(err);
            })
        }));
    }
    return promiseSerial(promises);
};
let goToContact = function (index, browser) {
    return new Promise(function (resolve, reject) {
        browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"))
            .then(function (elements) {
                elements[index].click();
                searchForm(browser).then(_ => resolve()).catch(err => reject(err));
            }).catch(function (err) {
            reject(err);
        });
    });
};

const promiseSerial = funcs =>
    funcs.reduce((promise, func) =>
            promise.then(result => func().then(Array.prototype.concat.bind(result))),
        Promise.resolve([]));

module.exports = finder;
