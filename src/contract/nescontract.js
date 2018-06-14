"use strict";

var Item = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.num = new BigNumber(o.num);
    } else {
        this.num = new BigNumber(0);
    }
}
Item.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var Player = function(text) {
    LocalContractStorage.defineMapProperty(this, "itemMap", {
        parse: function(text) {
            return new Item(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
    if (text) {
        var o = JSON.parse(text);
        this.coin = new BigNumber(o.coin);
        this.pay = new BigNumber(o.pay);
    } else {
        this.coin = new BigNumber(0);
        this.pay = new BigNumber(0);
    }
};
Player.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};


var UnderWorldGame = function() {
    LocalContractStorage.defineMapProperty(this, "playerMap", {
        parse: function(text) {
            return new Player(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
    LocalContractStorage.defineMapProperty(this, "priceMap", {});
    this.official = "n1RiF915paC6A5WqxSU7DRu7WJsSEuGaiYb";
    this.balanceKey = "balance";
    var balance = this.playerMap.get(this.balanceKey);
    if (!balance) {
        balance = new Player();
        this.playerMap.put(this.balanceKey, balance);
    }
};
UnderWorldGame.prototype = {
    init: function() {

    },
    destroy: function(who, value) {
        var from = Blockchain.transaction.from;
        if (this.official != from) {
            throw new Error("No authority.");
        }
        // 提现额转为bignumber
        var amount = new BigNumber(value);
        // 查询是否有映射的钱包
        var player = this.playerMap.get(who);
        if (!player) {
            throw new Error("No player.");
        }
        // 值超过提现的值return
        if (amount.gt(player.coin)) {
            throw new Error("Insufficient coin.");
        }
        player.coin = player.coin.sub(amount);
        this.playerMap.set(who, player);
    },
    modifyPrice: function(wei, amount) {
        var from = Blockchain.transaction.from;
        if (this.official != from) {
            throw new Error("No authority.");
        }
        var price = new BigNumber(amount);
        this.priceMap.set(wei, price);
    },
    breed: function() {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;
        var price = this.priceMap.get(value);
        if (!price) {
            throw new Error("No price.");
        }
        var payValue = new BigNumber(value);
        var payBalance = new BigNumber(value);
        var player = this.playerMap.get(from);
        if (player) {
            price = new BigNumber(new BigNumber(price).plus(player.coin));
            payValue = new BigNumber(payValue.plus(player.pay));
        }
        var newPlayer = new Player(player);
        newPlayer.coin = price;
        newPlayer.pay = payValue;



        this.playerMap.put(from, newPlayer);
        var balance = this.playerMap.get(this.balanceKey);
        balance.pay = balance.pay.plus(payBalance);
        this.playerMap.put(this.balanceKey, balance);

        // this.balance = this.balance.plus(payBalance);
    },
    withdrawBalance: function() {
        var from = Blockchain.transaction.from;
        if (this.official != from) {
            throw new Error("No authority.");
        }
        var balance = this.playerMap.get(this.balanceKey);
        var result = Blockchain.transfer(from, balance.pay);
        if (!result) {
            throw new Error("transfer failed.");
        }
        balance.pay = new BigNumber(0);
        this.playerMap.put(this.balanceKey, balance);
    },
    balanceOf: function(who) {
        var player = this.playerMap.get(who);
        if (!player) {
            throw new Error("no player.");
        }
        return player.coin;
    },
    totalPay: function(who) {
        var player = this.playerMap.get(who);
        if (!player) {
            throw new Error("no player.");
        }
        return player.pay;
    },
    getOfficial: function() {
        return this.official;
    },
    getBalance() {
        var balance = this.playerMap.get(this.balanceKey);
        return balance.pay;
    },
    getPrice(wei) {
        var price = this.priceMap.get(wei);
        return price;
    },
    getPlayerItem(who, itemID) {
        var player = this.playerMap.get(who);
        if (!player) {
            throw new Error("no player.");
        }
        var item = player.itemMap.get(itemID);
        if (item) {
            return item.num;
        } else {
            return 0;
        }
    },
    changePlayerItem(who, itemID, num) {
        var from = Blockchain.transaction.from;
        if (this.official != from) {
            throw new Error("No authority.");
        }
        var player = this.playerMap.get(who);
        if (!player) {
            throw new Error("no player.");
        }
        var newItem = new Item();
        newItem.num = new BigNumber(num);
        player.itemMap.put(itemID, newItem);
    }
};
module.exports = UnderWorldGame;