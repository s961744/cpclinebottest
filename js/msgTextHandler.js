'use strict' //strict mode

const
    lineBotSdk = require('./lineBotSdk');

exports.msgTextHandle = function (event) {
    //個人ID
    if (event.message.text.toUpperCase() === 'ID' && event.source.type === 'user') {
        lineBotSdk.replyMessage(event.replyToken, event.source.userId);
    }
    //群組ID
    else if (event.message.text.toUpperCase() === 'ID' && event.source.type === 'group') {
        lineBotSdk.replyMessage(event.replyToken, event.source.groupId);
    }
}
