'use strict' // 嚴謹模式

const
    http = require("http");

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

//****************************以下Rich Menu相關方法不可刪除，會使用到****************************//

// 建立Rich Menu Object(CPC客製)
var RMenuCPC = {
    "size": {
        "width": 2500,
        "height": 1686
    },
    "selected": false,
    "name": "CPC",
    "chatBarText": "功能選單",
    "areas": [
        {
            "bounds": {
                "x": 77,
                "y": 855,
                "width": 500,
                "height": 500
            },
            "action": {
                "type": "postback",
                "data": "!admin",
                "text": "!admin"
            }
        },
        {
            "bounds": {
                "x": 267,
                "y": 170,
                "width": 500,
                "height": 500
            },
            "action": {
                "type": "postback",
                "data": "!admin",
                "text": "!admin"
            }
        },
        {
            "bounds": {
                "x": 1000,
                "y": 70,
                "width": 500,
                "height": 500
            },
            "action": {
                "type": "message",
                "label": "部門管理",
                "text": "部門管理"
            }
        },
        {
            "bounds": {
                "x": 1761,
                "y": 170,
                "width": 500,
                "height": 500
            },
            "action": {
                "type": "postback",
                "data": "!admin"
            }
        },
        {
            "bounds": {
                "x": 1940,
                "y": 850,
                "width": 500,
                "height": 500
            },
            "action": {
                "type": "postback",
                "data": "!admin"
            }
        },
        {
            "bounds": {
                "x": 600,
                "y": 785,
                "width": 1300,
                "height": 900
            },
            "action": {
                "type": "message",
                "label": "RM_DESC",
                "text": "RM_DESC"
            }
        }
    ]
}

// 建立Rich Menu Object(3格_2500*843)
var RMenu3 = {
    "size": {
        "width": 2500,
        "height": 843
    },
    "selected": false,
    "name": "TEST_3",
    "chatBarText": "選單測試",
    "areas": [
        {
            "bounds": {
                "x": 0,
                "y": 0,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "!admin",
                "text": "!admin"
            }
        },
        {
            "bounds": {
                "x": 834,
                "y": 0,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test2"
            }
        },
        {
            "bounds": {
                "x": 1668,
                "y": 0,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test3"
            }
        }
    ]
}

// 建立Rich Menu Object(6格_2500*1686)
var RMenu6 = {
    "size": {
        "width": 2500,
        "height": 1686
    },
    "selected": false,
    "name": "TEST_6",
    "chatBarText": "選單測試",
    "areas": [
        {
            "bounds": {
                "x": 0,
                "y": 0,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test1"
            }
        },
        {
            "bounds": {
                "x": 834,
                "y": 0,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test2"
            }
        },
        {
            "bounds": {
                "x": 1668,
                "y": 0,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test3"
            }
        },
        {
            "bounds": {
                "x": 0,
                "y": 844,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test4"
            }
        },
        {
            "bounds": {
                "x": 834,
                "y": 844,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test5"
            }
        },
        {
            "bounds": {
                "x": 1668,
                "y": 844,
                "width": 833,
                "height": 843
            },
            "action": {
                "type": "postback",
                "data": "action=test6"
            }
        }
    ]
}


/**
 * 建立RichMenu
 * @param {String} richMenuName RichMenu名稱
 */
exports.createRichMenu = function (rmo) {
    var rmoArray = rmo.split("|", 2);
    client.createRichMenu(RMenuCPC).then(function (richMenuID) {
        console.log("Rich Menu created:" + JSON.stringify(richMenuID));
    }).catch(function (e) {
        console.log("createRichMenu error:" + e);
    });
}

// 刪除RichMenu
//var deleteRichMenuId = "richmenu-74238990b4985dfb260debb006116b6e";
//client.deleteRichMenu(deleteRichMenuId).then(function () {
//    console.log("Rich Menu deleted:" + deleteRichMenuId);
//}).catch(function (e) {
//    console.log("deleteRichMenu error:" + e);
//});

//var RichMenuId = "richmenu-19a8c423f8e9a8bd55a6ac24754cb02c";

// 綁定RichMenu圖片
//const filepath = path.join(__dirname, "RMenuCPC.png");
//const buffer = fs.readFileSync(filepath);
//client.setRichMenuImage(RichMenuId, buffer).then(function () {
//    console.log("setRichMenuImage seccess:" + RichMenuId);
//}).catch(function (e) {
//    console.log("setRichMenuImage error:" + e);
//});

// 取得Rich Menu List
//client.getRichMenuList().then(function (arr)
//{
//    console.log("RichMenuLists=" + JSON.stringify(arr))
//}).catch(function (e) {
//    console.log("getRichMenuList error:" + e);
//});


var RichMenuUserId = process.env.AdminLineUserId;

// 綁定RichMenuId給RichMenuUserId
//client.linkRichMenuToUser(RichMenuUserId, RichMenuId).then(function () {
//    console.log("linkRichMenuToUser seccess");
//    client.getRichMenuIdOfUser(RichMenuUserId).then(function (RichMenuId) {
//        console.log(RichMenuUserId + ".RichMenuID=" + RichMenuId);
//    }).catch(function (e) {
//        console.log("getRichMenuIdOfUser(" + RichMenuUserId + ")error:" + e);
//    });
//}).catch(function (e) {
//    console.log("linkRichMenuToUser(" + RichMenuUserId + ")error:" + e);
//});