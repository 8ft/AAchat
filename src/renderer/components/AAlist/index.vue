/**
* creater: chenrenbin
* creatTime: 2019.07.15
* use:
<AAlist
  * :list="[]"  // 数据源
*        :itemCallback="itemCallback"   // 列表子项点击事件回调，参数：数据item和索引index
*       />
*  ps: 子项插槽提供props：数据item和索引index
**/

<template>
	<ul id="AAlist">
		<li v-for="(item,index) in list" :key="'AAlist-item' + index">
			<div @click="handleCilck(item, index)">
				<slot :item="item" :index="index"></slot>
			</div>
		</li>
	</ul>
</template>

<script>
	export default {
		name: 'AAlist',
		components: {},
		props: {
			list: {
				type: Array,
				default: function() {
					return []
				}
			},
			itemCallback: Function
		},
		methods: {
			handleCilck(item, index) {
				if (this.itemCallback) {
					this.itemCallback(item, index)
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
  #AAlist {
    margin: 0
  }
</style>
