'use strict';
const
    line = require('@line/bot-sdk'),
    lineBotSdk = require('./js/lineBotSdk'),
    express = require('express'),
    msg = require('./js/msg'),
    postback = require('./js/postback'),
    bodyParser = require('body-parser');

// keep Heroku not sleep
//setInterval(function () {
//    http.get('http://cpclinebottest.herokuapp.com');
//}, 1500000); // every 25 minutes (1500000)

// 設定LINE BOT SDK環境變數
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

// recieve msg API
app.post('/', line.middleware(config), (req, res) => {
    console.log(req.body.events);
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result))
      .catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  });

// event handler
function handleEvent(event) {
    console.log(event.type);
    switch (event.type) {
        case 'message':
            msg.messageHandle(event);
            break;
        case 'postback':
            postback.postbackHandle(event);
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

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// send msg API
app.post('/sendMsg', (req, res) => {
    //console.log(req.body);
    var sendMsgResult = {"Result":"","successMsg":[], "failMsg":[]};
    if (req.body.msgData.length > 0) {
        try {
            if (req.body.msgData != null)
            {
                let requests = req.body.msgData.map(function (msg) {
                    return new Promise((resolve) => {
                        sendMsg(msg, resolve);
                        
                      });
                });
                Promise.all(requests).then(() => {
                    console.log(requests);
                    sendMsgResult.Result = "Send message Done";
                    res.send(sendMsgResult);
                });
            }
            else
            {
                sendMsgResult.Result = "No Message need to send";
                res.send(sendMsgResult);
            }
        }
        catch (e) {
            sendMsgResult.Result = e;
            console.log(e);
            res.send(sendMsgResult);
        }
    }
    else {
        sendMsgResult.Result = "Message data error";
        console.log("Message data error");
        res.send(sendMsgResult);
    }
});

function sendMsg (msg, callback) {
    var message_id = msg.message_id;
    var line_id = msg.line_id;
    var message;
    try {
        message = JSON.parse(msg.message);
    } 
    catch (e) {
        message = msg.message;
    }
    //console.log(message_id);
    //console.log(line_id);
    //console.log(message);
    try {
        // 訊息內容換行處理
        var messageSend = JSON.parse(jsonEscape(JSON.stringify(message)));
        // 將發送對象拆解
        var ids = line_id.split(',');
        //console.log('message_id:' + message_id + ',ids:' + ids);
        // 群組訊息
        if (ids[0].startsWith('C'))
        {
            lineBotSdk.pushMessage(ids[0], messageSend).then(function () {
                return callback(message_id, true);
            }).catch(function (e) {
                console.log(e);
                return callback(message_id, false);
            });
        }
        // 個人訊息
        else
        {
            lineBotSdk.multicast(ids, messageSend).then(function () {
                return callback(message_id, true);
            }).catch(function (e) {
                console.log(e);
                return callback(message_id, false);
            });
        }
    }
    catch (e) {
        console.log(e);
    }
  }

// follow event
function follow(event) {
    console.log('follow event=' + JSON.stringify(event));
    lineBotSdk.getDisplayName(event.source.userId).then(function (displayName) {
        // 發送新好友資訊給管理員
        lineBotSdk.pushMessage(process.env.AdminLineUserId, {
            type: 'text', text: '*****加入好友通知*****\nLine暱稱：' + displayName
            + '\nID：' + event.source.userId
        });
    }).catch(function (e) {
        console.log(e);
    });
}

// unfollow event
function unfollow(event) {
    console.log('unfollow event=' + JSON.stringify(event));
    // 發送封鎖人員資訊給管理員
    lineBotSdk.pushMessage(process.env.AdminLineUserId, {
        type: 'text', text: '*****好友封鎖/刪除通知*****\nID：' + event.source.userId
    });
}

// 例外處理
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

// 訊息內容換行處理
function jsonEscape(str) {
    return str.replace(/\n/g, "\\n").replace(/~n/g, "\\n");
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});