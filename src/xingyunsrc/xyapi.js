"use strict";

import Promise from 'bluebird';
var ddzcontract = "n1qtec4m7Nq567YnNWUoK5S9muXJyyjdiJD";

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb();
console.log("send");
var msgsender;

//Account.NewAccount().getAddressString();
// var msgsender = nebPay.simulateCall(ddzcontract, 0, "getme", JSON.stringify([]));

var NebPay = require("nebpay.js");     //https://github.com/nebulasio/nebPay
var nebPay = new NebPay();

// NebPay.queryPayInfo(serialNumber,{
//     callback:'http://localhost:8685/api/pay',
//     listener:undefined
// })
neb.setRequest(new nebulas.HttpRequest("https://testnet.nebulas.io"));
// neb.setRequest(new HttpRequest("http://localhost:8685"));
export const getneb = () => {
    return neb;
};

export const joingame = async () => {
    DDZ_DEBUG && console.log("joining game");
    nebPay.call(ddzcontract, 0, "join", JSON.stringify([]),{
        //callback: NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
        callback: NebPay.config.testnetUrl
        //此处可加listener
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};
export const buycoin = async (coin) => {
    var rate = await getrate();
    DDZ_DEBUG && console.log("buying coin " + coin + " " + rate);
    var serialNumber = nebPay.call(ddzcontract, coin * rate, "buy", JSON.stringify([coin]), {
        //callback: NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
        callback: NebPay.config.testnetUrl
        //此处可加listener
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};
export const sellcoin = async (coin) => {
    var rate = await getrate();
    DDZ_DEBUG && console.log("selling coin " + coin + " " + rate);
    var serialNumber = nebPay.call(ddzcontract, "0", "sell", JSON.stringify([coin]), {            //callback: NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
        callback: NebPay.config.testnetUrl
        //此处可加listener
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};

//console.log("nebpay: received re
export const requestround = async (player1, player2, player3, coin) => {
    DDZ_DEBUG && console.log("requesting round" + ":" + player1 + ":" + player2 + ":" + player3);
    var serialNumber = nebPay.call(ddzcontract, 0, "addround", JSON.stringify([player1, player2, player3, coin]), {
        //callback: NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
        callback: NebPay.config.testnetUrl
        //此处可加listener
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};

export const startround = async (roundid) => {
    DDZ_DEBUG && console.log("starting round");
    var serialNumber = nebPay.call(ddzcontract, 0, "startround", JSON.stringify([roundid]),{
        callback: NebPay.config.testnetUrl
        //此处可加listener
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};

export const endround = async (roundid, landlordaddr, farmerwin) => {
    DDZ_DEBUG && console.log("ending round");
    var serialNumber = nebPay.call(ddzcontract, 0, "endround", JSON.stringify([roundid, landlordaddr, farmerwin]),{
        callback: NebPay.config.testnetUrl
        //此处可加listener
    });
    //此处无需等待回调，因为玩家如果不想结算回调也触发不了，不如快点开始下一把
    //返回的是玩家剩余的币，详情见app.vue -> gameover
    var hash = await waitingcallback(serialNumber);
    this.getMe()
	.then((me) => {
		return me.coin;
	});
};
//========
export const getMe = async () => {
    const me = {};
    window.postMessage({
        "target": "contentscript",
        "data": {
        },
        "method": "getAccount",
    }, "*");
    var event;
    me.address = await new Promise((resolve, reject) => {
        event = function (e) {
            console.log("recived by page:" + e + ", e.data:" + JSON.stringify(e.data));
            if (!!e.data.data.account) {
                msgsender = e.data.data.account;
                window.removeEventListener('message', event);
                resolve(msgsender);
            }
        };
        window.addEventListener('message', event);//msgsender;
    });
    msgsender = me.address;
    DDZ_DEBUG && console.log(me.address);
    if (me.address) {
        DDZ_DEBUG && console.log("getting joined..");
        me.joined = await playerisjoined(msgsender);
        DDZ_DEBUG && console.log(me.joined);
        DDZ_DEBUG && console.log("getting coin..");
        //if (me.joined != "true") throw Error('NONE_JOINED');
        me.coin = await getCoin(msgsender);
        return me;
    }
    throw Error('WALLET_LOCKED');
};
export const getCoin = async (address) => {
    // return await nebPay.simulateCall(ddzcontract, 0, "getBalance", JSON.stringify([address]));
    return seeret(await neb.api.call(msgsender, ddzcontract, 0, 0, 1000000, 2000000, {
        "function": "getBalance",
        "args": JSON.stringify([address]),
    }));
}
export const getrate = async () => {
    return parseInt(seeret(await neb.api.call(msgsender, ddzcontract, 0, 0, 1000000, 2000000, {
        "function": "getrate",
        "args": JSON.stringify([]),
    }))) / 1000000000000000000;
    // return await nebPay.simulateCall(ddzcontract, 0, "getrate", JSON.stringify([]));
}
export const playerisjoined = async (address) => {
    return seeret(await neb.api.call(msgsender, ddzcontract, 0, 0, 1000000, 2000000, {
        "function": "isjoined",
        "args": JSON.stringify([address])
    }));
    // {return await nebPay.simulateCall(ddzcontract, 0, "isjoined", JSON.stringify([address]));
};
export const playerisadmin = async (address) => {
    return seeret(await neb.api.call(msgsender, ddzcontract, 0, 0, 1000000, 2000000, {
        "function": "isadmin",
        "args": JSON.stringify([address])
    }));
    // {return await nebPay.simulateCall(ddzcontract, 0, "isjoined", JSON.stringify([address]));
};
export const withdraw = async (coins) => {
    DDZ_DEBUG && console.log("withdrawing:" + coins);
    nebPay.call(ddzcontract, 0, "withdraw", JSON.stringify([coins]),{
        callback: NebPay.config.testnetUrl
    });
    return;
};
const waitingcallback = serialNumber => new Promise((resolve, reject) => {
    DDZ_DEBUG && console.log("waiting...");
    var intervalQuery;
    function funcIntervalQuery() {
        var options = {
            //var callbackUrl = NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
            callback: NebPay.config.testnetUrl
        }
        nebPay.queryPayInfo(serialNumber, options)   //search transaction result from server (result upload to server by app)
            .then(function (resp) {
                DDZ_DEBUG && console.log("tx result: " + resp)   //resp is a JSON string
                var respObject = JSON.parse(resp)
                if (respObject.data.status === 1) {
                    clearInterval(intervalQuery);
                    resolve(respObject.data.hash);
                }
            })
            .catch(function (err) {
                DDZ_DEBUG && console.log(err);
            });
    }
    intervalQuery = setInterval(function () {
        funcIntervalQuery();
    }, 10000);
});
const seeret = ret => {
    return ret.result.replace(/\"/g, "");
}
    // });