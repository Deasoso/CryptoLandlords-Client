<template src="./player.html"></template>

<script>
	import $ from 'webpack-zepto'
	import Player from './player.js';

	export default {
		extends: Player,
		mounted: function () {
			$(this.$el).addClass("prev-player");
		}
	}
</script>

<style>
	.prev-player {
		position: fixed;
		left: 20px;
	}
</style>