<template>
	<div id="files-bySender" ref="filesBySender">
		<h3	class="title">
			<span	:class="{gray: currentUser.userId}"	@click="closeFileList">{{$t('common.sender')}}</span>
			<span	v-if="currentUser.userId"><i class="iconfont iconxiayiye gray"></i>{{currentUser.label || currentUser.userInfo.nickName}}</span>
		</h3>
		<div class="sender-list" v-show="!currentUser.userId">
			<div class="item" @click="showFileList(item)"	v-for="item in friendList" :key="item.userId">
				<AAlist-item
					:data="item"
					:src="item.userInfo.userAvatar || defaultAvatar"
					:title="item.label || item.userInfo.nickName"
				/>
			</div>
		</div>
		<div class="file-list" ref="fileListBody" v-show="currentUser.userId">
			<a-spin :spinning="loading">
				<div style="height:100%">
					<div class="file-item" v-for="item in list"	:key="item.id">
						<div class="item-main flex-layout" @click="doPreview(item,updateData,()=>{initParams(currentUser);getList()})">
							<div class="name">
								<div class="icon" :class="item.ext"></div>
								<a-tooltip placement="topLeft" :title="item.newFileName||item.fileName">
									<p>{{item.newFileName||item.fileName}}</p>
								</a-tooltip>
							</div>
							<div class="time">
								{{$utils.time.formatTimestamp(item.timestamp, 'Y/M/D h:m')}}
							</div>
							<div class="size">
								{{formatBytes(item.fileSize, 1)}}
							</div>
							<div class="operation" @click.stop>
								<a-dropdown :getPopupContainer="() => $refs.filesBySender">
									<i class="iconfont icongengduo"></i>
									<a-menu slot="overlay" @click="val=>handleOperaton(val,item)">
										<a-menu-item key="0" v-if="!item.localPath">
											{{$t('common.download')}}
										</a-menu-item>
										<a-sub-menu :title="$t('common.open')" v-else>
											<a-menu-item key="1">
												{{$t('common.open')}}
											</a-menu-item>
											<a-menu-item key="2">
												{{$t('common.open')}} {{$t('common.folder')}}
											</a-menu-item>
										</a-sub-menu>
										<a-menu-item key="3">
											{{$t('common.relay')}}
										</a-menu-item>
										<a-menu-item key="4">
											{{$t('common.delete')}}
										</a-menu-item>
									</a-menu>
								</a-dropdown>
							</div>
						</div>
						<!-- <a-progress class="progress" :percent="getProgress(item,fileDownloadings,updateData)" status="active" :showInfo="false" :strokeWidth="2" v-if="fileDownloadings.find(file=>file.id==item.id)" /> -->
						<a-progress class="progress" :percent="item.progress" status="active" :showInfo="false" :strokeWidth="2" v-if="item.progress&&item.progress!=100" />
					</div>
					<div class="default" v-show="!((list.length&&!loading)||loading)">
						<div class="main">
							<img src="~@/assets/img/nofile.png" width="240" height="200" :alt="$t('common.noData')">
							<h3>{{$t('docs.tip.Docs[0]')}}</h3>
							<p>{{$t('docs.tip.Docs[1]')}}</p>
						</div>
					</div>
				</div>
			</a-spin>
		</div>
	</div>
</template>

