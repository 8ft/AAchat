<template>
	<div id="chatFile-image">
		<div class="image-group" v-for="(list, key, index) in data" :key="`group${index}`">
			<div class="name">
				{{key}}
			</div>
			<div class="list">
				<div class="item" v-for="(item, index2) in list" :key="`group${index}-${index2}`">
					<a-spin :spinning="loadingImags.includes(item.id)" v-if="!imgError[item.id]">
						<img
							class="content"
							:class="{filter: isShowBurntAfterRead(item)}"
							:style="sizeTransformate(item)"
							:src="reloadServerFile[item.id]||getUrl(item)"
							@error="imgLoadError(item)"
							@click.stop="openImgViewWin(item)"
						>
						<div class="watermark" v-if="isShowBurntAfterRead(item)" @click.stop="doRead(item)">
							<i class="iconfont icontupian"></i>
							<div>{{$t('chat.burnAfterReading')}}</div>
						</div>
						<div class="download" v-else-if="!item.localPath" @click.stop="doDownload(item)">
							<i class="iconfont icontupian"></i>
							<div>{{$t('common.download')}}</div>
						</div>
					</a-spin>
					<file-load-error :form="$CHAT_MSG_TYPE.TYPE_IMAGE" :iconSize="25" :fontSize="14" v-else></file-load-error>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
	// import noimg from '@/assets/img/shibai.png'
	import FileLoadError from '@/components/FileLoadError.vue'
	export default {
		name: 'ChatFileImage',
		components: { FileLoadError },
		props: {
			data: Object,
			getUrl:	Function,
			updateData:	Function,
			doBurntAfterRead:	Function,
			sizeTransformate:	Function
		},
		data() {
			return {
				loadingImags: [],
				imgError:	{},
				reloadServerFile: {}
			}
		},
		computed: {
		},
		mounted() {
			console.log('图片数据', this.data)
		},
		methods: {
			imgLoadError(item, index) {	// 优化多文件加载
				// this.$set(this.fileError, item.id, true)
				if (this.getUrl(item).indexOf('file://') > -1) {
					this.$set(this.reloadServerFile, item.id, this.$store.state.Setting.fileDomainURL + item.url)
				}	else {
					this.$set(this.reloadServerFile, item.id, '')
					this.$set(this.imgError, item.id, true)
				}
			},
			isShowBurntAfterRead(item) {
				return item.burntAfterRead === 1 && item.isSend === 0 && item.triggered != 1
			},
			async	doRead(item) {
				if (!item.localPath)	{
					const	localPath = await this.doDownload(item)
					if (localPath) item.localPath = localPath
				}
				this.openImgViewWin(item)
				// 做阅后即焚消息已读操作
				await this.doBurntAfterRead(this.$CHAT_MSG_TYPE.TYPE_IMAGE, item)
			},
			async doDownload(item) {
				if (this.loadingImags.includes(item.id)) {
					return
				}	else if (!this.onlineCheck()) {
					return
				}	else if (!(await this.$utils.fun.urlExist(item.url))) {
					this.$message.warning(this.$t('common.FileExpired'))
					return
				}
				this.loadingImags.push(item.id)
				const fileData = await this.$store.dispatch('Chat/downloadImageVoice', { msgID: item.id, fileInfo: { cForm: item.cForm, url: item.url, ext: item.ext, duration: item.duration }})
				await this.$store.dispatch('Chat/updateMsg', {
					id: item.id,
					updatingData: fileData
				})
				const	newItem =	Object.assign({}, item, fileData)
				if (newItem.triggered != 1) {
					console.log('我在同步已读：',	item.id)
					this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
				}
				newItem.triggered = 1
				this.$props.updateData(this.$CHAT_MSG_TYPE.TYPE_IMAGE, newItem)
				this.$store.dispatch('Chat/updateMsg', {
					id: item.id,
					updatingData:	{
						localPath: newItem.localPath,
						triggered: 1
					}
				})
				this.loadingImags.splice(this.loadingImags.findIndex(val => val === item.id), 1)
				return newItem.localPath
			},
			async	openImgViewWin(item) {
				if (this.imgError[item.id]) {
					return
				} else if (!(await this.$utils.fun.fileExist(item.localPath))) {
					this.updateData(this.$CHAT_MSG_TYPE.TYPE_IMAGE, Object.assign({}, item, { localPath: '' }))
					this.$message.warning(this.$t('common.fileNotExist[2]'))
					return
				} else if (item.isSend === 0 && item.read != 1) {
					console.log('同步已读：',	item.id)
					this.$utils.chatSdk.cReadAsync(item.id) // 同步已读
					this.$store.dispatch('Chat/updateMsg', {
						id: item.id,
						updatingData:	{
							read: 1
						}
					})
				}
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
			}
		}
	}
</script>
<style lang="scss" scoped>
  #chatFile-image {
    .image-group {
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
              filter: blur(4px);
            }
          }
          .watermark,	.download {
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
          }
        }
      }
    }
  }
</style>
