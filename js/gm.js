'use strict'//strict mode

const
    line = require('@line/bot-sdk'),
    msg = require('./msg');

//create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

//create LINE SDK client
const client = new line.Client(config);

//群組功能處理
exports.gmHandle = function (event, gmName) {
    switch (gmName) {
        case "gmMemberList":
            gmMemberList(event);
            break;
        case "gmMemberCheck":
            gmMemberCheck(event);
            break;
        case "gmBreakConfirm":
            gmBreakConfirm(event);
            break;
    }
}

//取得群組成員名單
function gmMemberList(event) {
    client.getGroupMemberIds(event.source.groupId).then((ids) => {
        var allId = "";
        ids.forEach((id) => {
            if (id != 'undefined') {
                allId += '\n' + id
            }
        });
        console.log(allId);
        msg.replyMessage(event.replyToken, { type: 'text', text: '群組人員(待轉為工號+姓名)：' + allId });
    })
    .catch((err) => {
        console.log(err);
    });
}

//檢查成員是否符合EB設定
function gmMemberCheck(event) {
    
}

//確認將Line Bot移出群組
function gmBreakConfirm(event) {
    client.leaveGroup(event.source.groupId).then(() => {
        console.log("leaveGroup:" + event.source.groupId);
    }).catch(function (e) {
        console.log("leaveGroup error:" + e);
    });
}