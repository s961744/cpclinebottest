'use strict' //strict mode

const
    line = require('@line/bot-sdk');

//create LINE SDK config from env variables
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
    }).catch(function (e) {
        console.log(userId + " getDisplayName error:" + e);
    });
}

//取得image, video, audio訊息中的stream資料
exports.getMessageContent = function (messageId) {
    client.getMessageContent(messageId).then(function (stream) {
        return stream;
    }).catch(function (e) {
        console.log(messageId + " getMessageContent error:" + e);
    });
}

//建立richMenu
exports.createRichMenu = function (rm) {
    client.createRichMenu(rm).then(function (richMenuID) {
        return richMenuID;
    }).catch(function (e) {
        console.log("createRichMenu error:" + e);
    });
}

//綁定rmName.png圖片給richMenuId
exports.createRichMenu = function (richMenuId, buffer) {
    client.setRichMenuImage(richMenuId, buffer).then(function () {
    }).catch(function (e) {
        console.log(richMenuId + " setRichMenuImage error:" + e);
    });
}

//綁定richMenuId給UserId
exports.linkRichMenuToUser = function (userId, richMenuId) {
    client.linkRichMenuToUser(userId, richMenuId).then(function () {
    }).catch(function (e) {
        console.log(richMenuId + " linkRichMenuToUser " + userId + " error:" + e);
    });
}

//取得UserId的richMenuId
exports.getRichMenuIdOfUser = function (userId) {
    client.getRichMenuIdOfUser(userId).then(function (richMenuId) {
        return richMenuId;
    }).catch(function (e) {
        console.log("getRichMenuIdOfUser " + userId + " error:" + e);
    });
}

//取得群組中成員
exports.getGroupMemberIds = function (groupId) {
    client.getGroupMemberIds(groupId).then(function (ids) {
        return ids;
    }).catch(function (e) {
        console.log("getGroupMemberIds " + groupId + " error:" + e);
    });
}

//離開群組
exports.leaveGroup = function (groupId) {
    client.leaveGroup(groupId).then(function () {
    }).catch(function (e) {
        console.log("leaveGroup " + groupId + " error:" + e);
    });
}