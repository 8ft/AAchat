<template>
	<div id="chat-file" :class="{hidden:!visible}" v-clickoutside="_hide" ref="chatFile">
		<div class="chat-file-header">
			<div class="menu">
				<span :class="{light: menuKey == $CHAT_MSG_TYPE.TYPE_FILE}" @click="showMenu($CHAT_MSG_TYPE.TYPE_FILE)">{{$t('common.file')}}</span>
				<span :class="{light: menuKey == $CHAT_MSG_TYPE.TYPE_IMAGE}" @click="showMenu($CHAT_MSG_TYPE.TYPE_IMAGE)">{{$t('common.image')}}</span>
				<span :class="{light: menuKey == $CHAT_MSG_TYPE.TYPE_VIDEO}" @click="showMenu($CHAT_MSG_TYPE.TYPE_VIDEO)">{{$t('common.video')}}</span>
			</div>
			<i class="iconfont icontongyongguanbi hoverable" @click="_hide"></i>
		</div>
		<div class="chat-file-main">
			<a-spin :spinning="isLoading">
				<!-- 加载过的列表保留 -->
				<template v-if="showHistory[$CHAT_MSG_TYPE.TYPE_FILE]">
					<files v-show="menuKey == $CHAT_MSG_TYPE.TYPE_FILE"
						:thread="thread"
						:sendings="sendings"
						:data.sync="showHistory[$CHAT_MSG_TYPE.TYPE_FILE].list"
						:updateData="updateData"
						:doFileSelect="doFileSelect"
						:doResend="doResend"
						:doDelete="doDelete"
						:doShare="doShare"
						:doDownload="doDownload"
						:doBurntAfterRead="doBurntAfterRead"
						:doSort="doSort"
						:getProgress="getProgress"
					/>
				</template>
				<template v-if="showHistory[$CHAT_MSG_TYPE.TYPE_IMAGE]">
					<images v-show="menuKey == $CHAT_MSG_TYPE.TYPE_IMAGE"
						:data="dataTransformate(showHistory[$CHAT_MSG_TYPE.TYPE_IMAGE].list)"
						:getUrl="getUrl"
						:updateData="updateData"
						:doBurntAfterRead="doBurntAfterRead"
						:sizeTransformate="sizeTransformate"
					/>
				</template>
				<template v-if="showHistory[$CHAT_MSG_TYPE.TYPE_VIDEO]">
					<videos v-show="menuKey == $CHAT_MSG_TYPE.TYPE_VIDEO"
						:data="dataTransformate(showHistory[$CHAT_MSG_TYPE.TYPE_VIDEO].list)"
						:getUrl="getUrl"
						:updateData="updateData"
						:doDownload="doDownload"
						:doBurntAfterRead="doBurntAfterRead"
						:sizeTransformate="sizeTransformate"
					></videos>
				</template>
				<p class="loadMore" v-show="showHistory[menuKey]&&showHistory[menuKey].list.length < showHistory[menuKey].count">
					<span @click="loadMore">{{$t('common.loadMore')}}</span>
				</p>
				<div class="nodata" v-show="showHistory[menuKey]&&showHistory[menuKey].list.length < 1">
					<img src="~@/assets/img/nothing.png" width="240" height="200">
					<p class="type" v-if="menuKey === $CHAT_MSG_TYPE.TYPE_IMAGE">
						{{$t('chat.noImage')}}
					</p>
					<p class="type" v-else-if="menuKey === $CHAT_MSG_TYPE.TYPE_FILE">
						{{$t('chat.noFile')}}
					</p>
					<p class="type" v-else-if="menuKey === $CHAT_MSG_TYPE.TYPE_VIDEO">
						{{$t('chat.noVideo')}}
					</p>
					<p v-if="menuKey === $CHAT_MSG_TYPE.TYPE_IMAGE">
						{{$t('chat.noImageTip')}}
					</p>
					<p v-else-if="menuKey === $CHAT_MSG_TYPE.TYPE_FILE">
						{{$t('chat.noFileTip')}}
					</p>
					<p v-else-if="menuKey === $CHAT_MSG_TYPE.TYPE_VIDEO">
						{{$t('chat.noVideoTip')}}
					</p>
				</div>
			</a-spin>
		</div>
	</div>
