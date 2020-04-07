'use strict';
const
    lineBotSdk = require('./js/lineBotSdk'),
    express = require('express'),
    msg = require('./js/msg'),
    postback = require('./js/postback'),
    request = require('./js/request'),
    jsonProcess = require('./js/jsonProcess');

// 維持Heroku不Sleep
//setInterval(function () {
//    http.get('http://cpclinebottest.herokuapp.com');
//}, 1500000); // every 25 minutes (1500000)

const app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index3.html');
});

app.get('/api/', function (req, res) {
    //console.log(req.query);
    var objsArray = [];
    jsonProcess.getJsonFileArrayData('url').then(function (data) {
        objsArray = JSON.parse(data);
        var obj = objsArray.filter(function (url) {
            return url.urlName == req.query.urlName;
        });
        var url = obj[0].url;
        var path = req.query.path;
        request.requestHttpGetJson(url + path).then(function (data) {
            res.send(data);
        });
    }).catch(function (error) {
        console.log(error);
    });
});

app.post('/sendMsg', (req, res) => {
    console.log(JSON.stringify(req.body));
    if (req.body.data.length > 0) {
        try {
            var jdata = JSON.parse(req.body.data);
            if (jdata.msgData != null)
            {
                jdata.msgData.forEach(function (msg) {
                    var message_id = msg.message_id;
                    var line_id = msg.line_id;
                    var message = msg.message;
                    try {
                        // 將發送對象拆解
                        var messageSend = JSON.parse(jsonEscape(message));
                        var ids = line_id.split(',');
                        console.log('message_id:' + message_id + ',ids:' + ids);
                        // 群組訊息
                        if (ids[0].startsWith('C'))
                        {
                            lineBotSdk.pushMessage(ids[0], messageSend).then(function () {
                                res.send({"sendMsgResult":"Send message success"});
                            }).catch(function (e) {
                                console.log(e);
                                res.send({"sendMsgResult":"Send message error:" + e});
                            });
                        }
                        //個人訊息
                        else
                        {
                            lineBotSdk.multicast(ids, messageSend).then(function () {
                                res.send({"sendMsgResult":"Send message success"});
                            }).catch(function (e) {
                                console.log(e);
                                res.send({"sendMsgResult":"Send message error:" + e});
                            });
                        }
                    }
                    catch (e) {
                        console.log(e);
                        res.send({"sendMsgResult":"Send message error:" + e});
                    }
                });
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

// 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log('App now running on port', port);
});

// event handler
function handleEvent(event) {
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

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

function jsonEscape(str) {
    return str.replace(/\n/g, "\\n").replace(/~n/g, "\\n");
}