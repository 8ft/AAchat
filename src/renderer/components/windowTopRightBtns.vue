<template>
	<!-- 窗体控制按钮 -->
	<div class="window-btns" v-if="$utils.currentWindow && $utils.os.isWindows">
		<span class="iconfont iconjian" @click="$utils.currentWindow.min"></span>
		<span :class="'iconfont '+(isMax?'iconshouqi':'iconquanping')" @click="max"></span>
		<span class="iconfont icontongyongguanbi" @click="hide"></span>
	</div>
</template>

<script>
	export default {
		name: 'WindowTopTool',
		computed: {
			isMax() {
				console.log('this.$store.state.Setting.isMaxCurrentWin:::', this.$store.state.Setting.isMaxCurrentWin)
				return this.$store.state.Setting.isMaxCurrentWin
			}
		},
		props: {
			closeBtnType: { // 关闭按钮类型
				type: String,
				default: 'hide'
			},
			from: { // 引用控件的来源
				type: String,
				default: ''
			}
		},
		methods: {
			hide() {
				// if (this.from === '') this.$store.dispatch('Setting/set_windowsVisibility', false)
				setTimeout(() => {
					this.$utils.currentWindow[this.closeBtnType]()
				}, 100)
			},
			max() {
				if (this.isMax) {
					this.$utils.currentWindow.unMax()
					this.$store.commit('Setting/SET_ISMAXCURRENTWIN', false)
				} else {
					this.$utils.currentWindow.max()
					this.$store.commit('Setting/SET_ISMAXCURRENTWIN', true)
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	.window-btns {
		display: flex;
		align-items: center;
		height: 100%;
		padding: 0 20px 0 20px;
		border-left: $border;
		position: relative;
		z-index: 2;
		-webkit-app-region: no-drag;
		span {
			font-size: 14px;
			cursor: pointer;
			border: none !important;
			&:nth-of-type(n + 2) {
				margin-left: 25px;
			}
			&:hover {
				color: #2e87ff;
			}
		}
		float: right
	}
</style>
