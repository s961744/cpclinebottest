'use strict' //strict mode

const
    lineBotSdk = require('./lineBotSdk'),
    msg = require('./msg');

exports.msgTextHandle = function (event) {
    //個人ID
    if (event.message.text.toUpperCase() === 'ID' && event.source.type === 'user') {
        msg.getMsgFromJsonFile('msg', 'emptyMsg').then(function (msgData) {
            console.log('msgData=' + JSON.stringify(msgData));
            msgData.text = event.source.userId;
            lineBotSdk.replyMessage(event.replyToken, msgData);
        });
    }
    //群組ID
    else if (event.message.text.toUpperCase() === 'ID' && event.source.type === 'group') {
        msg.getMsgFromJsonFile('msg', 'emptyMsg').then(function (msgData) {
            console.log('msgData=' + JSON.stringify(msgData));
            msgData.text = event.source.groupId;
            lineBotSdk.replyMessage(event.replyToken, msgData);
        });
    }
}
