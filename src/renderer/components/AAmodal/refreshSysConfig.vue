<template>
	<a-modal :title="$t('common.prompt')" centered class="notification-IM" :z-index="10000" :visible="visible" :width="438"
		:closable="false"
	>
		<p>{{$t('common.updateConfigTip')}}</p>
		<template #footer>
			<a-button type="primary" @click="$utils.fun.restartApp">
				{{$t('common.restart')}}
			</a-button>
			<a-button @click="$store.dispatch('Setting/set_showModal', '')">
				{{$t('common.exitBtn')}}
			</a-button>
		</template>
	</a-modal>
</template>
<script>
	export default {
		name: 'RefreshSysConfig',
		props: {
			visible: Boolean
		},
		methods: {
			handle() {
				this.$store.dispatch('Setting/set_showModal', '')
				this.$store.commit('Chat/switchThread', '') // 清空vuex里的currentThreadID
				setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
				this.$utils.fun.logout({ openLoginWin: true })
			}
		}
	}
</script>
