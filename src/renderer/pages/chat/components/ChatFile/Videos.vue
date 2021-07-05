<template>
	<div id="chatFile-video">
		<div class="video-group" v-for="(list, key, index) in data" :key="`videoGroup${index}`">
			<div class="name">
				{{key}}
			</div>
			<div class="list">
				<div class="item" v-for="(item, index2) in list" :key="`videoGroup${index}-${index2}`">
					<!-- <a-spin :spinning="fileDownloadings.find(loadingInfo=>loadingInfo.id==item.id)" v-if="!fileError[item.id]"> -->
					<a-spin :spinning="Boolean(item.progress&&item.progress!=100)" v-if="!fileError[item.id]">
						<video
							class="content"
							:class="{filter: isShowBurntAfterRead(item)}"
							:style="sizeTransformate(item)"
							:src="reloadServerFile[item.id]||getUrl(item)"
							@error="loadError(item)"
						>
						</video>
						<div class="mask" v-if="isShowBurntAfterRead(item)" @click.stop="doRead(item)">
							<i class="iconfont iconshipin2"></i>
							<div>{{$t('chat.burnAfterReading')}}</div>
						</div>
						<div class="mask" v-else-if="!item.localPath" @click.stop="doDownload($CHAT_MSG_TYPE.TYPE_VIDEO,item)">
							<i class="iconfont iconxiazai"></i>
							<div>{{$t('common.download')}}</div>
						</div>
						<template v-else>
							<div class="mask"	style="paddingTop:30px" @click.stop="openVideoPlayer(item)">
								<i class="iconfont iconshipin-1"	style="fontSize:25px"></i>
							</div>
							<div class="tip">
								<i class="iconfont iconshipin1"></i>
								<span>{{timeTarnsform(item.duration)}}</span>
							</div>
						</template>
					</a-spin>
					<file-load-error :form="$CHAT_MSG_TYPE.TYPE_VIDEO" :iconSize="25" :fontSize="14" v-else></file-load-error>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
	// import noimg from '@/assets/img/shibai.png'
	import FileLoadError from '@/components/FileLoadError.vue'
	export default {
		name: '',
		components: { FileLoadError },
		props: {
			data: Object,
			getUrl:	Function,
			updateData:	Function,
			doDownload:	Function,
			doBurntAfterRead:	Function,
			sizeTransformate:	Function
			// fileDownloadings:	Array
		},
		data() {
			return {
				fileError: {},
				reloadServerFile: {},
				burntAfterReadLodingItem:	{}
			}
		},
		watch: {
			// fileDownloadings(nVal, oVal) {
			// 	nVal.filetr(loadingInfo	=> loadingInfo.state == 'finished' && loadingInfo.fromType.indexOf('chat-') > -1).map(loadingInfo => {
			// 		const	item = this.data.list.find(item => item.id == loadingInfo.id)
			// 		if (!item) return
			// 		console.log('当前文件下载成功', item, loadingInfo)
			// 		this.updateData(this.$CHAT_MSG_TYPE.TYPE_VIDEO, Object.assign({}, item, { localPath: loadingInfo.localPath,	triggered: 1 }))
			// 		this.$store.dispatch('Chat/updateMsg', {
			// 			id: item.id,
			// 			updatingData:	{
			// 				localPath: loadingInfo.localPath,
			// 				triggered: 1
			// 			}
			// 		})
			// 		if (item.triggered != 1) this.$utils.chatSdk.cReadAsync(item.id)
			// 		if (item.id == this.burntAfterReadLodingItem.id) this.doRead(item)
			// 		this.$store.dispatch('Setting/del_fileDownloadings', item.id)
			// 	})
			// }
		},
		computed: {
		},
		mounted() {
			console.log('视频数据', this.data)
		},
		methods: {
			async	doRead(item) {
				if (!(item.localPath && (await	this.$utils.fun.fileExist(item.localPath)))) {
					this.doDownload(this.$CHAT_MSG_TYPE.TYPE_VIDEO, item)
					this.burntAfterReadLodingItem	=	item
					return
					// await this.doDownload(this.$CHAT_MSG_TYPE.TYPE_VIDEO, item).then(url => {
					// 	item.localPath = url
					// })
				}
				this.burntAfterReadLodingItem	=	{}
				this.openVideoPlayer(item)
				// 做阅后即焚消息已读操作
				await this.doBurntAfterRead(this.$CHAT_MSG_TYPE.TYPE_VIDEO, item)
			},
			async	openVideoPlayer(item) {
				if (this.fileError[item.id]) {
					return
				} else if (!(await this.$utils.fun.fileExist(item.localPath))) {
					this.updateData(this.$CHAT_MSG_TYPE.TYPE_VIDEO, Object.assign({}, item, { localPath: '' }))
					this.$message.warning(this.$t('common.fileNotExist[2]'))
					return
				}
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
			},
			isShowBurntAfterRead(item) {
				return item.burntAfterRead === 1 && item.isSend === 0 && item.triggered != 1
			},
			timeTarnsform(time)	{
				time = parseInt(time)
				const	hour = parseInt(time / 60 / 60)	|| 0
				const	minute = parseInt((time - hour * 60 * 60) / 60) || 0
				const	second = time - hour * 60 * 60 - minute * 60 || 0
				const	result = `${hour < 10 ? ('0' + hour) : hour}:${minute < 10 ? ('0' + minute) : minute}:${second < 10 ? ('0' + second) : second}`
				return	result
			},
			loadError(item) {
				// this.$set(this.fileError, item.id, true)
				if (this.getUrl(item).indexOf('file://') > -1) {
					this.$set(this.reloadServerFile, item.id, this.$store.state.Setting.fileDomainURL + item.url)
				}	else {
					this.$set(this.reloadServerFile, item.id, '')
					this.$set(this.fileError, item.id, true)
				}
			}
		}
	}
</script>
<style lang="scss" scoped>
  #chatFile-video {
    .video-group {
      padding: 0px 20px;
      & > .name {
        color: $black;
        font-size: 14px;
        line-height: 40px;
      }
      & > .list {
        .item {
          display: inline-block;
          position: relative;
					width: 86px;
					height: 86px;
					overflow: hidden;
					margin: 0px 4px 4px 0;
          .content {
            width: 100%;
						height: auto;
						margin-top: 50%;
						margin-left: 50%;
    				transform: translate(-50%,-50%);
            cursor: pointer;
            &.filter {
              filter: blur(15px);
            }
          }
          .mask {
            width: 86px;
            height: 86px;
            background: rgba(0, 0, 0, 0.2);
            position: absolute;
            left: 0;
            top: 0;
            text-align: center;
            color: #FFF;
            padding-top: 18px;
						cursor: pointer;
            .iconfont {
              padding-top: 10px;
              font-size: 30px;
              color: #FFF;
						}
						&>div{
							font-size: 14px;
						}
						&:hover{
							.iconshipin-1 {
								color: $darkBlue;
							}
						}
          }
          .tip {
            color: #FFF;
            text-align: center;
            width: 86px;
            position: absolute;
            bottom: 0px;
            background: linear-gradient(rgba(255, 255, 255, 0.01), rgba(118, 118, 118, 1));
            .iconfont {
              position: relative;
              top: 1px;
            }
          }
        }
      }
    }
  }
</style>
