'use strict';
const express = require('express');
const line = require('@line/bot-sdk');
const schedule = require('node-schedule');
const http = require("http");


//  維持Heroku不Sleep
setInterval(function () {
    http.get("http://cpclinebot.herokuapp.com");
}, 1500000); // every 25 minutes (1500000)

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

// 排程 1次/min
try
{
    var job = schedule.scheduleJob('0,30 * * * * *', function () {
        // 設定GET RESTful API連接參數
        var paraGet = '';
        var optionsGet = {
            host: '116.50.39.201',
            port: 7102,
            path: '/LinuxWS/resources/LinuxRESTful' + paraGet,
            method: 'GET'
        };
        console.log("http request");
        // 取得line_message_send中的待發訊息並發送
        http.request(optionsGet, function (resGET) {
            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            resGET.setEncoding('utf8');
            resGET.on('data', function (chunk) {
                if (chunk == '[]') {
                    console.log('No messages need to be sent.');
                }
                else {
                    console.log(chunk);
                    try {
                        var data = JSON.parse(chunk);
                    }
                    catch (e) {
                        return console.log(e);
                    }
                    data.forEach(function (row) {
                        var message_id = row.message_id;
                        var line_id = row.line_id;
                        var message = row.message;
                        try {
                            var messageSend = JSON.parse(message);
                        }
                        catch (e) {
                            return console.log(e);
                        }
                        console.log('message_id:' + message_id);
                        client.pushMessage(line_id, messageSend).then(function () {
                            // 設定PUT RESTful API連接參數
                            var paraPut = '?strMessageId=' + message_id;
                            var optionsPut = {
                                host: '116.50.39.201',
                                port: 7102,
                                path: '/LinuxWS/resources/LinuxRESTful' + paraPut,
                                method: 'PUT'
                            };
                            console.log(paraPut);
                            http.request(optionsPut, function (resPUT) {
                                resPUT.setEncoding('utf8');
                                resPUT.on('data', function (chunkPUT) {
                                    console.log(chunkPUT);
                                });
                            }).end();
                        }).catch(function (error) {
                            console.log(error);
                        });
                    });
                }
            });
        }).end();
    });
}
catch (e)
{
    console.log(e);
}

// event handler
async function handleEvent(event) {
  if (event.type !== 'message') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  reply(await getDisplayName(await getUserId(event)), event);
}

// 取得userid
function getUserId(event){
	const userId = event.source.userId;
	return userId;
}

// 取得Line暱稱
async function getDisplayName(userId) {
	console.log(userId);
	const profile = await client.getProfile(userId);
	return profile.displayName;
}

// 依據訊息type做出不同回應
async function reply(displayName, event) {
	//client.pushMessage(event.source.userId, { type: 'text', text: displayName +'您好,\n這是Line機器人測試'}).then(function() {
		
		// 收到文字訊息時
		if (event.message.type == 'text') {			
			if (event.message.text.toUpperCase().startsWith("V") && (event.message.text.length == 5))
			{
				var msg = { type: 'text', text: '已收到您輸入的驗證碼!\n請將表單送出，\n並等待權限審核流程完成，\n謝謝!' };
				// echo
				return client.replyMessage(event.replyToken, msg).then(function() {
					// 發送驗證資訊給管理員
					client.pushMessage(process.env.AdminLineUserId, { type: 'text', text: '*****Line推播權限申請*****\nLine暱稱：' + displayName + '\n驗證碼：' + event.message.text + '\nID：' + event.source.userId});
					// success 
					console.log(displayName);
					console.log(event);
				  
					// 將line_id及verify_code寫入line_user_auth
					var userInfo = { userId: event.source.userId, verifyCode: event.message.text };
					var formData = JSON.stringify(userInfo);
					var paraPost = '?strUserInfo=' + formData;
					var optionsPost = {
						host: '116.50.39.201',
						port: 7102,
						path: '/LinuxWS/resources/LinuxRESTful/LineUserAuth' + paraPost,
						method: 'POST'
					};
					
					http.request(optionsPost, function(resPOST) {
						resPOST.setEncoding('utf8');
						resPOST.on('data', function (chunkPOST) {
							console.log(chunkPOST);
						});
					}).end();
				  
				  
				}).catch(function(error) {
				  // error 
				  console.log(error);
				});
			}
			else if (event.message.text == '!停止')
			{
				job.cancel();
				client.pushMessage(event.source.userId, { type: 'text', text: '停止排程'});
			}
			else
			{
				var msg = { type: 'text', text: event.message.text };
				// echo
				return client.replyMessage(event.replyToken, msg).then(function() {
				  //client.replyMessage(event.replyToken, { type: 'text', text: '文字訊息回應為echo模式'});
				  // success 
				  console.log(displayName);
				  console.log(event);
				  
				}).catch(function(error) {
				  // error 
				  console.log(error);
				});
			}
		}
		  
		// 收到圖片訊息時
		if (event.message.type == 'image') {
			var msg = { type: 'text', text: "您傳的這張圖片不錯喔!" };
			return client.replyMessage(event.replyToken, msg).then(function() {
			  // success 
			  console.log(event.message);
			}).catch(function(error) {
			  // error 
			  console.log(error);
			});
		}
		  
		// 收到貼圖訊息時
		if (event.message.type =='sticker') {
			var msg = {
				"type": "sticker", 
				"packageId": "1", 
				"stickerId": "13"
			};
			return client.replyMessage(event.replyToken, msg).then(function() {
			  // success 
			  console.log(event.message);
			}).catch(function(error) {
			  // error 
			  console.log(error);
			});
		}
	//})
}
