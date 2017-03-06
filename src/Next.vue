<template src="./Player.tpl"></template>

<script>
	import $ from 'webpack-zepto'
	import Player from './player.js'

	export default {
		name: "next",
		extends: Player,
		mounted: function () {
			$(this.$el).addClass("next-player");
		}
	}
</script>

<style>
	.next-player {
		position: fixed;
		right: 0;
		text-align: right;
		top: 60px;
		padding: 10px;
	}
</style>