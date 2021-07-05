/**
* creater: chenrenbin
* creatTime: 2019.09.20
* use:
<select-list v-model="" :dataSource=""/>
*
*  ps: dataSource: [{
*        name: '', 数据类型名称
*        key: '',  数据类型标识
*        icon: '', 数据类型Icon
*        dataKey: {id: '',name: '',avatar: '',}, id：指定list的数据主键属性名称，name/avatar:用于列表展示数据对应list内的属性名，支持以竖线（'|'）分隔排优先级
*        list: [{...}]
*        child: [] 二级数据
*      }]
*      v-model：返回对应list的数据，加上dataKey属性---[{...listItem, dataKey}]
**/

<template>
	<div id="multiplePanel-selectList">
		<div class="menu" v-if="!showSlect">
			<template v-for="(item, index) in dataSource">
				<template v-if="!item.child">
					<div @click.stop="showMenu(item)" :key="`menu-${index}`">
						<AAlist-item class="menu-item" :icon="item.icon" :title="item.name" />
					</div>
				</template>
				<template v-else>
					<div @click.stop="showMenu(item)" :key="`menu-${index}`">
						<AAlist-item class="menu-item" :icon="item.icon" :title="item.name">
							<template v-slot:right>
								<i class="iconfont iconxiangxia" :class="{up: showChildMenuKey == item.key}"></i>
							</template>
						</AAlist-item>
					</div>
					<template v-if="showChildMenuKey == item.key">
						<div @click.stop="showMenu(child)" :key="`menuChild-${childIndex}`"
							v-for="(child, childIndex) in item.child"
						>
							<AAlist-item class="menuChild-item" :icon="child.icon" :title="child.name" />
						</div>
					</template>
				</template>
			</template>
		</div>

		<div class="menu-second" v-else>
			<h3 @click.stop="showMenu()">
				<i class="iconfont iconfanhui"></i>{{selectedItem.name}}
			</h3>
			<div style="paddingTop:60px">
				<div v-for="(item, index) in selectedItem.list" :key="`menu-second-item-${index}`" :class="{'disabled-item':isDisabled(item)}"
					@click.stop="doSelect(selectedItem, item)"
				>
					<AAlist-item class="menu-second-item" :title="selectedItem.dataKey.name | filterBykeys(item)"
						:desc="getDesc(selectedItem,item)"
					>
						<template v-slot:left>
							<i :class="['iconfont', 'icongou', {select: isSelect(selectedItem, item)}]"></i>
							<a-avatar :size="43" :src="selectedItem.dataKey.avatar | filterBykeys(item)"></a-avatar>
						</template>
					</AAlist-item>
				</div>
			</div>
			<div class="nodata" v-if="selectedItem.list.length == 0">
				<img src="~@/assets/img/nothing.png" width="132" height="100">
				<p>{{$t('common.nothingTips')}}</p>
			</div>
		</div>
	</div>
