'use strict' // 嚴謹模式

const
    msg = require('./msg'),
    user = require('./user'),
    jsonProcess = require('./jsonProcess'),
    request = require('./request');

exports.msgTextHandle = function (event) {
    // 推播權限申請驗證
    if (event.message.text.toUpperCase().startsWith("V") && (event.message.text.length === 5)) {
        msg.getMsgFromJsonFile("msg", "authApply").then(function (msgData) {
            msg.replyMessage(event.replyToken, msgData).then(function () {
                user.getDisplayName(event.source.userId).then(function (displayName) {
                    // 發送驗證資訊給管理員
                    msg.pushMessage(process.env.AdminLineUserId, {
                        type: 'text', text: '*****Line推播權限申請*****\nLine暱稱：' + displayName
                        + '\n驗證碼：' + event.message.text + '\nID：' + event.source.userId
                    });
                    // 將line_id及verify_code寫入line_user_auth
                    var userInfo = { userId: event.source.userId, verifyCode: event.message.text };
                    var formData = JSON.stringify(userInfo);
                    var urlName = 'lineRESTful';
                    var functionName = 'LineUserAuth'
                    var query = '?strUserInfo=' + formData;
                    request.getUrlFromJsonFile(urlName).then(function (url) {
                        request.requestHttpPost(url + functionName + query, '');
                    });
                }).catch(function (error) {
                    console.log(error);
                });
            }).catch(function (error) {
                console.log(error);
            });
        });
    }
    // 群組管理功能選單
    else if (event.message.text === 'gm') {
        msg.getMsgFromJsonFile("msg", event.message.text).then(function (msgData) {
            console.log('token=' + event.replyToken + ',msg=' + JSON.stringify(msgData));
            msg.replyMessage(event.replyToken, msgData);
        });
    }
    // 群組管理功能選單測試
    else if (event.message.text === 'gmTest') {
        msg.getMsgFromJsonFile("msg", event.message.text).then(function (msgData) {
            console.log('token=' + event.replyToken + ',msg=' + JSON.stringify(msgData));
            msg.replyMessage(event.replyToken, msgData);
        });
    }
    // RichMenu管理功能選單
    else if (event.message.text === 'rm') {
        msg.getMsgFromJsonFile("msg", event.message.text).then(function (msgData) {
            msg.replyMessage(event.replyToken, msgData);
        });
    }
    else if (event.message.text.toUpperCase().startsWith('RM') && event.source.userId == process.env.AdminLineUserId) {
        //if (event.message.text.toUpperCase().startsWith('RM_DESC')) {
        //    var msg = { type: 'text', text: "歡迎使用敬鵬即時訊息整合服務選單!\n若使用上有任何問題請洽#1409" };
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
    else if (event.message.text === '!admin') {
        if (event.source.userId === process.env.AdminLineUserId) {
            //msg = {
            //    "type": "template",
            //    "altText": "進入管理員選單",
            //    "template": {
            //        "type": "carousel",
            //        "columns": [
            //            {
            //                "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/+sedum.png",
            //                "title": "管理員選單1",
            //                "text": "好友管理",
            //                "actions": [
            //                    {
            //                        type: 'uri',
            //                        label: '加入好友',
            //                        uri: 'line://ti/p/@bmr3446l'
            //                    },
            //                    {
            //                        type: 'postback',
            //                        label: '發送加入好友訊息',
            //                        data: 'sendFollow'
            //                    },
            //                    {
            //                        type: 'postback',
            //                        label: '開發中',
            //                        data: '開發中'
            //                    }
            //                ]
            //            },
            //            {
            //                "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/cat.jpg",
            //                "title": "管理員選單2",
            //                "text": "功能測試",
            //                "actions": [
            //                    {
            //                        type: 'uri',
            //                        label: '拍照',
            //                        uri: 'line://nv/camera/'
            //                    },
            //                    {
            //                        type: 'postback',
            //                        label: '發送圖片',
            //                        data: 'sendImageTest'
            //                    },
            //                    {
            //                        type: 'uri',
            //                        label: '開發中',
            //                        uri: 'https://www.google.com.tw/'
            //                    }
            //                ]
            //            },
            //            {
            //                "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/difficult.png",
            //                "title": "管理員選單3",
            //                "text": "開發中",
            //                "actions": [
            //                    {
            //                        type: 'postback',
            //                        label: '開發中',
            //                        data: 'action=buy&itemid=123',
            //                        text: '這是代發訊息3'
            //                    },
            //                    {
            //                        type: 'datetimepicker',
            //                        label: '開發中',
            //                        data: 'datestring',
            //                        mode: 'date'
            //                    },
            //                    {
            //                        type: 'uri',
            //                        label: '開發中',
            //                        uri: 'https://www.google.com.tw/'
            //                    }
            //                ]
            //            }
            //        ]
            //    }
            //}
            //client.replyMessage(event.replyToken, msg);
        }
        else {
            client.pushMessage(event.source.userId, { type: 'text', text: '無法獲得管理選單，原因：非管理員' });
            console.log(event.source.userId + " 試圖進入管理員選單");
        }
    }
    else if (event.message.text === '!stop') {
        job.cancel();
        client.pushMessage(event.source.userId, { type: 'text', text: '停止發訊息排程' });
    }
    //else {
    //    var msg = { type: 'text', text: '請輸入正確指令或驗證碼\n若有問題請洽資訊處(#1409)\n謝謝' };
    //    // reply
    //    return client.replyMessage(event.replyToken, msg).then(function () {
    //        // success 
    //        console.log(event.source.userId + " 輸入了非指令:" + event.message.text);
    //    }).catch(function (error) {
    //        // error 
    //        console.log(error);
    //    });
    //}
}
