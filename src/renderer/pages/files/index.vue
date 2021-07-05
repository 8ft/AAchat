<template>
	<div id="files">
		<div class="files-main"	v-if="!showSearchFile">
			<div class="left-list-content">
				<global-search />
				<div class="layout-menu">
					<router-link :class="{'layout-menu-item':true}" to="/files?id=byType">
						<div class="iconfont iconicon_wenjian"></div>
						<div class="name">
							{{$t('common.fileType')}}
						</div>
					</router-link>
					<router-link :class="{'layout-menu-item':true}" to="/files?id=bySender" @click="linkClick=`bySender${Date.now()}`">
						<div class="iconfont iconicon_fasongren"></div>
						<div class="name">
							{{$t('common.sender')}}
						</div>
					</router-link>
					<router-link :class="{'layout-menu-item':true}" to="/files?id=byGroup" @click="linkClick=`bySender${Date.now()}`">
						<div class="iconfont iconicon_qunwenjian"></div>
						<div class="name">
							{{$t('docs.groupFile')}}
						</div>
					</router-link>
				</div>
			</div>
			<div class="message">
				<component
					v-if="$route.query.id"
					:is="`file-${$route.query.id}`"
					:fileDownloadings="fileDownloadings"
					:getProgress="getProgress"
					:doDownload="doDownload"
					:doOpen="doOpen"
					:showSelectModal="showSelectModal"
					:doDelete="doDelete"
					:doPreview="doPreview"
					:formatBytes="formatBytes"
					:linkClick="linkClick"
				></component>
				<div class="default" v-else>
					<div class="main">
						<img src="~@/assets/img/nothing.png" width="240" height="200" :alt="$t('common.noData')">
					</div>
				</div>
			</div>
		</div>
		<file-search
			class="files-search"
			:fileDownloadings="fileDownloadings"
			:getProgress="getProgress"
			:doDownload="doDownload"
			:doOpen="doOpen"
			:showSelectModal="showSelectModal"
			:doDelete="doDelete"
			:doPreview="doPreview"
			:formatBytes="formatBytes"
			v-else
		/>
		<a-modal :title="$t('common.prompt')"
			centered
			class="notification-IM"
			:z-index="10000"
			:visible="warnModalVisible"
			:width="438"
			:closable="false"
		>
			<p>{{noticeData.messages}}</p>
			<template #footer>
				<a-button type="primary" @click="noticeData.confirm" :loading="visibleLoading">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="()=>{warnModalVisible=false}">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
		<!-- 转发选择 -->
		<MultiplePanel
			v-if="selectModalVisible"
			:visible="selectModalVisible"
			:confirm="doShare"
			:cancel="()=>{selectModalVisible=false}"
			limit="50"
			:modeltitle="$t('common.relay')"
		>
			<div id="msg_for_share">
				<div>{{$t('common.leaveMessage')}}</div>
				<a-textarea v-model="msg_for_share" type="textarea" :autosize="{ minRows: 4, maxRows: 4 }" />
			</div>
		</MultiplePanel>
	</div>
</template>

