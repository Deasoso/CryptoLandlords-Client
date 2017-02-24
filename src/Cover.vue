<template>
	<div class="text-center cover">
		<span class="btn-group cover-cards" v-if="stage > 1 && parsedCards.length">
			<input type="button" v-for="c in parsedCards" :value="c.text" class="btn btn-default">
		</span>
	</div>
</template>

<script>
	import Card from './card.js'

	export default {
		props: ["cards", "stage"],
		computed: {
			parsedCards: function () {
				return Card.convert(this.cards).sort(Card.cardSort);
			}
		}
	}

	// simple tests
	!function (testing) {
		if (! testing) return;
		console.log("[Card] testing detect start");
		var samples = [
			[101],
			[201, 202],
			[1801, 2001],
			[301, 401, 501, 701, 601],
			[301, 302, 303, 101],
			[301, 302, 303, 101, 101],
			[301, 302, 303, 401, 402, 403],
			[301, 302, 303, 401, 402, 403, 101, 102],
			[301, 302, 303, 401, 402, 403, 101, 202],
			[301, 302, 303, 401, 402, 403, 101, 102, 201, 202],
			[301, 302, 303, 401, 402, 403, 501, 502, 503, 101, 102, 201],
			[301, 302, 303, 304],
			[301, 302, 303, 304, 101, 102],
			[301, 302, 303, 304, 101, 102, 201, 202],
			[301, 302, 303, 304, 101, 102, 103, 201, 202, 203]
		];

		for (var i=0; i<samples.length; i++) {
			var info = Card.detect(samples[i]);
			console.log(samples[i].join(",") + " => " + (info !== false ? info.type : "false"));
		}
		console.log("[Card] testing detect end");
	}(process.env.NODE_ENV != "production");
</script>

<style>
	.cover {
		position: fixed;
		top: 0;
		width: 100%;
		background-color: rgba(255, 255, 255, .8);
		z-index: 100000000;
	}

	.cover-cards {
		padding: 10px 0;
	}
</style>