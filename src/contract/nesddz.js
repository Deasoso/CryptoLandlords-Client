"use strict";

var Round = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.roundid = new BigNumber(o.roundid);
        this.coin = new BigNumber(o.coin);
        this.coins = [0,0,0];
        this.players = ["","",""];
        this.landlord = ["","",""];
        this.isfarmerwin = [false,false,false];
        this.checked = [false,false,false];
        for(var i=0;i<3;i++){
            this.coins[i] = new BigNumber(o.coins[i]);
            this.players[i] = o.players[i];
            this.landlord[i] = o.landlord[i];
            this.isfarmerwin[i] = o.isfarmerwin[i];
            this.checked[i] = o.checed[i];
        }
        this.end = o.end;
        this.canceled = o.canceled;
    } else {
        this.roundid = new BigNumber(0);
        this.coin = new BigNumber(0);
        this.coins = [0,0,0];
        this.players = ["","",""];
        this.landlord = ["","",""];
        this.isfarmerwin = [false,false,false];
        this.checked = [false,false,false];
        for(var i=0;i<3;i++){
            this.coins[i] = new BigNumber(0);
            this.players[i] = "";
            this.landlord[i] = "";
            this.isfarmerwin[i] = false;
            this.checked[i] = false;
        }
        this.end = false;
        this.canceled = false;
    }
}
Round.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var DDZ = function() {

    this.owner = "";
    this.rate = new BigNumber(10000000000000000); //10^16, 1 nas = 100 coins
    this.allcoins = new BigNumber(0);
    this.roundamount = new BigNumber(0);

    LocalContractStorage.defineMapProperty(this, "admins", {});
    LocalContractStorage.defineMapProperty(this, "players", {});
    LocalContractStorage.defineMapProperty(this, "gamecoins", {});
    LocalContractStorage.defineMapProperty(this, "rounds", {});
}

