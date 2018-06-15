<template>
	<div id="app" class="disable-select" onselectstart="return false">
		<room :rooms="rooms" v-show="roomId==-1"></room>
		<cover :stage="stage" :cards="coverCards"></cover>
		<prev :stage="stage" ref="prev" v-show="roomId!=-1"></prev>
		<next :stage="stage" ref="next" v-show="roomId!=-1"></next>
		<actor :stage="stage" ref="actor" v-show="roomId!=-1"></actor>
		<center :stage="stage" :roomId="roomId" :roomCoin="roomCoin" :waiting="waiting" :roundid="roundid" :canChangeCoin="canChangeCoin" v-show="roomId!=-1"></center>
		<div id="notify-message">
			<div class="alert alert-success" v-show="notifyMessage.length">
				<strong>{{notifyMessage}}</strong>
			</div>
		</div>
		<div class="github text-center"><a href="https://github.com/Deasoso/CryptoLandlords-Client" target="_blank">@Github</a></div>
	</div>
</template>

<script>
	import Room from './Room.vue'
	import Cover from './Cover.vue'
	import Prev from './Prev.vue'
	import Next from './Next.vue'
	import Actor from './Actor.vue'
	import Card from './card.js'
	import Center from './Center.vue'
	import * as web3 from '@/xingyunsrc/xyapi.js'//'@/web3src/web3.js'
	import $ from 'webpack-zepto'

	export default {
		name: 'app',
		data: function () {
			return {
				stage: 0, /* 0:waiting, 1:calling, 2:playing, 3: over */
				waiting: 0, /* 0:ready 1:request 2:pay */
				lastPlayerId: DDZ_UNKNOWN,
				lastPlayerShot: [],
				roomId: DDZ_UNKNOWN,
				roomCoin: 5,
				canChangeCoin: false,
				coverCards: [],
				rooms: [],
				ws: null,
				notifyMessage: "",
				notifyTimer: null,
				roundid: 0,
			}
		},
		components: {
			Room, Cover, Prev, Next, Actor, Center
		},
		methods: {
			setLastPlayerId: function (playerId) {
				DDZ_DEBUG && console.log("[root]set lastPlayerId=" + playerId);
				this.lastPlayerId = playerId;
			},
			setStage: function (stage) {
				DDZ_DEBUG && console.log("[root]set stage=" + stage);
				this.stage = stage;
			},
			getRefById: function (id) {
				id >>= 0;
				return this.$refs.actor.id === id ? "actor"
						: (id === (this.$refs.actor.id + 1) % 3 ? "next" : "prev");
			},
			refreshPlayers: function (players) {
				for (var id in [0,1,2]) {
					if (id in players){
						this.$refs[this.getRefById(id)].join(id, players[id].ready);
						if(players[id].address){
							this.$refs[this.getRefById(id)].setaddr(players[id].address);
						}
						if(players[id].coin){
							this.$refs[this.getRefById(id)].setcoin(players[id].coin);
						}
					}else{
						this.$refs[this.getRefById(id)].leave();
					}
				}
			},
			send: function (data) {
				DDZ_DEBUG && console.log("[APP]sent: " + JSON.stringify(data));
				this.ws.send(JSON.stringify(data));
			},
			setme:function (me) {
				this.$refs["actor"].setaddr(me.address);
				this.$refs["actor"].setcoin(me.coin) >> 0;
				this.send({action: "setaddr",
					data:{
						address: me.address,
						coin:me.coin	
					}});
			},
			notify: function (content, time) {
				clearTimeout(this.notifyTimer);
				this.notifyTimer = setTimeout(function (){
					$("#notify-message").hide();
				}, time || 2000);
				this.notifyMessage = content;
				$("#notify-message").show();
			},
			setcanChangeCoin: function(can){
				this.canChangeCoin = can;
			},
			changecoin: function(newcoin){
				for (var child in this.$refs){
					if(this.$refs[child].hasPrepared){
						this.notify('Can\'t change.', 10000);
						return;
					}
				}
				this.send({action: "changecoin",
					data:{
						newcoin: newcoin
                    }
                });
			},
		},
		created: function () {
			this.$on("message", async function (m) {
				var $refs = this.$refs;
				var actor = $refs["actor"];
				switch (m.action) {
					case "listRoom":
						this.rooms = m.rooms;
						break;
					case "join":
						if (actor.id === DDZ_UNKNOWN) {
							this.roomId = m.roomId;
							this.roomCoin = m.data.roomCoin;
							actor.join(m.playerId);
							this.refreshPlayers(m.data.players);
						} else {
							$refs[this.getRefById(m.playerId)].join(m.playerId);
							this.refreshPlayers(m.data.players);
						}
						for (var child in $refs){
							$refs[child].reset();
						}
						break;
					case "ready":
						this.refreshPlayers(m.data.players);
						break;
					case "leave":
						if (m.playerId === actor.id) {
							this.roomId = DDZ_UNKNOWN;
							this.roundid = 0;
							actor.leave();//.id = DDZ_UNKNOWN; 
						} else {
							$refs[this.getRefById(m.playerId)].leave();
						}
						DDZ_DEBUG && console.log(m.data.players);
						for (var child in $refs)
							$refs[child].reset();
						break;
					case "goout":
						// this.send({action: "leave"});
						break;
					case "start":
						this.setStage(1);
						for (var child in $refs)
							$refs[child].reset();
						break;
					case "play":
						this.setStage(2);
						this.setLastPlayerId(m.speaker);
						this.lastPlayerShot = [];
						this.coverCards = m.data.coverCards;
						break;
					case "gameOver":
						var farmerwin = !m.data.masterWin;
						DDZ_DEBUG && console.log(m.data.roundid+","+farmerwin+","+m.data.masteraddr)
						web3.endround(m.data.roundid,m.data.masteraddr,farmerwin).then((coin) => {
							this.$refs["actor"].setcoin(coin);
							//仅刷新coin，不用等待回调就可以开下一把
						});
						this.roundid = 0;
						this.refreshPlayers(m.data.players);
						this.notify((m.data.masterWin ? "地主胜利 !" : "农民胜利 !"), 5000);
						this.setStage(3);
						actor.hasPrepared = false;
						for (var id in m.data.cards) {
							$refs[this.getRefById(id)].cards = m.data.cards[id];
						}
						break;
					case "createnewround":
						var self = this;
						var round = {};
						DDZ_DEBUG && console.log(round);
						round.player1 = m.player1;
						round.player2 = m.player2;
						round.player3 = m.player3;
						round.coin = m.coin;
						var startround = (result) => {
								 DDZ_DEBUG && console.log(JSON.stringify(result.args) + "," + 
								 (round.player1 == result.player1) + "," + 
								 (round.player2 == result.player2) + "," + 
								 (round.player3 == result.player3) + "," + 
								 (round.coin == result.coins) + "," + 
								 result.player1 + "," + 
								 round.player1 + "," + 
								 round.player2 + "," +
								 round.player3);
								if (round.player1 == result.player1 && 
									round.player2 == result.player2 &&
									round.player3 == result.player3 &&
									round.coin == result.coins){
									this.roundid = parseInt(result.roundid);
									self.send({action: "creatednewround",
									   data:{'roundid':result.roundid}});
									// web3.newroundevent.stopWatching();
								}
						}	
						// web3.newroundevent.watch(waitround);
						web3.requestround(m.player1,m.player2,m.player3,m.coin).then((roundhash) => {
							DDZ_DEBUG && console.log("reqqquresting");
							DDZ_DEBUG && console.log(roundhash);
							var roundhash = roundhash;
							web3.getneb().api.getEventsByHash({hash: roundhash})
							.then((events) => {
								DDZ_DEBUG && console.log(events);
								startround(JSON.parse(events.events[0].data).Newround);
							})
							.catch((e) => {
								DDZ_DEBUG && console.log(e);
							});
						});
						break;
					case "waitingnewround":
						this.waiting = 1;
						for (var child in $refs)
								$refs[child].reset();
						break;
					case "pay":
						this.waiting = 2;
						web3.startround(m.roundid).then(() => {
							this.$refs["actor"].subcoin(this.roomCoin);
							for (var child in $refs)
								$refs[child].reset();
							this.send({action: "payed"});
						})
						break;
					case "changecoin":
						this.roomCoin = m.data.newcoin;
						break;
				}
				for (var child in $refs)
					$refs[child].handle(m);
			});
		},
		mounted: function () {
			var app = this;
			try {
				var ws = new WebSocket(DDZ_WS_ADDRESS);
				window.onbeforeunload = function (e) {
					// app.send({action: "leave"});
    			}
				ws.onopen = function () {
					app.send({action: "listRoom"});
				};
				ws.onmessage = function (event) {
					DDZ_DEBUG && console.log("[APP]received: " + event.data);
					try {
						var data = JSON.parse(event.data);
						app.$emit("message", data);
					} catch (e) {
						app.notify(event.data, 10000);
						DDZ_DEBUG && console.error(e);
					}
				};
				ws.onclose = function (e) {
					DDZ_DEBUG && console.log(e);
					DDZ_DEBUG && console.log("fxxkingclose");
					app.roomId = DDZ_UNKNOWN;
					app.setStage(0);
				};
				ws.onerror = function () {
					app.roomId = DDZ_UNKNOWN;
				};
				app.ws = ws;
			} catch (e) {
			}
		}
	}
</script>

<style>
	.disable-select {
		-moz-user-select: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.m10 {
		margin: 10px 0
	}

	.btn {
		outline:none !important;
	}

	.player {
		z-index: 100000000;
		background-color: rgba(255, 255, 255, .8);
		padding: 10px 0;
	}

	input.shot-cards,
	input.shot-cards:focus,
	input.shot-cards:hover,
	input.shot-cards:active {
		background-color: #d9ffde !important;
	}

	#notify-message {
		position: fixed;
		width: 100%;
		top: 36%;
		z-index: 2000000000;
	}
	#notify-message .alert{
		width: 500px;
		margin: 0 auto;
		padding: 30px;
		opacity: .85;
	}

	.github{
		position: fixed;
		z-index: 2000000000;
		bottom: 8px;
		width: 100%;
	}
</style>
