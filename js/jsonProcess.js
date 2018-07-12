'use strict' // 嚴謹模式

const
    fs = require('fs'),
    path = require('path');

//get json file data
exports.getJsonFileData = function (fileName) {
    return new Promise(function (resolve, reject) {
        var fs = require('fs');
        var obj;
        fs.readFile('json/' + fileName + '.json', 'utf8', function (data) {
            obj = JSON.parse(data);
            console.log("obj=" + JSON.stringify(obj));
            resolve(obj);
        }).catch(function (e) {
            console.log("getJsonFileData error:" + e);
            reject(e);
        });
    });
}