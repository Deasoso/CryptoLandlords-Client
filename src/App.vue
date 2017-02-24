<template>
	<div id="app" class="disable-select" onselectstart="return false">
		<room :rooms="rooms" v-show="roomId==-1"></room>
		<cover :stage="stage" :cards="coverCards"></cover>
		<prev :stage="stage" ref="prev" v-show="roomId!=-1"></prev>
		<next :stage="stage" ref="next" v-show="roomId!=-1"></next>
		<actor :stage="stage" ref="actor" v-show="roomId!=-1"></actor>
		<div id="notify-message">
			<div class="alert alert-success" v-show="notifyMessage.length">
				<strong>{{notifyMessage}}</strong>
			</div>
		</div>
	</div>
</template>

<script>
	import Room from './Room.vue'
	import Cover from './Cover.vue'
	import Prev from './Prev.vue'
	import Next from './Next.vue'
	import Actor from './Actor.vue'
	import Card from './card.js'
	import $ from 'webpack-zepto'

	const DEBUG = process.env.NODE_ENV != "production";
	const UNKNOWN = -1;

	export default {
		name: 'app',
		data: function () {
			return {
				stage: 0, /* 0:waiting, 1:calling, 2:playing, 3: over */
				lastPlayerId: UNKNOWN,
				lastPlayerShot: [],
				roomId: UNKNOWN,
				coverCards: [],
				rooms: [],
				ws: null,
				notifyMessage: "",
				notifyTimer: null
			}
		},
		components: {
			Room, Cover, Prev, Next, Actor
		},
		methods: {
			setLastPlayerId: function (playerId) {
				DEBUG && console.log("[root]set lastPlayerId=" + playerId);
				this.lastPlayerId = playerId;
			},
			setStage: function (stage) {
				DEBUG && console.log("[root]set stage=" + stage);
				this.stage = stage;
			},
			getRefById: function (id) {
				id >>= 0;
				return this.$refs.actor.id === id ? "actor"
						: (id === (this.$refs.actor.id + 1) % 3 ? "next" : "prev");
			},
			refreshPlayers: function (players) {
				for (var id in players) {
					this.$refs[this.getRefById(id)].join(id, players[id].ready);
				}
			},
			send: function (data) {
				DEBUG && console.log("[APP]sent: " + JSON.stringify(data));
				this.ws.send(JSON.stringify(data));
			},
			notify: function (content, time) {
				clearTimeout(this.notifyTimer);
				this.notifyTimer = setTimeout(function (){
					$("#notify-message").hide();
				}, time || 2000);
				this.notifyMessage = content;
				$("#notify-message").show();
			}
		},
		created: function () {
			this.$on("message", function (m) {
				var $refs = this.$refs;
				var actor = $refs["actor"];
				switch (m.action) {
					case "listRoom":
						this.rooms = m.rooms;
						break;
					case "join":
						if (actor.id === UNKNOWN) {
							this.roomId = m.roomId;
							actor.join(m.playerId);
							this.refreshPlayers(m.data.players);
						} else {
							$refs[this.getRefById(m.playerId)].join(m.playerId);
						}
						break;
					case "ready":
						this.refreshPlayers(m.data.players);
						break;
					case "leave":
						if (m.playerId === actor.id) {
							this.roomId = UNKNOWN;
							$refs["actor"].leave();
						} else {
							$refs[this.getRefById(m.playerId)].leave();
						}
						this.setStage(0);
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
						this.notify("Landlord " + (m.data.masterWin ? "won !" : "failed !"), 5000);
						this.setStage(3);
						actor.hasPrepared = false;
						for (var id in m.data.cards) {
							$refs[this.getRefById(id)].cards = m.data.cards[id];
						}
						break;
				}
				for (var child in $refs)
					$refs[child].handle(m);
			});
		},
		mounted: function () {
			var app = this;
			try {
				var ws = new WebSocket("ws://172.17.15.167:34567");
				ws.onopen = function () {
					app.send({action: "listRoom"});
				};
				ws.onmessage = function (event) {
					DEBUG && console.log("[APP]received: " + event.data);
					try {
						var data = JSON.parse(event.data);
						app.$emit("message", data);
					} catch (e) {
						app.notify(event.data, 10000);
						console.error(e);
					}
				};
				ws.onclose = function () {
					app.roomId = UNKNOWN;
					app.setStage(0);
				};
				ws.onerror = function () {
					app.roomId = UNKNOWN;
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
</style>