<script>
	import AAlistItem from '@/components/AAlist/item.vue'
	import { sortByPinyin } from '@/utils/common/pinyin'
	import geren from '@/assets/img/geren_default@2x.png'

	export default {
		name: 'FileBySender',
		components: { AAlistItem },
		props: {
			fileDownloadings: Array,
			getProgress: Function,
			doDownload: Function,
			doOpen: Function,
			showSelectModal:	Function,
			doDelete:	Function,
			doPreview: Function,
			formatBytes: Function,
			linkClick: String
		},
		data() {
			return {
				loading: false,
				defaultAvatar: geren,
				sortKind: [],
				showSecondList: false,
				currentUser: {},
				params: {},
				count: 0,
				list: [],
				navMenuPostfix:	{ 1: 'doc,docx', 2: 'xlsx,xls', 3: 'ppt,pptx,pdf,txt,html,png,jpg,jpeg,gif,bmp,zip,rar,mp4' },
				openTime:	null
			}
		},
		computed: {
			// searchFileKeyword() {
			// 	return this.$store.state.Setting.searchFileKeyword
			// },
			friendList() {
				let result = []
				this.$store.state.MyFriend.list.forEach(friend => {
					if (friend.isOnBlacklist != 1) {
						const userInfo = this.$store.state.User.list.filter(userInfo => userInfo.userId == friend.userId)
						result.push({ ...friend, userInfo: userInfo[0] || {}})
					}
				})
				let onlineList = []
				let offlineList = []
				result.forEach(item => {
					item.userInfo.onlineState == 1 ? onlineList.push(item) : offlineList.push(item)
				})
				function filter(item) {
					return item.label || item.userInfo.nickName
				}
				onlineList = sortByPinyin(onlineList, null, true, filter)
				offlineList = sortByPinyin(offlineList, null, true, filter)
				result = onlineList.concat(offlineList)
				return result
			}
		},
		watch: {
			'linkClick'(nVal, oVal) {
				if (nVal != oVal && this.currentUser.userId) {
					this.closeFileList()
				}
			},
			'$store.state.Setting.fileDownloadings': {
				async	handler(nVal)	{
					const	fileDownloadings = Object.values(nVal).filter(loadingInfo => loadingInfo.fromType.indexOf('chat-') >= 0)
					console.log('文件下载bySender',	fileDownloadings)
					if (fileDownloadings.length) {
						fileDownloadings.forEach(loadingInfo => {
							const	fileInfo = this.list.find(fileInfo => loadingInfo.id === fileInfo.id)
							if (fileInfo) {
								if (loadingInfo.state == 'finished') {
									this.updateData({ id: fileInfo.id,	localPath: loadingInfo.localPath, triggered: 1,	progress:	0 })
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
									this.updateData({ id: fileInfo.id, progress: loadingInfo.progress })
								}	else if	(loadingInfo.state != 'progress') { // 清理下载失败的数据
									this.$store.dispatch('Setting/del_fileDownloadings', fileInfo.id)
									this.updateData({ id: fileInfo.id, progress: 0 })
								}
							}
						})
					}
				},
				deep:	true
			}
			// '$store.state.Setting.searchFileKeyword'(nVal) {
			// 'searchFileKeyword'(nVal) {
			// 	console.log(123, nVal)
			// 	if (!this.currentUser.userId)	return
			// 	this.initParams(this.currentUser)
			// 	this.getList()
			// }
		},
		mounted() {
			this.$nextTick(() => { // 有需要再添加页面大小变化的情况
				this.$refs.fileListBody.addEventListener('scroll', this.scrollChange)
				this.$once('hook:beforeDestroy', function() {
					this.$refs.fileListBody.addEventListener('scroll', null)
				})
			})
		},
		methods: {
			updateData(newItem) {
				const	index = this.list.findIndex(item	=> {
					return item.id == newItem.id
				})
				this.$set(this.list, index, Object.assign({}, this.list[index], newItem))
			},
			handleOperaton({ key }, item) {
				switch (key) {
				case '0':
					this.doDownload(item, this.updateData, () => {
						this.initParams(this.currentUser)
						this.getList()
					})
					break
				case '1':
					this.doOpen('1', item, this.updateData)
					break
				case '2':
					this.doOpen('2', item, this.updateData)
					break
				case '3':
					this.showSelectModal(item, () => { // 本地未下载+服务器过期时用于删除记录
						this.initParams(this.currentUser)
						this.getList()
					})
					break
				case '4':
					this.doDelete(item, () => {
						// this.list = this.list.filter(Obj => item.id != Obj.id)---考虑到下拉刷新改用重新获取数据
						this.initParams(this.currentUser)
						this.getList()
					})
					break
				}
			},
			showFileList(item) {
				this.initParams(item)
				this.getList().then(res => {
					this.currentUser = item
				})
			},
			initParams(item) {
				// let loadingMsgIds = ''
				// if (this.$store.state.Chat.downloadingMsgs && this.$store.state.Chat.downloadingMsgs.length) {
				// 	loadingMsgIds = this.$store.state.Chat.downloadingMsgs.join(',').replace(/,/g, "','")
				// }
				// let	ext = ''
				// for (const	key	in	this.navMenuPostfix) {
				// 	ext += `,${this.navMenuPostfix[key]}`
				// }
				// ext	=	ext.slice(1)
				this.openTime = this.$utils.fun.getServerTime('bySender_initParams')
				this.params = {	// 是单聊发送的文件：发送正常+非阅后即焚+不在聊天页面下载队列（pc无密聊）；不能识别的图片和视频才在文档展示-103：文件
					// where: `senderID='${item.userId}' and cForm=103 and threadType=0 and status=1 and burntAfterRead!=1 and timestamp < ${this.openTime} and id not in ('${loadingMsgIds}') and ext in ('${ext.replace(/,/g, "','")}')`,
					where: `senderID='${item.userId}' and cForm=103 and threadType=0 and status=1 and burntAfterRead!=1 and timestamp < ${this.openTime}`,
					order: `timestamp DESC`,
					returnCount: true,
					size: 30,
					index: 0
				}
				// if (this.searchFileKeyword) {
				// 	const	where = this.params.where
				// 	this.params.where	=	`${where} and	(newFileName like '%${this.searchFileKeyword}%' or fileName like '%${this.searchFileKeyword}%')`
				// }
			},
			async getList()	{
				// this.loading = true
				console.log(this.params)
				const res = await this.$utils.sqlite.getChatData(this.params)
				// this.loading = false
				console.log(res)
				this.count = res.count
				this.list = res.messages
				return res
			},
			scrollChange({ target }) {
				const	{ clientHeight, scrollHeight, scrollTop } = target
				if (scrollTop + clientHeight >= scrollHeight) this.loadMore()
			},
			async	loadMore() {
				if (this.count > this.list.length)	{
					this.params.index	+= 1
					const res = await this.$utils.sqlite.getChatData(this.params)
					console.log(this.params, res)
					this.count = res.count
					this.list = this.list.concat(res.messages)
				}
			},
			closeFileList() {
				this.currentUser = {}
			}
		}
	}
