export default {
	methods: {
		onlineCheck(text) {
			if (!this.$store.state.Setting.online) {
				this.$message.error(text || this.$t('common.netErrorTip[0]'))
			}
			return this.$store.state.Setting.online
		},
		maxWindow() {
			// if (this.$utils.os.isWindows) return
			if (this.$store.state.Setting.isMaxCurrentWin) {
				this.$utils.currentWindow.unMax()
				this.$store.commit('Setting/SET_ISMAXCURRENTWIN', false)
			} else {
				this.$utils.currentWindow.max()
				this.$store.commit('Setting/SET_ISMAXCURRENTWIN', true)
			}
		}
	}
}
