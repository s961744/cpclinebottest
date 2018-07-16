'use strict' //strict mode

const
    line = require('@line/bot-sdk'),
    fs = require('fs'),
    path = require('path');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

/**
 * 建立richMenu
 * @param {String} rmName RichMenu名稱(richMenu.json的rmName)
 */
exports.createRichMenu = function (rmName) {
    return new Promise(function (resolve, reject) {
        getRichMenuData(rmName).then(function (rm) {
            client.createRichMenu(rm).then(function (richMenuID) {
                console.log("Rich Menu created:" + JSON.stringify(richMenuID));
                resolve(richMenuID);
            }).catch(function (e) {
                console.log("createRichMenu error:" + e);
                reject(e);
            });
        });
    });
}

//綁定rmName.png圖片給richMenuId
exports.setRichMenuImage = function (richMenuId, rmName) {
    return new Promise(function (resolve, reject) {
        const filepath = path.join("img", rmName + ".png");
        const buffer = fs.readFileSync(filepath);
        client.setRichMenuImage(richMenuId, buffer).then(function () {
            console.log("setRichMenuImage seccess:" + richMenuId);
            resolve(richMenuId);
        }).catch(function (e) {
            console.log("setRichMenuImage error:" + e);
            reject(e);
        });
    });
}

//綁定richMenuId給UserId
exports.linkRichMenuToUser = function (richMenuId, userId) {
    return new Promise(function (resolve, reject) {
        client.linkRichMenuToUser(userId, richMenuId).then(function () {
            console.log("linkRichMenuToUser seccess");
            client.getRichMenuIdOfUser(userId).then(function (richMenuId) {
                console.log(userId + ".RichMenuID=" + richMenuId);
                resolve(richMenuId);
            }).catch(function (e) {
                console.log("getRichMenuIdOfUser(" + userId + ")error:" + e);
                reject(e);
            });
        }).catch(function (e) {
            console.log("linkRichMenuToUser(" + userId + ")error:" + e);
            reject(e);
        });
    });
}

//依rmName取得richMenu選單內容
function getRichMenuData(rmName) {
    return new Promise(function (resolve, reject) {
        var objsArray = [];
        jsonProcess.getJsonFileArrayData("richMenu").then(function (data) {
            objsArray = JSON.parse(data)
            var obj = objsArray.filter(function (rm) {
                return rm.rmName == rmName;
            });
            resolve(obj[0].rm);
        });
    }).catch(function (e) {
        console.log("getRichMenuData error:" + e);
        reject(e);
    });
}

// 取得Rich Menu List
//client.getRichMenuList().then(function (arr)
//{
//    console.log("RichMenuLists=" + JSON.stringify(arr))
//}).catch(function (e) {
//    console.log("getRichMenuList error:" + e);
//});

// 刪除RichMenu
//var deleteRichMenuId = "richmenu-74238990b4985dfb260debb006116b6e";
//client.deleteRichMenu(deleteRichMenuId).then(function () {
//    console.log("Rich Menu deleted:" + deleteRichMenuId);
//}).catch(function (e) {
//    console.log("deleteRichMenu error:" + e);
//});

//var RichMenuId = "richmenu-19a8c423f8e9a8bd55a6ac24754cb02c";