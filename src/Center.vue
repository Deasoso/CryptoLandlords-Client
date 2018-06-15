<template>
        <div class="text-center room">
			<div>Room ID：{{this.roomId}}</div>
			<div>Room Coin：{{this.roomCoin}}</div>
			<div class="input-group inputandbutton" v-show="canChangeCoin">
            	<input  type="number" 
						class="form-control"
						onkeyup="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;" 
						onafterpaste="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;"
						v-model="coin"
						>
            	<span class="input-group-btn">
					<button class="btn btn-default" type="button" @click="ChangeCoin">Change Coin</button>
				</span>
        	</div>
			<div v-if = "stage==0 && waiting ==0">Waiting for Ready...</div>
			<div v-if = "stage==0 && waiting ==1">Waiting for Reaquest...</div>
			<div v-if = "stage==0 && waiting ==2">Waiting for Pay...</div>
			<div v-if = "stage==1">Waiting for Call..</div>
		</div>
</template>

<script>
	export default {
        props:["roomId", "roomCoin", "stage", "waiting", "canChangeCoin"],
        data: function(){
            return{
                coin: 0,
            }
        },
        name: "center",
        methods: {
			ChangeCoin: function(){
                this.$parent.changecoin(this.coin);
            },
        }
	}
</script>

<style>
    .room {
		position: fixed;
		bottom: 50%;
		width: 100%;
		background-color: rgba(255, 255, 255, .8);
		z-index: 100000000;
	}

	.inputandbutton{
		left: 37%;
		width: 26%;
	}
</style>