</script>

<style lang="scss">
	#files-bySender{
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction:	column;
		.title{
			color: $black;
			font-size: 16px;
			height: 80px;
			line-height: 80px;
			padding: 0 20px;
			margin: 0;
			border-bottom: $border;
			-webkit-app-region: drag;
			.gray{
				color: $gray;
				cursor: pointer;
			}
			.iconfont{
				margin-right: 5px;
			}
		}
		.sender-list{
			flex: 1;
			overflow-y: scroll;
			.AAlist-item{
				border: none;
			}
			.item{
				padding: 0	20px;
				&:hover{
					background-color:	$bg;
					cursor: pointer;
					.AAlist-item .meta-title{
						color: $darkBlue;
					}
				}
			}
		}
		.file-list{
			flex: 1;
			overflow-y: scroll;
			.ant-spin-nested-loading,	.ant-spin{
					height: 100%;
					.ant-spin-container{
						height: 100%;
					}
				}
			.flex-layout{
				display: flex;
				text-align: center;
				align-items:center;
				.name{
					flex: 1;
					text-align: left;
				}
				.time{
					width: 150px;
				}
				.size{
					width: 100px;
				}
				.operation{
					width: 70px;
				}
			}
			.file-item{
				padding: 0 5px 0 20px;
				cursor: pointer;
				color: $gray;
				position: relative;
				.item-main{
					border-bottom: $border;
					padding: 12px	0;
					.name{
						.icon {
							width: 24px;
							height: 32px;
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
						p{
							color: $black;
							margin: 0;
							display: -webkit-box;
							-webkit-line-clamp: 1;
							-webkit-box-orient: vertical;
							overflow: hidden;
							text-overflow: ellipsis;
							padding-left: 8px;
							line-height: 32px;//暂时的居中处理，便于后面扩展双行文本（第二行放‘来源’）
							word-break: break-all;
						}
					}
					.origin{
						display: -webkit-box;
						-webkit-line-clamp: 1;
						-webkit-box-orient: vertical;
						overflow: hidden;
						text-overflow: ellipsis;
						word-break: break-all;
					}
					.operation{
						&:hover{color: $darkBlue;}
					}
				}
				.progress{
					width: 96%;
					position: absolute;
					bottom: -8px;
					z-index: 3;
				}
				&:hover{
					background-color: $bg;
					.name	p{color: $darkBlue;}
				}
			}
		}
		.default {
			width: 100%;
			height: 100%;
			position: relative;
			.main {
				position: absolute;
				left: 50%;
				top: 50%;
				width: 100%;
				transform: translate(-50%, -65%);
				text-align: center;
				h3{
					color: $black;
					font-size: 14px;
					font-weight: normal;
				}
				p {
					margin: 0;
					color: $gray;
					font-size: 12px;
				}
			}
		}
	}
</style>
