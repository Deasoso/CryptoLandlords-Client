<template>
	<div id="app" class="disable-select" onselectstart="return false">
		<rooms :rooms="rooms" v-show="roomId==-1"></rooms>
		<cover :stage="stage" :cards="coverCards"></cover>
		<prev :stage="stage" ref="prev" v-show="roomId!=-1"></prev>
		<next :stage="stage" ref="next" v-show="roomId!=-1"></next>
		<actor :stage="stage" ref="actor" v-show="roomId!=-1"></actor>
	</div>
</template>

<script>
	import rooms from './Rooms.vue';
	import cover from './Cover.vue';
	import prev from './Prev.vue';
	import next from './Next.vue';
	import actor from './Actor.vue';
	import Card from './card.js';
	import $ from 'webpack-zepto'

	var DEBUG = 0;
	var UNKNOWN = -1;

	export default {
		name: 'app',
		data: function () {
			return {
				stage: 0, /* 0:waiting, 1:calling, 2:playing */
				lastPlayerId: UNKNOWN,
				lastPlayerShot: [],
				roomId: UNKNOWN,
				coverCards: [],
				rooms: [],
				ws: null
			}
		},
		components: {
			rooms, cover, prev, next, actor
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
				DEBUG && console.log("sent: " + JSON.stringify(data));
				this.ws.send(JSON.stringify(data));
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
						alert("Landlord " + (m.data.masterWin ? "won" : "failed"));
						app.setStage(3);
						actor.hasPrepared = false;
						for (var id in m.data.cards) {
							$refs[app.getRefById(id)].cards = m.data.cards[id];
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
				var ws = new WebSocket(WSADDR || "ws://localhost:34567");
				ws.onopen = function () {
					app.send({action: "listRoom"});
				};
				ws.onmessage = function (event) {
					DEBUG && console.log("received: " + event.data);
					try {
						var data = JSON.parse(event.data);
						app.$emit("message", data);
					} catch (e) {
						alert(event.data);
						console.error(e);
					}
				};
				ws.onclose = function () {
				};
				ws.onerror = function () {
				};
				app.ws = ws;
			} catch (e) {
			}

			// silly blink
			setInterval(function () {
				$(".glyphicon-time").toggle();
			}, 500);
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
</style>
