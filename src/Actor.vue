<template>
	<div class="text-center actor">
		<div v-if="stage == 0 || stage == 3" class="m10">
			<span class="label label-success" v-if="hasPrepared">waiting for other players</span>
			<input type="button" @click="prepare" value="I'm Ready!" class="btn btn-primary" v-else>
		</div>
		<div v-if="stage == 1">
			<div v-if="speaking">
				<input type="button" @click="call(1)" value="Call" class="btn btn-primary">
				<input type="button" @click="call(0)" value="Pass" class="btn btn-default">
			</div>
			<div v-else>
				<span class="label label-success" v-if="callState == 0">waiting for other players</span>
				<span class="label label-info" v-else-if="callState < 0">Pass</span>
			</div>
		</div>
		<div v-if="stage > 1">
			<div v-if="speaking && stage == 2" class="m10">
				<input type="button" @click="shoot" value="Shoot" class="btn btn-primary">
				<input type="button" @click="pass" value="Pass" class="btn btn-default" v-show="canPass">
			</div>
			<div v-else-if="shotCount" class="m10">
				<span class="btn-group" v-if="lastShot.length">
					<input type="button" v-for="c in parsedLastShot" :value="c.text" class="btn btn-default" disabled>
				</span>
				<span class="label label-default" v-else>Pass</span>
			</div>
		</div>
		<div v-if="cards.length" class="btn-group m10">
			<input type="button" v-for="c in parsedCards" :value="c.text" :data-key="c.key" :key="c.key" @click="pick"
						 class="btn btn-default">
		</div>
		<div>{{displayName}} <span class="glyphicon glyphicon-user text-danger" title="The Landlord"
															 v-if="isMaster && stage == 2"></span></div>
	</div>
</template>

<script>
	import Player from './player.js';
	import $ from 'webpack-zepto';
	import Card from './card.js';

	var app;

	export default {
		extends: Player,
		computed: {
			canPass: function () {
				return app.lastPlayerId != this.id;
			}
		},
		methods: {
			call: function (yes) {
				app.send({action: "call", data: {confirmed: !!yes}});
			},
			prepare: function () {
				app.setStage(0);
				app.$refs.actor.reset();
				app.send({action: "ready"});
			},
			shoot: function () {
				var cards = $.map($(".picked"), function (item) {
					return $(item).attr("data-key") >> 0;
				});

				if (cards.length) {
					var cardInfo = Card.detect(cards);
					if (cardInfo === false) {
						alert("Invalid cards.");
						return;
					}

					if (app.lastPlayerShot.length && app.lastPlayerId != this.id) {
						var othersShotInfo = Card.detect(app.lastPlayerShot);
						if (! Card.canBeat(cardInfo, othersShotInfo)) {
							alert("Try again.");
							return;
						}
					}

					app.send({action: "shoot", data: {cards: cards}});
				}
			},
			pass: function () {
				$(".picked").toggleClass("btn-warning picked");
				app.send({action: "shoot", data: {cards: []}});
			},
			pick: function (e) {
				$(e.target).toggleClass("btn-warning picked");
			}
		},

		mounted: function () {
			app = this.$parent;
		}
	}
</script>

<style>
	.actor {
		position: fixed;
		bottom: 20px;
		width: 100%;
	}
</style>