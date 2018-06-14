pragma solidity ^0.4.2;
// pragma experimental ABIEncoderV2;

library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract DDZ{
  
  using SafeMath for uint256;

  address private owner;
  uint256 private rate = 100000000000000; // 10^14 Wei = 1 gamecoin
  uint256 public allcoins;
  uint256 public roundamout;

  mapping (address => bool) private admins;
  mapping (address => bool) public players;
  mapping (address => uint256) public gamecoins;
  mapping (uint256 => Round) public rounds;

  struct Round{
    uint256 roundid;
    uint256 coin;
    uint256[3] coins;     //use for consensus
    address[3] players;   //3 players
    address[3] landlord;  //use for consensus
    bool[3] isfarmerwin;  //use for consensus
    bool[3] checked;      //use for consensus
    //string[3] process;    //use for check consensus
    bool end;
    bool canceled;
  }

  event Joined(address indexed addr);
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Subcoin(address indexed from, address indexed outto, uint256 outcoins);
  event Transferout(address indexed outto, uint256 outvalue);
  event okTransferout(address indexed outfrom, address indexed outto, uint256 outvalue);
  event Newround(uint256 roundid, address player1, address player2, address player3, uint256 coins);
  event Startround(uint256 roundid);
  event Endround(uint256 roundid, address landlord, bool isfarmerwin);
  event Cancelround(uint256 roundid);
  event Errorround(uint256 roundid);

  function DDZ() public {
    owner = msg.sender;
    players[owner] = true;
    admins[owner] = true;
    gamecoins[owner] = 100;
    allcoins = 100;
  }

  // modifiers 
  modifier onlyOwner() {
    require(owner == msg.sender);
    _;
  }

  modifier onlyAdmins() {
    require(admins[msg.sender]);
    _;
  }

  modifier onlyPlayers() {
    require(players[msg.sender]);
    _;
  }

  modifier onlyRoundPlayer(uint256 _roundid){
    Round storage round = rounds[_roundid];
    require(round.roundid == _roundid);
    require(msg.sender == round.players[0] ||
             msg.sender == round.players[1] ||
             msg.sender == round.players[2]);
    _;
  }

  // owner ===============
  function setOwner (address _owner) onlyOwner() public {
    owner = _owner;
  }
  
  function addAdmin (address _admin) onlyOwner() public {
    admins[_admin] = true;
  }

  function removeAdmin (address _admin) onlyOwner() public {
    delete admins[_admin];
  }

  //admins ===============

  //Use if someone break the rule, to compensation players
  //Do not use in normal scene
  function givegamecoin(address _addr, uint256 _coins) onlyAdmins() public {
    if (!players[_addr]){
      players[_addr] = true;
      gamecoins[_addr] = 0;
    }
    gamecoins[_addr] = gamecoins[_addr].add(_coins);
    allcoins = allcoins.add(_coins);
    Transfer(msg.sender, _addr, _coins);
  }
  function takegamecoin(address _addr, uint256 _coins) onlyAdmins() public {
    require(players[_addr]);
    gamecoins[_addr] = gamecoins[_addr].sub(_coins);
    allcoins = allcoins.sub(_coins);
    Subcoin(msg.sender, _addr, _coins);
  }

  //Use to solve player request
  function givewei(address _addr, uint256 _coins) onlyAdmins() public {
    require(players[_addr]);
    require(_coins >= 100);
    require(allcoins >= _coins);
    _addr.transfer(_coins.mul(rate));
    okTransferout(msg.sender, _addr, _coins);
  }
  
  //Take money, (notice extends coins)
  function withdraw (uint256 _coins) onlyAdmins() public {
    require(this.balance > _coins.mul(rate));
    msg.sender.transfer(_coins.mul(rate));
  }

  //players ===============
  function join() public {
    if (players[msg.sender]) require(false);
    players[msg.sender] = true;
    gamecoins[msg.sender] = 0;
    Joined(msg.sender);
  }

  function buy(uint256 _coins) payable onlyPlayers() public returns(address msgsend, uint256 coins){
    require(_coins >= 1);
    require(msg.value >= _coins.mul(rate));
    //this.transfer(_coins.mul(rate));
    msg.sender.transfer(msg.value.sub(_coins.mul(rate)));
    gamecoins[msg.sender] = gamecoins[msg.sender].add(_coins);
    allcoins = allcoins.add(_coins);
    Transfer(this, msg.sender, _coins);
    return (msg.sender , _coins);
  }
  
  //Only an event, then admin will give player wei
  function sell(uint256 _coins) onlyPlayers() public{
    require(_coins >= 100);
    require(getBalance(msg.sender) >= _coins);
    allcoins = allcoins.sub(_coins);
    gamecoins[msg.sender] = gamecoins[msg.sender].sub(_coins);
    Transferout(msg.sender, calculatePrice(_coins));
  }

  //rounds ================
  //started by player
  //return 0:error
  //warning: when match started, it can't be canceled by players.
  function addround(address _player1, address _player2, address _player3, uint256 _coins) onlyPlayers() public returns(uint256){
    require(players[_player1] && players[_player2] && players[_player3]);
    require(gamecoins[_player1] >= _coins);
    require(gamecoins[_player2] >= _coins);
    require(gamecoins[_player3] >= _coins);
    require(_player1 != _player2 && _player2 != _player3 && _player1 != _player3);
    require(msg.sender == _player1);
    require(_coins >= 1);
    roundamout = roundamout.add(1);
    uint256 k = 0;
    address l = 0;
    Round memory round = Round(
      roundamout,
      _coins,
      [k,k,k],
      [_player1,_player2,_player3],
      [l,l,l],              //landlordaddress, this is default, use to consensus
      [false,false,false],  //farmerwin ,this is default, use to consensus
      [false,false,false],  //use for checking, can be better
      //["","",""],           //process
      false,                //ended
      false);               //canceled
    rounds[roundamout] = round;
    //startround(roundamout);
    Newround(roundamout,_player1,_player2,_player3,_coins);
    return roundamout;
  }

  //started by 3 players
  function startround(uint256 _roundid) onlyPlayers() onlyRoundPlayer(_roundid) public returns(string){
    Round storage round = rounds[_roundid];
    uint256 index = 0;
    if (msg.sender == round.players[0]){
      index = 0;
    }else if(msg.sender == round.players[1]){
      index = 1;
    }else if(msg.sender == round.players[2]){
      index = 2;
    }else{
      return;
    }
    if(round.coins[index] >= round.coin) return;
    require(gamecoins[msg.sender] >= round.coin);
    gamecoins[msg.sender] = gamecoins[msg.sender].sub(round.coin);
    round.coins[index] = round.coins[index].add(round.coin);
    if(round.coins[0] >= round.coin && round.coins[1] >= round.coin && round.coins[2] >= round.coin){
      Startround(_roundid);
    }
  }

  //end by 3 players
  function endround(uint256 _roundid, address _landlord, bool _isfarmerwin) onlyPlayers() onlyRoundPlayer(_roundid) public{
    Round storage round = rounds[_roundid];
    bool isend = !round.end;
    require(isend);
    uint256 index = 0;
    if (msg.sender == round.players[0]){
      index = 0;
    }else if(msg.sender == round.players[1]){
      index = 1;
    }else if(msg.sender == round.players[2]){
      index = 2;
    }else{
      require(false);
    }
    require(_landlord == round.players[0] || _landlord == round.players[1] || _landlord == round.players[2]);
    require(round.coins[0] >= round.coin && round.coins[1] >= round.coin && round.coins[2] >= round.coin);
    round.landlord[index] = _landlord;
    round.isfarmerwin[index] = _isfarmerwin;
    //if (round.coin >= 100) round.process[index] = _process;
    round.checked[index] = true;
    if (round.checked[0] && round.checked[1] && round.checked[2]){
      if(round.landlord[0] == round.landlord[1] && round.landlord[1] == round.landlord[2]){
        if(round.isfarmerwin[0] == round.isfarmerwin[1] && round.isfarmerwin[1] == round.isfarmerwin[2]){
          _endround(_roundid, _landlord, _isfarmerwin);
          Endround(_roundid, _landlord, _isfarmerwin);
        }else{
          Errorround(_roundid);
        }
      }
    }
  }

  //if disputed, end by admin;
  function adminendround(uint256 _roundid, address _landlord, bool _isfarmerwin) onlyAdmins() public{
    _endround(_roundid, _landlord, _isfarmerwin);
    Endround(_roundid, _landlord, _isfarmerwin);
  }

  function admincancelround(uint256 _roundid) onlyAdmins() public{
    _cancelround(_roundid);
    Cancelround(_roundid);
  }

  //calculate coins
  function _endround(uint256 _roundid, address _landlord, bool _isfarmerwin) private{
    Round storage round = rounds[_roundid];
    require(round.coins[0] >= round.coin && round.coins[1] >= round.coin && round.coins[2] >= round.coin);
    uint256 landlordindex = 0;
    uint256 farmer1index = 0;
    uint256 farmer2index = 0;
    if (_landlord == round.players[0]){
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
      require(false);
    }
    if(_isfarmerwin){
      //landlord lose
      round.coins[landlordindex] = 
      round.coins[landlordindex].sub(round.coin.div(2));
      gamecoins[round.players[farmer1index]] = 
      gamecoins[round.players[farmer1index]].add(round.coin.div(2));
      round.coins[landlordindex] = 
      round.coins[landlordindex].sub(round.coin.div(2));
      gamecoins[round.players[farmer2index]] = 
      gamecoins[round.players[farmer2index]].add(round.coin.div(2));
      //farmer get ori
      round.coins[farmer1index] = 
      round.coins[farmer1index].sub(round.coin);
      gamecoins[round.players[farmer1index]] = 
      gamecoins[round.players[farmer1index]].add(round.coin);
      round.coins[farmer2index] = 
      round.coins[farmer2index].sub(round.coin);
      gamecoins[round.players[farmer2index]] = 
      gamecoins[round.players[farmer2index]].add(round.coin);
    }else{
      //farmer lose
      round.coins[farmer1index] = 
      round.coins[farmer1index].sub(round.coin.div(2));
      gamecoins[round.players[landlordindex]] = 
      gamecoins[round.players[landlordindex]].add(round.coin.div(2));
      round.coins[farmer2index] = 
      round.coins[farmer2index].sub(round.coin.div(2));
      gamecoins[round.players[landlordindex]] = 
      gamecoins[round.players[landlordindex]].add(round.coin.div(2));
      //farmer get 1/2 ori ,landlord get ori
      round.coins[farmer1index] = 
      round.coins[farmer1index].sub(round.coin.div(2));
      gamecoins[round.players[farmer1index]] = 
      gamecoins[round.players[farmer1index]].add(round.coin.div(2));
      round.coins[farmer2index] = 
      round.coins[farmer2index].sub(round.coin.div(2));
      gamecoins[round.players[farmer2index]] = 
      gamecoins[round.players[farmer2index]].add(round.coin.div(2));
      round.coins[landlordindex] = 
      round.coins[landlordindex].sub(round.coin);
      gamecoins[round.players[landlordindex]] = 
      gamecoins[round.players[landlordindex]].add(round.coin);
    }
    round.end = true;
  }

  function _cancelround(uint256 _roundid) private{
    Round storage round = rounds[_roundid];
    //all get ori
    round.coins[0] = 
    round.coins[0].sub(round.coins[0]);
    gamecoins[round.players[0]] = 
    gamecoins[round.players[0]].add(round.coins[0]);
    round.coins[1] = 
    round.coins[1].sub(round.coins[1]);
    gamecoins[round.players[1]] =
    gamecoins[round.players[1]].add(round.coins[1]);
    round.coins[2] = 
    round.coins[2].sub(round.coins[2]);
    gamecoins[round.players[2]] = 
    gamecoins[round.players[2]].add(round.coins[2]);
    round.canceled = true;
  }
  //extends ===============
  //use for client
  function roundispayed(uint256 _roundid)  onlyPlayers() onlyRoundPlayer(_roundid) public view returns(bool){
    Round storage round = rounds[_roundid];
    if(round.roundid == 0) return false;
    return (round.coins[0] >= round.coin && round.coins[1] >= round.coin && round.coins[2] >= round.coin);
  }

  function ispayed(uint256 _roundid) onlyPlayers() onlyRoundPlayer(_roundid) public view returns(bool){
    Round storage round = rounds[_roundid];
    uint256 index = 0;
    if (msg.sender == round.players[0]){
      index = 0;
    }else if(msg.sender == round.players[1]){
      index = 1;
    }else if(msg.sender == round.players[2]){
      index = 2;
    }else{
      require(false);
    }
    return (round.coins[index] >= round.coin);
  }

  function getBalance(address _addr) public view returns(uint){
	  return gamecoins[_addr];
  }
  
  function getthisbalance() public view returns(uint256){
    return this.balance;
  }

  function getround(uint256 _roundid) public view returns(
    uint256 roundid,
    uint256 coin,
    uint256 coins1,     //use for consensus
    uint256 coins2,     //use for consensus
    uint256 coins3,     //use for consensus
    address players1,   //3 players
    address players2,   //3 players
    address players3,   //3 players
    bool end,
    bool canceled){

    Round storage round = rounds[_roundid];
    uint256[3] storage k1 = round.coins;
    address[3] storage k2 = round.players;
    return (round.roundid, 
    round.coin,
    k1[0],     //use for consensus
    k1[1],     //use for consensus
    k1[2],     //use for consensus
    k2[0],   //3 players
    k2[1],   //3 players
    k2[2],   //3 players
    round.end,
    round.canceled);
  }
  

  function calculatePrice (uint256 _price) public pure returns (uint256) {
    if (_price < 100) {
      return _price.div(100).mul(90);
    } else if (_price < 200) {
      return _price.div(100).mul(93);
    } else if (_price < 1000) {
      return _price.div(100).mul(95);
    } else if (_price < 10000) {
      return _price.div(100).mul(97);
    } else {
      return _price.div(100).mul(99);
    }
  }

  function getrate() public view returns(uint256){
    return rate;
  }

  function isjoined(address _addr) public view returns(bool){
    return players[_addr];
  }

  function () payable public{
    
  }
}