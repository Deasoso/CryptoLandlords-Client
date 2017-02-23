<template>
	<div class="text-center m10">
		<span class="btn-group" v-if="stage > 1 && parsedCards.length">
			<input type="button" v-for="c in parsedCards" :value="c.text" class="btn btn-default">
		</span>
	</div>
</template>

<script>
	import Card from './card.js';

	export default {
		props: ["cards", "stage"],
		computed: {
			parsedCards: function () {
				return Card.convert(this.cards).sort(Card.cardSort);
			}
		}
	}
</script>