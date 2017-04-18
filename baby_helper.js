'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var Promise = require("bluebird");
var LOGIN = 'https://prodapp.babytrackers.com/session';
var DEVICES = 'https://prodapp.babytrackers.com/account/device';
var TRANSACTION = 'https://prodapp.babytrackers.com/account/transaction';
var USERNAME = 'USERNAME';
var PASSWORD ='PASSWORD';
var UUID = 'fe087824-dc84-44f3-809a-c01f945e4057';
const uuidV4 = require('uuid/v4');
var dateFormat = require('dateformat');
var fs = require('fs');
var syncIdFile = "/var/tmp/babytracker-syncid"

function BabyHelper() {
    

}

BabyHelper.prototype.login = function() {
    var data = {
    AppInfo: { AccountType: 0, AppType: 0 },
    Device: { DeviceName: "Unknown", DeviceOSInfo: "Nexus 5X OS25", DeviceUUID: UUID },
    EmailAddress: USERNAME,
    Password: PASSWORD
};
    var self=this;
    return this.postRequest(LOGIN,data).then(function (resp1) {
            return self.getRequest(DEVICES);
        }).then(function (resp2) {
            var deviceList=resp2.body;
                if(deviceList.length > 0)
                {
                //console.log(deviceList);
                return true;
                } else {
                    //console.log(resp2);
                    throw new Error("Unable to Retrieve Devices With Session");
                    return false;
                }
                 }).catch(function (err) {
                  //console.log(err)
                //console.log(err);

                 throw new Error("Unable to Retrieve Session");
                });
            };


BabyHelper.prototype.getBabyObject = function( ) {
    var self=this;
    return this.getRequest(DEVICES).then(function (response){
        //console.log("Grabbed Devices");
        var deviceList = response.body;
        var latestTransactions = [];
        for(var i=0;i<deviceList.length;i++)
        {
            latestTransactions.push(TRANSACTION+"/"+deviceList[i].DeviceUUID+"/"+(deviceList[i].LastSyncID-1));
        }
        //console.log(latestTransactions);
        return Promise.map(latestTransactions, function(obj) {
              return self.getRequest(obj).then(function(response) {
                var rawTransaction = JSON.parse(Buffer.from(response.body[0].Transaction, 'base64').toString());
                return (rawTransaction);
                });
        });
    }).then(function(results) {
              //console.log(results);
              var babyResult = "";
              var latestDate = Date.parse("January 1, 1970");
              for (var i = 0; i < results.length; i++) {
               
                 if(Date.parse(results[i].timestamp) > latestDate)
                 {
                    latestDate = Date.parse(results[i].timestamp);
                    babyResult = results[i].baby;
                 }
              }

              return babyResult;
          }).catch(function (err) {
        console.log(err);
        throw new Error("Unable To Retrieve Baby Object");
    })
    
};

BabyHelper.prototype.logDiaper = function(changeType) {
    var self=this;
    this.login().then(function(loginState)
    {
        return self.getBabyObject();
    }).then(function(babyObj){

        var myUUID = uuidV4();
        var now = new Date();
        var timestamp = dateFormat(now, "yyyy-mm-dd HH:MM:ss +0000");
        var data = {
                      BCObjectType: "Diaper",
                      amount: "2",
                      status: changeType,
                      baby: babyObj,
                      note: "",
                      pictureLoaded: true,
                      pictureNote: [],
                      time: timestamp,
                      newFlage: true,
                      objectID: myUUID,
                      timestamp: timestamp
            };
        var dataBuffer = new Buffer(JSON.stringify(data)).toString("base64");
        var currentSyncId = fs.readFileSync(syncIdFile).toString();
        var newSyncId = parseInt(currentSyncId)+1;
        var finalTransaction = {
            OPCode: 0,
            SyncID: newSyncId,
            Transaction: dataBuffer
        };
        return self.postRequest(TRANSACTION,finalTransaction);
    }).then(function(response){
        console.log("Logged Diaper Change - " + changeType);
        var currentSyncId = fs.readFileSync(syncIdFile).toString();
        var newSyncId = parseInt(currentSyncId)+1;
        fs.writeFileSync(syncIdFile,newSyncId);
        }).catch(function(err){
    throw new Error("Unable to Log Diaper Change" + err)
});
}

BabyHelper.prototype.getRequest = function(url) {
  var options = {
    method: 'GET',
    uri: url,
    resolveWithFullResponse: true,
    json: true,
    jar: true
  };
  
  return rp(options);
};  

BabyHelper.prototype.postRequest = function(url,data) {
  var options = {
    url: url,
    method: "POST",
    resolveWithFullResponse: true,
    json: data,
    jar: true
  };

  return rp(options);
}; 

module.exports = BabyHelper;
