var mysql = require('mysql');

  class CampaignsDb {
    constructor(){
      this.connection = mysql.createConnection({
        host     : '162.243.8.121',
        user     : 'root',
        password : 'mysqlzhd123Q!@#',
        database : 'ctform'
      });
    }

    connect(){
      this.connection.connect(function(err){
          if(err){
            console.error(`Oops, we have an error! ${err}`);
            return;
          }

          console.log('successfully connected...');
      });
    }

    // handler.basicQuery = function(){
    //   connection.query('SELECT * AS solution', function (error, results, fields) {
    //     if (error) throw error;
    //     console.log('The solution is: ', results[0].solution);
    //   });
    // }

    endConnection(){
      this.connection.end(function(err){
        if(err){
          console.error(`Oops, we have an error! ${err}`);
          return;
        }

        console.log('disconnected from db...');
      });
    }
  }

module.exports = CampaignsDb;
