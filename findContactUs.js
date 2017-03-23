var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

// var driver = new webdriver.Builder()
//     .forBrowser('chrome')
//     .build();

module.exports  = function(path){
  var that = this;
  if(path){
    that.path = path;
    that.driver = new webdriver.Builder()
        .forBrowser('chrome')
        .build();
    console.log('getting - ' + that.path);
    that.driver.get(that.path.toString());
    that.driver.quit();
    // that.driver.findElements(webdriver.By.tagName('a')).then(function(elems){
      // console.log();
      // elems.forEach(function (elem) {
      //   try{
      //     that.elem = elem;
      //     that.elem.getText().then(function(textValue=''){
      //       console.log('textValue of ' + that.path + ' - ' + textValue);
      //       if(textValue.toLowerCase().includes('contact')){
      //         if(that.elem.isDisplayed()){
      //           console.log('before clicking');
      //           that.elem.click();
      //         }
      //         console.log('after clicking, quitting page...');
      //         that.driver.quit();
      //         console.log('page should be closed... - ' + that.path);
      //       }
      //     });
      //   }catch (e){
      //     console.log('error encountered');
      //   }
      // });
    // });
  }
}
