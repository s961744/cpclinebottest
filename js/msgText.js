'use strict' // 嚴謹模式

const
    jsonProcess = require('./jsonProcess');

//get json file data
exports.getMsgFromJsonFile = function (fileName, msgName) {
    return new Promise(function (resolve, reject) {
        var objsArray = [];
        jsonProcess.getJsonFileArrayData(fileName).then(function (data) {
            //console.log("data=" + JSON.stringify(data));
            objsArray = JSON.parse(data)
            console.log("objsArray=" + JSON.stringify(objsArray));
            var obj = objsArray.filter(function (msg) {
                return msg.msgName == msgName;
            });
            console.log("obj=" + JSON.stringify(obj));
            resolve(obj.msg);
        });
    }).catch(function (e) {
        console.log("getMsgFromJsonFile error:" + e);
        reject(e);
    });
}