<template>
	<div class="container">
		<div @click="enter" :data-id="room.id" v-for="room in rooms">
			<hr>
			<span>Room #{{room.id}} </span>
			<span class="btn-group">
				<input type="button" v-for="i in [0,1,2]" :value="i" :disabled="room.players.indexOf(i)>-1"
							 class="btn btn-default">
			</span>
		</div>
	</div>
</template>

<script>
	import $ from 'webpack-zepto'

	export default {
		props: ["rooms"],
		methods: {
			enter: function (e) {
				var el = $(e.target);
				if (!el.is("input")) return;
				this.$parent.send({
					action: "join",
					data: {
						roomId: $(e.currentTarget).data("id") >> 0,
						playerId: el.val() >> 0
					}
				});
			}
		}
	}
</script>