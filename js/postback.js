'use strict' // 嚴謹模式

const
    msg = require('./msg');

//postback handle
exports.postbackHandle = function (event) {
    return new Promise(function (resolve, reject) {
        var data = JSON.parse(event.postback.data);
        switch (data.responseType) {
            case "msg":
                msg.getMsgFromJsonFile(data.responseType, data.msgName).then(function (msgData) {
                    msg.pushMessage(event.source.userId, msgData);
                    resolve('postbackHandle msg done')
                });
                break;
            case "gm":

                break;
            case "rm":

                break;
        }
    });
}