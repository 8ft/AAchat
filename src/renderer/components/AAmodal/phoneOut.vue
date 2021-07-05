<template>
	<a-modal :title="$PROJECT_NAME" class="notification-IM" :visible="visible" :width="438" :z-index="10000"
		centered :closable="false"
	>
		<p>{{$t('common.logoutForPc', { projectName: $PROJECT_NAME })}}</p>
		<template #footer>
			<a-button type="primary" @click="handle">
				{{$t('common.okBtn')}}
			</a-button>
		</template>
	</a-modal>
</template>
<script>
	export default {
		name: 'PhoneOut',
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
