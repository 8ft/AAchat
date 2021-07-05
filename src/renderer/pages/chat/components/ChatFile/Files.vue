<template>
	<div id="chatFile-file"	ref="chatFile_file">
		<div class="header">
			<div class="operation">
				<div class="left">
					<a-button type="primary"	@click.stop="doFileSelect">
						{{$t('common.sendFiles')}}
					</a-button>
				</div>
				<div class="right" ref="sort">
					<i class="iconfont iconsousuo1" @click="toSearch"></i>
					<a-dropdown :trigger="['click']" :getPopupContainer="() => $refs.sort">
						<i class="iconfont iconpaixu"></i>
						<a-menu slot="overlay" v-model="sortKind" @click="handleSort">
							<a-menu-item key="sortByTime">
								{{$t('common.sortByTime')}}
							</a-menu-item>
							<a-menu-item key="sortByName">
								{{$t('common.sortByName')}}
							</a-menu-item>
							<a-menu-item key="sortBySize">
								{{$t('common.sortBySize')}}
							</a-menu-item>
						</a-menu>
					</a-dropdown>
				</div>
			</div>
			<p class="tip">
				<i class="iconfont iconfasongshibai"></i>
				{{$t('common.fileSaveExpired', { type: thread.type==1?$t('docs.groupChat'):$t('docs.privateChat'), time: paramsConfig.chatMessageOverdue||7 })}}
			</p>
		</div>
		<div class="main"	@click.stop>
			<div class="item" v-for="(item, index) in data" :key="`file-${index}`">
				<AAlist-item class="file"
					:title="getTitle(item)"
					:desc="getDesc(item)"
					:leftCallback="e=>itemClick(e,item)"
					:centerCallback="e=>itemClick(e,item)"
				>
					<template v-slot:left>
						<div class="icon" :class="item.ext"></div>
					</template>
					<template v-slot:right>
						<div class="operation">
							<span class="left">
								<a-tooltip placement="top" :title="$t('common.resend')" v-if="item.isSend&&item.status==2">
									<i class="iconfont iconshuaxin1" :class="{spin: sendings.includes(item.id)}" @click.stop="doResend($CHAT_MSG_TYPE.TYPE_FILE, item)"></i>
								</a-tooltip>
								<a-tooltip placement="top" :title="$t('common.relay')" v-else-if="item.status==1">
									<i class="iconfont iconzhuanfa1" @click.stop="doShare(item)"></i>
								</a-tooltip>
							</span>
							<span class="right" ref="open">
								<a-tooltip placement="top" :title="$t('common.delete')" v-if="item.status==2">
									<i class="iconfont iconguanbi-1" @click.stop="preDelete(item)"></i>
								</a-tooltip>
								<a-dropdown :trigger="['click']" :getPopupContainer="() => $refs.chatFile_file" v-else-if="item.localPath">
									<a-tooltip placement="top" :title="$t('common.open')">
										<span><i class="iconfont iconwenjian"></i><i class="iconfont iconxiangxia"></i></span>
									</a-tooltip>
									<a-menu slot="overlay">
										<a-menu-item key="0" @click="e=>handleOpen(e,'0',item)">{{$t('common.open')}}</a-menu-item>
										<a-menu-item key="1" @click="e=>handleOpen(e,'1',item)">{{$t('common.open')}} {{$t('common.folder')}}</a-menu-item>
									</a-menu>
								</a-dropdown>
								<a-tooltip placement="top" :title="$t('common.download')" v-else>
									<i class="iconfont iconxiazai1" @click.stop="doDownload($CHAT_MSG_TYPE.TYPE_FILE,item)"></i>
								</a-tooltip>
							</span>
						</div>
					</template>
				</AAlist-item>
				<!-- <a-progress class="progress" :percent="getProgress(item,fileDownloadings,$CHAT_MSG_TYPE.TYPE_FILE)" status="active" :showInfo="false" :strokeWidth="2" v-if="fileDownloadings.find(loadingInfo=>loadingInfo.id==item.id)" /> -->
				<a-progress class="progress" :percent="item.progress" status="active" :showInfo="false" :strokeWidth="2" v-if="item.progress&&item.progress!=100" />
			</div>
		</div>
		<!-- 搜索面板 -->
		<div class="searchBody" v-if="showSearch">
			<div class="searchBody-header">
				<i class="iconfont iconfanhui icon" @click.stop="goBack"></i>
				<a-input ref="searchIpt"	class="searchInput" :placeholder="$t('search.searchByFileName')" v-model="fileKey">
					<i slot="prefix" class="iconfont iconsousuo" />
					<a-icon slot="suffix" class="icon" type="close-circle" style="color: rgba(0,0,0,.45)" @click.stop="fileKey = '';$refs.searchIpt.focus()" />
				</a-input>
			</div>
			<div class="searchBody-main" v-if="searchResult.length"	@click.stop>
				<a-spin :spinning="searching">
				</a-spin>
				<p class="count">
					{{$t('search.searchDocRes', { number: searchResult.length })}}
				</p>
				<div class="item" v-for="(item, index) in searchResult" :key="`searhFile-${index}`">
					<AAlist-item class="file"
						:title="getTitle(item)"
						:desc="getDesc(item)"
						:leftCallback="e=>itemClick(e,item)"
						:centerCallback="e=>itemClick(e,item)"
					>
						<template v-slot:left>
							<div class="icon" :class="item.ext"></div>
						</template>
						<template v-slot:right>
							<div class="operation">
								<span class="left">
									<a-tooltip placement="top" :title="$t('common.resnd')" v-if="item.isSend&&item.status==2">
										<i class="iconfont iconshuaxin1"	:class="{spin: sendings.includes(item.id)}"	@click.stop="doResend($CHAT_MSG_TYPE.TYPE_FILE, item)"></i>
									</a-tooltip>
									<a-tooltip placement="top" :title="$t('common.relay')" v-else-if="item.status==1">
										<i class="iconfont iconzhuanfa1" @click.stop="doShare(item)"></i>
									</a-tooltip>
								</span>
								<span class="right" ref="open">
									<a-tooltip placement="top" :title="$t('common.delete')" v-if="item.status==2">
										<i class="iconfont iconguanbi-1" @click.stop="preDelete(item)"></i>
									</a-tooltip>
									<a-dropdown :trigger="['click']" :getPopupContainer="() => $refs.chatFile_file" v-else-if="item.localPath">
										<a-tooltip placement="top" :title="$t('common.open')">
											<span><i class="iconfont iconwenjian"></i><i class="iconfont iconxiangxia"></i></span>
										</a-tooltip>
										<a-menu slot="overlay">
											<a-menu-item key="0" @click="e=>handleOpen(e,'0',item)">{{$t('common.open')}}</a-menu-item>
											<a-menu-item key="1" @click="e=>handleOpen(e,'1',item)">{{$t('common.open')}} {{$t('common.folder')}}</a-menu-item>
										</a-menu>
									</a-dropdown>
									<a-tooltip placement="top" :title="$t('common.download')" v-else>
										<i class="iconfont iconxiazai1" @click.stop="doDownload($CHAT_MSG_TYPE.TYPE_FILE,item)"></i>
									</a-tooltip>
								</span>
							</div>
						</template>
					</AAlist-item>
					<!-- <a-progress class="progress" :percent="getProgress(item,fileDownloadings,$CHAT_MSG_TYPE.TYPE_FILE)" status="active" :showInfo="false" :strokeWidth="2" v-if="fileDownloadings.find(loadingInfo=>loadingInfo.id==item.id)" /> -->
					<a-progress class="progress" :percent="item.progress" status="active" :showInfo="false" :strokeWidth="2" v-if="item.progress&&item.progress!=100" />
				</div>
			</div>
			<div class="searchBody-nodata" v-else-if="showNoData">
				<a-spin :spinning="searching">
					{{$t('common.noResultsFound')}}
				</a-spin>
			</div>
		</div>
		<!-- 删除文件 -->
		<a-modal
			:visible="delMsgDialog"
			class="notification-IM"
			:getContainer="()=>$refs.chatFile_file"
			:title="$t('chat.fileBeDeleted[1]')"
			centered
			:width="436"
			:maskClosable="false"
			@cancel="delMsgDialog=false;"
		>
			<p>{{$t('chat.fileBeDeleted[2]')}}</p>
			<template #footer>
				<a-button
					type="primary"
					:loading="deleting"
					@click="handleDelete(currentItem)"
				>
					{{$t('common.delete')}}
				</a-button>
				<a-button @click="delMsgDialog=false;">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
	</div>
