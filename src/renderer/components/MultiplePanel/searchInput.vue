<!--/**
* creater: chenrenbin
* creatTime: 2019.09.20
* use: <search-input v-model="" :dataSource=""/>
*
*  ps: dataSource: [{
*        name: '', 数据类型名称
*        key: '',  数据类型标识
*        dataKey: {id: ''}, id：指定list的数据主键属性名称
*        list: [{
*           extend: {avatar,title,desc} 指定展示列表的图片和文本
*           ....
*         }]
*        searchFilter: 过滤算法，回传搜索文本和列表数据&#45;&#45;function(searchText, list){}
*      }]
*      v-model：返回对应list的数据，加上dataKey属性-&#45;&#45;[{...listItem, dataKey}]
**/-->

<template>
	<div id="search-input" v-clickoutside="_hideDropdown">
		<a-input :placeholder="$t('common.search')" v-model.trim="searchText" />
		<div class="resultPanel" v-if="searchText">
			<div class="list" v-if="searchResult.length">
				<div class="item" v-for="item in searchResult" :key="item.key">
					<h3>{{item.name}}</h3>
					<template v-if="item.key=='groupMembers'">
						<div v-for="(childItem, index) in item.list" @click="doSelect(item, childItem)" :key="`${item.key}-${index}`">
							<AAlist-item class="child-item" :src="childItem.avatar" :title="childItem.title"
								:desc="childItem.desc"
							></AAlist-item>
						</div>
					</template>
					<template v-else>
						<div v-for="(childItem, index) in item.list" @click="doSelect(item, childItem)" :key="`${item.key}-${index}`">
							<AAlist-item class="child-item" :src="childItem.extend.avatar" :title="childItem.extend.title"
								:desc="childItem.extend.desc"
							></AAlist-item>
						</div>
					</template>
				</div>
			</div>
			<div v-if="loading" class="loading">
				<a-spin />
			</div>
			<div v-else-if="!searchResult.length" class="no-data">
				<p>{{$t('search.noResultFound')}}</p>
			</div>
		</div>
	</div>
</template>
<script>
	import AAlistItem from '@/components/AAlist/item.vue'

	let searchPool

	export default {
		name: 'SearchInput',
		components: { AAlistItem },
		props: {
			value: {
				type: Array,
				default: () => {
					return []
				}
			},
			dataSource: Array
		},
		data() {
			return {
				loading: false,
				searchText: '',
				searchResult: []
			}
		},
		computed: {},
		watch: {
			'searchText'(nVal, oVal) {
				if (nVal != oVal) {
					this.loading = true //  加载效果提前
					searchPool(nVal)
				}
			}
		},
		filter: {},
		created() {
		},
		mounted() {
			searchPool = this.debounce(this.doSearch, 700)
		},
		beforeDestroy() {
			searchPool.cancel()
			searchPool = null
		},
		methods: {
			doSearch(value) {
				if (!value) {
					this.searchResult = []
					return
				}
				const result = []
				this.dataSource.map(item => {
					if (!item.searchFilter) return
					const { list, ...other } = item
					other.list = item.searchFilter(value, list)
					if (other.list.length) result.push(other)
				})
				this.searchResult = result
				this.$nextTick(() => {
					this.loading = false
				})
			},
			doSelect(dataSourceItem, selectItem) {
				const { dataKey, key } = dataSourceItem
				const sameData = this.value.find(item => {
					return item[dataKey.id] == selectItem[dataKey.id]
				})
				if (!sameData) {
					selectItem.dataSourceKey = key
					selectItem.dataKey = dataKey
					this.$emit('input', this.value.concat([selectItem]))
				}
				this.searchText = ''
			},
			debounce(fn, timeout = 500, immediate = true) {
				let timer
				const debounced = function(...args) {
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => {
						if (immediate) immediate = false
						fn.apply(fn, args)
					}, immediate ? 0 : timeout)
				}
				debounced.cancel = function() {
					clearTimeout(timer)
					timer = null
				}
				return debounced
			},
			_hideDropdown() {
				this.searchText = ''
				this.searchResult = []
			}
		}
	}
</script>
<style lang="scss">
  #search-input {
    margin-top: 15px;
    position: relative;
    .ant-input {
      height: 40px
    }
    .resultPanel {
      position: absolute;
      top: 52px;
			z-index: 1;
      width: 100%;
      background: #fff;
      border: $border;
      border-radius: 4px;
      min-height: 60px; //  配合loading
      .list {
        height: 310px;
        overflow-y: auto;
        .item {
          h3 {
            color: $gray;
            font-size: 14px;
            line-height: 40px;
            margin: 0;
            border-bottom: $border;
            margin-left: 14px;
          }
          .child-item {
            padding: 5px 0 5px 14px;
            &:hover {
              background-color: #F8F8F8
            }
          }
        }
      }
    }
    .no-data {
      p {
        color: $gray;
        font-size: 12px;
        line-height: 60px;
        text-align: center;
      }
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 100%;
      background: #fff;
      opacity: 0.8;
      z-index: 1;
    }
  }
</style>
