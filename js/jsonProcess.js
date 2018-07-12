﻿'use strict' // 嚴謹模式

const
    fs = require('fs'),
    path = require('path');

//get json file data
exports.getJsonFileArrayData = function (fileName) {
    return new Promise(function (resolve, reject) {
        var fs = require('fs');
        var arr = [];
        fs.readFile('json/' + fileName + '.json', 'utf8', function (err, data) {
            if (err) reject(err);
            arr = JSON.parse(data);
            console.log("arr=" + JSON.stringify(arr));
            resolve(arr);
        });
    });
}