</template>
<script>
	import AAlistItem from '@/components/AAlist/item.vue'
	import youxiangImg from '@/assets/img/youxiang.png'
	// import { sortByPinyin } from '@/utils/common/pinyin'

	let searchPool

	export default {
		name: 'ChatFileFile',
		components: { AAlistItem },
		props: {
			thread: Object,
			data: Array,
			sendings: Array,
			updateData: Function,
			doFileSelect: Function,
			doResend:	Function,
			doShare:	Function,
			doDelete:	Function,
			doDownload:	Function,
			doBurntAfterRead:	Function,
			doSort:	Function,
			// fileDownloadings:	Array,
			getProgress: Function
		},
		data() {
			return {
				searching: false,
				youxiangImg,
				fileKey: '',
				showSearch: false,
				searchResult: [],
				sortKind: ['sortByTime'],
				deleting:	false,
				delMsgDialog:	false,
				currentItem: {},
				showNoData: false
			}
		},
		computed: {
			paramsConfig() {
				return this.$store.state.Setting.paramsConfig
			}
			// groupUsers() {
			// 	return this.$store.getters['MyGrounp/groupUsers'](this.thread.id)
			// },
			// friends() {
			// 	return this.$store.state.MyFriend.list
			// },
			// users() {
			// 	return this.$store.state.User.list
			// }
		},
		watch: {
			fileKey(nVal, oVal) {
				if (nVal == oVal) {
					return
				} else if (!nVal) {
					this.searchResult = []
				} else {
					searchPool(nVal)
				}
			}
		},
		mounted() {
			// console.log('文件数据', this.data)
		},
		methods: {
			itemClick(e, item) {	// 在线预览
				if (this.$store.state.Setting.online) { // 网络可用，使用在线预览
					this.openFilePlayer(item)
				} else { // 网络不可用，调用本地打开，本地打开方法会判断本地文件存不存在
					this.handleOpen(e, '0', item)
				}
			},
			async	openFilePlayer(item) {
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({
					action: 'openFilePlayer',
					params: {
						url: item.url,
						filePath: item.localPath,
						fileName: item.fileName,
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
					this.updateData(this.$CHAT_MSG_TYPE.TYPE_FILE, Object.assign({}, item, { triggered: 1 }))
					await this.$store.dispatch('Chat/updateMsg', {
						id: item.id,
						updatingData: {
							triggered: 1
						}
					})
					this.$utils.chatSdk.cReadAsync(item.id) // 同步已读--没走下载
				}
			},
			async	handleOpen(e, key, item) {
				window.event ? window.event.cancelBubble = true : e.stopPropagation()
				if (!(await	this.$utils.fun.fileExist(item.localPath))) {
					this.updateData(this.$CHAT_MSG_TYPE.TYPE_FILE, Object.assign({}, item, { localPath: '' }))
					this.$message.warning(this.$t('common.fileNotExist[2]'))
					return
				}
				switch (key) {
				case '0':
					this.$utils.fun.openFile(item.localPath)
					break
				case '1':
					this.$utils.fun.openFolder(item.localPath)
					break
				}
				if (this.isShowBurntAfterRead(item)) { // 未读的阅后即焚
					this.doBurntAfterRead(this.$CHAT_MSG_TYPE.TYPE_FILE, item)
				}
			},
			preDelete(item) {
				this.currentItem = item
				this.deleting	= false
				this.delMsgDialog = true
			},
			async	handleDelete(item) {
				this.deleting	= true
				await	this.doDelete(this.$CHAT_MSG_TYPE.TYPE_FILE, item)
				this.deleting	= false
				this.delMsgDialog	= false
			},
			handleSort({ key }) {
				if (key == this.sortKind[0]) return
				this.sortKind = [key]
				this.doSort(key)
			},
			// handleSort(sortName) { // 顺序不能变
			// 	this[sortName.key]()
			// 	this.sortKind = [sortName.key]
			// },
			// sortByName() {
			// 	if (this.sortKind[0] != 'sortByTime') this.sortByTime()
			// 	this.$emit('update:data', sortByPinyin(this.data, 'fileName', true))
			// },
			// sortBySize() {
			// 	if (this.sortKind[0] != 'sortByTime') this.sortByTime()
			// 	this.data.sort((a, b) => {
			// 		return (b.fileSize - a.fileSize)
			// 	})
			// },
			// sortByTime() {
			// 	this.data.sort((a, b) => {
			// 		return (b.timestamp - a.timestamp)
			// 	})
			// },
			// 搜索部分
			handleSearch(fileKey) {
				this.searching = true
				this.searchResult = this.data.filter(item => {
					const fileName = item.newFileName || item.fileName
					return fileName && fileName.indexOf(fileKey) >= 0
				})
				this.searching = false
				this.showNoData = !(this.searchResult.length > 0)
			},
			toSearch() {
				if (!searchPool) searchPool = this.debounce(this.handleSearch, 700)
				this.showSearch = true
				this.$nextTick(() => this.$refs.searchIpt.focus())
			},
			debounce(fn, timeout = 500, immediate = true) {
				let timer
				const debounced = function(...args) {
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => {
						if (immediate) immediate = false
						fn.apply(fn, args)
					}, immediate ? 0 : timeout)
				}
				debounced.cancel = function() {
					clearTimeout(timer)
					timer = null
				}
				return debounced
			},
			goBack() {
				this.showSearch = false
				this.fileKey = ''
				this.searchResult = []
			},
			// 信息展示部分
			getTitle(item) {
				const fileName = item.newFileName || item.fileName
				let	result = ''
				if (item.burntAfterRead === 1 && item.isSend === 0) {
					result = `<span>${fileName}<i class='${item.triggered != 1 ? 'warning' : 'gray'} iconfont iconyuehoujifenkaiqi'></i></span>`
				} else {
					result = fileName
				}
				return result
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
			},
			getDesc(item,	friends, groupUsers, users) {
				if (item.status === 2)	{
					return	`<i class='warning'>${this.$t('chat.sendFileTip[0]')}</i>`
				}	else {
					const fileSize = item.fileSize
					const sendTime = this.$utils.time.formatTimestamp(item.timestamp, 'Y/M/D h:m')
					const	senderName = item.name
					return `${this.formatBytes(fileSize, 1)}&nbsp;&nbsp${sendTime}&nbsp;&nbsp${senderName}`
					// const	friendInfo = friends.find(friendInfo => friendInfo.userId === item.senderID) || {}
					// if (friendInfo.label)	{
					// 	senderName = friendInfo.label
					// }	else {
					// 	const	groupUserInfo = groupUsers.find(groupUserInfo => groupUserInfo.userId === item.senderID) || {}
					// 	if (groupUserInfo.userLabel) {
					// 		senderName = groupUserInfo.userLabel
					// 	}	else {
					// 		const	userInfo = users.find(userInfo => userInfo.userId === item.senderID) || {}
					// 		senderName = userInfo.nickName
					// 	}
					// }
					// return `${this.formatBytes(fileSize, 1)}&nbsp;&nbsp${sendTime}&nbsp;&nbsp${senderName}`
				}
			},
			isShowBurntAfterRead(item) {
				return item.burntAfterRead === 1 && item.isSend === 0 && item.triggered != 1
			}
		},
		beforeDestroy() {
			searchPool && searchPool.cancel()
			searchPool = null
		}
	}
</script>
<style lang="scss">
  #chatFile-file {
    .main, .searchBody-main {
      .item {
        position: relative;
        .file {
          padding: 5px 10px	5px	20px;
          border: none;
          .warning {
            color: #FD4545;
          }
					.gray{
						color: #c6c6c6;
					}
					.meta-description{
						color: $gray;
					}
          &:hover {
            background-color: #F8F8F8;
            .meta-title {
              color: $darkBlue;
            }
          }
					.icon {
						width: 29px;
						height: 38px;
						@include retinize('file-icon/other');
						float: left;
						&.txt {
							@include retinize('file-icon/txt');
						}
						&.xls, &.xlsx {
							@include retinize('file-icon/excel');
						}
						&.html {
							@include retinize('file-icon/html');
						}
						&.key {
							@include retinize('file-icon/key');
						}
						&.pdf {
							@include retinize('file-icon/pdf');
						}

						&.ppt, &.pptx {
							@include retinize('file-icon/ppt');
						}
						&.docx, &.doc {
							@include retinize('file-icon/word');
						}
						&.zip, &.rar {
							@include retinize('file-icon/zip');
						}
					}
          .operation {
            .left {
              margin-right: 5px;
              &:hover {
                color: $darkBlue;
              }
							@keyframes spin {
								from {
									transform: rotate(0deg);
								}
								to {
									transform: rotate(360deg);
									// transition: all 0.6s;
								}
							}
							.iconshuaxin1{
								display: inline-block;
								position: relative;
								&.spin{
									animation: spin 0.6s linear infinite;
								}
							}
            }
            .right {
							display:inline-block;
							min-width: 30px;
              .iconxiangxia {
                font-size: 10px;
                position: relative;
                top: -3px;
              }
              &:hover {
                color: $darkBlue;
              }
              .ant-dropdown-menu-item {
                text-align: center;
              }
            }
          }
        }
        .progress {
          padding: 0px 20px;
          position: absolute;
          bottom: -7px;
        }
      }
    }
    .searchBody {
      .searchBody-header {
        .ant-input {
          background-color: #F8F8F8;
          border-color: #f0f0f0;
        }
        .ant-input:focus {
          box-shadow: none;
        }
      }
    }
  }
