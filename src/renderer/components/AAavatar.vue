/**
* creater: chenrenbin
* creatTime: 2019.07.15
* use:
<AAavatar :logos="logos"></AAavatar>
*    logos: [{
*       type: 'img/text',
*       value: 'url/文本' (ps:文本已做截取首字处理)
*    }]
**/

<template>
	<div class="AAavatar">
		<div class="AAavatar-logo" :style="variationStyle(index)" v-for="(item, index) in logos"
			:key="'AAavatar-logo' + index"
		>
			<img :src="item.value" alt="" v-if="item.type == 'img'">
			<p :style="variationText(index)" v-else>
				{{item.value[0]}}
			</p>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'AAvatar',
		props: {
			logos: {
				type: Array,
				validator: function(value) {
					let result = true
					value.forEach(v => {
						if (!v.type || !v.value) return result = false
					})
					return result
				},
				default: () => [{ type: '', value: '' }],
				required: true
			}
		},
		methods: {
			variationStyle(index) {
				var result = {}
				const BORFER = '1px solid #FFF'
				switch (this.logos.length) {
				case 1:
					break
				case 2:
					result = { width: '50%' }
					index == 0 ? result['border-right'] = BORFER : result['border-left'] = BORFER
					break
				case 3:
					result = { width: '50%', height: '50%' }
					if (index == 0) {
						result.height = '100%'
						result['border-right'] = BORFER
					} else if (index == 1) {
						result['border-left'] = result['border-bottom'] = BORFER
					} else if (index == 2) {
						result['border-left'] = result['border-top'] = BORFER
					}
					break
				default:
					result = { width: '50%', height: '50%' }
					if (index == 0) {
						result['border-right'] = result['border-bottom'] = BORFER
					} else if (index == 1) {
						result['border-left'] = result['border-bottom'] = BORFER
					} else if (index == 2) {
						result['border-right'] = result['border-top'] = BORFER
					} else if (index == 3) {
						result['border-left'] = result['border-top'] = BORFER
					}
				}
				return result
			},
			variationText(index) {
				var result = {}
				const POSITION = '2px'
				switch (this.logos.length) {
				case 1:
					result = { position: 'unset', 'line-height': '42px', 'text-align': 'center', 'font-size': '18px' }
					break
				case 2:
					if (index == 0) {
						result = { 'line-height': '42px', right: POSITION }
					} else if (index == 1) {
						result = { 'line-height': '42px', left: POSITION }
					}
					break
				case 3:
					if (index == 0) {
						result = { 'line-height': '42px', right: POSITION }
					} else if (index == 1) {
						result = { bottom: POSITION, left: POSITION }
					} else if (index == 2) {
						result = { top: POSITION, left: POSITION }
					}
					break
				default:
					if (index == 0) {
						result = { bottom: POSITION, right: POSITION }
					} else if (index == 1) {
						result = { bottom: POSITION, left: POSITION }
					} else if (index == 2) {
						result = { top: POSITION, right: POSITION }
					} else if (index == 3) {
						result = { top: POSITION, left: POSITION }
					}
				}
				return result
			}
		}
	}
</script>

<style lang="scss" scoped>
  .AAavatar {
    display: inline-block;
    width: 43px;
    height: 43px;
    overflow: hidden;
    border-radius: 50%;
    .AAavatar-logo {
      display: inline-block;
      background-color: #2E87FF;
      width: 100%;
      height: 100%;
      position: relative;
      p {
        color: #fff;
        font-size: 12px;
        line-height: 12px;
        margin: 0;
        padding: 0;
        position: absolute;
      }
      img {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        border: none;
        vertical-align: unset;
      }
    }
  }
</style>
