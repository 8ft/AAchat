<!--
/**
* creater: chenrenbin
* creatTime: 2019.09.20
* use: <MultiplePanel
*        :visible=""        // 显示开关
*        :modeltitle=""     // 标题
*        :limit=""          //  可选数量阈值
*        :confirm=""        //  获取选中的数据
*        :cancel=""         //  关闭组件
*        :dataType=""       //  数据源类型：	recentChat（最近聊天），friends（我的好友），groups（我的群组）,groupMembers(群成员) 以竖线('|')分割代表多个数据源;不传默认全部数据
*		 :selectedIds=""    //	groupId（暂定，随后续需求变更）字符串形式设置已选中的数据，多个以‘|’分割
*		 :clear=""			//	是否在显示时清空前一次的操作状态,默认会清
*        :disableSelected=""  //是否禁用已选
*       />
*
*  ps: confirm返回一个数组：[groupInfo/friendInfo]
*      groupInfo: {...myGroup, userRelationList：[{...userRelationInfo, friendInfo, userInfo}, ...]}
*      friendInfo: {...myFriend, userInfo}
*      说明: myGroup：我的群组信息；userRelationInfo：群组用户信息（群成员）；userRelationInfo：我的好友信息；userInfo：用户信息
*           对应接口/user/groupInfo/myGroupsAndUsers的数据格式
**/
-->

<template>
	<div id="multiple-panel" ref="multiplePanel" @click.stop>
		<a-modal
			class="multiple-panel notification-IM"
			:title="modeltitle"
			centered
			:maskClosable="false"
			:getContainer="()=>$refs.multiplePanel" :visible="visible" v-if="visible" :width="686" :footer="null"
			@cancel.stop="doCancel"
		>
			<div class="panel-body">
				<div class="left">
					<div class="left-top item">
						<search-input v-model="selectList" :dataSource="dataSource"	/>
					</div>
					<div class="left-center item">
						<template v-for="(item, index) in selectList">
							<span class="tip" :key="`tip-${index}`">{{item.dataKey.name | filterBykeys(item)}}<i
								class="iconfont icontongyongguanbi" @click.stop="doDelete(index,item)"
							></i></span>
						</template>
					</div>
					<div class="left-bottom item">
						<!--自定义扩展-->
						<slot></slot>
						<div class="operation">
							<a-button type="primary" :loading="loading" :disabled="loading||(selectingCount===0 && modeltitle !== $t('search.selectSender'))"
								@click="doConfirm(selectList)"
							>
								{{$t('common.okBtn') + (limit ? `(${selectList.length}/${limit})` : '')}}
							</a-button>
							<a-button :loading="loading" :disabled="loading" @click.stop="doCancel">
								{{$t('common.exitBtn')}}
							</a-button>
						</div>
					</div>
				</div>
				<div class="right">
					<select-list v-model="selectList" :disabledIds="disabledIds" :dataSource="dataSource" />
				</div>
			</div>
		</a-modal>
	</div>
