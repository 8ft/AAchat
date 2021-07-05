<template>
	<div id="chat">
		<thread-list></thread-list>

		<!-- <router-view v-if="$route.params.id"></router-view> -->
		<Messages v-show="$store.state.Chat.currentThreadID"></Messages>
		<!-- store.state.organizationPage说明：
		此div class="default"的drag状态会影响organizationPage页面的拖动，所以organizationPage在打开时候，隐藏此div
		-->
		<div class="default" v-show="!$store.state.Chat.currentThreadID && !$store.state.organizationPage">
			<div class="main">
				<img src="~@/assets/img/noActiveThread.png" width="280" height="224" />
				<h1>{{$t('chat.noActiveThread[0]')}}</h1>
				<p>{{$t('chat.noActiveThread[1]')}}</p>
			</div>
		</div>
	</div>
</template>

<script>
	import ThreadList from './components/ThreadList'
	import Messages from './message'

	export default {
		components: { ThreadList, Messages },
		data() {
			return {
				startDrop: false
			}
		},
		computed: {}
	}
</script>

<style lang="scss" scoped>
  #chat {
    width: 100%;
    height: 100%;
    display: flex;
    .default {
      display: flex;
      flex: 1;
      position: relative;
	    z-index: 2;
	    -webkit-app-region: drag;
      .main {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100%;
        transform: translate(-50%, -65%);
        text-align: center;
        h1 {
          margin: 0;
          font-size: 14px;
          font-weight: normal;
          font-stretch: normal;
          line-height: 14px;
          color: #333333;
          margin-top: 49px;
        }
        p{
          margin-top: 10px;
          font-size: 12px;
          font-weight: normal;
          font-stretch: normal;
          line-height: 12px;
          letter-spacing: 0px;
          color: #999999;
        }
      }
    }
  }
</style>
