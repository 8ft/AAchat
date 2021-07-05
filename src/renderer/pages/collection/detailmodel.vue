<!--<DetailModel  ref="son"></DetailModel>-->
<!--父组件中定义打开方法 this.$refs.son.visible = true;-->
<!--cancel 关闭弹窗后执行-->
<template>
	<div class="collectnotebook" ref="collectnotebook">
		<a-modal
			:title="modelhead"
			v-model="visible"
			:getContainer="()=>$refs.collectnotebook"
			:width="modelwidth"
			:footer="null"
			:destroyOnClose="true"
			:afterClose="cancel"
		>
			<!-- <iframe v-if="detaildata.form === $CHAT_MSG_TYPE.TYPE_NOTE&&detaildata.noteId" :src="`${this.$store.state.Setting.notebookHostURL}/favorite/link?id=${detaildata.noteId}`" frameborder="0"></iframe> -->
			<!-- <iframe v-if="detaildata.form === $CHAT_MSG_TYPE.TYPE_NOTE&&detaildata.noteId" :src="`http://192.168.1.173:16690/favorite/link?id=${detaildata.noteId}`" frameborder="0"></iframe> -->
			<a-dropdown
				:getPopupContainer="() => $refs.collectnotebook"
				overlayClassName="contextmenu"
				@visibleChange="_initContextmenu"
				:trigger="['contextmenu']"
				:visible="showContextMenu"
			>
				<div @contextmenu="_contextmenu" v-html="formatedMsg(replaceimg(detaildata.content||''))" v-if="detaildata.form === $CHAT_MSG_TYPE.TYPE_NOTE" class="collect_Content"></div>
				<div v-html="formatedMsg(detaildata.content||'')" @contextmenu="_contextmenu" style="user-select: text" class="text_content" ref="text_content"></div>
				<a-menu slot="overlay" v-clickoutside="_hideContextMenu" v-show="contextmenuItems.copy">
					<a-menu-item @click="_copy">
						{{$t('common.copy')}}
					</a-menu-item>
				</a-menu>
			</a-dropdown>
		</a-modal>
	</div>
</template>

<script>
	export default {
		name: 'Detailmodel',
		data() {
			return {
				visible: false,
				showContextMenu: false,
				contextmenuItems: {
					copy: false
				}
			}
		},
		props: {
			modelhead: {
				type: String,
				default: window.i18n.t('common.note')
			},
			modelwidth: {
				type: Number,
				default: 436
			},
			detaildata: {
				type: Object
			},
			cancel: {
				type: Function,
				default: () => {}
			}
		},
		methods: {
			formatedMsg(text) {
				if (!text) return ''
				text = text.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
				text = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(text)
				const domContainer = document.createElement('div')
				domContainer.appendChild(this.$utils.message.buildDom(text, false, true))
				return domContainer.innerHTML
			},
			replaceimg(text) {
				if (!text) return ''
				text = text.replace(/<img src="/gi, '<img src="' + this.$store.state.Setting.fileDomainURL)
				return text
			},

			_copy() {
				if (this.detaildata.form == 101) {
					this.$utils.fun.writeToClipboard({
						html: this.$refs.text_content.innerHTML,
						text: this.detaildata.content
					})
				} else {
					const selectionContent = this.$utils.selection.getSelectionContent()
					if (selectionContent) {
						this.$utils.fun.writeToClipboard(selectionContent)
					}
				}
				this.showContextMenu = false
			},
			_contextmenu(e) {
				e.preventDefault()
				this.showContextMenu = true
			},
			_hideContextMenu() {
				this.showContextMenu = false
			},
			_initContextmenu(visible) {
				if (visible && (this.$utils.selection.getSelectionContent() || this.detaildata.form == 101)) {
					this.contextmenuItems.copy = true
				} else {
					this.contextmenuItems.copy = false
				}
			}
		}
	}
</script>

<style lang="scss">

	.collectnotebook{
		/deep/ .ant-modal-header{
			background: #F1F2F5;
		}
		.contextmenu {
			min-width: 50px !important;
		}
		.ant-modal-body{
			padding:10px!important;
			user-select: text!important;
			max-height: 500px;
			overflow-y: auto;
			.emoji{
				width: 18px;
				height: 18px;
			}
		}

		.collect_Content{
			white-space: pre-wrap;
			img:not(.emoji){
				display: block;
				max-width: 100%;
				padding: 4px 8px;
			}
		}

		iframe{
			width:100%;
			height: 500px;
		}
		.editor {
			flex: 1;
			overflow-y: auto;
		}
		.text_content{
			white-space: pre-wrap;
			.emoji{
				width: 18px;
				height: 18px;
			}
		}
	}
</style>
