<template>
	<div class="content">
			<ul id="myTab" class="nav nav-tabs container">
				<p class="navbar-text pull-right">{{message}}</p>
				<li class="disabled"><a href="#">星云斗地主1.0</a></li>
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
					<span class="btn-group col-xs-6 col-sm-4 col-md-3 top" v-if="room.id<100">
						<span type="button" class="disabled btn btn-default">房间 #{{room.id}} </span>
						<input type="button" v-for="i in [0,1,2]" :value="i" :disabled="room.players.indexOf(i)>-1"
							 class="btn btn-default">
					</span>
				</a>
			</div>
		</div>
		<div class="room-list" v-if="nowIndex==tabsParam[3]">
			<div class="container">
				<a @click="enter" :data-id="room.id" v-for="room in rooms">
					<span class="btn-group col-xs-6 col-sm-4 col-md-3 top" v-if="room.id>=100">
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
				<hr>
<div>这是一款去中心化的棋牌对战游戏。</div>
<div>拥有独特的共识机制来结算游戏结果，让游戏在没有第三方情况下能稳步进行。</div>
<hr>
<div>游戏步骤：</div>
<div>用游戏币游戏：</div>
<div>①：注册游戏：点击首页的注册游戏，发起交易即可，新用户立送100游戏币。</div>
<div>②：充值游戏币（可选）：点击充值页面，会以1星云币=100游戏币的比例进行充值。</div>
<div>③：加入房间:在房间页面加入房间。</div>
<div>④：修改房间底分（可选）：修改房间的底分。</div>
<div>⑤：准备游戏。</div>
<div>⑥：在所有玩家准备完毕后，等待0号玩家向合约发起对局请求。</div>
<div>⑦：对局请求发送完毕后，每个玩家向本局游戏押上游戏币。</div>
<div>⑧：Have Fun！</div>
<div>⑨：游戏结束后，向合约发起游戏结束请求，在所有玩家确认后，将会结算游戏币。</div>
<div>⑩：退出房间，或者继续下一局游戏。</div>
<hr>
<div>用星云币游戏：</div>
<div>①：加入房间：在星云币试玩场加入房间并准备。</div>
<div>②：准备游戏。</div>
<div>③：在所有玩家准备后，各自向合约发起对局请求。</div>
<div>④：Have Fun！</div>
<div>⑤：游戏结束后，向合约发起游戏结束请求，在所有玩家确认后，将会结算游戏币。</div>
<div>⑥：退出房间，或者继续下一局游戏。</div>
<hr>
<div>游戏说明：</div>
<div>游戏没有掉线重连机制，如果对局中出现意外情况，请邮箱futurelightcone@gamil.com，并说明情况，管理员会解决。</div>
<div>炸弹和春天等不会翻倍。地主胜利即赢底分，农民胜利即赢一半底分。</div>
<div>星云币试玩场说明：</div>
<div>底分：</div>
<div>100-119房间：0.01星云币。</div>
<div>120-139房间：0.1星云币。</div>
<div>140-159房间：1星云币。</div>
<div>160-179房间：10星云币。</div>
<div>180-199房间：100星云币。</div>
<div>每局结束后收取1%手续费。</div>
<div>仅提供少量星云币的试玩，切勿沉迷赌博。</div>
<div>游戏需要共识机制，所以希望大家遵守游戏规则，公平竞技。</div>
<hr>
<div>Copyright 2018 Deaso.</div>
<div>All rights reserved.</div>
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
			this.tabsParam = ['首页','充值','房间','星云币试玩场'];
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
					if (roomid > 100){
						web3.roundstarted(roomid).then((yes)=>{
							if (yes == "false"){
								this.$parent.send({
								action: "join",
								data: {
									roomId: roomid >> 0,
									playerId: el.val() >> 0
								}
								});
							}else{
								this.$parent.notify("round started.",10000)
							}
						})
					}else{
						this.$parent.send({
							action: "join",
							data: {
								roomId: roomid >> 0,
								playerId: el.val() >> 0
							}
						});
					}
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
					if(me.joined == 'false'){
						theself.message = "玩家：" + me.address.slice(-6).toUpperCase() + "，似乎还没注册游戏……去首页注册一下？或者去星云币试玩场？";
					}else{
						theself.message = "玩家：" + me.address.slice(-6).toUpperCase() + " 剩余游戏币：" + me.coin;
					};
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