</template>
<script>
	import AAlistItem from '@/components/AAlist/item.vue'
	import getLetter from '@/utils/common/pinyin'
	//  import { sortByPinyin } from '@/utils/electron/fun'
	export default {
		name: 'SelectList',
		components: { AAlistItem },
		filters: {
			filterBykeys(key, data) {
				let result = ''
				const keys = key.split('|')
				for (var i = 0; i < keys.length; i++) {
					var keyRank = keys[i].split('.')
					if (keyRank.length) {
						let findData = data
						for (var j = 0; j < keyRank.length; j++) {
							result = findData[keyRank[j]] || ''
							if (typeof result == 'string') {
								break
							} else {
								findData = result
							}
						}
					} else {
						result = data[keyRank[0]] || ''
					}
					if (result) break
				}
				return result
			}
		},
		props: {
			value: Array,
			dataSource: Array,
			disabledIds: {
				type: Array,
				default: () => ([])
			}
		},
		data() {
			return {
				showKey: '',
				showChildMenuKey: 'friends',
				showSlect: false,
				selectedItem: {}
			}
		},
		watch: {
			'dataSource'(nVal, oVal) { // 确保二级列表是响应式
				if (this.selectedItem.key) {
					const	selectedItem = nVal.find(item => this.selectedItem.key == item.key)
					if (selectedItem && selectedItem.list.length && selectedItem.key == 'friends') {
						selectedItem.list = this.doSort(selectedItem.list)
					}
					this.selectedItem = selectedItem
				}
			}
		},
		created()	{
			// 默认打开第一个列表
			this.showMenu(this.dataSource[0])
		},
		mounted() {
		},
		beforeDestroy() {
		},
		methods: {
			isDisabled(item) {
				return this.disabledIds.includes(item[this.selectedItem.dataKey.id])
			},
			getDesc(selectedItem, item) {
				let	result = ''
				if (selectedItem.key == 'friends' || (selectedItem.key == 'recentChat' && item.userInfo)) {
					result = (item.userInfo && item.userInfo.onlineState == 1) ? this.$t('common.online') : this.$t('common.offline')
					// result = (item.userInfo && item.userInfo.onlineState == 1) ? this.$t('common.online') : this._formatDate(item.userInfo.onlineTime)
				}	else if (selectedItem.key == 'groups' || (selectedItem.key == 'recentChat' && item.groupUsers)) {
					result = `${item.groupUsers.length + this.$t('common.people')}`
				}
				return result
			},
			doSort(list = []) {
				let onlineList = []
				let offlineList = []
				list.forEach(item => {
					item.userInfo.onlineState == 1 ? onlineList.push(item) : offlineList.push(item)
				})
				onlineList = this.sortByPinyin(onlineList)
				offlineList = this.sortByPinyin(offlineList)
				return onlineList.concat(offlineList)
			},
			sortByPinyin: (list = []) => {
				let result = []
				const store = {}
				const letterList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
				letterList.map(letter => {
					store[letter] = []
				})
				const letterReg = new RegExp('^[a-zA-Z]')
				// const uppercaseLetterReg = new RegExp('^[A-Z]') // 来自
				list.map(item => {
					const value = item.label || item.userInfo.nickName
					if (!value) return
					if (letterReg.test(value[0])) { // 以字母命名的情况后续可看是否有要求再优化
						store[value[0].toUpperCase()].unshift(item)
					} else if (letterReg.test(getLetter(value[0])[0])) {
						store[getLetter(value[0])[0]].push(item)
					} else store['#'].push(item)
				})
				Object.values(store).forEach(item => {
					result = result.concat(item)
				})
				return result
			},
			_formatDate(time) { // 时间戳
				if (!time) return	''
				let result = ''
				const	serverTime = this.$utils.fun.getServerTime('_formatDate')
				const interval = (serverTime || Date.now()) - time
				function isToday(timestamp) {
					return new Date(Number(timestamp)).setHours(0, 0, 0, 0) == new	Date(serverTime).setHours(0, 0, 0, 0)
				}
				if (!time) {
					result = window.i18n.t('common.offline')
				} else if (interval < 1000 * 60) {
					result = window.i18n.t('chat.justNow') + window.i18n.t('common.online')
				} else if (interval < 1000 * 60 * 60) {
					result = window.i18n.tc('chat.minuteAgo', Math.floor(interval / (1000 * 60)))
				// } else if (interval < 1000 * 60 * 60 * 24) {
				} else if (isToday(time)) {
					result = window.i18n.tc('chat.hourAgo', Math.floor(interval / (1000 * 60 * 60)))
				} else if (new Date(serverTime).getFullYear() == new Date(Number(time)).getFullYear()) {
					result = this.$utils.time.formatTimestamp(time, 'M/D') + this.$t('common.online')
				} else {
					result = this.$utils.time.formatTimestamp(time, 'Y/M/D') + this.$t('common.online')
				}
				return result
			},
			showMenu(item = { list: [] }) {
				if (item.child && item.child.length) {
					this.showChildMenuKey = this.showChildMenuKey == item.key ? '' : item.key
				} else {
					if (item.list.length && item.key == 'friends') item.list = this.doSort(item.list)
					this.selectedItem = item
					this.showSlect = !this.showSlect
				}
			},
			doSelect(dataSourceItem, selectItem) {
				const { dataKey, key } = dataSourceItem
				const sameData = this.value.find(item => {
					return item[dataKey.id] == selectItem[dataKey.id]
				})
				if (!sameData) {
					selectItem.dataSourceKey = key
					selectItem.dataKey = dataKey // 由于数据类型是自定义的，加入dataKey数据用于面板左侧展示选中结果的名称过滤
					this.$emit('input', this.value.concat([selectItem]))
				} else {
					this.$emit('input', this.value.filter(item => {
						return item[dataKey.id] != selectItem[dataKey.id]
					}))
				}
			},
			isSelect(dataSourceItem, data) {
				const sameData = this.value.find(item => {
					return item[dataSourceItem.dataKey.id] == data[dataSourceItem.dataKey.id]
				})
				return Boolean(sameData)
			}
		}
	}
</script>
<style lang="scss">
  #multiplePanel-selectList {
		-webkit-app-region: no-drag;
    .menu {
      .menu-item {
        padding: 5px 15px;
        &:hover {
          background-color: $bg
        }
				.iconfont{
					padding: 4px;
					font-size: 34px;
					border-radius: 50%;
				}
				.iconxiaoxi{
					background-color: #6CC988;
				}
        .iconwodequnzu {
          background-color: #FF872F;
        }
        .iconxiangxia {
          color: $gray;
          font-weight: bold;
          display: inline-block;
          transform: rotate(0deg);
          transition: transform 0.3s;
          &.up {
            transform: rotate(180deg);
          }
        }
      }
      .menuChild-item {
        padding: 8px 15px 8px 30px;
        border: none;
        &:hover {
          background-color: $bg;
          .iconfenzu {
            background-color: $bg;
          }
        }
        .iconfenzu {
          color: #E9E9E9;
          font-size: 16px;
          background-color: #FFF;
        }
      }
    }
    .menu-second {
      padding: 0 15px;
      & > h3 {
        color: $black;
        font-size: 16px;
		width: 224px;
        height: 54px;
		line-height: 54px;
		margin: 0;
        cursor: pointer;
		position: absolute;
		top: 0;
		z-index: 10;
		background-color: #fff;
		border-bottom: $border;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
        .iconfont {
          color: $gray;
          font-size: 14px;
          font-weight: bold;
          margin-right: 5px;
        }
        &:hover .iconfont {
          color: $darkBlue
        }
      }
      .menu-second-item {
        padding: 9px 0;
        border: none;
        .icongou {
          color: #FFF;
          font-size: 14px;
          background-color: #FFF;
          border: $border;
		  border-color: #c9c9c9;
          border-radius: 50%;
          margin-right: 5px;
          position: relative;
          top: 3px;
          &::before {
            position: relative;
            top: 1px;
          }
        }
        .select {
          border-color: $darkBlue;
          background-color: $darkBlue;
        }
      }

	  .disabled-item{
			pointer-events: none;
			filter: grayscale(100%);
			opacity: .5;
		}
      .nodata {
        text-align: center;
        margin-top: 100px;
        p {
          color: $gray;
          font-size: 12px;
        }
      }
    }
  }
</style>
