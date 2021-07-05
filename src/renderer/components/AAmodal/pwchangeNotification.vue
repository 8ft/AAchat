<template>
	<a-modal :title="$t('common.prompt')" class="notification-IM" :visible="visible" :width="438" :closable="false" centered>
		<p>{{$t('common.aboutAccountTip[3]')}}</p>
		<template #footer>
			<a-button type="primary" @click="handle">
				{{$t('common.okBtn')}}
			</a-button>
		</template>
	</a-modal>
</template>
<script>
	export default {
		name: 'PwchangeNotification',
		props: {
			visible: Boolean
		},
		methods: {
			handle() {
				this.$store.dispatch('Setting/set_showModal', '')
				setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
				// this.$utils.fun.logout({ openLoginWin: true })
			}
		}
	}
</script>
