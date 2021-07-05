<template>
	<div class="player">
		<a-modal :title="$t('common.systemNotification')"
			centered
			class="notification-IM"
			:z-index="10000"
			:visible="isDel"
			:width="438"
			:closable="false"
		>
			<p v-if="deleteType === 'lockedGroup'">
				{{$t('chat.lockGroupTip[1]', { name: groupName || ''})}}
			</p>
			<p v-else-if="deleteType === 'dismissGroup'">
				{{$t('chat.groupDisbanded[1]', [groupName || ''])}}
			</p>
			<!--<p v-else-if="deleteType === 'destroyUserId'">
				用户"{{params.userName}}"销毁了账号
			</p>-->
			<p v-else>
				{{$t('chat.deletedOrRecalled')}}
			</p>
			<template #footer>
				<a-button type="primary" @click="handleClose">
					{{$t('common.okBtn')}}
				</a-button>
			</template>
		</a-modal>
		<div class="player-top" :style="'padding-top:' + ($utils.os.isMac ? '10px' : '')">
			<div class="player-top-db-area" @dblclick.stop="headerDbClick"></div>
			<div class="user-info">
				<div class="user-avatar avatargerenbg" :class="{'avatarLoadFinish': avatarLoadFinish}" v-if="!isAnoymous">
					<img :src="params.userAvatar" @load="avatarLoadSucc" @error="e => $utils.setDefaultAvatar(e, 0)">
				</div>
				<div class="user-avatar isAnoymous" :style="{background: params.userAvatar.bgColor}" v-else>
					{{params.userAvatar.userName}}
				</div>
				<div class="user-name">
					<span>{{title}}</span>
					<p>
						<template v-if="params.fileSize">
							{{params.fileSize | formatBytes}}
						</template>
						{{timestamp}}
					</p>
				</div>
			</div>
			<window-top-right-btns close-btn-type="close" from="player"></window-top-right-btns>
			<div class="tool">
				<div class="iconfont iconfenxiang-01" :title="$t('common.relay')" style="margin-right:17px;" @click="share" v-if="(hasLocalFileExist || hasServerFileExist) && params.burntAfterRead == 0 && params.threadType != 10001"></div>
				<div class="image-toolbar lg-toolbar" id="toolbar" style="float: right" v-if="params.playerType === $CHAT_MSG_TYPE.TYPE_IMAGE"></div>
				<div v-else-if="params.playerType === $CHAT_MSG_TYPE.TYPE_VIDEO">
					<a class="iconfont iconxiazai2" :title="$t('common.download')" target="_blank" download :href="'file://' + params.filePath" v-if="params.burntAfterRead == 0"></a>
				</div>
				<div v-else-if="params.playerType === $CHAT_MSG_TYPE.TYPE_FILE">
					<div class="iconfont iconxiazai2" :title="$t('common.download')" target="_blank" v-if="params.burntAfterRead == 0 && !hasLocalFileExist && hasServerFileExist" @click="download"></div>
					<a-dropdown :trigger="['click']" v-else-if="hasLocalFileExist">
						<span style="display:flex; align-items: center">
							<i class="iconfont iconwenjian" style="font-size: 25px; margin-right: 5px;"></i>
							<i class="iconfont iconxiangxia" style="font-size: 10px"></i>
						</span>
						<a-menu slot="overlay" @click="handleOpen">
							<a-menu-item key="0">
								{{$t('common.open')}}
							</a-menu-item>
							<a-menu-item key="1">
								{{$t('common.open')}} {{$t('common.folder')}}
							</a-menu-item>
						</a-menu>
					</a-dropdown>
				</div>
				<!--<div v-else>
					<div class="iconfont iconxiazai">
						<p>
							<span></span>
						</p>
					</div>
					<div class="iconfont iconzhuanfa1"></div>
				</div>-->
			</div>
		</div>
		<div class="player-container">
			<div class="del-mask" v-if="isDel"></div>
			<router-view />
		</div>
	</div>
</template>