DDZ.prototype = {
    init: function() {
        this.owner = Blockchain.transaction.from;
        this.players.put(this.owner, true);
        this.admins.put(this.owner, true);
        this.gamecoins.put(this.owner, new BigNumber(100));
        this.allcoins = new BigNumber(100);
    },
    // events
    _event: function(name,indexes){
        var k = {};
        k[name] = indexes;
        Event.Trigger("DDZ", k);
    },
    // modifiers 
    m_onlyOwner: function() {
        var from = Blockchain.transaction.from;
        if (this.owner != from) throw new Error("No Owner.");
    },
    m_onlyAdmins: function() {
        var from = Blockchain.transaction.from;
        var admin = this.admins.get(from);
        if (!admin) throw new Error("No Admin.");
    },
    m_onlyPlayers: function() {
        var from = Blockchain.transaction.from;
        var player = this.players.get(from);
        if (!player) throw new Error("No Player.");
    },
    m_onlyRoundPlayer: function(_roundid) {
        var from = Blockchain.transaction.from;
        var round = this.rounds.get(_roundid);
        if(round.roundid != _roundid) throw new Error("No Round.");
        if( from != round.players[0] &&
            from != round.players[1] &&
            from != round.players[2]) {
            throw new Error("Player Not in Round.");
        }
    },
    //owner
    setOwner: function(_owner){
        this.m_onlyOwner();
        this.owner = _owner;
    },
    addAdmin: function(_admin){
        this.m_onlyOwner();
        this.admins.put(_admin, true);
    },
    removeAdmin: function(_admin){
        this.m_onlyOwner();
        this.admins.del(_admin);
    },
    //admins
    givegamecoin: function(_addr,_coins){
        this.m_onlyAdmins();
        var _coins = new BigNumber(_coins);
        var player = this.players.get(_addr);
        if (!player) {
            this.players.put(_addr, true);
            this.gamecoins.put(_addr, new BigNumber(0));
        }
        this.gamecoins.put(_addr, new BigNumber(this.gamecoins.get(_addr)).plus(_coins));
        this.allcoins = this.allcoins.plus(_coins);
        this._event("Transfer",{from: Blockchain.transaction.from,
                to: _addr, value: _coins});
    },
    takegamecoin: function(_addr,_coins){
        this.m_onlyAdmins();
        var _coins = new BigNumber(_coins);
        var player = this.players.get(_addr);
        if (!player) throw new Error("No Such Player.");
        this.gamecoins.put(_addr, new BigNumber(this.gamecoins.get(_addr)).sub(_coins));
        this.allcoins = this.allcoins.sub(_coins);
        this._event("Subcoin",{from: Blockchain.transaction.from,
            to: _addr, value: _coins});
    },
    givewei: function(_addr,_coins){
        this.m_onlyAdmins();
        var _coins = new BigNumber(_coins);
        var player = this.players.get(_addr);
        var rate = this.rate;
        if (!player) throw new Error("No Such Player.");
        if(_coins.lt(100)) throw new Error("Value Too Low");
        if(this.allcoins.lt(_coins)) throw new Error("Not Enough Coins");
        Blockchain.transfer(_addr, _coins.times(rate));
        this._event("okTransferout",{from: Blockchain.transaction.from,
            to: _addr, value: _coins});
    },
    withdraw: function(_coins){
        this.m_onlyAdmins();
        var rate = this.rate;
        var _coins = new BigNumber(_coins);
        Blockchain.transfer(Blockchain.transaction.from, _coins.times(rate));
    },
    //players
    join: function(){
        var _addr = Blockchain.transaction.from;
        var player = this.players.get(_addr);
        if (player) throw new Error("Joined Player.");
        this.players.put(_addr, true);
        this.gamecoins.put(_addr, new BigNumber(100));
        this._event("Joined",{addr: Blockchain.transaction.from});
    },
    buy: function(_coins){
        this.m_onlyPlayers();
        var _coins = new BigNumber(_coins);
        var from = Blockchain.transaction.from;
        var value = new BigNumber(Blockchain.transaction.value);
        var rate = this.rate;
        if(_coins.lt(new BigNumber(1))) throw new Error("Value Too Low");
        if(value.lt(_coins.times(rate))) throw new Error("Not Enough Value");
        Blockchain.transfer(from,value.sub(_coins.times(rate)));
        this.gamecoins.put(from, new BigNumber(this.gamecoins.get(from)).plus(_coins));//afterplus);
        this.allcoins = this.allcoins.plus(_coins);
        this._event("Transfer",{from: "DDZ",
            to: from, value: _coins});
    },
    sell: function(_coins){
        this.m_onlyPlayers();
        var _coins = new BigNumber(_coins);
        var from = Blockchain.transaction.from;
        if(_coins.lt(100)) throw new Error("Value Too Low");
        if(new BigNumber(this.gamecoins.get(from)).lt(_coins)) throw new Error("Not Enough Coins");
        this.gamecoins.put(from, new BigNumber(this.gamecoins.get(from)).sub(_coins));
        this._event("Transferout",{outto: from, value: this.calculatePrice(_coins)});
    },
    //round player
    addround: function(_player1,_player2,_player3,_coins){
        this.m_onlyPlayers();
        var _coins = new BigNumber(_coins);
        var from = Blockchain.transaction.from;
        var _players = [_player1,_player2,_player3];
        for(var i=0;i<3;i++){
            if (!this.players.get(_players[i])) throw new Error("No Such Player" + i + ".");
            if (new BigNumber(this.gamecoins.get(_players[i])).lt(_coins)) throw new Error("Player" + i + " Not Enough Coins");
        }
        if(!(_player1 != _player2 && _player2 != _player3 && _player1 != _player3)) throw new Error("Same Player");
        if(from != _player1) throw new Error("Just Player1 Can Request");
        if(_coins.lt(1)) throw new Error("Value Too Low");
        this.roundamount = this.roundamount.plus(1);
        var round = new Round();
        round.roundid = this.roundamount;
        round.coin = _coins;
        round.players = _players;
        this.rounds.put(this.roundamount,round);
        this._event("Newround",{from: "DDZ",
            roundid: this.roundamount, player1: _player1, player2:_player2, player3:_player3, coins:_coins});
    },
    startround: function(_roundid){
        this.m_onlyPlayers();
        this.m_onlyRoundPlayer(_roundid);
        var round = this.rounds.get(_roundid);
        var index = new BigNumber(0);
        var from = Blockchain.transaction.from;
        if (from == round.players[0]){
            index = 0;
        }else if(from == round.players[1]){
            index = 1;
        }else if(from == round.players[2]){
            index = 2;
        }else{
            throw new Error("Unknown Error");
        }
        if(new BigNumber(round.coins[index]).gte(round.coin)) throw new Error("Payed");
        if(new BigNumber(this.gamecoins.get(from)).lt(round.coin)) throw new Error("Not Enough Coins");
        this.gamecoins.put(from, new BigNumber(this.gamecoins.get(from)).sub(round.coin));
        // round.coins[0] = new BigNumber(round.coins[index]).plus(round.coin);
        // round.coins[1] = new BigNumber(round.coins[index]).plus(round.coin);
        // round.coins[2] = new BigNumber(round.coins[index]).plus(round.coin);
        round.coins[index] = new BigNumber(round.coins[index]).plus(round.coin);
        this.rounds.put(_roundid,round);
        if (new BigNumber(round.coins[0]).gte(round.coin) && 
            new BigNumber(round.coins[1]).gte(round.coin) && 
            new BigNumber(round.coins[2]).gte(round.coin)){
            this._event("Startround",{from: "DDZ", roundid: _roundid});
        }
    },
    endround: function(_roundid, _landlord, _isfarmerwin){
        this.m_onlyPlayers();
        this.m_onlyRoundPlayer(_roundid);
        var round = this.rounds.get(_roundid);
        var index = new BigNumber(0);
        var from = Blockchain.transaction.from;
        if (from == round.players[0]){
            index = 0;
        }else if(from == round.players[1]){
            index = 1;
        }else if(from == round.players[2]){
            index = 2;
        }else{
            throw new Error("Unknown Error");
        }
        if (!(_landlord == round.players[0] || _landlord == round.players[1] || _landlord == round.players[2])) throw new Error("No such Landlord");
        if (!(  new BigNumber(round.coins[0]).gte(round.coin) && 
                new BigNumber(round.coins[1]).gte(round.coin) && 
                new BigNumber(round.coins[2]).gte(round.coin))) throw new Error("Error Coins" + round.coins[0] + round.coins[0] + round.coins[1]);
        round.landlord[index] = _landlord;
        round.isfarmerwin[index] = _isfarmerwin;
        round.checked[index] = true;
        // round.landlord[0] = _landlord;
        // round.isfarmerwin[0] = _isfarmerwin;
        // round.checked[0] = true;
        // round.landlord[1] = _landlord;
        // round.isfarmerwin[1] = _isfarmerwin;
        // round.checked[1] = true;
        // round.landlord[2] = _landlord;
        // round.isfarmerwin[2] = _isfarmerwin;
        // round.checked[2] = true;
        if (round.checked[0] && round.checked[1] && round.checked[2]){
            if(round.landlord[0] == round.landlord[1] && round.landlord[1] == round.landlord[2]){
                if(round.isfarmerwin[0] == round.isfarmerwin[1] && round.isfarmerwin[1] == round.isfarmerwin[2]){
                    this._endround(_roundid, _landlord, _isfarmerwin);
                    this._event("Endround",{from: "DDZ", 
                        roundid: _roundid, landlord: _landlord, isfarmerwin: _isfarmerwin});
                }else{
                    this._event("Errorround",{from: "DDZ", roundid: _roundid});
                }
            }else{
                this._event("Errorround",{from: "DDZ", roundid: _roundid});
            }
        }
    },
    //round admin
    adminendround: function(_roundid, _landlord, _isfarmerwin){
        this.m_onlyAdmins();
        this._endround(_roundid, _landlord, _isfarmerwin);
        this._event("Endround",{from: "DDZ", 
            roundid: _roundid, landlord: _landlord, isfarmerwin: _isfarmerwin});
    },
    admincancelround: function(_roundid){
        this.m_onlyAdmins();
        this._cancelround(_roundid);
        this._event("Cancelround",{from: "DDZ", roundid: _roundid});
    },
    //calculate coins
    _endround: function(_roundid, _landlord, _isfarmerwin){
        var round = this.rounds.get(_roundid);
        if (!(  new BigNumber(round.coins[0]).gte(round.coin) && 
                new BigNumber(round.coins[1]).gte(round.coin) && 
                new BigNumber(round.coins[2]).gte(round.coin))) throw new Error("Error Coins" + round.coins[0] + round.coins[0] + round.coins[1]);
        var landlordindex = 0;
        var farmer1index = 0;
        var farmer2index = 0;
        if(_landlord == round.players[0]){
            landlordindex = 0;
            farmer1index = 1;
            farmer2index = 2;
        }else if(_landlord == round.players[1]){
            landlordindex = 1;
            farmer1index = 0;
            farmer2index = 2;
        }else if(_landlord == round.players[2]){
            landlordindex = 2;
            farmer1index = 0;
            farmer2index = 1;
        }else{
            throw new Error("Unknown Error");
        }
        if(_isfarmerwin){
            //landlord lose
            round.coins[landlordindex] = 
            new BigNumber(round.coins[landlordindex]).sub(parseInt(new BigNumber(round.coin).div(2)));
            this.gamecoins.put(round.players[farmer1index],
                new BigNumber(this.gamecoins.get(round.players[farmer1index])).plus(parseInt(new BigNumber(round.coin).div(2))));
            round.coins[landlordindex] = 
            new BigNumber(round.coins[landlordindex]).sub(parseInt(new BigNumber(round.coin).div(2)));
            this.gamecoins.put(round.players[farmer2index],
                new BigNumber(this.gamecoins.get(round.players[farmer2index])).plus(parseInt(new BigNumber(round.coin).div(2))));
            //farmer get ori
            round.coins[farmer1index] = 
            new BigNumber(round.coins[farmer1index]).sub(round.coin);
            this.gamecoins.put(round.players[farmer1index],
                new BigNumber(this.gamecoins.get(round.players[farmer1index])).plus(parseInt(new BigNumber(round.coin).div(2))));
            round.coins[farmer2index] = 
            new BigNumber(round.coins[farmer2index]).sub(round.coin);
            this.gamecoins.put(round.players[farmer2index],
                new BigNumber(this.gamecoins.get(round.players[farmer2index])).plus(parseInt(new BigNumber(round.coin).div(2))));
        }else{
            //farmer lose
            round.coins[farmer1index] = 
            new BigNumber(round.coins[farmer1index]).sub(parseInt(new BigNumber(round.coin).div(2)));
            this.gamecoins.put(round.players[landlordindex],
                new BigNumber(this.gamecoins.get(round.players[landlordindex])).plus(parseInt(new BigNumber(round.coin).div(2))));
            round.coins[farmer2index] = 
            new BigNumber(round.coins[farmer2index]).sub(parseInt(new BigNumber(round.coin).div(2)));
            this.gamecoins.put(round.players[landlordindex],
                new BigNumber(this.gamecoins.get(round.players[landlordindex])).plus(parseInt(new BigNumber(round.coin).div(2))));
            //farmer get 1/2 ori ,landlord get ori
            round.coins[farmer1index] = 
            new BigNumber(round.coins[farmer1index]).sub(parseInt(new BigNumber(round.coin).div(2)));
            this.gamecoins.put(round.players[farmer1index],
                new BigNumber(this.gamecoins.get(round.players[farmer1index])).plus(parseInt(new BigNumber(round.coin).div(2))));
            round.coins[farmer2index] = 
            new BigNumber(round.coins[farmer2index]).sub(parseInt(new BigNumber(round.coin).div(2)));
            this.gamecoins.put(round.players[farmer2index],
                new BigNumber(this.gamecoins.get(round.players[farmer2index])).plus(parseInt(new BigNumber(round.coin).div(2))));
            round.coins[landlordindex] = 
            new BigNumber(round.coins[landlordindex]).sub(round.coin);
            this.gamecoins.put(round.players[landlordindex],
                new BigNumber(this.gamecoins.get(round.players[landlordindex])).plus(round.coin));
        }
        round.end = true;
        this.rounds.put(_roundid,round);
    },
    _cancelround: function(_roundid){
        var round = this.rounds.get(_roundid);
        if (!(  new BigNumber(round.coins[0]).gte(round.coin) &&
                new BigNumber(round.coins[1]).gte(round.coin) &&
                new BigNumber(round.coins[2]).gte(round.coin))) throw new Error("Error Coins" + round.coins[0] + round.coins[0] + round.coins[1]);
        for(var i=0;i<3;i++){
            round.coins[i] = 
            new BigNumber(round.coins[i]).sub(round.coins[i]);
            this.gamecoins.put(round.players[i],
                new BigNumber(new BigNumber(this.gamecoins.get(round.players[i]))).plus(round.coins[i]));
        }
        round.canceled = true;
    },
    //extends
    roundispayed: function(_roundid){
        var round = this.rounds.get(_roundid);
        if(round.roundid == 0) return false;
        return (new BigNumber(round.coins[0]).gte(round.coin) && 
                new BigNumber(round.coins[1]).gte(round.coin) && 
                new BigNumber(round.coins[2]).gte(round.coin));
    },
    ispayed: function(_roundid, _addr){
        var round = this.rounds.get(_roundid);
        if (_addr == round.players[0]){
            index = 0;
        }else if(_addr == round.players[1]){
            index = 1;
        }else if(_addr == round.players[2]){
            index = 2;
        }else{
            throw new Error("Unknown Error");
        }
        return (new BigNumber(round.coins[index]).gte(round.coin));
    },
    getBalance: function(_addr){
        return this.gamecoins.get(_addr);
    },
    // getthisbalance: function(_addr){ //use balanceOf
    //     return balance;
    // },
    getround: function(_roundid){
        return this.rounds.get(_roundid);
    },
    calculatePrice: function(_price){
        if (_price < 100) {
            return _price.div(100).times(90);
          } else if (_price < 200) {
            return _price.div(100).times(93);
          } else if (_price < 1000) {
            return _price.div(100).times(95);
          } else if (_price < 10000) {
            return _price.div(100).times(97);
          } else {
            return _price.div(100).times(99);
          }
    },
    getrate: function(){
        return this.rate;
    },
    isjoined: function(_addr){
        return this.players.get(_addr);
    },
    isadmin: function(_addr){
        return this.admins.get(_addr);
    },
}

module.exports = DDZ;