</template>
<script>
	import SearchInput from './searchInput.vue'
	import SelectList from './selectList.vue'
	import { mapGetters } from 'vuex'

	export default {
		name: 'MultiplePanel',
		components: { SearchInput, SelectList },
		props: {
			groupName: String,
			groupMembers: Array,
			visible: Boolean,
			limit: [String, Number],
			confirm: Function,
			cancel: Function,
			dataType: String,
			modeltitle: String,
			selectedList:	Array,
			selectedIds: String,
			disabledIds: {
				type: Array,
				default: () => ([])
			},
			clear: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				loading: false,
				selectList:	[],
				selectingCount: 0
			}
		},
		computed: {
			...mapGetters({
				friendsDetail: 'friendsDetail',
				groupsDetail: 'groupsDetail',
				threads: 'sortedThreads'
			}),
			dataSource() {
				//        1.3版本去除分组
				//        const friendGroups = this.$store.state.MyFriend.friendGroups.map((item,index) => {
				//          const data = {
				//            name: item.friendGroupName, icon: 'iconfenzu', key: item.friendGroupId,
				//            dataKey: {id: 'userId', name: 'label|userInfo.nickName', avatar: 'userInfo.userAvatar'},
				//            list: this.friendsDetail.filter(friendInfo => {return item.friendGroupId == friendInfo.friendGroupId})
				//          }
				//          return data
				//        })
				// 过滤系统消息、非群成员、被锁定得群、被隐藏显示
				const	recentChatList = this.threads.length && this.threads.filter(item => (item.type == 0 || (item.type == 1 && item.latestStatus == '8' && item.state != 0)) && item.hidden == 0).map(item => {
					var	newItem = null
					if (item.type == 0) {
						newItem = this.friendsDetail.find(itemInfo => itemInfo.groupId == item.id)
					}	else if (item.type == 1) {
						newItem = this.groupsDetail.find(itemInfo => itemInfo.groupId == item.id)
					}
					return newItem || {}
				})
				const dataList = [// 对象数组便于后续扩展（最近聊天，分组...）
					{
						name: this.$t('common.recentChat'),
						icon: 'iconxiaoxi',
						key: 'recentChat',
						dataKey: { id: 'groupId', name: 'groupLabel|groupName|label|userInfo.nickName', avatar: 'groupAvatar|userInfo.userAvatar' },
						list: recentChatList
					},
					{
						name: this.$t('common.myFriends'),
						icon: 'iconwodehaoyou',
						key: 'friends',
						dataKey: { id: 'groupId', name: 'label|userInfo.nickName', avatar: 'userInfo.userAvatar' },
						// 选中项随数据变化 --- 参照checkSelectList
						// list: this.friendsDetail.filter(item => item.isOnBlacklist != 1 || this.selectList.find(selectedItem => item.groupId == selectedItem.groupId)),
						list: this.friendsDetail.filter(item => item.isOnBlacklist != 1),
						searchFilter: this.$store.getters.friendsDetailFilter,
						child: null
					},
					{
						name: this.$t('common.AAgroups'),
						icon: 'iconwodequnzu',
						key: 'groups',
						dataKey: { id: 'groupId', name: 'groupLabel|groupName', avatar: 'groupAvatar' },
						list: this.groupsDetail.filter(item => item.state != 0),
						searchFilter: this.$store.getters.groupsDetailFilter
					}
				]

				if (/groupMembers/.test(this.dataType)) {
					dataList.push({
						name: this.groupName,
						icon: 'iconwodequnzu',
						key: 'groupMembers',
						dataKey: { id: 'userId', name: 'label|userLabel|nickName', avatar: 'userAvatar' },
						list: this.groupMembers,
						searchFilter: this.$utils.fuzzySearch.searchfilter,
						child: null
					})
				}

				let data
				if (this.dataType) {
					data = dataList.filter(item => {
						return this.dataType.split('|').includes(item.key)
					})
				} else {
					data = dataList
				}
				console.log(data)
				return data
			}
		},
		watch: {
			'visible': {
				handler(nVal, oVal) {
					this.$store.dispatch('Setting/set_onlineStatePollForModel', nVal)
					if (!nVal && this.clear) {
						this.selectList = []
						this.loading = false
					}
				},
				immediate: true
			},
			selectedIds: {
				handler(nVal, oVal) {
					if (nVal) {
						const ids = nVal.split('|')
						const selectList = []
						this.dataSource.forEach(data => {
							data.list.forEach(item => { // 由于数据类型是自定义的，加入dataKey数据用于左侧展示选中结果的名称过滤
								if (ids.includes(item[data.dataKey.id])) {
									selectList.push(Object.assign({}, item, { dataKey: data.dataKey, dataSourceKey: data.key }))
								}
							})
						})
						this.selectList	= selectList
					}
				},
				immediate: true
			},
			selectList(nVal, oVal) {
				if (nVal.length > this.limit) {
					if (this.modeltitle == this.$t('chat.addGroupAdmin')) {
						this.$message.warning(this.$t('common.selectionLimit[0]'))
					} else {
						this.$message.warning(`最多添加${this.limit}个`)
					}

					this.selectList = oVal
				}

				if (this.selectedIds) {
					this.selectingCount = this.selectList.length - this.selectedIds.split('|').length
				} else {
					this.selectingCount = this.selectList.length
				}
			},
			dataSource(nVal, oVal) {
				this.checkSelectList(nVal)
			}
		},
		mounted() {
		},
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
		methods: {
			checkSelectList(dataSource) { // 测试要求(随数据变化),过滤掉已经不存在的选中对象
				const newList = []
				this.selectList.forEach(select => {
					const source = dataSource.find(data => data.key == select.dataSourceKey)
					if (source && source.list && source.list.some(data => {
						return data[source.dataKey.id] == select[source.dataKey.id]
					})) {
						newList.push(select)
					}
				})
				this.selectList = newList
			},
			doCancel() {
				this.cancel()
			},
			doDelete(index, item) {
				let isDisabled = false
				if (this.disabledIds.length > 0) {
					const keys = this.dataSource.map(source => {
						return source.dataKey.id
					})
					let val
					for (let i = 0; i < keys.length; i++) {
						val = item[keys[i]]
						if (val && this.disabledIds.includes(val)) {
							isDisabled = true
							break
						}
					}
				}
				if (!isDisabled) {
					this.selectList.splice(index, 1)
				}
			},
			async doConfirm(data) {
				this.loading = true
				await this.confirm(data)
				this.loading = false
			}
		},
		beforeDestroy()	{
			this.$store.dispatch('Setting/set_onlineStatePollForModel', false)
		}
	}
</script>
<style lang="scss">
  #multiple-panel {
		-webkit-app-region: no-drag;
    .ant-modal-body {
      padding: 0 !important;
    }
    .panel-body {
			position: relative;
      height: 495px;
      overflow-y: auto;
      display: flex;
      flex-flow: row nowrap;
      .left {
        flex: 1 1 auto;
        border-right: $border;
        display: flex;
        flex-flow: column nowrap;
        & > .item {
          padding: 0px 30px
        }
        .left-top {
          flex: 0 0 auto;
        }
        .left-center {
          flex: 1 1 auto;
          overflow-y: auto;
          padding-top: 5px;
          .tip {
            color: $black;
            font-size: 14px;
            background-color: #F1F2F5;
            display: inline-block;
            padding: 5px 10px;
            margin: 10px 10px 0px 0px;
            border-radius: 4px;
            cursor: pointer;
            .iconfont {
              color: $gray;
              font-size: 11px;
              margin-left: 8px;
              &:hover {
                color: $black
              }
            }
          }
        }
        .left-bottom {
          flex: 0 0 auto;
          padding: 30px;
          .operation {
            text-align: right;
            .ant-btn:first-child {
              margin-right: 13px
            }
          }
        }
      }
      .right {
        width: 246px;
        flex: 0 0 auto;
        overflow-y: auto;
      }
    }
  }
</style>
