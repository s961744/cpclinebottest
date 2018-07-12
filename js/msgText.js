'use strict' // 嚴謹模式

const
    jsonProcess = require('./js/jsonProcess');

//get json file data
exports.getMsgFromJsonFile = function (fileName, msgName) {
    return new Promise(function (resolve, reject) {
        var objsArray = [];
        objsArray = jsonProcess.getJsonFileData(fileName)
        var obj = objsArray.filter(function (msg) {
            return msg.msgName == msgName;
        });
        resolve(obj.msg);
    }).catch().catch(function (e) {
        console.log("getMsgFromJsonFile error:" + e);
        reject(e);
    });
}