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

// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
//app.use(bodyParser.json())

// send msg API
app.post('/sendMsg', (req, res) => {
    console.log(req.body);
    if (req.body.msgData.length > 0) {
        try {
            if (req.body.msgData != null)
            {
                req.body.msgData.forEach(function (msg) {
                    var message_id = msg.message_id;
                    var line_id = msg.line_id;
                    var message = msg.message;
                    console.log(message_id);
                    console.log(line_id);
                    console.log(message);
                    try {
                        // 訊息內容換行處理
                        var messageSend = JSON.parse(jsonEscape(JSON.stringify(message)));
                        // 將發送對象拆解
                        var ids = line_id.split(',');
                        console.log('message_id:' + message_id + ',ids:' + ids);
                        // 群組訊息
                        if (ids[0].startsWith('C'))
                        {
                            lineBotSdk.pushMessage(ids[0], messageSend).then(function () {
                            }).catch(function (e) {
                                console.log(e);
                            });
                        }
                        // 個人訊息
                        else
                        {
                            lineBotSdk.multicast(ids, messageSend).then(function () {
                            }).catch(function (e) {
                                console.log(e);
                            });
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                });
                res.send({"sendMsgResult":"Send message success"});
            }
        }
        catch (e) {
            console.log(e);
            res.send({"sendMsgResult":"Send message error:" + e});
        }
    }
    else {
        console.log("Message data error");
        res.send({"sendMsgResult":"Send message error:Message data error"});
    }
});

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