</template>
<script>
	import Files from './Files.vue'
	import Images from './Images.vue'
	import Videos from './Videos.vue'
	import { sortByPinyin } from '@/utils/common/pinyin'

	export default {
		name: 'ChatFile',
		components: { Files, Images, Videos },
		props: {
			visible: Boolean,
			thread: Object
		},
		data() {
			return {
				isLoading: false,
				openTime: '',
				menuKey: this.$CHAT_MSG_TYPE.TYPE_FILE, // 103.文件、102.图片、105.视频
				showHistory: {}, // 数据缓存减少数据请求---{102:{params,count,list},...}
				sendings:	[],
				downloadings: [],
				currentSort: '', // 针对文件的名称排序
				sortByNameList:	[], // 针对文件的名称排序
				orderKey:	{ sortByTime:	'timestamp DESC', sortBySize: 'fileSize DESC,timestamp DESC', sortByName: 'timestamp DESC' }
			}
		},
		computed: {
			userCardWorking() {
				return !!this.$store.state.OPcomponent.userCard.userId
			},
			fileDomainURL() {
				return this.$store.state.Setting.fileDomainURL
			}
			// fileDownloadings() {
			// 	return this.$store.state.Setting.fileDownloadings
			// }
		},
		watch: {
			'visible': {
				handler(nVal, oVal) {
					if (nVal) this.init()
				},
				immediate: true
			},
			'$store.state.Setting.fileDownloadings': {
				async	handler(nVal)	{
					if (!this.visible) return
					const	fileDownloadings = Object.values(nVal).filter(loadingInfo => loadingInfo.fromType.indexOf('chat-') >= 0)
					if (fileDownloadings.length) {
						fileDownloadings.forEach(loadingInfo =>	{
							const	fileInfo = this.showHistory[loadingInfo.type]	&& this.showHistory[loadingInfo.type].list.find(fileInfo => loadingInfo.id === fileInfo.id)
							console.log('聊天文件下载', fileInfo, loadingInfo)
							if (fileInfo) {
								if (loadingInfo.state === 'finished') {
									this.updateData(loadingInfo.type, Object.assign({}, fileInfo, { localPath: loadingInfo.localPath, triggered: 1,	progress:	0 }))
									this.$message.success(this.$t('common.fileDownload[0]', { fileName: fileInfo.newFileName || fileInfo.fileName }))
									this.$store.dispatch('Chat/updateMsg', {
										id: fileInfo.id,
										updatingData:	{
											localPath: loadingInfo.localPath,
											triggered: 1
										}
									})
									if (fileInfo.triggered != 1) this.$utils.chatSdk.cReadAsync(fileInfo.id) // 同步已读
									this.$store.dispatch('Setting/del_fileDownloadings', fileInfo.id)
								}	else if	(loadingInfo.state === 'progress') {
									this.updateData(loadingInfo.type, Object.assign({}, fileInfo, { progress: loadingInfo.progress }))
								}	else if	(loadingInfo.state != 'progress') { // 清理下载失败的数据
									this.$store.dispatch('Setting/del_fileDownloadings', fileInfo.id)
									this.updateData(loadingInfo.type, Object.assign({}, fileInfo, { progress: 0 }))
								}
							}
						})
					}
				},
				deep:	true
			}
		},
		created() {
		},
		methods: {
			// 文件消息相关操作----------------------------------->>>
			doFileSelect(e) {	// 发送文件
				this.$emit('fileSelect', e)
				this._hide(e)
			},
			async	doBurntAfterRead(key, item) {	// 阅读阅后即焚消息
				this.$utils.chatSdk.cDeleteAsync(item.id, JSON.stringify({ burntAfterRead: 1 }), 'true')// 删除服务端数据
				if (item.triggered != 1) {
					this.updateData(key, Object.assign({}, item, { triggered: 1 }))
					this.$store.dispatch('Chat/updateMsg', {
						id: item.id,
						updatingData:	{
							triggered: 1
						}
					})
				}
			},
			async	doResend(key,	item) { // 重新发送
				if (this.sendings.includes(item.id)) {
					return
				}	else if (!this.onlineCheck()) {
					return
				}
				this.sendings.push(item.id)
				const res = await this.$store.dispatch('Chat/resendMessage', { thread: this.thread, message: item })
				if (res && res.code == 0) {
					const	newItem	=	await	this.$utils.sqlite.getChatData({ where: `id='${res.data.id}'` })
					this.updateData(key, newItem[0], item.id)// 下载成功后id会被更新
					this.sendings.splice(this.sendings.findIndex(val => val === item.id), 1)
					this.$message.success(this.$t('common.sendSuccessfully'))
				}
			},
			doShare(item)	{ // 转发
				if (!this.onlineCheck()) return
				this.$emit('share',	item)
			},
			async	doDelete(key,	item) { // 删除文件
				if (this.sendings.includes(item.id))	{
					this.$message.warning(this.$t('common.sendFileDel'))
					return
				}
				await this.$store.dispatch('Chat/delMsg', {
					threadID: this.thread.id,
					ids: [item.id]
				})
				this.showHistory[key].list = this.showHistory[key].list && this.showHistory[key].list.filter(Obj => item.id != Obj.id)
			},
			async	doDownload(key,	item) { // 下载----视频和文件
				// if (this.downloadings.includes(item.id)) {
				if (this.$store.state.Setting.fileDownloadings[item.id.replace(/-/g, '')]) {
					return
				}	else if (!this.onlineCheck()) {
					return
				}	else if (!(await this.$utils.fun.urlExist(item.url))) {
					this.$message.warning(this.$t('common.FileExpired'))
					return
				}

				this.$eventBus.$emit('downloadFile', {
					type: key,
					id: item.id,
					filePath: item.url,
					fileName: item.fileName,
					fromType:	'chat-2'
				})
				// return new Promise((resolve, reject) => {
				// 	this.$utils.fun
				// 		.downloadFile({
				// 			type: key,
				// 			filePath: item.url,
				// 			fileName: item.fileName,
				// 			id: item.id
				// 		}, async({ state, totalBytes, receivedBytes, saveFilePath }) => {
				// 			const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
				// 			const	newItem = Object.assign({}, item, { progress })
				// 			if (!this.downloadings.includes(item.id)) this.downloadings.push(item.id)
				// 			if (state === 'finished') {
				// 				newItem.localPath = saveFilePath
				// 				this.downloadings.splice(this.downloadings.findIndex(val => val === item.id), 1)
				// 				await this.$store.dispatch('Chat/updateMsg', {
				// 					id: item.id,
				// 					updatingData:	{
				// 						localPath: newItem.localPath,
				// 						triggered: 1
				// 					}
				// 				})
				// 				if (newItem.triggered != 1) this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
				// 				newItem.triggered = 1
				// 				this.updateData(key, newItem)
				// 				console.log(789, state)
				// 				resolve(saveFilePath)
				// 			}	else {
				// 				this.updateData(key, newItem)
				// 			}
				// 		})
				// })
			},
			updateData(key, newItem, oldKey) { // 更新当前数据池
				const	index = this.showHistory[key].list.findIndex(item	=> {
					return item.id == newItem.id || item.id == oldKey
				})
				this.$set(this.showHistory[key].list,	index, newItem)
			},
			getUrl(item) { // fun有判断本地有没有文件，服务器图片是否有效的方法
				// let	url = ''
				// if (this.$utils.fun.fileExist(item.localPath)) {
				// 	url = `file://${item.data && item.localPath}`
				// } else {
				// 	url = this.fileDomainURL + item.url
				// }
				// console.log('地址', url)
				// 优化页面加载速度
				return item.localPath ? `file://${item.localPath}` : (this.fileDomainURL + item.url)
			},
			// 页面交互数据支持------------------------------------------------->>>
			showMenu(key) {
				if (this.menuKey == key) return
				this.menuKey = key
				if (!this.showHistory[key]) this.getList()
			},
			doSort(key) {
				this.currentSort = key
				this.showHistory[this.menuKey].params.index = 0
				this.showHistory[this.menuKey].params.order = this.orderKey[key]
				this.getList(key)
			},
			initParams() {
				const loadingMsgIds = ''
				// const	downloadingMsgIds	=	this.$store.state.Chat.downloadingMsgs.map(item	=> {
				// 	return item.split('|')[0]
				// })
				// loadingMsgIds	=	downloadingMsgIds.join(',').replace(/,/g, "','")
				return {
					where: `threadID='${this.thread.id}' and cForm=${this.menuKey} and status!=0 ${this.menuKey != this.$CHAT_MSG_TYPE.TYPE_FILE ? 'and status!=2' : ''} and timestamp < ${this.openTime} and id not in ('${loadingMsgIds}')`,
					order: 'timestamp DESC',
					returnCount: true,
					size: this.menuKey == this.$CHAT_MSG_TYPE.TYPE_FILE ? 20 : 50, // 文件整屏数量较少
					index: 0
				}
			},
			async getList(order) {
				const data = this.showHistory[this.menuKey]
				const params = (data && data.params) || this.initParams()// 保证搜索条件where不会变---以打开时刻的情况为准

				if (this.menuKey == this.$CHAT_MSG_TYPE.TYPE_FILE && this.currentSort == 'sortByName') {
					if (!this.sortByNameList.length) {
						this.isLoading = true
						const res = await this.$utils.sqlite.getChatData(Object.assign({}, params, { index: null, size: null }))
						this.isLoading = false
						this.showHistory[this.menuKey].count = res.count
						this.sortByNameList = sortByPinyin(res.messages, 'fileName', true)
					}
					const	showCount = ((this.showHistory[this.menuKey].params.index + 1) * this.showHistory[this.menuKey].params.size) || this.showHistory[this.menuKey].params.size
					const	list = this.sortByNameList.slice(0, showCount)

					this.$set(this.showHistory, this.menuKey, Object.assign({}, this.showHistory[this.menuKey], { list }))
					console.log(12, params, this.sortByNameList, this.showHistory)
					return
				}

				// this.isLoading = true
				const res = await this.$utils.sqlite.getChatData(params)
				// this.isLoading = false

				this.$set(this.showHistory, this.menuKey, {
					params,
					count: res.count,
					list: params.index > 0 ? this.showHistory[this.menuKey].list.concat(res.messages) : res.messages
				})
			},
			loadMore() {
				if (!this.showHistory[this.menuKey]) return
				this.showHistory[this.menuKey].params.index += 1
				this.getList()
			},
			init() {
				this.menuKey = this.$CHAT_MSG_TYPE.TYPE_FILE
				this.openTime = new Date().getTime()
				this.showHistory = {}
				// 针对文件的名称排序重置
				this.currentSort = ''
				this.sortByNameList = []
				this.getList()
			},
			dataTransformate(data) { // 当前是已经排序过的数据
				// 是否在本周(周一至周日)
				function inCurrentWeek(time) {
					const now = new Date()
					const nowYear = now.getFullYear()
					const nowMonth = now.getMonth()
					const nowDay = now.getDate()
					const nowDayOfWeek = now.getDay()

					const weekStartTime = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 1).getTime()
					const weekEndTime = new Date(nowYear, nowMonth, nowDay + (7 - nowDayOfWeek)).getTime()
					return (weekStartTime < time) && (weekEndTime > time)
				}
				// 按月分组数据---本周-本月-X年X月
				function groupByMonth(arr = []) {
					const groupResult = {}
					const currentMonth = this.$utils.time.formatTimestamp(new Date().getTime(), 'Y年M月')
					arr.forEach(item => {
						if (!item.timestamp) console.error(`有数据没有创建时间timestamp`)
						if (inCurrentWeek(item.timestamp)) {
							groupResult['本周'] ? groupResult['本周'].push(item) : (groupResult['本周'] = [item])
						} else {
							let key = this.$utils.time.formatTimestamp(item.timestamp, 'Y年M月')
							if (key === currentMonth) key = '本月'
							groupResult[key] ? groupResult[key].push(item) : (groupResult[key] = [item])
						}
					})
					return groupResult
				}
				return groupByMonth.bind(this, data)()
			},
			sizeTransformate(item) {
				const	width	=	item.width
				const	height =	item.height
				const	result = {
					[width > height ? 'height' : 'width']: '100%',
					[width > height ? 'width' : 'height']: 'auto'
				}
				return result
			},
			_hide(e) {
				if (e.target.id === 'chatFileSwitch' || this.userCardWorking) return
				this.$emit('hide')
			},
			getProgress(item, list = [], key) {
				const	result = list.find(itemInfo => item.id == itemInfo.id)
				if (!result) return	0
				if (result.state == 'finished' && result.fromType.indexOf('chat-') > -1) {
					console.log('当前文件下载成功', item, result)
					this.updateData(key, Object.assign({}, item, { localPath: result.localPath, triggered: 1 }))
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
			}
		}
	}
