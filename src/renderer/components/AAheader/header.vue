/**
defineclose: 是否启用自定义菜单
支持插槽覆盖
* creater: linzuan
* creatTime: 2019.07.17
* use:
<aachat_header :defineclose="{false or true}"></aachat_header>
**/

<template>
	<div class="aachat_header">
		<header id="chat_header">
			<div class="search-area" style="-webkit-app-region: no-drag;">
				<slot name="aaleft">
					<!--&lt;!&ndash;<a-auto-complete :dataSource="dataSource" />&ndash;&gt;-->
					<!--<input type="text">-->
					<!--<span class="iconfont iconsousuo allsearch"></span>-->
				</slot>
			</div>

			<div class="usermsg" style="margin-right: 176px;">
				<slot name="aamid">
					<!--<span class="isonline" v-if="!isonline" style="margin-right: 60px;">正在重连...</span>-->
					<!--<slot name="centen"></slot>-->
					<!--<a-avatar  :style=" {color: '#f56a00', backgroundColor: '#fde3cf'} ">U</a-avatar>-->
					<!--<a-avatar  :src="'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'"></a-avatar>-->
					<!--<span class="iconfont iconxiala" style="color: #999999"></span>-->
				</slot>
			</div>

			<div
				class="window-btns"
				v-if="$utils.currentWindow && !defineclose"
				style="{-webkit-app-region: no-drag}"
			>
				<button class="iconfont iconjian" @click="$utils.currentWindow.min"></button>
				<button :class="'iconfont '+(isMax?'iconshouqi':'iconquanping')" @click="max"></button>
				<button class="iconfont icontongyongguanbi" @click="$utils.currentWindow.close"></button>
			</div>
			<div class="window-btns" v-if="defineclose" style="{-webkit-app-region: no-drag}">
				<!--<button class="iconfont icontongyongguanbi" @click="closedefine()"></button>-->
				<slot name="closebtn"></slot>
			</div>
		</header>
	</div>
</template>

<script>
	export default {
		name: 'AachatHeader',
		props: {
			useravatar: {
				type: Object,
				default: function() {
					return { user: false }
				}
			},
			defineclose: { type: Boolean, default: false }
		},
		data() {
			return {
				isMax: false
			}
		},
		computed: {
			isonline() {
				return this.$store.state.Setting.online
			}
		},
		mounted() {
			window.addEventListener('online', this.updateOnlineStatus)
			window.addEventListener('offline', this.updateOnlineStatus)
		},
		methods: {
			max() {
				if (this.$utils.currentWindow.isMax()) {
					this.$utils.currentWindow.unMax()
					this.isMax = false
				} else {
					this.$utils.currentWindow.max()
					this.isMax = true
				}
			},
			updateOnlineStatus(e) {
				const { type } = e
				this.isonline = type === 'online'
			}
		}
	}
</script>

<style lang="scss">
  .aachat_header {
    display: flex;
    flex-direction: column;
    #chat_header {
      height: 55px;
      border-bottom: $border;
      -webkit-app-region: drag;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      .search-area {
        flex: 0.3;
        text-align: center;
        position: relative;
        input {
          width: 232px;
          border: 1px solid rgba(240, 240, 240, 1);
          border-radius: 4px;
          margin-left: 16px;
        }
        .allsearch {
          position: absolute;
          left: 25px;
          top: 4px;
          font-size: 13px;
          color: #999999;
        }
      }
      .isonline {
        width: 80px;
        height: 30px;
        background-color: #fde7e4;
        border-radius: 4px;
        color: #f45e4d;
        padding: 7px 7px;
        font-size: 12px;
      }
      .window-btns {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 12px 0 20px;
        border-left: $border;
        position: absolute;
        right: 0px;
        button {
          font-size: 11px;
          -webkit-app-region: no-drag;
          cursor: pointer;
          &:nth-of-type(n + 2) {
            margin-left: 25px;
          }
        }
      }
    }
  }
</style>
