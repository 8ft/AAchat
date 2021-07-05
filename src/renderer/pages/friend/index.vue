<template>
	<div id="friend">
		<div id="groups">
			<router-link to="/friend/mine" style="background:skyBlue;">
				我的好友
			</router-link>
			<router-link to="/friend/new" style="background:seaGreen;">
				新的好友
			</router-link>
		</div>
		<router-view id="list"></router-view>
	</div>
</template>

<script>
	export default {
		components: {},
		methods: {}
	}
</script>

<style lang="scss" scoped>
  #friend {
    width: 100%;
    height: 100%;
    display: flex;
    #groups {
      overflow-x: hidden;
      overflow-y: auto;
      width: 248px;
      border-right: $border;

      a {
        display: block;
        height: 50px;
        text-align: center;
        line-height: 50px;
        color: #fff;
      }
    }
    #list {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
  }
</style>
