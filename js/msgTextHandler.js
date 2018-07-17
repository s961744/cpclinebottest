﻿'use strict' //strict mode

const
    lineBotSdk = require('./lineBotSdk'),
    msg = require('./msg'),
    jsonProcess = require('./jsonProcess'),
    request = require('./request');

exports.msgTextHandle = function (event) {
    //推播權限申請驗證
    if (event.message.text.toUpperCase().startsWith('V') && (event.message.text.length === 5)) {
        msg.getMsgFromJsonFile('msg', 'authApply').then(function (msgData) {
            lineBotSdk.replyMessage(event.replyToken, msgData).then(function () {
                lineBotSdk.getDisplayName(event.source.userId).then(function (displayName) {
                    //發送驗證資訊給管理員
                    lineBotSdk.pushMessage(process.env.AdminLineUserId, {
                        type: 'text', text: '*****Line推播權限申請*****\nLine暱稱：' + displayName
                        + '\n驗證碼：' + event.message.text + '\nID：' + event.source.userId
                    });
                    //將line_id及verify_code寫入line_user_auth
                    var userInfo = { userId: event.source.userId, verifyCode: event.message.text };
                    var formData = JSON.stringify(userInfo);
                    var urlName = 'lineRESTful';
                    var path = '/LineUserAuth'
                    var query = '?strUserInfo=' + formData;
                    request.getUrlFromJsonFile(urlName).then(function (url) {
                        console.log(url + path + query);
                        request.requestHttpPost(url + path + query, '');
                    });
                }).catch(function (error) {
                    console.log(error);
                });
            }).catch(function (error) {
                console.log(error);
            });
        });
    }
    //群組管理功能選單
    else if (event.message.text === 'gm' && event.source.type === 'group') {
        msg.getMsgFromJsonFile('msg', event.message.text).then(function (msgData) {
            lineBotSdk.replyMessage(event.replyToken, msgData);
        });
    }
    else if (event.message.text.toUpperCase().startsWith('RM') && event.source.userId == process.env.AdminLineUserId) {
        //if (event.message.text.toUpperCase().startsWith('RM_DESC')) {
        //    var msg = { type: 'text', text: '歡迎使用敬鵬即時訊息整合服務選單!\n若使用上有任何問題請洽#1409' };
        //    client.replyMessage(event.replyToken, msg);
        //}
        // 建立RichMenu
        //else if (event.message.text.toUpperCase().startsWith('RM_CR')) {
        //    var rmName = event.message.text.substring(6);
        //    rm.createRichMenu(rmName).then((richMenuID) => {
        //        rm.setRichMenuImage(richMenuID).then((richMenuID) => {
        //            rm.linkRichMenuToUser(process.env.AdminLineUserId, richMenuID);
        //        }).catch((err) => {
        //            console.log(err);
        //        });
        //    }).catch((err) => {
        //        console.log(err);
        //    });
        //}
    }
    //系統管理員選單
    else if (event.message.text === 'adminMenu') {
        if (event.source.userId === process.env.AdminLineUserId) {
            msg.getMsgFromJsonFile('msg', event.message.text).then(function (msgData) {
                lineBotSdk.replyMessage(event.replyToken, msgData);
            });
        }
        else {
            msg.getMsgFromJsonFile('msg', 'adminMenuReject').then(function (msgData) {
                lineBotSdk.replyMessage(event.replyToken, msgData);
            });
        }
    }
}