<script>
	import AAlistItem from '@/components/AAlist/item.vue'
	import FileByType from './byType.vue'
	import FileBySender from './bySender.vue'
	import FileByGroup from './byGroup.vue'
	import FileSearch from './fileSearch.vue'
	import GlobalSearch from '@/components/GlobalSearch'
	import MultiplePanel from '@/components/MultiplePanel'
	import AAmodal from '@/components/AAmodal/index.vue'

	export default {
		name: 'Files',
		components: { GlobalSearch, AAlistItem, FileByType, FileBySender, FileByGroup, FileSearch, MultiplePanel, AAmodal },
		data() {
			return {
				visibleLoading: false,
				downloadings: [],
				selectModalVisible: false,
				msg_for_share: '',
				warnModalVisible: false,
				noticeData: {
					messages: '',
					confirm: ''
				},
				currentItem: {},
				linkClick: '',
				fileDownloadings:	[]
			}
		},
		watch: {
			// '$route.query.id'(nVal) {
			// 	this.$store.dispatch('Setting/set_searchFileKeyword', '')
			// }
		},
		computed: {
			showSearchFile() {
				return this.$store.state.Setting.showSearchFile
			},
			clientFileMaxSize() {
				return parseInt(this.$store.state.Setting.paramsConfig && this.$store.state.Setting.paramsConfig.clientFileMaxSize) || 20
			}
			// fileDownloadings() {
			// 	return this.$store.state.Setting.fileDownloadings
			// }
		},
		mounted() {
		},
		methods: {
			async	doPreview(item, updateData, deleteRecord) {	// 在线预览
				this.currentItem = item
				if (!this.onlineCheck()) { // 涉及消息同步，所以加判断
					return
				} else if (item.threadType == 1) {
					const	groupInfo = this.$store.getters['MyGrounp/groupInfo'](item.threadID)
					if (groupInfo && groupInfo.state == 0) {
						this.$message.error(this.$t('chat.lockGroupTip[0]'))
						return
					}
				}

				// 考虑数据状态与本地或服务端不同步的情况
				const	record = await this.$utils.sqlite.getChatData({ where: `cForm=103 and id='${item.id}'` })
				if (record[0]) {
					if (await this.$utils.fun.urlExist(item.url)) {
						console.log(1, item)
						this.openFilePlayer(item, updateData)
					}	else if (await this.$utils.fun.fileExist(item.localPath)) {
						console.log(2, item)
						this.doOpen('1', item, updateData)
					}	else {
						this.$message.warning(this.$t('common.FileExpired'))
					}
				} else {
					this.noticeData = {
						messages: this.$t('chat.fileBeDeleted[0]'),
						confirm: () => {
							// this.$store.dispatch('Chat/delMsg', {
							// 	threadID: this.currentItem.threadID,
							// 	ids: [this.currentItem.id]
							// }).then(res => {
							// 	deleteRecord()
							// 	this.warnModalVisible = false
							// })
							deleteRecord()
							this.warnModalVisible = false
						}
					}
					this.warnModalVisible = true
				}
			},
			async	openFilePlayer(item, updateData) {
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({
					action: 'openFilePlayer',
					params: {
						fromType:	2, // 1-收藏，2-文档，其他-聊天
						url: item.url,
						filePath: item.localPath,
						fileName: item.newFileName || item.fileName,
						userName: item.name,
						userAvatar: item.avatar,
						timestamp: item.timestamp,
						messageId: item.id,
						threadId: item.threadID,
						burntAfterRead:	item.burntAfterRead,
						senderId: item.senderID,
						fileSize: item.fileSize,
						isUnreadBurntAfterReadMsg: this.isShowBurntAfterRead(item)
					}
				})
				if (item.triggered != 1) {
					updateData(Object.assign({}, item, { triggered: 1 }))
					await this.$store.dispatch('Chat/updateMsg', {
						id: item.id,
						updatingData: {
							triggered: 1
						}
					})
					this.$utils.chatSdk.cReadAsync(item.id) // 同步已读--没走下载
				}
			},
			isShowBurntAfterRead(item) {
				return item.burntAfterRead === 1 && item.isSend === 0 && item.triggered != 1
			},
			async	doDelete(item, deleteRecord) { // 删除文件
				this.currentItem = item
				this.noticeData = {
					messages: this.$t('chat.fileBeDeleted[2]'),
					confirm: () => {
						// if (this.downloadings.includes(this.currentItem.id)) {
						const	fileDownloadingInfo = this.$store.state.Setting.fileDownloadings[this.currentItem.id.replace(/-/g, '')]
						if (fileDownloadingInfo) {
							this.$message.warning(this.$t('common.downloadingLimit'))
							return
						}
						this.$store.dispatch('Chat/delMsg', {
							threadID: this.currentItem.threadID,
							ids: [this.currentItem.id]
						}).then(res => {
							deleteRecord()
							this.warnModalVisible = false
						})
					}
				}
				this.warnModalVisible = true
			},
			async showSelectModal(item, deleteRecord) {
				console.log(1, item)
				if (!this.onlineCheck()) {
					return
				} else if (item.threadType == 1) {
					const	groupInfo = this.$store.getters['MyGrounp/groupInfo'](item.threadID)
					if (groupInfo && groupInfo.state == 0) {
						this.$message.error(this.$t('chat.lockGroupTip[0]'))
						return
					}
				}

				this.currentItem = item
				const confirm	=	() => {
					this.msg_for_share = ''
					this.selectModalVisible = true
				}

				// 考虑数据状态与本地或服务端不同步的情况---依据消息记录为准
				const	record = await this.$utils.sqlite.getChatData({ where: `cForm=103 and id='${item.id}'` })
				if (record[0]) {
					if (await this.$utils.fun.fileExist(item.localPath)) {
						confirm()
					}	else if (await this.$utils.fun.urlExist(item.url)) {
						confirm()
					}	else {
						this.$message.warning(this.$t('common.FileExpired'))
					}
				}	else {
					this.noticeData = {
						messages: this.$t('chat.fileBeDeleted[0]'),
						confirm: () => {
							// this.$store.dispatch('Chat/delMsg', {
							// 	threadID: this.currentItem.threadID,
							// 	ids: [this.currentItem.id]
							// }).then(res => {
							// 	deleteRecord()
							// 	this.warnModalVisible = false
							// })
							deleteRecord()
							this.warnModalVisible = false
						}
					}
					this.warnModalVisible = true
				}
			},
			async	doShare(groups) {
				if (!this.onlineCheck()) {
					return
				} else if (this.currentItem.fileSize && this.currentItem.fileSize / (1024 * 1024) > this.clientFileMaxSize) {
					// this.$message.warning(`无法发送大于${this.clientFileMaxSize}MB的文件`)
					this.$message.error(this.$t('chat.sendFileTip[1]', { size: this.clientFileMaxSize }))
					return
				}
				this.selectModalVisible = false
				const serverFileExistList = []
				if (await this.$utils.fun.urlExist(this.currentItem.url)) serverFileExistList.push(this.currentItem.url)
				const sharingMessages = [this.currentItem]
				if (this.msg_for_share) {
					sharingMessages.push({
						cForm: this.$CHAT_MSG_TYPE.TYPE_TEXT,
						text: this.msg_for_share,
						msg_for_share: true, // 转发留言
						data: {}
					})
				}
				this.$store.dispatch('Chat/relayMessage', { messages: sharingMessages, groups, merge: false, serverFileExistList }).then(res => {
					this.$message.success(this.$t('chat.forwardTip[2]'))
				}).catch(e => {
					this.$message.error(e.message)
					console.log(e)
				})
			},
			async doOpen(type, item, updateData) {
				if (!(await	this.$utils.fun.fileExist(item.localPath))) {
					updateData(Object.assign({}, item, { localPath: '' }))
					this.$message.warning(this.$t('common.fileNotExist[2]'))
					return
				} else if (item.threadType == 1) {
					const	groupInfo = this.$store.getters['MyGrounp/groupInfo'](item.threadID)
					if (groupInfo && groupInfo.state == 0) {
						this.$message.error(this.$t('chat.lockGroupTip[0]'))
						return
					}
				}

				if (item.isSend === 0 && item.read != 1) { // 正常情况只有图片（会自行下载）会执行
					console.log('同步已读：',	item.id)
					this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
					this.$store.dispatch('Chat/updateMsg', {
						id: item.id,
						updatingData:	{
							read: 1
						}
					})
				}
				switch (type) {
				case '1':
					if (item.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE) {
						this.$utils.fun.createWin({
							action: 'openImagePlayer',
							params: {
								senderId: item.senderID,
								threadId: item.threadID,
								messageId: item.id,
								filePath: item.localPath,
								userName: item.name,
								userAvatar: item.avatar,
								timestamp: item.timestamp,
								fileSize: item.fileSize,
								burntAfterRead: item.burntAfterRead
							}
						})
					} else if (item.cForm == this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
						this.$utils.fun.createWin({
							action: 'openVideoPlayer',
							params: {
								senderId: item.senderID,
								threadId: item.threadID,
								messageId: item.id,
								filePath: item.localPath,
								userName: item.name,
								userAvatar: item.avatar,
								timestamp: item.timestamp,
								fileSize: item.fileSize,
								burntAfterRead: 0
							}
						})
					} else this.$utils.fun.openFile(item.localPath)
					break
				case '2':
					this.$utils.fun.openFolder(item.localPath)
					break
				}
			},
			async	doDownload(item, updateData, reloadData) { // 下载----视频和文件
				// if (this.downloadings.includes(item.id)) {
				console.log('下载', item, this.$store.state.Chat.downloadingMsgs)
				if (this.$store.state.Setting.fileDownloadings[item.id.replace(/-/g, '')]) {
					this.$message.warning(this.$t('common.downloading'))
					return
				}	else if (!this.onlineCheck()) {
					return
				}	else if (!(await this.$utils.fun.urlExist(item.url))) {
					this.$message.warning(this.$t('common.FileExpired'))
					return
				} else if (item.threadType == 1) {
					const	groupInfo = this.$store.getters['MyGrounp/groupInfo'](item.threadID)
					if (groupInfo && groupInfo.state == 0) {
						this.$message.error(this.$t('chat.lockGroupTip[0]'))
						return
					}
				}
				const	record = await this.$utils.sqlite.getChatData({ where: `cForm=103 and id='${item.id}'` })
				if (!record[0]) {
					this.noticeData = {
						messages: this.$t('chat.fileBeDeleted[0]'),
						confirm: () => {
							reloadData()
							this.warnModalVisible = false
						}
					}
					this.warnModalVisible = true
					return
				}
				// } else if (this.$store.state.Chat.downloadingMsgs.includes(item.id)) {//聊天与文档部分互不影响
				// 	this.$message.warning('该文件已在下载队列中，暂时无法操作')
				// 	return
				// }

				this.$eventBus.$emit('downloadFile', {
					type: this.$CHAT_MSG_TYPE.TYPE_FILE,
					id: item.id,
					filePath: item.url,
					fileName: item.newFileName || item.fileName,
					fromType:	'chat-3'
				})
				// this.fileDownload(item, updateData)

				// if (item.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE) { // 图片下载
				// 	this.imgDownload(item, updateData)
				// } else { // 文件下载
				// 	this.fileDownload(item, updateData)
				// }
			},
			async imgDownload(item, updateData) {
				this.downloadings.push(item.id)
				const fileData = await this.$store.dispatch('Chat/downloadImageVoice', {
					msgID: item.id,
					fileInfo: {
						cForm: item.cForm,
						url: item.url,
						ext: item.ext,
						duration: item.duration
					}
				})
				await this.$store.dispatch('Chat/updateMsg', {
					id: item.id,
					updatingData: fileData
				})
				console.log('下载数据：', fileData)
				if (item.triggered != 1) {
					console.log('我在同步已读：',	item.id)
					this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
				}
				const	newItem =	Object.assign({}, item, fileData)
				newItem.triggered = 1
				this.$store.dispatch('Chat/updateMsg', {
					id: item.id,
					updatingData:	{
						localPath: newItem.localPath,
						triggered: 1
					}
				})
				updateData(newItem)
				this.downloadings.splice(this.downloadings.findIndex(val => val === item.id), 1)
			},
			fileDownload(item, updateData) { // updateData--暂时没用到
				this.$utils.fun
					.downloadFile({
						type: this.$CHAT_MSG_TYPE.TYPE_FILE,
						filePath: item.url,
						fileName: item.newFileName || item.fileName,
						id: item.id
					}, async({ state, totalBytes, receivedBytes, saveFilePath }) => {
						const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
						if (state == 'finished') {
							this.$store.dispatch('Setting/update_fileDownloadings', { id: item.id, state, progress, localPath: saveFilePath })
							await this.$store.dispatch('Chat/updateMsg', {
								id: item.id,
								updatingData:	{
									localPath: saveFilePath,
									triggered: 1
								}
							})
							if (item.triggered != 1) this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
							this.$message.success(this.$t('common.fileDownload[0]', { fileName: item.newFileName || item.fileName }))
						}	else if (state == 'canceled' || state == 'abort') {
							this.$store.dispatch('Setting/del_fileDownloadings', item.id)
						}	else {
							this.$store.dispatch('Setting/update_fileDownloadings', { id: item.id, state, progress, localPath: saveFilePath })
						}
					})
			},
			getProgress(item, list = [],	updateData) {
				if (!list.length) return	0
				const	result = list.find(itemInfo => item.id == itemInfo.id)
				if (!result) return	0
				if (result.state == 'finished' && result.fromType.indexOf('chat-') > -1) {
					updateData({ id: item.id,	localPath: result.localPath, triggered: 1 })
					this.$message.success(this.$t('common.fileDownload[0]', { fileName: item.newFileName || item.fileName }))
					this.$store.dispatch('Chat/updateMsg', {
						id: item.id,
						updatingData:	{
							localPath: result.localPath,
							triggered: 1
						}
					})
					if (item.triggered != 1) this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
					this.$store.dispatch('Setting/del_fileDownloadings', item.id)
				}	else if	(result.state != 'progress') { // 清理下载失败的数据
					this.$store.dispatch('Setting/del_fileDownloadings', item.id)
				}
				return result	?	result.progress : 0
			},
			formatBytes(bytes, decimal = 2) {
				if (bytes != null) {
					const result = Number(bytes)
					if (result <= 0) {
						return `${result}KB`
					} else {
						const s = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
						const e = Math.floor(Math.log(bytes) / Math.log(1024))
						return `${(bytes / Math.pow(1024, Math.floor(e))).toFixed(decimal)}${s[e]}`
					}
				} else {
					return '-'
				}
			}
		},
		beforeDestroy() {
			this.$store.dispatch('Setting/set_showSearchFile', false)
		}
	}
</script>
<style lang="scss">
  #files { // 修改引入的组件样式
    .layout-menu-item{
		.iconicon_wenjian{color: #05c55f!important;}
		.iconicon_fasongren{color: #1e8eff!important;}
		.iconicon_qunwenjian{color: #ff7a4a!important;}
    }
  }
</style>

<style lang="scss" scoped>
  #files {
		width: 100%;
		height: 100%;
		.files-main{
			width: 100%;
			height: 100%;
			display: flex;
			.files-menu {
				.menu-item {
					display: block;
					padding-left: 15px;
					flex: 0 0 auto;
					&:hover, &.light {
						background-color: $bg;
					}
				}
			}
			.message {
				flex: 1;
				.default {
					width: 100%;
					height: 100%;
					position: relative;
					.main {
						position: absolute;
						left: 50%;
						top: 50%;
						width: 100%;
						transform: translate(-50%, -50%);
						text-align: center;
						p {
							margin: 0;
							color: $lightBlack;
							font-size: 20px;
							font-weight: 400;
							min-height: 30px;
						}
					}
				}
			}
		}
		.files-search{
			width: 100%;
			height: 100%;
		}
  }
</style>
