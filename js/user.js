'use strict' //strict mode

const
    line = require('@line/bot-sdk');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// 取得Line暱稱
function getDisplayName(userId) {
    client.getProfile(userId).then(function (profile) {
        return profile.displayName;
    });
}