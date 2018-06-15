<template>
	<div class="content">
			<ul id="myTab" class="nav nav-tabs container">
				<p class="navbar-text pull-right">{{message}}</p>
				<li class="disabled"><a href="#">星云斗地主</a></li>
    			<li 
        			v-for="(item,index) in tabsParam" 
        			:class="{active:item == nowIndex}"
        			@click="toggleTabs">
					<a href="#" data-toggle="tab">
            			{{item}}
        			</a>
				</li>
			</ul>
		<div class="room-list" v-if="nowIndex==tabsParam[2]">
			<div class="container">
				<a @click="enter" :data-id="room.id" v-for="room in rooms">
					<span class="btn-group col-xs-6 col-sm-4 col-md-3 top">
						<span type="button" class="disabled btn btn-default">房间 #{{room.id}} </span>
						<input type="button" v-for="i in [0,1,2]" :value="i" :disabled="room.players.indexOf(i)>-1"
							 class="btn btn-default">
					</span>
				</a>
			</div>
		</div>
		<div class="buy-sell-view" v-else-if="nowIndex==tabsParam[1]">
			<div class="container">
				<hr>
				<div>兑换比例：1 星云币 = 100 游戏币</div>
				<hr>
    					<div class="input-group">
							<input type="number" 
								class="form-control" 
								placeholder="充值游戏币数量" 
								v-model="buyamount"
								onkeyup="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;" 
								onafterpaste="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;">
      						<span class="input-group-btn">
        						<button class="btn btn-default" type="button" @click="buycoin">充值游戏币</button>
      						</span>
    					</div>
				<hr>
    					<div class="input-group">
      						<input type="number" 
							  	class="form-control" 
							  	placeholder="兑换游戏币数量" 
								v-model="sellamount"
								onkeyup="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;" 
								onafterpaste="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;">
      						<span class="input-group-btn">
        						<button class="btn btn-default" type="button" @click="sellcoin">兑换游戏币</button>
      						</span>
    					</div>
			<div v-if="isadmin">
				<hr>
			</div>
						<div class="input-group" v-show="isadmin">
      						<input type="number" 
							  	class="form-control" 
							  	placeholder="取出游戏币数量" 
								v-model="outamount"
								onkeyup="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;" 
								onafterpaste="this.value=this.value.replace(/\D/g,'');if(this.value >= 9999999999) this.value=9999999999;">
      						<span class="input-group-btn">
        						<button class="btn btn-default" type="button" @click="outcoin">取出游戏币</button>
      						</span>
    					</div>
			</div>
		</div>
		<div class="join-view" v-else-if="nowIndex==tabsParam[0]">
			<div class="container">
				<hr>
				<button type="button" class="btn btn-default" @click="joingame">
					注册游戏
				</button>
			</div>
		</div>
	</div>
</template>

<script>
	import $ from 'webpack-zepto'
	import * as web3 from "@/xingyunsrc/xyapi.js"//'@/web3src/web3.js'

	export default {
		name: "room",
		props: ["rooms"],
		data() {
			return {
				buyamount:'',
				sellamount:'',
				message:"loading...",
				isadmin:false,
				outamount:'',
			}
		},
		async created() {
			this.tabsParam = ['首页','充值','房间'];
			this.nowIndex = '首页';
			this.loadme();
		},
		methods: {
			enter: function (e) {
				DDZ_DEBUG && console.log(e.currentTarget);
				DDZ_DEBUG && console.log(e.currentTarget.getAttribute('data-id'));//.data("id"));
				var roomid = e.currentTarget.getAttribute('data-id');
				web3.getMe()
				.then((me) => {
					var el = $(e.target);
					if (!el.is("input")) return;
					this.$parent.send({
						action: "join",
						data: {
							roomId: roomid >> 0,
							playerId: el.val() >> 0
						}
					});
				}).catch((e) => {
					this.$parent.notify(e.message, 2000);
				});
			},
			toggleTabs: function(e){
				DDZ_DEBUG && console.log(e);
				this.nowIndex = e.target.innerText;
				if (!this.tabsParam.includes(this.nowIndex)) this.nowIndex = '首页';
				this.$forceUpdate();
			},
			loadme: function(e){
				var theself = this;
				web3.getMe()
				.then(async (me) => {
					theself.$parent.setme(me);
					theself.message = "玩家：" + me.address.slice(-6).toUpperCase() + " 剩余游戏币：" + me.coin;
					var isadmin = await web3.playerisadmin(me.address);
					if(isadmin == "true") theself.isadmin = true;
					else theself.isadmin = false;
					theself.$forceUpdate();
				})
				.catch((e) => {
					if (e.message == 'NO_METAMASK'){
						theself.message = "此游戏仅能运行在Chrome或Firefox下，去下载一个？";
					}else if(e.message == 'METAMASK_LOCKED'){
						theself.message = "没有收到你的钱包地址，安装或解锁一下星云链钱包插件？";
					}else if(e.message == 'NONE_JOINED'){
						theself.message = "似乎还没注册游戏……去首页注册一下？";
					}
				});
			},
			joingame: function(e){
				web3.joingame().then((hash) => {
					DDZ_DEBUG && console.log(e);
					this.loadme();
				}).catch((e) => {
					this.$parent.notify(e.message, 2000);
				});
			},
			buycoin: function(e){
				web3.buycoin(this.buyamount).then((hash) => {
					DDZ_DEBUG && console.log(e);
					this.loadme();
				});
			},
			sellcoin: function(e){
				web3.sellcoin(this.sellamount).then((hash) => {
					DDZ_DEBUG && console.log(e);
					this.loadme();
				});
			},
			outcoin: function(e){
				web3.withdraw(this.outamount);
			}
		}
	}
</script>

<style>
	.room-list {
		padding: 20px;
		/* background-color: rgba(255, 255, 255, .8); */
		/* position: fixed; */
		/* z-index: 10000000; */
		/* top: 50px; */
		/* width: 100%; */
		height: 0px;
		padding-bottom:100%;
		/* max-height: 600px; */
		/* overflow-y: scroll; */
	}
	.top { margin-bottom: 10px; }
</style>