<script>
	import windowTopRightBtns from '@/components/windowTopRightBtns'
	import { setLang } from '@/assets/lang'
	import { ipcRenderer } from 'electron'

	export default {
		name: 'Player',
		components: {
			windowTopRightBtns
		},
		data() {
			return {
				avatarLoadFinish: false,
				isDel: false,
				isClose: true,
				timestamp: '',
				isMax: false,
				params: {},
				title: '',
				hasLocalFileExist: false,
				hasServerFileExist: false,
				currentMessageId: '',
				deleteType: '',
				groupName: '',
				isAnoymous: false
			}
		},
		watch: {
			async '$store.state.OPcomponent.playerWinHide'(val) {
				if (val) return
				this.$utils.currentWindow.setOpacity(0)
				if (this.$utils.currentWindow.isMinimized()) this.$utils.currentWindow.restore()
				this.$utils.currentWindow.show()
				this.$utils.currentWindow.focus()
				await this.$utils.fun.waiting(250)
				this.$utils.currentWindow.setOpacity(1)
			}
		},
		methods: {
			isOnline() {
				const state = this.$utils.fun.getGlobalByName('online')
				if (!state) {
					this.$message.error(this.$t('common.netErrorTip[0]'))
				}
				return state
			},
			share() {
				if (!this.isOnline()) return
				if (this.params.fromType == 1) {
					this.$utils.sqlite.getCollectData({
						where: `id='${this.currentMessageId}'`
					}).then(res => {
						if (res && res.length) {
							res[0].fromType = 1
							ipcRenderer.send('playerWin', {
								opType: 'share',
								data: res[0]
							})
						}
					})
				} else {
					this.$utils.sqlite.getChatData({
						where: `id='${this.currentMessageId}'`
					}).then(res => {
						if (res && res.length) {
							ipcRenderer.send('playerWin', {
								opType: 'share',
								data: res[0]
							})
						}
					})
				}
				/* ipcRenderer.send('playerWin', {
					opType: 'share',
					data: {}
				})*/
			},
			async handleOpen({ key }) {
				this.hasLocalFileExist = await this.$utils.fun.fileExist(this.params.filePath)
				if (!this.hasLocalFileExist) {
					this.$message.error(this.$t('common.fileNotExist[2]'))
					return
				}
				switch (key) {
				case '0':
					this.$utils.fun.openFile(this.params.filePath)
					break
				case '1':
					this.$utils.fun.openFolder(this.params.filePath)
					break
				}
			},
			download() {
				if (!this.isOnline()) return
				this.params.opType = 'download'
				if (!this.params.subMessageId) this.params.subMessageId = this.params.messageId
				ipcRenderer.send('playerWin', this.params)
			},
			async playerInfo(val) {
				this.params = val
				this.isAnoymous = typeof this.params.userAvatar === 'object'
				switch (val.playerType) {
				case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
					this.title = this.$t('common.aboutShare[0]', { name: val.userName })
					break
				case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
					this.title = this.$t('common.aboutShare[1]', { name: val.userName })
					break
				case this.$CHAT_MSG_TYPE.TYPE_FILE:
					this.title = this.$t('common.aboutShare[2]', { name: val.userName, fileName: this.params.fileName })
					this.hasLocalFileExist = await this.$utils.fun.fileExist(this.params.filePath)
					this.hasServerFileExist = await this.$utils.fun.urlExist(this.params.url)
					break
				}
				document.title = this.title
				this.timestamp = window.$moment(parseInt(val.timestamp)).format('YYYY/MM/DD HH:mm')
			},
			avatarLoadSucc() {
				this.avatarLoadFinish = true
			},
			async handleClose() {
				this.isDel = false
				this.isClose = true
				this.$utils.currentWindow.setOpacity(0)
				await this.$utils.fun.waiting(100)
				this.$utils.currentWindow.close()
				this.$store.dispatch(`player/set_playerData`, {})
			},
			headerDbClick() {
				if (this.isWinMax) {
					this.$utils.currentWindow.unMax()
					this.isWinMax = false
				} else {
					this.$utils.currentWindow.max()
					this.isWinMax = true
				}
			}
		},
		mounted() {
			window.addEventListener('keyup', (e) => {
				if (e.key === 'Escape') {
					this.handleClose()
				}
			}, true)
			ipcRenderer.on('params', async(event, data) => {
				console.log('params:::', data)
				if (!data.userName) return
				this.$store.dispatch(`player/set_playerData`, data)
				this.currentMessageId = data.messageId
				let payload = data
				if (data.imageArray && data.imageArray.length) {
					const index = data.imageArray.findIndex(item => {
						return item.messageId === this.currentMessageId
					})
					if (index > -1) {
						payload = data.imageArray[index]
						payload.playerType = this.$CHAT_MSG_TYPE.TYPE_IMAGE
					}
				}
				this.playerInfo(payload)
				this.$store.dispatch('OPcomponent/set_playerWinHide', true)
				this.isDel = false
				if (payload.playerType) this.$router.push({ path: `/player/player${payload.playerType}?lg=1&slide=0` })
				/* console.log(1111111)
				if (!payload.userName) return
				this.isClose = false
				this.$store.dispatch('OPcomponent/set_playerWinHide', true)
				this.$emit('params', payload)*/
			})
			ipcRenderer.on('delete', (event, { deleteType, groupName }) => {
				this.isDel = true
				const temp = Object.assign({}, this.$store.state.player.playerData)
				temp.filePath = ''
				this.deleteType = deleteType
				this.groupName = groupName
				this.$store.dispatch(`player/set_playerData`, temp)
			})
			ipcRenderer.on('setPlayerWin', (event, payload) => {
				const temp = window._.assign({}, this.params, payload)
				this.playerInfo(temp)
			})
			ipcRenderer.on('changePlayerMessageId', (event, messageId) => {
				this.currentMessageId = messageId
				let payload = this.$store.state.player.playerData
				if (this.$store.state.player.playerData.imageArray && this.$store.state.player.playerData.imageArray.length) {
					const index = this.$store.state.player.playerData.imageArray.findIndex(item => {
						return item.messageId === this.currentMessageId
					})
					if (index > -1) {
						payload = this.$store.state.player.playerData.imageArray[index]
						payload.playerType = this.$CHAT_MSG_TYPE.TYPE_IMAGE
					}
				}
				this.playerInfo(payload)
			})
			ipcRenderer.on('close', () => {
				this.$store.dispatch(`player/set_playerData`, {})
				// this.handleClose()
			})
			ipcRenderer.on('changeLang', (event, lang) => {
				setLang(lang)
				this.playerInfo(this.params)
				// this.handleClose()
			})
		}
	}
