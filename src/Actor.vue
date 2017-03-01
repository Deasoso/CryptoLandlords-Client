<template>
	<div class="text-center player actor">
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
					<input type="button" v-for="c in parsedLastShot" :value="c.text" class="btn btn-default shot-cards">
				</span>
				<span class="label label-default" v-else>Pass</span>
			</div>
		</div>
		<div v-show="cards.length" class="btn-group m10 actor-cards">
			<input type="button" v-for="c in parsedCards" class="btn btn-default btn-lg actor-card"
						 :value="c.text" :data-key="c.key" :key="c.key" @mouseover="swipePick">
		</div>
		<div>
			<span>{{displayName}}</span>
			<span class="glyphicon glyphicon-user text-danger" title="The Landlord" v-if="isMaster && stage > 1"></span>
		</div>
	</div>
</template>

<script>
	import Player from './player.js'
	import $ from 'webpack-zepto'
	import Card from './card.js'

	var app, actor;
	var swipePicking = false;

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
						app.notify("Invalid cards.");
						return;
					}

					if (app.lastPlayerShot.length && app.lastPlayerId != this.id) {
						var othersShotInfo = Card.detect(app.lastPlayerShot);
						if (! Card.canBeat(cardInfo, othersShotInfo)) {
							app.notify("Invalid cards.");
							return;
						}
					}

					app.send({action: "shoot", data: {cards: cards}});
				}
			},
			pass: function () {
				$(".picked").toggleClass("picked");
				app.send({action: "shoot", data: {cards: []}});
			},
			swipePick: function (e) {
				if (swipePicking) {
					$(e.target).toggleClass("picked");
				}
			}
		},

		mounted: function () {
			app = this.$parent;
			actor = this;

			$(document).mouseup(function(){
				swipePicking = false;
			});
			$(".actor-cards").mousedown(function(e){
				swipePicking = true;
				if ($(e.target).is(".actor-card")) {
					$(e.target).toggleClass("picked");
				}
				e.preventDefault();
				e.stopPropagation();
			});

			$(document).on("contextmenu", function(e){
				if(app.stage == 2 && actor.speaking) {
					actor.shoot();
				}
				e.stopPropagation();
				e.preventDefault();
			});
		}
	}
</script>

<style>
	.actor {
		position: fixed;
		bottom: 20px;
		width: 100%;
	}

	.picked {
		position: relative;
		top: -5px;
		background: #d9ffde;
	}

	input.picked:focus,
	input.picked:hover,
	input.picked:active {
		background-color: #d9ffde !important;
	}
</style>