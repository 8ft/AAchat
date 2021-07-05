<template>
	<a-modal :title="title || $t('common.systemNotification')"
		centered
		class="notification-IM"
		:z-index="10000"
		:visible="visible"
		:width="438"
		:closable="false"
	>
		<p>{{messages}}</p>
		<template #footer>
			<a-button type="primary" @click="handle" :loading="isLoading">
				{{$t('common.gotIt')}}
			</a-button>
		</template>
	</a-modal>
</template>
<script>
	export default {
		name: 'AAmodal',
		props: {
			title: String,
			visible: Boolean,
			messages: String,
			confirm: Function
		},
		data() {
			return {
				isLoading: false
			}
		},
		methods: {
			handle() {
				this.isLoading = true
				if (this.$props.confirm) {
					this.$props.confirm()
					return
				}
				this.$store.dispatch('Setting/set_showModal', '')
				setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
				// this.$utils.fun.logout({ openLoginWin: true })
				this.isLoading = false
			}
		}
	}
</script>
