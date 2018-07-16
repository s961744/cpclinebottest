'use strict' //strict mode

const
    line = require('@line/bot-sdk'),
    jsonProcess = require('./jsonProcess'),
    msgTextHandler = require('./msgTextHandler');

//create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

//create LINE SDK client
const client = new line.Client(config);

//訊息處理
exports.messageHandle = function (event) {
    switch (event.message.type) {
        case "text":
            msgTextHandler.msgTextHandle(event);
            break;
        case "image":
            break;
    }
}

//回應訊息
exports.replyMessage = function (replyToken, msg) {
    client.replyMessage(replyToken, msg);
}

//發送訊息
exports.pushMessage = function (lineId, msg) {
    client.pushMessage(lineId, msg);
}

//依msgName從json檔案取得訊息
exports.getMsgFromJsonFile = function (fileName, msgName) {
    return new Promise(function (resolve, reject) {
        var objsArray = [];
        jsonProcess.getJsonFileArrayData(fileName).then(function (data) {
            objsArray = JSON.parse(data)
            var obj = objsArray.filter(function (msg) {
                return msg.msgName == msgName;
            });
            resolve(obj[0].msg);
        });
    }).catch(function (e) {
        console.log("getMsgFromJsonFile error:" + e);
        reject(e);
    });
}