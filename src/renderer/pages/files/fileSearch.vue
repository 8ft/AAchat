<template>
	<div id="fileSearch" ref="fileSearch">
		<div class="header">
			<a-input ref="searchInput" class="searchInput" size="large" v-model="wordText" :placeholder="$t('search.searchFile')" @pressEnter="doSearch">
				<i slot="prefix" class="iconfont iconsousuo" />
				<a-tooltip slot="suffix">
					<a-icon class="clear" type="close" v-show="wordText" @click.stop="wordText=''" />
					<a-button type="primary" size="large" @click.stop="doSearch">
						{{$t('common.search')}}
					</a-button>
				</a-tooltip>
			</a-input>
			<i class="iconfont icontongyongguanbi close" @click.stop="$store.dispatch('Setting/set_showSearchFile', false)"></i>
		</div>
		<div class="table-list"	v-show="((list.length&&!loading)||loading)">
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
			<div class="table-body"	ref="fileListSearch">
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
									<a-dropdown :getPopupContainer="() => $refs.fileSearch">
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
					</div>
				</a-spin>
			</div>
		</div>
		<!-- <div class="default" v-show="wordText&&!((list.length&&!loading)||loading)"> -->
		<div class="default" v-show="showNodata">
			<div class="main">
				<img src="~@/assets/img/nofile.png" width="240" height="200" :alt="$t('common.noData')">
				<h3>{{$t('docs.tip.noFile[0]')}}</h3>
				<p>{{$t('docs.tip.noFile[1]', { projectName: $PROJECT_NAME })}}</p>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'FileSearch',
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
				wordText: '',
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
				showNodata: false
			}
		},
		watch: {
			'$store.state.Setting.fileDownloadings': {
				async	handler(nVal)	{
					const	fileDownloadings = Object.values(nVal).filter(loadingInfo => loadingInfo.fromType.indexOf('chat-') >= 0)
					console.log('文件下载bySearch',	fileDownloadings)
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
		mounted() {
			this.$refs.searchInput.focus()
			this.$nextTick(() => { // 有需要再添加页面大小变化的情况
				this.$refs.fileListSearch.addEventListener('scroll', this.scrollChange)
				this.$once('hook:beforeDestroy', function() {
					this.$refs.fileListSearch.addEventListener('scroll', null)
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
			initParams(item) {
				this.openTime = this.$utils.fun.getServerTime('fileSearch_initParams')
				this.params = {	// 文件：发送正常+非阅后即焚+不在聊天页面下载队列（pc无密聊）；不能识别的图片和视频才在文档展示-103：文件
					where: `threadType!=10001 and cForm=103 and status=1 and burntAfterRead!=1 and timestamp < ${this.openTime}`,
					order: `timestamp DESC`,
					returnCount: true,
					size: 30,
					index: 0
				}
				if (this.wordText) {
					const wordText = this.wordText.trim()
					const	where = this.params.where
					this.params.where	=	`${where} and	(newFileName like '%${wordText}%' or fileName like '%${wordText}%')`
				}
			},
			async getList()	{
				// this.loading = true
				console.log(this.params)
				const res = await this.$utils.sqlite.getChatData(this.params)
				res.messages.forEach(item => { // 避免销号时，实时刷新获取不到
					item.origin = this.getOrigin(item)
				})
				// this.loading = false
				console.log(res)
				this.count = res.count
				this.list = res.messages
				this.showNodata = this.list.length < 1
				return res
			},
			doSearch() {
				this.initParams()
				const testSpace = /^[ ]*$/g
				if (this.wordText && !this.wordText.match(testSpace)) {
					this.getList()
				} else {
					this.count = 0
					this.list = []
					this.showNodata = false
				}
			},
			scrollChange({ target }) {
				const	{ clientHeight, scrollHeight, scrollTop } = target
				if (scrollTop + clientHeight >= scrollHeight) this.loadMore()
			},
			async	loadMore() {
				if (this.count > this.list.length)	{
					this.params.index	+= 1
					console.log(this.params)
					const res = await this.$utils.sqlite.getChatData(this.params)
					res.messages.forEach(item => { // 避免销号时，实时刷新获取不到
						item.origin = this.getOrigin(item)
					})
					console.log(res)
					this.count = res.count
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
  #fileSearch{
    display: flex;
    flex-direction:	column;
    .header{
      height: 80px;
      border-bottom: $border;
      text-align: center;
      .searchInput{
        width: 55%;
        line-height: 80px;
        .ant-input{
          font-size: 12px;
          border-radius: 20px;
          padding-left: 35px;
          padding-right: 115px;
        }
        .iconsousuo{
          color: $gray;
          position: relative;
          top: 2px;
        }
        .ant-input-suffix{
          top:50%;
          right: 0px;
          .clear{
            color: $gray;
            padding: 5px;
            position: relative;
            top: 2px;
            right: 5px;
            cursor: pointer;
            // &:hover{
            //   color: #40a9ff;
            // }
          }
          .ant-btn{
            width: 85px;
            font-size: 12px;
            border-radius: 20px;
          }
        }
      }
      .close{
        padding: 4px;
        border: $border;
        border-radius: 50%;
        color: $lightBlack;
        border-color: $lightBlack;
        margin-left: 10px;
        cursor: pointer;
        &:hover{
          color: $darkBlue;
          border-color: $darkBlue;
        }
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
					width: 150px;
				}
				.origin{
					width: 180px;
					padding: 0 20px;
				}
				.size{
					width: 100px;
				}
				.operation{
					width: 70px;
				}
			}
			.table-title{
				color: $gray;
				font-size: 12px;
				padding: 30px 20px 10px;
				// height: 40px;
				// line-height: 40px;
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

