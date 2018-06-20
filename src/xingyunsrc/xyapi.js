"use strict";

import Promise from 'bluebird';
// var ddzcontract = "n1qtec4m7Nq567YnNWUoK5S9muXJyyjdiJD"; //test
// var ddzquickcontract = "n1sjbBU4m5h82VavvENosYHEJQgoNDLFNNb"; //test
var ddzcontract = "n1kWUU4U5uYrCWLXxCQDRKJw8gEqKS7o7Js"; //main
var ddzquickcontract = "n1xrYBupdyXQykLwCdK8uVFwRXGySgdAzyV" //main

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb();
console.log("send");
var msgsender;

var NebPay = require("nebpay.js");     //https://github.com/nebulasio/nebPay
var nebPay = new NebPay();

// var callbacks = NebPay.config.testnetUrl;
var callbacks = NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
// neb.setRequest(new nebulas.HttpRequest("https://testnet.nebulas.io")); //test
neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io")); //main

export const getneb = () => {
    return neb;
};

export const joingame = async () => {
    DDZ_DEBUG && console.log("joining game");
    var serialNumber = nebPay.call(ddzcontract, 0, "join", JSON.stringify([]),{
        callback: callbacks
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};
export const buycoin = async (coin) => {
    var rate = await getrate();
    DDZ_DEBUG && console.log("buying coin " + coin + " " + rate);
    var serialNumber = nebPay.call(ddzcontract, coin * rate, "buy", JSON.stringify([coin]), {
        callback: callbacks
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};
export const sellcoin = async (coin) => {
    var rate = await getrate();
    DDZ_DEBUG && console.log("selling coin " + coin + " " + rate);
    var serialNumber = nebPay.call(ddzcontract, "0", "sell", JSON.stringify([coin]), {            //callback: NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
        callback: callbacks
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};

//console.log("nebpay: received re
export const requestround = async (player1, player2, player3, coin) => {
    DDZ_DEBUG && console.log("requesting round" + ":" + player1 + ":" + player2 + ":" + player3);
    var serialNumber = nebPay.call(ddzcontract, 0, "addround", JSON.stringify([player1, player2, player3, coin]), {
        callback: callbacks
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};

export const startround = async (roundid) => {
    DDZ_DEBUG && console.log("starting round");
    var serialNumber = nebPay.call(ddzcontract, 0, "startround", JSON.stringify([roundid]),{
        callback: callbacks
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};

export const endround = async (roundid, landlordaddr, farmerwin) => {
    DDZ_DEBUG && console.log("ending round");
    var serialNumber = nebPay.call(ddzcontract, 0, "endround", JSON.stringify([roundid, landlordaddr, farmerwin]),{
        callback: callbacks
    });
    //此处无需等待回调，因为玩家如果不想结算回调也触发不了，不如快点开始下一把
    //返回的是玩家剩余的币，详情见app.vue -> gameover
    var hash = await waitingcallback(serialNumber);
    this.getMe()
	.then((me) => {
		return me.coin;
	});
};

export const quickstartround = async (roundid,playerid) => {
    var coin = idtoCoin(roundid);
    DDZ_DEBUG && console.log("starting round");
    var serialNumber = nebPay.call(ddzquickcontract, coin, "startround", JSON.stringify([roundid,playerid]),{
        callback: callbacks
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
};
export const quickendround = async (roundid, landlordaddr, farmerwin) => {
    DDZ_DEBUG && console.log("ending round");
    var serialNumber = nebPay.call(ddzquickcontract, 0, "endround", JSON.stringify([roundid, landlordaddr, farmerwin]),{
        callback: callbacks
        //此处可加listener
    });
    var hash = await waitingcallback(serialNumber);
    return hash;
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
    var state = await neb.api.getAccountState({address:msgsender});
    me.balance = parseInt(state.balance) / 1000000000000000000;
    DDZ_DEBUG && console.log(me.address);
    if (me.address) {
        DDZ_DEBUG && console.log("getting joined..");
        me.joined = await playerisjoined(msgsender);
        DDZ_DEBUG && console.log(me.joined);
        DDZ_DEBUG && console.log("getting coin..");
        if (me.joined == "true") me.coin = await getCoin(msgsender);
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
        callback: callbacks
    });
    return;
};
export const getbalance = async (address) => {
    var state = await neb.api.getAccountState({address:address});
    return parseInt(state.balance) / 1000000000000000000;
};
export const idtoCoin = (_roundid) => {
    if (_roundid < 100) {
        return 0;
    } else if (_roundid < 120) {
        return 0.01;
    } else if (_roundid < 140) {
        return 0.1;
    } else if (_roundid < 160) {
        return 1;
    } else if (_roundid < 180) {
        return 10;
    } else {
        return 100;
    }
}
export const roundstarted = async (roundid) => {
    return seeret(await neb.api.call(msgsender, ddzquickcontract, 0, 0, 1000000, 2000000, {
        "function": "roundstarted",
        "args": JSON.stringify([roundid])
    }));
    // {return await nebPay.simulateCall(ddzcontract, 0, "isjoined", JSON.stringify([address]));
};
const waitingcallback = serialNumber => new Promise((resolve, reject) => {
    DDZ_DEBUG && console.log("waiting...");
    var intervalQuery;
    function funcIntervalQuery() {
        var options = {
            callback: callbacks
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
    intervalQuery = setInterval(funcIntervalQuery, 10000);
});
const seeret = ret => { // replace ""
    return ret.result.replace(/\"/g, "");
}

    // });