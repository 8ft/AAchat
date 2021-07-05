<template>
	<div id="files-byType" ref="filesByType">
		<h3	class="title">
			{{$t('common.fileType')}}
		</h3>
		<div class="nav-menu">
			<span	class="item" :class="{light: navMenuKey==0}"	@click="menuChang(0)">{{$t('common.all')}}</span>
			<span	class="item" :class="{light: navMenuKey==1}"	@click="menuChang(1)">{{$t('nav.docs')}}</span>
			<span	class="item" :class="{light: navMenuKey==2}"	@click="menuChang(2)">{{$t('common.table')}}</span>
			<span	class="item" :class="{light: navMenuKey==3}"	@click="menuChang(3)">{{$t('common.file')}}</span>
			<span class="right" ref="sort">
				<a-dropdown :trigger="['click']" :getPopupContainer="() => $refs.sort">
					<i class="iconfont iconpaixu"></i>
					<a-menu slot="overlay" v-model="sortKind" @click="handleSort">
						<!-- <a-menu-item key="sortByTime">
							时间排序
						</a-menu-item>
						<a-menu-item key="sortByName">
							名称排序
						</a-menu-item>
						<a-menu-item key="sortBySize">
							大小排序
						</a-menu-item> -->
						<a-menu-item key="timestamp DESC">
							{{$t('docs.sort[0]')}}
						</a-menu-item>
						<a-menu-item key="timestamp ASC">
							{{$t('docs.sort[1]')}}
						</a-menu-item>
						<a-menu-item key="fileSize DESC,timestamp DESC">
							{{$t('docs.sort[2]')}}
						</a-menu-item>
						<a-menu-item key="fileSize ASC,timestamp DESC">
							{{$t('docs.sort[3]')}}
						</a-menu-item>
					</a-menu>
				</a-dropdown>
			</span>
		</div>
		<div class="table-list"	v-show="(list.length&&!loading)||loading">
			<div class="table-title	flex-layout">
				<div class="name">
					{{$t('common.name')}}
				</div><div class="time">
					{{$t('common.time')}}
				</div><div class="origin">
					{{$t('common.source')}}
				</div><div class="size">
					{{$t('common.size')}}
				</div>
				<div class="operation"></div>
			</div>
			<div class="table-body"	ref="fileListBody">
				<a-spin :spinning="loading">
					<div style="height:100%">
						<div class="table-item" v-for="item in list"	:key="item.id">
							<div class="item-main flex-layout" @click="doPreview(item,updateData,()=>{initParams();getList()})">
								<div class="name">
									<div class="icon" :class="item.ext"></div>
									<a-tooltip placement="topLeft" :title="item.newFileName||item.fileName">
										<p>{{item.newFileName||item.fileName}}</p>
									</a-tooltip>
								</div>
								<div class="time">
									{{$utils.time.formatTimestamp(item.timestamp, 'Y/M/D h:m')}}
								</div>
								<div class="origin">
									<!-- <a-tooltip placement="top" :title="getOrigin(item)">
										{{getOrigin(item)}}
									</a-tooltip> -->
									<a-tooltip placement="top" :title="item.origin">
										{{item.threadType == 1 ? $t('docs.groupChat') : $t('docs.privateChat')}}:{{item.origin}}
									</a-tooltip>
								</div>
								<div class="size">
									{{formatBytes(item.fileSize, 1)}}
								</div>
								<div class="operation" @click.stop>
									<a-dropdown :getPopupContainer="() => $refs.filesByType">
										<i class="iconfont icongengduo1"></i>
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
					</div>
				</a-spin>
			</div>
		</div>
		<div class="default" v-show="!((list.length&&!loading)||loading)">
			<div class="main">
				<img src="~@/assets/img/nofile.png" width="240" height="200" :alt="$t('common.noData')">
				<!--<h3>暂无聊天{{navMenuKey==0?'文档':navMenus[navMenuKey]}}</h3>
				<p>聊天中的{{navMenuKey==0?'文档':navMenus[navMenuKey]}}都会显示在这里</p>-->
				<h3 v-if="navMenuKey == 0 || navMenuKey == 1">
					{{$t(`docs.tip.Docs[0]`)}}
				</h3>
				<p v-if="navMenuKey == 0 || navMenuKey == 1">
					{{$t(`docs.tip.Docs[1]`)}}
				</p>
				<h3 v-if="navMenuKey == 2">
					{{$t(`docs.tip.Tables[0]`)}}
				</h3>
				<p v-if="navMenuKey == 2">
					{{$t(`docs.tip.Tables[1]`)}}
				</p>
				<h3 v-if="navMenuKey == 3">
					{{$t(`docs.tip.Files[0]`)}}
				</h3>
				<p v-if="navMenuKey == 3">
					{{$t(`docs.tip.Files[1]`)}}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
	// import { sortByPinyin } from '@/utils/common/pinyin'

	export default {
		name: 'FileByType',
		props: {
			fileDownloadings: Array,
			getProgress: Function,
			doDownload: Function,
			doOpen: Function,
			showSelectModal:	Function,
			doDelete:	Function,
			doPreview: Function,
			formatBytes: Function
		},
		data() {
			return {
				loading: false,
				openTime:	'',
				params:	{
					where: '',
					order: 'timestamp DESC',
					returnCount: true,
					size: 30,
					index: 0
				},
				count: 0,
				list:	[],
				navMenuKey:	'0', //	1-文档，2-表格，3-文件
				navMenuPostfix:	{ 1: 'doc,docx', 2: 'xlsx,xls', 3: 'ppt,pptx,pdf,txt,html,png,jpg,jpeg,gif,bmp,zip,rar,mp4' },
				// sortKind: ['sortByTime'],
				// orderKey:	{ sortByTime:	'timestamp DESC', sortBySize: 'fileSize DESC,timestamp DESC', sortByName: 'timestamp DESC' }
				sortKind: ['timestamp DESC']
			}
		},
		computed: {
			// searchFileKeyword() {
			// 	return this.$store.state.Setting.searchFileKeyword
			// }
		},
		watch: {
			'$store.state.Setting.fileDownloadings': {
				async	handler(nVal)	{
					const	fileDownloadings = Object.values(nVal).filter(loadingInfo => loadingInfo.fromType.indexOf('chat-') >= 0)
					console.log('文件下载byType',	fileDownloadings)
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
		},
		beforeMount()	{
			this.initParams()
			this.getList()
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
				// console.log(7890, index, newItem)
				this.$set(this.list, index, Object.assign({}, this.list[index], newItem))
			},
			handleOperaton({ key }, item) {
				switch (key) {
				case '0':
					this.doDownload(item, this.updateData, () => {
						this.initParams()
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
						this.initParams()
						this.getList()
					})
					break
				case '4':
					this.doDelete(item, () => {
						// this.list = this.list.filter(Obj => item.id != Obj.id)---考虑到下拉刷新改用重新获取数据
						this.initParams()
						this.getList()
					})
					break
				}
			},
			initParams() { // 根据当前设置的文件类型和排序类型重置
				// let loadingMsgIds = ''
				// if (this.$store.state.Chat.downloadingMsgs && this.$store.state.Chat.downloadingMsgs.length) {
				// 	loadingMsgIds = this.$store.state.Chat.downloadingMsgs.join(',').replace(/,/g, "','")
				// }
				// let	ext	=	''
				// if (this.navMenuKey != 0) {
				// 	ext = this.navMenuPostfix[this.navMenuKey]
				// } else {
				// 	for (const	key	in	this.navMenuPostfix) {
				// 		ext += `,${this.navMenuPostfix[key]}`
				// 	}
				// 	ext	=	ext.slice(1)
				// }
				this.openTime = this.$utils.fun.getServerTime('byType_initParams')
				this.params = {	// 单聊和群聊内：发送正常+非阅后即焚+不在聊天页面下载队列（pc无密聊）；不能识别的图片和视频才在文档展示-103：文件
					// where: `threadType!=10001 and cForm=103 and status=1 and burntAfterRead!=1 and timestamp < ${this.openTime} and id not in ('${loadingMsgIds}') and ext in ('${ext.replace(/,/g, "','")}')`,
					where: `threadType!=10001 and cForm=103 and status=1 and burntAfterRead!=1 and timestamp < ${this.openTime}`,
					// order: `${this.orderKey[this.sortKind[0]]}`,
					order: `${this.sortKind[0]}`,
					returnCount: true,
					size: 30,
					index: 0
				}
				let	ext	=	''
				if (this.navMenuKey != 0) {
					if (this.navMenuKey == 1 || this.navMenuKey == 2) { // 文档/表格
						ext = this.navMenuPostfix[this.navMenuKey]
						this.params.where += ` and ext in ('${ext.replace(/,/g, "','")}')`
					}	else { //	文件：除了文档/表格外以文件形式（cForm=103）发送的
						ext = this.navMenuPostfix[1] + ',' + this.navMenuPostfix[2]
						ext	=	ext.slice(0)
						this.params.where += ` and ext not in ('${ext.replace(/,/g, "','")}')`
					}
				}
				// if (this.searchFileKeyword) {
				// 	const	where = this.params.where
				// 	this.params.where	=	`${where} and	(newFileName like '%${this.searchFileKeyword}%' or fileName like '%${this.searchFileKeyword}%')`
				// }
			},
			menuChang(key) {
				if (this.navMenuKey == key) return
				this.navMenuKey = key
				// 重置搜索条件
				this.initParams()
				this.getList()
			},
			async getList()	{
				const	params = { ...this.params }
				// if (this.sortKind[0] == 'sortByName') {
				// 	params.size = null
				// 	params.index = null
				// }
				// this.loading = true
				const res = await this.$utils.sqlite.getChatData(params)
				// this.loading = false
				res.messages.forEach(item => { // 避免销号时，实时刷新获取不到
					item.origin = this.getOrigin(item)
				})
				this.count = res.count
				// if (this.sortKind[0] == 'sortByName') {
				// 	const	list = sortByPinyin(res.messages, 'fileName', true)
				// 	this.list = list.slice(0, this.params.size)
				// } else this.list = res.messages
				this.list = res.messages
			},
			handleSort(sort) {
				this.sortKind = [sort.key]
				this.initParams()
				this.getList()
			},
			scrollChange({ target }) {
				const	{ clientHeight, scrollHeight, scrollTop } = target
				if (scrollTop + clientHeight >= scrollHeight) this.loadMore()
			},
			async	loadMore() {
				if (this.count > this.list.length)	{
					this.params.index	+= 1
					const	params = { ...this.params }
					// if (this.sortKind[0] == 'sortByName') {
					// 	params.size = null
					// 	params.index = null
					// }
					const res = await this.$utils.sqlite.getChatData(params)
					res.messages.forEach(item => { // 避免销号时，实时刷新获取不到
						item.origin = this.getOrigin(item)
					})
					this.count = res.count
					// if (this.sortKind[0] == 'sortByName') {
					// 	const	list = sortByPinyin(res.messages, 'fileName', true)
					// 	const	showCount	=	(this.params.index + 1) * this.params.size
					// 	this.list = list.slice(0, showCount)
					// } else	this.list = this.list.concat(res.messages)
					this.list = this.list.concat(res.messages)
				}
			},
			getOrigin(item) {
				let	result = ''
				const threadType = item.threadType
				const threadID = item.threadID
				if (threadType == 1) { // 群聊
					const groupInfo = this.$store.getters['MyGrounp/groupInfo'](item.threadID)
					result = `${groupInfo.groupLabel || groupInfo.groupName}`
				} else { // 单聊
					result = this.$store.getters.latestUsername(item.senderID, threadType, threadID)
					if (!result) {
						result = item.name
					}
				}
				return	result
			}
		}
	}
</script>

<style lang="scss">
	#files-byType{
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
			-webkit-app-region: drag
		}
		.nav-menu{
			height: 40px;
			line-height: 40px;
			.item{
				margin: 0 20px;
				font-size: 16px;
				cursor: pointer;
				&:hover{color: $darkBlue;}
				&.light{
					color: $darkBlue;
					position: relative;
					&::after{
						content: '';
						display: inline-block;
						width: 100%;
						height: 2px;
						background-color: $darkBlue;
						position: absolute;
						bottom: -5px;
						left: 0;
					}
				}
			}
			.right{
				float: right;
				margin-right: 20px;
				cursor: pointer;
				&:hover{color: $darkBlue;}
			}
		}
		.table-list{
			flex: 1;
			overflow-y: auto;//使下层的flex：overflow-y生效
			display: flex;
			flex-direction:	column;
			.flex-layout{
				display: flex;
				text-align: center;
				align-items:center;
				.name{
					flex: 1;
					text-align: left;
				}
				.time{
					width: 130px;
				}
				.origin{
					width: 150px;
					padding: 0 10px;
				}
				.size{
					width: 70px;
				}
				.operation{
					width: 70px;
					.iconfont{
						font-size: 25px
					}
				}
			}
			.table-title{
				color: $gray;
				font-size: 12px;
				padding: 0 8px 0 20px;
				height: 40px;
				line-height: 40px;
				border-bottom: $border;
			}
			.table-body{
				flex: 1;
				overflow-y: scroll;
				.ant-spin-nested-loading,	.ant-spin{
					height: 100%;
					.ant-spin-container{
						height: 100%;
					}
				}
				.table-item{
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
