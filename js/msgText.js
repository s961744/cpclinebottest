'use strict' // 嚴謹模式

const
    jsonProcess = require('./jsonProcess');

//get json file data
exports.getMsgFromJsonFile = function (fileName, msgName) {
    return new Promise(function (resolve, reject) {
        var objsArray = [];
        objsArray = JSON.parse(jsonProcess.getJsonFileArrayData(fileName));
        var obj = objsArray.filter(function (msg) {
            return msg.msgName == msgName;
        });
        Promise.resolve(obj.msg);
    }).catch(function (e) {
        console.log("getMsgFromJsonFile error:" + e);
        reject(e);
    });
}