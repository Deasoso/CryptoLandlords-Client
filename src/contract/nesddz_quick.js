"use strict";

var Round = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.roundid = new BigNumber(o.roundid);
        this.coin = new BigNumber(o.coin);
        this.coins = [0,0,0];
        this.players = ["1","2","3"];
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
        this.started = o.started;
    } else {
        this.roundid = new BigNumber(0);
        this.coin = new BigNumber(0);
        this.coins = [new BigNumber(0),new BigNumber(0),new BigNumber(0)];
        this.players = ["1","2","3"];
        this.landlord = ["","",""];
        this.isfarmerwin = [false,false,false];
        this.checked = [false,false,false];
        this.started = false;
    }
}
Round.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var DDZ_quick = function() {
    this.owner = "";
    this.allcoins = new BigNumber(0);
    this.roundamount = new BigNumber(0);
    this.rate = new BigNumber(10000000000000000);
    LocalContractStorage.defineMapProperty(this, "admins", {});
    LocalContractStorage.defineMapProperty(this, "rounds", {});
}

DDZ_quick.prototype = {
    init: function() {
        this.owner = Blockchain.transaction.from;
        this.admins.put(this.owner, true);
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
    withdraw: function(_neb){
        this.m_onlyAdmins();
        var _neb = new BigNumber(_neb);
        Blockchain.transfer(Blockchain.transaction.from, _neb);
    },
    //round player
    startround: function(_roundid, _index){
        var value = new BigNumber(Blockchain.transaction.value);
        var from = Blockchain.transaction.from;
        var _roundid = new BigNumber(_roundid);
        var _coins = this.idtoCoin(_roundid);
        var round = this.rounds.get(_roundid);
        if(value.lt(_coins)) throw new Error("Not Enough Coins");
        if(!round){
            round = new Round();
            round.roundid = _roundid;
            round.coin = _coins;
            round.players[_index] = from;
        }
        if(!(round.players[0] != round.players[1] && round.players[1] != round.players[2] && round.players[0] != round.players[2])) throw new Error("Same Player");
        round.coins[_index] = new BigNumber(round.coins[_index]).plus(round.coin);
        Blockchain.transfer(from,value.sub(round.coin));
        this.rounds.put(_roundid,round);
        if (new BigNumber(round.coins[0]).gte(round.coin) && 
            new BigNumber(round.coins[1]).gte(round.coin) && 
            new BigNumber(round.coins[2]).gte(round.coin)){
            this._event("Startround",{from: "DDZ", roundid: _roundid});
        }
    },
    endround: function(_roundid, _landlord, _isfarmerwin){
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
            Blockchain.transfer(round.players[farmer1index],calculatePrice(new BigNumber(round.coin).div(2)));
            Blockchain.transfer(round.players[farmer2index],calculatePrice(new BigNumber(round.coin).div(2)));
            //farmer get ori
            Blockchain.transfer(round.players[farmer1index],calculatePrice(new BigNumber(round.coin).div(2)));
            Blockchain.transfer(round.players[farmer2index],calculatePrice(new BigNumber(round.coin).div(2)));
        }else{
            //farmer lose
            Blockchain.transfer(round.players[landlordindex],calculatePrice(new BigNumber(round.coin).div(2)));
            Blockchain.transfer(round.players[landlordindex],calculatePrice(new BigNumber(round.coin).div(2)));
            //farmer get 1/2 ori ,landlord get ori
            Blockchain.transfer(round.players[farmer1index],calculatePrice(new BigNumber(round.coin).div(2)));
            Blockchain.transfer(round.players[farmer2index],calculatePrice(new BigNumber(round.coin).div(2)));
            Blockchain.transfer(round.players[landlordindex],calculatePrice(new BigNumber(round.coin)));
        }
        newround = new Round();
        newround.roundid = _roundid;
        newround.coin = this.idtoCoin(this._roundid);
        this.rounds.put(_roundid,newround);
    },
    _cancelround: function(_roundid){
        var round = this.rounds.get(_roundid);
        if (!(  new BigNumber(round.coins[0]).gte(round.coin) &&
                new BigNumber(round.coins[1]).gte(round.coin) &&
                new BigNumber(round.coins[2]).gte(round.coin))) throw new Error("Error Coins" + round.coins[0] + round.coins[0] + round.coins[1]);
        for(var i=0;i<3;i++){
            Blockchain.transfer(round.players[i],new BigNumber(round.coin))
        }
        newround = new Round();
        newround.roundid = _roundid;
        newround.coin = this.idtoCoin(this._roundid);
        this.rounds.put(_roundid,newround);
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
    // getthisbalance: function(_addr){ //use balanceOf
    //     return balance;
    // },
    getround: function(_roundid){
        return this.rounds.get(_roundid);
    },
    calculatePrice: function(_price){
        return _price.div(100).times(99);
    },
    idtoCoin: function(_roundid){
        if (_roundid.lt(100)) {
            throw new Error("No Round.");
          } else if (_roundid.lt(120)) {
            return new BigNumber(this.rate).times(1);
          } else if (_roundid.lt(140)) {
            return new BigNumber(this.rate).times(10);
          } else if (_roundid.lt(160)) {
            return new BigNumber(this.rate).times(100);
          } else if (_roundid.lt(180)) {
            return new BigNumber(this.rate).times(1000);
          } else {
            return new BigNumber(this.rate).times(10000);
          }
    },
    isadmin: function(_addr){
        return this.admins.get(_addr);
    },
}

module.exports = DDZ_quick;