<template src="./Player.tpl"></template>

<script>
	import $ from 'webpack-zepto'
	import Player from './player.js'

	export default {
		name: "prev",
		extends: Player,
		mounted: function () {
			$(this.$el).addClass("prev-player");
		},
		methods: {
			displaymes: function(){
				if(this.$parent.roomId < 100) return this.displayName;
				else return this.displayquickName;
			},
		}
	}
</script>

<style>
	.prev-player {
		position: fixed;
		left: 0;
		top: 50px;
		padding: 10px;
	}
</style>