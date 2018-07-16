'use strict' // 嚴謹模式

const
    line = require('@line/bot-sdk'),
    jsonProcess = require('./jsonProcess'),
    msgTextHandler = require('./msgTextHandler');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

//message handle
exports.gmMemberList = function (event) {
    client.getGroupMemberIds(event.source.groupId).then((ids) => {
        //console.log(event.source.groupId);
        var allId = "";
        ids.forEach((id) => {
            if (id != 'undefined') {
                allId += '\n' + id
            }
        });
        console.log(allId);
        client.replyMessage(event.replyToken, { type: 'text', text: '群組人員(待轉為工號+姓名)：' + allId });
    })
    .catch((err) => {
        console.log(err);
    });
}

//get message from json file
exports.gmMemberCheck = function (event) {
    
}