<!--
使用方式:
<message-box :boxtitle='{}' :doClose="doClose" top="100px" v-if="show" :dosure="dosure">
    <div slot='content'>你的编辑区域</div>
</message-box>
说明：boxtitle={title:'',close:true or false} 头部title跟关闭按钮 不传头部不显示，可传单个
      doClose用于关闭窗体及执行自定义操作；
      dosure用于确认按钮
      top用于控制窗体头部距离浏览器视口的距离，默认窗口是相对浏览器视口垂直水平居中
-->

<template>
	<div class="messageBox">
		<div class="chat-background" @click="close"></div>
		<div class="chat-body" :style="top ? {top, transform: 'translate(-50%, 0)'} : null">
			<div class="chat_mian">
				<div class="boxheader" v-if="boxtitle.title || boxtitle.close">
					<slot name="boxheader">
						<h2>{{boxtitle.title}} </h2><span class="iconfont icontongyongguanbi" v-if="boxtitle.close"
							@click="close"
						></span>
					</slot>
				</div>
				<div class="maincontent">
					<slot name="content"></slot>
					<div class="footerbtn">
						<slot name="btn">
							<a-button type="primary" @click="sure">
								确定
							</a-button>
							<a-button @click="close">
								{{$t('common.exitBtn')}}
							</a-button>
						</slot>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'MessageBox',
		props: {
			top: {
				type: String,
				default: null
			},
			doClose: {
				type: Function,
				default: null
			},
			dosure: {
				type: Function,
				default: null
			},
			boxtitle: {
				type: Object,
				default: () => {
					return { title: false, close: false }
				}
			}
		},
		methods: {
			close() {
				if (this.doClose) this.doClose()
			},
			sure() {
				if (this.dosure) this.dosure()
			}
		}
	}
</script>

<style lang="scss" scoped>
  .messageBox {
    .chat-background {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1300;
      background: rgba(0, 0, 0, .45);
    }
    .chat-body {
      background-color: #fff;
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 1300;
      transform: translate(-50%, -50%);
      .chat_mian {
        .boxheader {
          background: #F1F2F5;
          height: 35px;
          border-radius: 4px;
          line-height: 35px;
          padding: 0px 20px;
          h2 {
            /*width: 100%;*/
            float: left;
            font-size: 16px;
            font-weight: normal;
            color: #333333;
          }
          .icontongyongguanbi {
            float: right;
            font-size: 12px;
            color: #999999;
            cursor: pointer;
          }
        }
        .maincontent {
          padding: 20px 25px 25px 25px;
          clear: both;
          .footerbtn {
            float: right;
            padding-bottom: 15px;
            padding-top: 15px;
            button {
              margin-left: 12px;
              &:last-of-type {
                color: #999999;
              }
            }
          }
        }
      }
    }
  }
</style>
