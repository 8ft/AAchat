<!--/**
* creater: chenrenbin
* creatTime: 2019.07.17
* use: <AAlist-item
*        src=""         //设置组件左侧显示图片地址，对应ant-design的头像组件src参数，更多设置可在avatarConfig配置
*        icon=""        // 设置组件左侧显示icon，值对应内置字体图标库的类名
*        iconStyle='{}' // 配置组件左侧显示内置字体图标库icon时的自定义样式
*        title=""       // 设置组件中间的第一行文本，支持标签字符串（例如：嵌入em标签实现高亮可用于搜索组件，嵌入i标签用于标题旁的logo）
*        desc=""        // 设置组件中间的第二行文本，特性同上
*        :leftCallback="leftCallback"     // 点击头像的触发事件，回传参数：（有传data参数时回传data对象,无时默认{}）
*        :centerCallback="centerCallback"   // 点击中间内容主体的触发事件，回传参数同上
*    补充参数：
*         :data="{}"  // 数据对象
*         :metaKey="{}"      // 对应传入list内使用“标题/描述”的字段名； 默认：{src: 'src', title: 'title', desc: 'desc'}
*         :avatarConfig={}   // 对应ant-design的头像组件参数：{icon，shape，size（默认43px），src，srcSet，alt，loadError}
*         :avatarError=""    //  头像加载失败的默认头像
*      />
*
*  ps: 所有参数都是非必须的(事件传参情况可参照事件冒泡规则按需定制)；UI主体分为三列自适应布局，支持插槽覆盖，具体参照v-slot的使用;
*      取值优先级：icon > src > avatarConfig > data[metaKey.src], title > data[metaKey.src], desc > data[metaKey.desc]
**/-->

<template>
	<div class="AAlist-item" v-if="title||data[metaKey.title]||desc||data[metaKey.desc]">
		<div class="item-left" @click="leftHandle(data)">
			<slot name="left">
				<i :class="['avatar', 'iconfont', icon]" :style="iconStyle" v-if="icon"></i>
				<a-avatar
					class="avatargerenbg"
					v-else-if="src || avatarConfig.src || data[metaKey.src]"
					:icon="avatarConfig.icon"
					:shape="avatarConfig.shape"
					:size="avatarConfig.size || 43"
					:src="loadErrorSrc || src || avatarConfig.src || data[metaKey.src]"
					:srcSet="avatarConfig.srcSet"
					:alt="avatarConfig.alt"
					:loadError="avatarConfig.loadError || loadError"
				/>
			</slot>
		</div>
		<div class="item-center" @click="centerHandle(data)">
			<slot name="center">
				<p class="meta meta-title" v-html="title || data[metaKey.title]"></p>
				<p class="meta meta-description" v-html="desc || data[metaKey.desc]"></p>
			</slot>
		</div>
		<div class="item-right">
			<slot name="right"></slot>
		</div>
	</div>
</template>

<script>
	import geren from '@/assets/img/geren_default@2x.png'

	export default {
		name: 'AAlistItem',
		layout: 'default',
		components: {},
		props: {
			src: String,
			icon: String,
			title: String,
			desc: String,
			iconStyle: {
				type: Object,
				default: function() {
					return {}
				}
			},
			data: {
				type: Object,
				default: function() {
					return {}
				}
			},
			metaKey: {
				type: Object,
				default: function() {
					return { src: 'src', title: 'title', desc: 'desc' }
				}
			},
			avatarConfig: {
				type: Object,
				default: function() {
					return {}
				}
			},
			avatarError: String,
			leftCallback: Function,
			centerCallback: Function
		},
		data() {
			return {
				loadErrorSrc: ''
			}
		},
		methods: {
			leftHandle(item) {
				if (this.leftCallback) {
					this.leftCallback(item)
				}
			},
			centerHandle(item) {
				if (this.centerCallback) {
					this.centerCallback(item)
				}
			},
			loadError() {
				this.loadErrorSrc = this.avatarError || geren
			}
		}
	}
</script>

<style lang="scss" scoped>
  .AAlist-item {
    p {
      margin: 0;
      padding: 0;
      word-break: break-all;
    }
    width: 100%;
    padding: 12px 0;
    border-bottom: $border;
    cursor: pointer;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-around;
    align-items: center;
    .item-left {
      flex: 0 0 auto;
      .avatar {
        color: #FFF;
        font-size: 36px;
        border-radius: 4px;
        background-color: $darkBlue;
      }
    }
    .item-center {
      flex: 1 1 auto;
      padding: 0 10px;
      .meta-title {
        color: $black;
        font-size: 16px;
        font-weight: 400;
      }
      .meta-description {
        color: $lightBlack;
        font-size: 12px;
      }
      .meta {
        // line-height: 26px;
        // max-height: 26px;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        em {
          color: $darkBlue;
          font-style: normal;
        }
        i {
          padding-left: 5px;
          &:hover {
            color: $darkBlue;
          }
        }
      }
      &:hover {
        .meta-title {
          i {
            color: $black;
          }
        }
      }
    }
    .item-right {
      flex: 0 0 auto;
    }
  }
</style>
