<template>
	<div class="player">
		<a-modal :title="'系统通知'"
			centered
			class="notification-IM"
			:z-index="10000"
			:visible="isDel"
			:width="438"
			:closable="false"
		>
			<p>您浏览的内容已被删除或撤回</p>
			<template #footer>
				<a-button type="primary" @click="handleClose">
					确定
				</a-button>
			</template>
		</a-modal>
		<div class="player-top" :style="'padding-top:' + ($utils.os.isMac ? '10px' : '')">
			<div class="player-top-db-area" @dblclick.stop="headerDbClick"></div>
			<div class="user-info">
				<div class="user-avatar avatargerenbg" :class="{'avatarLoadFinish': avatarLoadFinish}">
					<img :src="userAvatar" @load="avatarLoadSucc" @error="e => $utils.setDefaultAvatar(e, 0)">
				</div>
				<div class="user-name">
					<span>{{userName + title}}</span>
					<p>{{fileSize | formatBytes}} {{timestamp}}</p>
				</div>
			</div>
			<window-top-right-btns close-btn-type="close" from="player"></window-top-right-btns>
			<div class="tool">
				<slot name="toolbar">
					<div>
						<div class="iconfont iconxiazai">
							<p>
								<span></span>
							</p>
						</div>
						<div class="iconfont iconzhuanfa1"></div>
					</div>
				</slot>
			</div>
		</div>
		<div class="player-container">
			<slot v-if="!isClose"></slot>
		</div>
	</div>
</template>

<script>
	import windowTopRightBtns from '@/components/windowTopRightBtns'
	import { ipcRenderer } from 'electron'

	export default {
		name: 'Player',
		components: {
			windowTopRightBtns
		},
		props: {
			title: {
				type: String,
				default: ''
			},
			playerType: {
				type: Number
			},
			playerInfo: {
				type: Object,
				default: () => {
					return {}
				}
			}
		},
		data() {
			return {
				avatarLoadFinish: false,
				isDel: false,
				isClose: true,
				timestamp: '',
				isMax: false,
				params: {},
				fileSize: 0,
				userName: '',
				userAvatar: ''
			}
		},
		watch: {
			playerInfo(val) {
				document.title = val.userName + this.title
				this.fileSize = val.fileSize
				this.userName = val.userName
				this.userAvatar = val.userAvatar
				this.timestamp = window.$moment(parseInt(val.timestamp)).format('YYYY/MM/DD HH:mm')
			},
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
			avatarLoadSucc() {
				this.avatarLoadFinish = true
			},
			async handleClose() {
				this.isDel = false
				this.isClose = true
				this.$utils.currentWindow.setOpacity(0)
				await this.$utils.fun.waiting(100)
				this.$utils.currentWindow.close()
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
			ipcRenderer.on('params', async(event, payload) => {
				if (!payload.userName) return
				this.isClose = false
				this.$store.dispatch('OPcomponent/set_playerWinHide', true)
				this.$emit('params', payload)
			})
			ipcRenderer.on('delete', () => {
				this.isDel = true
			})
			ipcRenderer.on('setPlayerWin', (event, payload) => {
				const temp = window._.assign({}, this.params, payload)
				console.log('setPlayerWin:::', temp)
				this.$emit('resetParams', temp)
			})
			ipcRenderer.on('close', () => {
				this.isClose = true
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
          font-size: 25px;
          color: #666;
          margin-right: 20px;
          cursor: pointer;
          position: relative;
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
	    // border-top: 1px solid #c5c5c5;
    }
  }
</style>