</style>
<style lang="scss" scoped>
  #chatFile-file {
    // height: 100%;
    position: relative;
    .header {
      padding: 15px 20px;
      .operation {
        display: flex;
        vertical-align: middle;
        & > .left {
          flex: 1;
        }
        & > .right {
          padding-top: 8px;
          .iconfont {
            font-size: 18px;
            margin-right: 10px;
            cursor: pointer;
            &.iconpaixu {
              margin: 0
            }
            &:hover {
              color: $darkBlue;
            }
          }
        }
      }
      .tip {
        color: $gray;
        font-size: 12px;
        margin: 8px 0px 0;
        .iconfasongshibai {
          position: relative;
          top: 2px;
          margin-right: 2px;
        }
      }
    }
    .searchBody {
      width: 100%;
      min-height: 90vh;
      position: absolute;
      top: 0;
      left: 0;
      background-color: #FFF;
      .searchBody-header {
        padding: 15px 20px;
        display: flex;
        .icon {
          cursor: pointer;
          &:hover {
            color: $darkBlue;
          }
          &.iconfanhui {
            line-height: 32px;
            padding-right: 6px;
          }
        }
        .searchInput {
          flex: 1;
          background-color: #F8F8F8;
        }
      }
      .searchBody-main {
        .count {
          color: $gray;
          font-size: 14px;
          padding: 0 20px;
        }
      }
      .searchBody-nodata {
        color: $gray;
        font-size: 14px;
        text-align: center;
        margin-top: 20px;
      }
    }
  }
</style>