</script>
<style lang="scss">
	#chat-file {
		.ant-spin-nested-loading,	.ant-spin-container{
			height:	100%
		}
	}
</style>
<style lang="scss" scoped>
  #chat-file {
    position: absolute;
    top: 0;
    right: 0;
    width: 600px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0px 4px 16px 0px rgba(224, 224, 224, 0.55);
    z-index: 999;
		transition: all 0.3s ease-out;
		-webkit-app-region: no-drag;
		// .animation{
		// 	@keyframes mymove
		// 	{
		// 		from {width: 0px;}
		// 		to {width: 600px;}
		// 	}
		// 	animation: mymove 0.4s;
		// }
    &.hidden {
      transform: translateX(100%);
	    box-shadow: 0px 0px 0px 0px rgba(224, 224, 224, 0.55)!important;
    }
    .chat-file-header {
      height: 80px;
      font-size: 18px;
      color: $black;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
      padding-left: 20px;
	    -webkit-app-region: drag;
      .menu {
        flex: 1;
        & > span {
          display: inline-block;
          line-height: 80px;
          padding: 0px 5px;
          margin-right: 10px;
          &:hover {
            color: $darkBlue
          }
          &.light {
            color: $darkBlue;
            border-bottom: 2px solid $darkBlue;
          }
        }
      }
      .iconfont {
        font-size: 12px;
        padding: 20px 30px 20px 20px;
      }
    }
    .chat-file-main {
      height: 100%;
      overflow-y: scroll;
			margin-bottom: 10px;
			position: relative;
      .loadMore {
        text-align: center;
        padding: 20px;
				padding-bottom: 0px;
        & > span {
          color: $black;
          font-size: 14px;
          cursor: pointer;
          &:hover {
            color: $darkBlue;
          }
        }
      }
      .nodata {
				width: 100%;
				position: absolute;
				top: 0;
				z-index: -1;
        text-align: center;
        padding-top: 120px;
        & > p {
          color: $gray;
          font-size: 12px;
          margin-bottom: 8px;
          &.type {
            font-size: 14px;
	          color: $black;
          }
        }
      }
    }
  }
</style>
