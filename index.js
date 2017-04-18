var DashButton = require('dash-button');
var BabyHelper = require('./baby_helper.js');
var babyHelper = new BabyHelper();
var dateFormat = require('dateformat');
var lastEvent = new Date("January 01, 2000 00:00:00");
const util = require('util')

//Pee (Elements) -  40:b4:cd:28:82:a2
//Poop (Battery) - 68:54:fd:80:77:78
//Mixed (Battery) - 68:54:fd:3e:31:1f

var peeBtn = new DashButton("40:b4:cd:28:82:a2");
var pooBtn = new DashButton("68:54:fd:80:77:78");
var mixedBtn = new DashButton("68:54:fd:3e:31:1f");

console.log("Running!");

var registerPee = peeBtn.addListener(function(){
    var timestamp = checkBtnPress();
    if(timestamp)
    {
        console.log("Pee Occured At: " + timestamp);
        babyHelper.logDiaper(0);
    }
});

var registerPoo = pooBtn.addListener(function(){
    var timestamp = checkBtnPress();
    if(timestamp)
    {
        console.log("Poo Occured At: " + timestamp);
        babyHelper.logDiaper(1);
    }
});

var registerMixed = mixedBtn.addListener(function(){
    var timestamp = checkBtnPress();
    if(timestamp)
    {
        console.log("Mixed Occured At: " + timestamp);
        babyHelper.logDiaper(2);
    }
});

function checkBtnPress() {
    var now = new Date();
    var checkTime = new Date(lastEvent.setTime(lastEvent.getTime()+ 1000 * 60));
    if(checkTime > now) { 
            //console.log("Duplicate Button Press");
            return false;
        } else {
            var timestamp = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
            lastEvent.setTime(now.getTime());
            return timestamp;
        }
}