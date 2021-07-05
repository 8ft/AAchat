<!--/**
* creater: wuxl
* 图片、视频加载失败组件
* use: <file-load-error
*        width=""         // 宽，默认100%
*        height=""        // 高，默认100%
*        :form=""         // 消息的cform
*        :icon-size=""         //  图标尺寸，整型，单位px
*        :font-size=""         //  文字尺寸，整型，单位px
*         background-color   // 背景颜色，默认#000
*         font-color        // 文字颜色，默认#fff
*      />
*
*  ps: 不传入回调方法时，底部按钮不显示;
*      基于业务：好友可以修改备注；自己可以修改昵称和头像；底部按钮功能会优先使用外部传入的回调，未传入则根据与当前账号的关系去自定义
**/-->
<template>
	<div class="file-load-error" :style="{ width, height, backgroundColor, color: fontColor }">
		<div v-if="[$CHAT_MSG_TYPE.TYPE_IMAGE,$CHAT_MSG_TYPE.TYPE_EMOJI].includes(form)" :style="{fontSize: fontSize + 'px'}">
			<div class="iconfont icontupianjiazaishibai1" :style="{fontSize: iconSize + 'px'}"></div>
			<div v-if="showText">
				{{this.$t('common.fileNotExist[1]')}}
			</div>
			<a-button size="small" v-if="hasRetryBtn" @click.stop="retryBtn">
				{{$t('common.retry')}}
			</a-button>
		</div>
		<div v-else-if="form === $CHAT_MSG_TYPE.TYPE_VIDEO" :style="{fontSize: fontSize + 'px'}">
			<div class="iconfont iconshipin3" :style="{fontSize: iconSize + 'px'}"></div>
			<div v-if="showText">
				{{this.$t('common.fileNotExist[0]')}}
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'FileLoadError',
		props: {
			hasRetryBtn: {
				type: Boolean,
				default: false
			},
			width: {
				type: String,
				default: '100%'
			},
			height: {
				type: String,
				default: '100%'
			},
			form: {
				type: Number,
				default: 102
			},
			iconSize: {
				type: Number,
				default: 30
			},
			fontSize: {
				type: Number,
				default: 12
			},
			backgroundColor: {
				type: String,
				default: '#c0c0c0'
			},
			fontColor: {
				type: String,
				default: '#fff'
			},
			showText: {
				type: Boolean,
				default: true
			}
		},
		methods: {
			retryBtn() {
				this.$emit('retry')
			}
		}
	}
</script>

<style scoped lang="scss">
	.file-load-error{
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 180%;
		&>div{
			.iconfont{
				font-size: 30px;
			}
			text-align:center;
		}
	}
</style>
