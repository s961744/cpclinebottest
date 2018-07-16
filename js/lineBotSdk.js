'use strict' //strict mode

const
    line = require('@line/bot-sdk');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

//回應訊息
exports.replyMessage = function (replyToken, msg) {
    client.replyMessage(replyToken, msg);
}

//發送訊息
exports.pushMessage = function (lineId, msg) {
    client.pushMessage(lineId, msg);
}

//發送多對象訊息
exports.multicast = function (ids, msg) {
    client.multicast(ids, msg);
}

//取得Line暱稱
exports.getDisplayName = function(userId) {
    client.getProfile(userId).then(function (profile) {
        return profile.displayName;
    });
}

//取得image, video, audio訊息中的stream資料
exports.getMessageContent = function (messageId) {
    client.getMessageContent(messageId).then(function (stream) {
        return stream;
    });
}