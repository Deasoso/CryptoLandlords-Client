<template src="./player.html"></template>

<script>
	import $ from 'webpack-zepto'
	import Player from './player.js';

	export default {
		extends: Player,
		mounted: function () {
			$(this.$el).addClass("next-player");
		}
	}
</script>

<style>
	.next-player {
		position: fixed;
		right: 20px;
		text-align: right;
	}
</style>