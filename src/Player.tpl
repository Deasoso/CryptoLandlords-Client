<div class="player">
	<div v-if="id == -1">
		<span>{{displaymes()}}</span>
	</div>
	<div v-else>
		<span>{{displaymes()}} <span class="glyphicon glyphicon-user text-danger" title="The Landlord" v-if="isMaster"></span></span>
		<div v-if="stage == 0" class="m10">
			<span class="label label-success" v-if="hasPrepared">准备</span>
			<span class="label label-warning" v-else>未准备</span>
		</div>
		<div v-else-if="stage == 1">
			<div v-if="speaking">
				<span class="glyphicon glyphicon-time text-primary"></span>
			</div>
			<div v-else>
				<span class="label label-success" v-if="callState < 0">Pass</span>
			</div>
		</div>
		<div v-else-if="stage > 1">
			<div class="m10">
					<span class="btn-group" v-if="stage == 3">
						<input type="button" v-for="c in parsedCards" :value="c.text" class="btn btn-default btn-lg">
					</span>
					<span v-else>
						<span v-if="cardCount >= 2">
							<span class="badge">{{cardCount}}</span> 剩余手牌
						</span>
						<span v-else-if="cardCount == 1">
							<span class="badge">{{cardCount}}</span> 剩余手牌
						</span>
						<span v-else-if="cardCount == 0">
							<div class="btn btn-success">Winner!</div>
						</span>
					</span>
			</div>
			<div v-if="speaking && stage == 2" class="m10">
				<span class="glyphicon glyphicon-time text-primary" key="timer"></span>
			</div>
			<div v-else-if="shotCount" class="m10">
				<span class="btn-group" v-if="parsedLastShot.length > 0">
					<input type="button" v-for="c in parsedLastShot" :value="c.text" class="btn btn-default shot-cards">
				</span>
				<span class="label label-success" v-else>Pass</span>
			</div>
		</div>
	</div>
</div>