</script>

<style scoped lang="scss">
  .player {
    position: relative;
    height: 100%;
	  .hidden{
		  visibility: hidden;
	  }
    .player-top {
      height: 74px;
	    position: relative;
	    -webkit-app-region: drag;
	    .player-top-db-area{
		    position: absolute;
		    top: 0;
		    bottom: 0;
		    left: 0;
		    right: 0;
		    z-index: 1;
	    }
      .user-info {
        height: 100%;
        display: flex;
        align-items: center;
        float: left;
        .user-avatar {
	        height: 45px;
	        width: 45px;
	        border-radius: 50%;
          margin-left: 25px;
	        overflow: hidden;
	        &.isAnoymous{
		        color:#fff;
		        display: flex;
		        align-items: center;
		        justify-content: center;
		        font-size: 20px;
	        }
	        &.avatarLoadFinish{
		        background:#fff!important;
	        }
	        img{
		        width:45px;
		        height: 45px;
		        border-radius: 50%;
	        }
        }
        .user-name {
          float: left;
          font-size: 16px;
          color: #333;
          margin-left: 10px;
          span {
          }
          p {
            font-size: 12px;
            color: #999;
            margin: 2px 0 0;
          }
        }
      }
      .tool {
        height: 100%;
        float: right;
        display: flex;
	      position: relative;
	      z-index: 3;
        align-items: center;
	      -webkit-app-region: no-drag;
        .iconfont {
          font-size: 24px;
          color: #999;
          margin-right: 20px;
          cursor: pointer;
          position: relative;
	        &:hover{
		        color: #5078b3;
	        }
          p {
            display: none;
            position: absolute;
            width: 100%;
            height: 2px;
            background: #E1E1E1;
            span {
              background: #3F8EFB;
              width: 50%;
              display: block;
              height: 100%;
            }
          }
        }
      }
    }
    .player-container{
      position: absolute;
      top: 74px;
      bottom: 0;
      width: 100%;
      background: #ececec;
			-webkit-app-region: no-drag;
	    .del-mask{
		    position: absolute;
		    top: 0;
		    left: 0;
		    width: 100%;
		    height: 100%;
		    background: #ececec;
		    z-index: 1200;
	    }
	    // border-top: 1px solid #c5c5c5;
    }
  }
</style>
