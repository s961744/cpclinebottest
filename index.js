'use strict';
const
    express = require('express'),
    line = require('@line/bot-sdk'),
    schedule = require('node-schedule'),
    http = require("http"),
    fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    AWS = require('aws-sdk'),
    moment = require('moment'),
    rm = require('./js/richMenu'),
    jsonProcess = require('./js/jsonProcess');

AWS.config.region = 'chinpoon';
var s3 = new AWS.S3({ region: 'ap-northeast-1' });

// 維持Heroku不Sleep
//setInterval(function () {
//    http.get("http://cpclinebottest.herokuapp.com");
//}, 1500000); // every 25 minutes (1500000)

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

const app = express();

app.post('/', line.middleware(config), (req, res) => {
    // req.body.events should be an array of events
    if (!Array.isArray(req.body.events)) {
        return res.status(500).end();
    }

    // handle events separately
    Promise.all(req.body.events.map(handleEvent))
        .then(() => res.end())
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

// 排程 1次/30sec (每分鐘的5秒及35秒)
var job = schedule.scheduleJob('5,35 * * * * *', function () {
    // 設定GET RESTful API連接參數
    var paraGet = '';
    var optionsGet = {
        host: '116.50.39.201',
        port: 7102,
        path: '/WechatRESTful/resources/WechatRESTfulTest',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };
    // 取得line_message_send中的待發訊息並發送
    try
    {
        http.request(optionsGet, function (resGET) {
            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            var chunks = [];  
            var size = 0;  
            //resGET.setEncoding('utf8');
            resGET.on('data', function (chunk) {
                chunks.push(chunk);
                size += chunk.length;
            });
            resGET.on('end', function () {
                var data = null;
                switch (chunks.length) {
                    case 0: data = new Buffer(0);
                        break;
                    case 1: data = chunks[0];
                        break;
                    default:
                        data = new Buffer(size);
                        for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                            var chunk = chunks[i];
                            chunk.copy(data, pos);
                            pos += chunk.length;
                        }
                        break;
                }
                if (data.length < 3) {
                    console.log("No messages need to be sent.");
                }
                else {
                    console.log(JSON.stringify(data));
                    try {
                        var jdata = JSON.parse(data);
                        jdata.forEach(function (row) {
                            var message_id = row.message_id;
                            var line_id = row.line_id;
                            var message = row.message;
                            try {
                                var messageSend = JSON.parse(message);
                                var line_idSend = line_id.split(',');
                                console.log('message_id:' + message_id + ',line_id:' + line_idSend);
                                client.multicast(line_idSend, messageSend).then(function () {
                                    // 設定PUT RESTful API連接參數
                                    var paraPut = '?strMessageId=' + message_id;
                                    var optionsPut = {
                                        host: '116.50.39.201',
                                        port: 7102,
                                        path: '/LineRESTful/resources/LineRESTfulTest' + paraPut,
                                        method: 'PUT'
                                    };
                                    try
                                    {
                                        // 發送後寫入actual_send_time
                                        http.request(optionsPut, function (resPUT) {
                                            resPUT.setEncoding('utf8');
                                            resPUT.on('data', function (chunkPUT) {
                                                console.log(chunkPUT);
                                            });
                                        }).end();
                                    }
                                    catch(e)
                                    {
                                        return console.log("http request fail:" + JSON.stringify(optionsPut));
                                    }
                                }).catch(function (error) {
                                    console.log(error);
                                });
                            }
                            catch (e) {
                                return console.log(e);
                            }
                        });
                    }
                    catch (e) {
                        return console.log(e);
                    }
                }
            });
        }).end();
    }
    catch(e)
    {
        return console.log("http request fail:" + JSON.stringify(optionsGet));
    }
});

// event handler
function handleEvent(event) {

    switch (event.type) {
        case 'message':
            message(event);
            break;
        case 'postback':
            postback(event);
            break;
        case 'follow':
            follow(event);
            break;
        case 'unfollow':
            unfollow(event);
            break;
        default:
            return Promise.resolve(null);
    }
}

// message event
function message(event) {
    //client.pushMessage(event.source.userId, { type: 'text', text: displayName +'您好,\n這是Line機器人測試'}).then(function() {

    // 收到文字訊息時
    if (event.message.type === 'text') {
        if (event.message.text.toUpperCase().startsWith("V") && (event.message.text.length === 5)) {
            var msg = { type: 'text', text: '已收到您輸入的驗證碼!\n請將表單送出，\n並等待權限審核流程完成，\n謝謝!' };
            // 收到驗證碼reply
            return  client.replyMessage(event.replyToken, msg).then(function () {
                return  getDisplayName(event.source.userId).then(function (displayName) {
                    // 發送驗證資訊給管理員
                    client.pushMessage(process.env.AdminLineUserId, {
                        type: 'text', text: '*****Line推播權限申請*****\nLine暱稱：' + displayName
                        + '\n驗證碼：' + event.message.text + '\nID：' + event.source.userId
                    });
                    // 將line_id及verify_code寫入line_user_auth
                    var userInfo = { userId: event.source.userId, verifyCode: event.message.text };
                    var formData = JSON.stringify(userInfo);
                    var paraPost = '?strUserInfo=' + formData;
                    var optionsPost = {
                        host: '116.50.39.201',
                        port: 7102,
                        path: '/LineRESTful/resources/LineRESTfulTest/LineUserAuth' + paraPost,
                        method: 'POST'
                    };
                    try {
                        http.request(optionsPost, function (resPOST) {
                            resPOST.setEncoding('utf8');
                            resPOST.on('data', function (chunkPOST) {
                                console.log(chunkPOST);
                            });
                        }).end();
                    }
                    catch (e) {
                        return console.log("http request fail:" + JSON.stringify(optionsPost));
                    }
                }).catch(function (error) {
                    // error 
                    console.log(error);
                });
            }).catch(function (error) {
                // error 
                console.log(error);
            });
        }
        else if (event.message.text === '群組管理') {
            //var msg = {
            //    "type": "imagemap",
            //    "baseUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/test4",
            //    "altText": "This is an imagemap",
            //    "baseSize": {
            //        "height": 1040,
            //        "width": 1040
            //    },
            //    "actions": [
            //        {
            //            "type": "message",
            //            "text": "群組申請",
            //            "area": {
            //                "x": 0,
            //                "y": 0,
            //                "width": 520,
            //                "height": 520
            //            }
            //        },
            //        {
            //            "type": "message",
            //            "text": "群組成員查詢",
            //            "area": {
            //                "x": 520,
            //                "y": 0,
            //                "width": 1040,
            //                "height": 520
            //            }
            //        },
            //        {
            //            "type": "message",
            //            "text": "群組ID",
            //            "area": {
            //                "x": 0,
            //                "y": 520,
            //                "width": 520,
            //                "height": 1040
            //            }
            //        },
            //        {
            //            "type": "message",
            //            "text": "取消群組",
            //            "area": {
            //                "x": 520,
            //                "y": 520,
            //                "width": 1040,
            //                "height": 1040
            //            }
            //        }
            //    ]
            //}
            var msg = {
                type: 'template',
                altText: '群組管理選單',
                template: {
                    type: 'buttons',
                    thumbnailImageUrl: 'https://s3-ap-northeast-1.amazonaws.com/chinpoon/groupMenuV3.png',
                    title: '群組管理選單',
                    text: '僅限群組管理員使用',
                    actions: [
                        {
                            type: 'postback',
                            label: '代號設定',
                            data: 'action=groupSet&groupId=' + event.source.groupId,
                            text: '群組代號設定'
                        },
                        {
                            type: 'postback',
                            label: '人員清單',
                            data: 'action=groupMember&groupId=' + event.source.groupId,
                            text: '群組成員清單'
                        },
                        {
                            type: 'postback',
                            label: '人員比對',
                            data: 'action=groupMemberCompare&groupId=' + event.source.groupId,
                            text: '群組人員比對'
                        },
                        {
                            type: 'postback',
                            label: '功能解除',
                            data: 'action=groupBreak&groupId=' + event.source.groupId,
                            text: '群組功能解除'
                        }
                    ]
                }
            }
            client.replyMessage(event.replyToken, msg);
        }
        else if (event.message.text === '群組代號設定') {
            var msg = { type: 'text', text: '請輸入於EB申請取得的群組代號\n(ex:GP001)' };
            client.replyMessage(event.replyToken, msg);
        }
        else if (event.message.text === '群組成員清單') {
            console.log(event.source.groupId);
            client.getGroupMemberIds(event.source.groupId)
                .then((ids) => {
                    console.log(event.source.groupId);
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
        else if (event.message.text === '群組人員比對') {
            var msg = { type: 'text', text: '與EB系統中維護之成員比對吻合' };
            client.replyMessage(event.replyToken, msg);
        }
        else if (event.message.text === '群組功能解除') {
            var msg = '';
            if (event.source.userId == process.env.AdminLineUserId) {
                msg = {
                    type: 'template',
                    altText: '群組功能解除確認',
                    template: {
                        type: 'confirm',
                        text: '注意：敬鵬LineBot將離開群組，\n是否確定解除?',
                        actions: [
                            {
                                type: 'postback',
                                label: '確定',
                                data: 'action=groupLeaveConfirm&groupId=' + event.source.groupId
                            },
                            {
                                type: 'postback',
                                label: '取消',
                                data: 'action=groupLeaveCancel&groupId=' + event.source.groupId
                            }
                        ]
                    }
                }
            }
            else {
                msg = { type: 'text', text: '此功能僅限群組管理員操作\n管理員：' + process.env.AdminLineUserId };
            }
            client.replyMessage(event.replyToken, msg);
        }
        else if (event.message.text.toUpperCase().startsWith('RM') && event.source.userId == process.env.AdminLineUserId) {
            if (event.message.text.toUpperCase().startsWith('RM_DESC')) {
                var msg = { type: 'text', text: "歡迎使用敬鵬即時訊息整合服務選單!\n若使用上有任何問題請洽#1409" };
                client.replyMessage(event.replyToken, msg);
            }
            else if (event.message.text.toUpperCase().startsWith('RM_CR')) {
                //var rmo = event.message.text.substring(6);
                rm.createRichMenu().then((richMenuID) => {
                    rm.setRichMenuImage(richMenuID).then((richMenuID) => {
                        rm.linkRichMenuToUser(process.env.AdminLineUserId, richMenuID);
                    }).catch((err) => {
                        console.log(err);
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }
        }
        else if (event.message.text === '!admin') {
            if (event.source.userId === process.env.AdminLineUserId)
            {
                msg = {
                    "type": "template",
                    "altText": "進入管理員選單",
                    "template": {
                        "type": "carousel",
                        "columns": [
                            {
                                "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/+sedum.png",
                                "title": "管理員選單1",
                                "text": "好友管理",
                                "actions": [
                                    {
                                        type: 'uri',
                                        label: '加入好友',
                                        uri: 'line://ti/p/@bmr3446l'
                                    },
                                    {
                                        type: 'postback',
                                        label: '發送加入好友訊息',
                                        data: 'sendFollow'
                                    },
                                    {
                                        type: 'postback',
                                        label: '開發中',
                                        data: '開發中'
                                    }
                                ]
                            },
                            {
                                "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/cat.jpg",
                                "title": "管理員選單2",
                                "text": "功能測試",
                                "actions": [
                                    {
                                        type: 'uri',
                                        label: '拍照',
                                        uri: 'line://nv/camera/'
                                    },
                                    {
                                        type: 'postback',
                                        label: '發送圖片',
                                        data: 'sendImageTest'
                                    },
                                    {
                                        type: 'uri',
                                        label: '開發中',
                                        uri: 'https://www.google.com.tw/'
                                    }
                                ]
                            },
                            {
                                "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/difficult.png",
                                "title": "管理員選單3",
                                "text": "開發中",
                                "actions": [
                                    {
                                        type: 'postback',
                                        label: '開發中',
                                        data: 'action=buy&itemid=123',
                                        text: '這是代發訊息3'
                                    },
                                    {
                                        type: 'datetimepicker',
                                        label: '開發中',
                                        data: 'datestring',
                                        mode: 'date'
                                    },
                                    {
                                        type: 'uri',
                                        label: '開發中',
                                        uri: 'https://www.google.com.tw/'
                                    }
                                ]
                            }
                        ]
                    }
                }
                client.replyMessage(event.replyToken, msg);
            }
            else
            {
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

    // 收到圖片訊息時
    if (event.message.type === 'image') {
        msg = { type: 'text', text: "您傳了一張圖片!" };
        var chunks = [];
        var size = 0;
        var data = [];

        return client.replyMessage(event.replyToken, msg).then(function () {
            client.getMessageContent(event.message.id).then((stream) => {

                // 取得Image content(byte[])
                stream.on('data', (chunk) => {
                    chunks.push(chunk);
                    size += chunk.length;
                })
                stream.on('error', (err) => {
                    // error handling
                })
                stream.on('end', (err) => {
                    
                    switch (chunks.length) {
                        case 0: data = new Buffer(0);
                            break;
                        case 1: data = chunks[0];
                            break;
                        default:
                            data = new Buffer(size);
                            for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                                var chunk = chunks[i];
                                chunk.copy(data, pos);
                                pos += chunk.length;
                            }
                            break;
                    }

                    //upload to S3
                    //var date = new Date();
                    //var params = {
                    //    Bucket: 'chinpoon', // 資料夾
                    //    Key: 'image-' + date.getFullYear() + date.getMonth() + date.getDay() + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + '.jpg', // 檔名
                    //    ACL: 'public-read', // 權限公開
                    //    Body: data
                    //};
                    //s3.putObject(params, function (err, data) {
                    //    if (err) {
                    //        console.log("Error uploading image: ", err);
                    //    } else {
                    //        console.log("Successfully uploaded image on S3", data);
                    //    }
                    //})

                    // save file to Server
                    var now = new Date().toISOString().
                        replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '').replace(/\s+/g, "");
                    var random = Math.floor(Math.random() * 9999) + 1;
                    var FileName = now + random + ".png";
                    console.log(FileName);
                    var optionsPost = {
                        host: '116.50.39.201',  
                        port: 7102,
                        path: '/FileRESTful/resources/FileRESTful/postFile/LineFile/' + FileName,
                        method: 'POST',
                        encoding: null
                    };
                    try {
                        var post_req = http.request(optionsPost, function (res) {
                            res.on('data', function (chunk) {
                                //var jdata = JSON.parse(chunk);
                                //jdata.forEach(function (row) {
                                //    var ReturnMsg = row.ReturnMsg;
                                //    var Directory = row.Directory;
                                //    console.log(ReturnMsg);
                                //    console.log(Directory);
                                //});
                                console.log("圖片上傳結果：" + chunk);
                                client.pushMessage(event.source.userId, { type: 'text', text: '圖片上傳成功!' });
                            });
                        });

                        // post the data
                        post_req.write(data);
                        post_req.end();

                    }
                    catch (e) {
                        return console.log("http request fail:" + JSON.stringify(optionsPost) + "," + e);
                    }
                })
            })

            // success 
            console.log(event.message);

        }).catch(function (error) {
            // error 
            console.log(error);
        });
    }

    // 收到影片訊息時
    if (event.message.type === 'video') {
        msg = { type: 'text', text: "您傳了一個影片!" };
        chunks = [];
        size = 0;
        data = [];

        return client.replyMessage(event.replyToken, msg).then(function () {
            client.getMessageContent(event.message.id).then((stream) => {

                // 取得Image content(byte[])
                stream.on('data', (chunk) => {
                    chunks.push(chunk);
                    size += chunk.length;
                })
                stream.on('error', (err) => {
                    // error handling
                })
                stream.on('end', (err) => {

                    switch (chunks.length) {
                        case 0: data = new Buffer(0);
                            break;
                        case 1: data = chunks[0];
                            break;
                        default:
                            data = new Buffer(size);
                            for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                                var chunk = chunks[i];
                                chunk.copy(data, pos);
                                pos += chunk.length;
                            }
                            break;
                    }

                    // save file to Server
                    var optionsPost = {
                        host: '116.50.39.201',
                        port: 7102,
                        path: '/LineRESTful/resources/LineRESTfulTest/postVideo',
                        method: 'POST',
                        encoding: null
                    };
                    try {
                        var post_req = http.request(optionsPost, function (res) {
                            res.on('data', function (chunk) {
                                console.log("影片已上傳:/home/mis/Line/mp4/" + chunk);
                            });
                        });

                        // post the data
                        post_req.write(data);
                        post_req.end();

                    }
                    catch (e) {
                        return console.log("http request fail:" + JSON.stringify(optionsPost));
                    }
                })
            })

            // success 
            console.log(event.message);

        }).catch(function (error) {
            // error 
            console.log(error);
        });
    }

    // 收到貼圖訊息時
    if (event.message.type === 'sticker') {
        msg = {
            "type": "sticker",
            "packageId": "1",
            "stickerId": "13"
        };
        return client.replyMessage(event.replyToken, msg).then(function () {
            // success 
            console.log(event.message);
        }).catch(function (error) {
            // error 
            console.log(error);
        });
    }
    //})

    // 收到檔案時
    if (event.message.type === 'file') {
        msg = { type: 'text', text: "檔案上傳!" };
        var chunks = [];
        var size = 0;
        var data = [];

        return client.replyMessage(event.replyToken, msg).then(function () {
            client.getMessageContent(event.message.id).then((stream) => {

                // 取得content(byte[])
                stream.on('data', (chunk) => {
                    chunks.push(chunk);
                    size += chunk.length;
                })
                stream.on('error', (err) => {
                    // error handling
                })
                stream.on('end', (err) => {

                    switch (chunks.length) {
                        case 0: data = new Buffer(0);
                            break;
                        case 1: data = chunks[0];
                            break;
                        default:
                            data = new Buffer(size);
                            for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                                var chunk = chunks[i];
                                chunk.copy(data, pos);
                                pos += chunk.length;
                            }
                            break;
                    }

                    // save file to Server
                    var now = new Date().toISOString().
                        replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '').replace(/\s+/g, "");
                    var random = Math.floor(Math.random() * 9999) + 1;
                    var FileName = now + random + '.png';
                    console.log(FileName);
                    var optionsPost = {
                        host: '116.50.39.201',
                        port: 7102,
                        path: '/FileRESTful/resources/FileRESTful/postFile/LineFile/' + FileName,
                        method: 'POST',
                        encoding: null
                    };
                    try {
                        var post_req = http.request(optionsPost, function (res) {
                            res.on('data', function (chunk) {
                                //var jdata = JSON.parse(chunk);
                                //jdata.forEach(function (row) {
                                //    var ReturnMsg = row.ReturnMsg;
                                //    var Directory = row.Directory;
                                //    console.log(ReturnMsg);
                                //    console.log(Directory);
                                //});
                                console.log("上傳結果：" + chunk);
                            });
                        });

                        // post the data
                        post_req.write(data);
                        post_req.end();

                    }
                    catch (e) {
                        return console.log("http request fail:" + JSON.stringify(optionsPost) + "," + e);
                    }
                })
            })

            // success 
            console.log(event.message);

        }).catch(function (error) {
            // error 
            console.log(error);
        });
    }
}

// postback event
function postback(event) {
    console.log("postback event=" + JSON.stringify(event));
    var msg = "";
    if (event.postback.data === "action=test2")
    {
        msg = {
            type: 'template',
            altText: 'this is a confirm template',
            template: {
                type: 'confirm',
                text: '設備：T2_CF_MODICON\n蒸汽鍋爐發生異常\n請相關人員前往處置',
                actions: [
                    {
                        type: 'postback',
                        label: '已處置完畢',
                        data: '123',
                        text: '已處置完畢'

                    },
                    {
                        type: 'uri',
                        label: '影像回報',
                        uri: 'line://nv/camera/'
                    }
                ]
            }
        }
        client.pushMessage(event.source.userId, msg);
    }
    else if (event.postback.data === "action=test1")
    {
        msg = {
            type: 'template',
            altText: 'this is a buttons template',
            template: {
                type: 'buttons',
                thumbnailImageUrl: 'https://s3-ap-northeast-1.amazonaws.com/chinpoon/cat.jpg',
                title: 'Menu',
                text: 'TEST2 為 圖文選單 訊息測試',
                actions: [
                    {
                        type: 'postback',
                        label: '代發訊息測試',
                        data: 'action=buy&itemid=123',
                        text: '這是代發訊息'
                    },
                    {
                        type: 'datetimepicker',
                        label: '日期選取測試',
                        data: 'datestring',
                        mode: 'date'
                    },
                    {
                        type: 'uri',
                        label: '超連結測試',
                        uri: 'https://www.google.com.tw/'
                    }
                ]
            }
        }
        client.pushMessage(event.source.userId, msg);
    }
    else if (event.postback.data === "action=test3") {
        msg = {
            "type": "template",
            "altText": "this is a carousel template",
            "template": {
                "type": "carousel",
                "columns": [
                    {
                        "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/+sedum.png",
                        "title": "選單1",
                        "text": "TEST3為輪播圖文選單測試",
                        "actions": [
                            {
                                type: 'postback',
                                label: '代發訊息測試',
                                data: 'action=buy&itemid=123',
                                text: '這是代發訊息'
                            },
                            {
                                type: 'datetimepicker',
                                label: '日期選取測試',
                                data: 'datestring',
                                mode: 'date'
                            },
                            {
                                type: 'uri',
                                label: '超連結測試',
                                uri: 'https://www.google.com.tw/'
                            }
                        ]
                    },
                    {
                        "thumbnailImageUrl": "https://s3-ap-northeast-1.amazonaws.com/chinpoon/cat.jpg",
                        "title": "選單2",
                        "text": "TEST3為輪播圖文選單測試",
                        "actions": [
                            {
                                type: 'postback',
                                label: '代發訊息測試2',
                                data: 'action=buy&itemid=123',
                                text: '這是代發訊息2'
                            },
                            {
                                type: 'datetimepicker',
                                label: '日期選取測試',
                                data: 'datestring',
                                mode: 'date'
                            },
                            {
                                type: 'uri',
                                label: '超連結測試',
                                uri: 'https://www.google.com.tw/'
                            }
                        ]
                    }
                ]
            }
        }
        client.replyMessage(event.replyToken, msg);
    }
    else if (event.postback.data === "action=test4") {

    }
    else if (event.postback.data === "action=test5") {

    }
    else if (event.postback.data === "action=test6") {

    }
    else if (event.postback.data === "datestring") {
        msg = {
            type: 'text', text: '您所挑選的日期為:' + event.postback.params.date
        };
        client.pushMessage(event.source.userId, msg);
    }
    else if (event.postback.data === "getRichMenuList")
    {
        // 取得Rich Menu List
        client.getRichMenuList().then(function (arrRichMenuList)
        {
            for (var i = 0; i < arrRichMenuList.length; i++) {
                var Id = arrRichMenuList[i].richMenuId;
                var Name = arrRichMenuList[i].name;
                var ChatBarText = arrRichMenuList[i].chatBarText;
                msg = {
                    type: 'text', text: '選單' + i + '：\nId=' + Id + '\nName=' + Name + '\nChatBarText=' + ChatBarText
                };
                client.pushMessage(event.source.userId, msg);
                console.log(JSON.stringify(msg));
            }
        }).catch(function (e) {
            console.log("getRichMenuList error:" + e);
        });
    }
    else if (event.postback.data === "sendImageTest") {
        var filepath = path.join("img", "test.jpg");
        msg = { type: 'image', originalContentUrl: filepath, previewImageUrl: filepath };
        client.pushMessage(event.source.userId, msg);
        console.log(JSON.stringify(msg));
    }
    else if (event.postback.data === "RM_DESC") {
        jsonProcess.getMsgFromJsonFile("msgText","rm_desc").then(function (msg) {
            client.pushMessage(event.source.userId, msg);
        });
    }
    else if (event.postback.data === "部門管理") {
        msg = { "type": "text", "text": "歡迎使用敬鵬即時訊息整合服務選單!\n若使用上有任何問題請洽#1409" };
        console.log(JSON.stringify(msg));
        client.pushMessage(event.source.userId, msg);
    }
}

// follow event
function follow(event) {
    console.log("follow event=" + JSON.stringify(event));
    return getDisplayName(event.source.userId).then(function (displayName) {
        // 發送新好友資訊給管理員
        client.pushMessage(process.env.AdminLineUserId, {
            type: 'text', text: '*****加入好友通知*****\nLine暱稱：' + displayName
            + '\nID：' + event.source.userId
        });
    }).catch(function (error) {
        // error 
        console.log(error);
    });
}

// unfollow event
function unfollow(event) {
    console.log("unfollow event=" + JSON.stringify(event));
    // 發送封鎖人員資訊給管理員
    client.pushMessage(process.env.AdminLineUserId, {
        type: 'text', text: '*****好友封鎖/刪除通知*****\nID：' + event.source.userId
    });
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

// 取得Line暱稱
function getDisplayName(userId) {
    return client.getProfile(userId).then(function (profile) {
        return profile.displayName;
    });
}