<template>
	<div id="addressBook">
		<div class="left-list-content">
			<global-search />
			<div class="layout-menu">
				<router-link :class="{'layout-menu-item':true}" to="/addressBook/myFriends">
					<div class="iconfont iconicon_wodehaoyou"></div>
					<div class="name">
						{{$t('common.myFriends')}}
					</div>
				</router-link>
				<router-link :class="{'layout-menu-item':true}" to="/addressBook/newFriends">
					<div class="iconfont iconicon_xindehaoyou"></div>
					<div class="name">
						{{$t('common.newFriends')}}
					</div>
					<span v-if="statistics.todoNum" class="count">{{statistics.todoNum > 99 ? '99+' : statistics.todoNum}}</span>
				</router-link>
				<router-link :class="{'layout-menu-item':true}" to="/addressBook/myGrounps">
					<div class="iconfont iconicon_qunzu"></div>
					<div class="name">
						{{$t('common.AAgroups')}}
					</div>
				</router-link>
				<!--1.3版本去除分组-->
				<!--<div class="menu-drop">-->
				<!--<div class="menu-item" @click="showList()">-->
				<!--<AAlist-item :data="{title: $t('common.allFriends')}">-->
				<!--<template v-slot:left><i class="iconfont iconwodehaoyou"></i></template>-->
				<!--<template v-slot:right><div class="iconBody"><i class="iconfont iconxiangxia" :class="{up: key == 'friends'}"></i></div></template>-->
				<!--</AAlist-item>-->
				<!--</div>-->
				<!--<div ref="menuchilds" v-if="key == 'friends'">-->
				<!--<a-dropdown-->
				<!--overlayClassName="right-menu"-->
				<!--:getPopupContainer="() => $refs.menuchilds"-->
				<!--@visibleChange="(visible) => contextMenuClick(visible, item)"-->
				<!--:trigger="['contextmenu']"-->
				<!--v-for="(item, index) in friendGroups"-->
				<!--:key="key + index">-->
				<!--<div class="menuItem-list">-->
				<!--<router-link tag="div" class="menu-item" :to="`/addressBook/${item.friendGroupId}?friendGroupName=${item.friendGroupName}`">-->
				<!--<AAlist-item :data="{title: item.friendGroupName}">-->
				<!--<template v-slot:left><span class="horn"></span></template>-->
				<!--</AAlist-item>-->
				<!--</router-link>-->
				<!--</div>-->
				<!--<a-menu slot="overlay">-->
				<!--<a-menu-item @click="showDialog('addGroup')">{{$t('common.addGroup')}}</a-menu-item>-->
				<!--<a-menu-item @click="showDialog('renameGroup')">{{$t('common.rename')}}</a-menu-item>-->
				<!--<a-menu-item @click="showDialog('delGroup')" :disabled="item.friendGroupId == 0">{{$t('common.delgroup')}}</a-menu-item>-->
				<!--</a-menu>-->
				<!--</a-dropdown>-->
				<!--</div>-->
				<!--</div>-->
			</div>
		</div>
		<div class="message">
			<!--子视图-->
			<router-view v-if="$route.params.id"></router-view>
			<div class="default" v-else>
				<div class="main">
					<img src="~@/assets/img/nothing.png" width="240" height="200" :alt="$t('common.noData')">
					<p></p>
				</div>
			</div>
		</div>

		<!--添加分组/分组重命名-->
		<!--<a-modal :title="visible === 'addGroup' ? $t('common.addGroup') : $t('common.rename')" class="notification-aachat" centered :width="420" :closable="false" @cancel="showDialog" :visible="visible === 'addGroup'|| visible === 'renameGroup'">-->
		<!--<a-input :placeholder="$t('common.editGroupTips')" v-model.trim="groupParams.friendGroupName" maxlength="10"/>-->
		<!--<template #footer>-->
		<!--<a-button type="primary" :disabled="!(groupParams.friendGroupName.length > 0)" :loading="dialogLoading" @click="_save">{{$t('common.confirmBtn')}}</a-button>-->
		<!--<a-button  :disabled="dialogLoading" @click="showDialog">{{$t('common.exitBtn')}}</a-button>-->
		<!--</template>-->
		<!--</a-modal>-->

		<!--删除分组-->
		<!--<a-modal :title="$t('common.tips')" centered class="notification-aachat" :visible="visible == 'delGroup'" @cancel="showDialog" :width="470" :closable="false">-->
		<!--&lt;!&ndash;<a-spin :spinning="spinning" :wrapperClassName="'spinning'">&ndash;&gt;-->
		<!--<p>{{$t('common.delgroupTips')+ '“' + friendGroups[0].friendGroupName + '”，' + $t('common.delgroupComfirmTips')}}</p>-->
		<!--&lt;!&ndash;</a-spin>&ndash;&gt;-->
		<!--<template #footer>-->
		<!--<a-button type="primary" :loading="dialogLoading" @click="delGroup">{{$t('common.confirmBtn')}}</a-button>-->
		<!--<a-button :disabled="dialogLoading" @click="showDialog">{{$t('common.exitBtn')}}</a-button>-->
		<!--</template>-->
		<!--</a-modal>-->
	</div>
</template>

<script>
	import GlobalSearch from '@/components/GlobalSearch'
	import { isNickNameAllow } from '@/utils/web'

	export default {
		name: 'AddressBook',
		components: { GlobalSearch },
		data() {
			return {
				key: 'friends',
				visible: '',
				dialogLoading: false,
				currentGroup: {},
				groupParams: {
					friendGroupId: '',
					friendGroupName: ''
				}
			}
		},
		computed: {
			statistics() {
				return this.$store.state.NewFriend.statistics
			},
			friendGroups() {
				return this.$store.state.MyFriend.friendGroups
			}
		},
		mounted() {
		},
		methods: {
			showList(key = 'friends') {
				this.key = this.key == key ? '' : key
			},
			contextMenuClick(visible, item) {
				this.currentGroup = visible ? item : {}
			},
			showDialog(val = '') {
				this.groupParams = {
					friendGroupId: (val && val != 'addGroup') ? this.currentGroup.friendGroupId : '',
					friendGroupName: (val == 'renameGroup') ? this.currentGroup.friendGroupName : ''
				}
				this.dialogLoading = false
				this.visible = val
			},
			_save() {
				if (!this.groupParams.friendGroupName) {
					return this.$message.warning(this.$t('common.editGroupTips'))
				} else if (!isNickNameAllow(this.groupParams.friendGroupName)) {
					return this.$message.warning(this.$t('common.editGroupCheckTips'))
				}
				this.dialogLoading = true
				this.$utils.api.user.save(this.groupParams).get().then(res => {
					this.dialogLoading = false
					this.$store.dispatch('MyFriend/update_friendGroupInfo', res.data)
					this.showDialog()
				}).catch(e => {
					this.dialogLoading = false
				})
			},
			delGroup() {
				this.dialogLoading = true
				this.$utils.api.user.deleteFriendGroup({ friendGroupId: this.groupParams.friendGroupId }).get().then(res => {
					this.dialogLoading = false
					this.$store.dispatch('MyFriend/delete_friendGroupInfo', { friendGroupId: this.groupParams.friendGroupId })
					// 更新所有关系用户列表：接口未提供根据friendGroupId获取分组下的所有人信息接口；前端更新friendGroupId=0为我的好友不保险；获取所有好友列表接口附带了群组列表查询较慢
					const firstGroupFriend = this.$store.state.MyFriend.list.find(item => {
						return this.groupParams.friendGroupId == item.friendGroupId
					})
					if (firstGroupFriend) this.$store.dispatch('MyFriend/update_info')
					this.showDialog()
				}).catch(e => {
					this.dialogLoading = false
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
  #addressBook {
    width: 100%;
    height: 100%;
    display: flex;
    .layout-menu-item {
		.iconicon_wodehaoyou {
		color:  #fc9211;
		}
		.iconicon_xindehaoyou {
		color: #05c55f;
		}
		.iconicon_qunzu {
		color: #1e8eff;
		}
		.iconxiangxia {
		font-size: 16px;
		font-weight: bold;
		color: $gray;
		display: inline-block;
		transform: rotate(0deg);
		transition: transform 0.3s;
		&.up {
			transform: rotate(180deg);
		}
		}
        .iconBody {
          padding-right: 15px;
        }
        .count {
          color: #FFF;
          font-size: 8px;
          padding: 0 4px;
          background-color: #FF3B30;
          display: inline-block;
          height: 15px;
          line-height: 14px;
          min-width: 15px;
          text-align: center;
		  border-radius: 10px;
		  margin-right:15px;
		}
		 .menu-drop {
			.menuItem-list {
			.horn {
				display: inline-block;
				width: 12px;
				height: 12px;
				border-left: 2px solid #E9E9E9;
				border-bottom: 2px solid #E9E9E9;
			}
		}
	  }
	}

    .message {
      flex: 1 1 auto;
      .default {
        width: 100%;
        height: 100%;
        position: relative;
	      -webkit-app-region: drag;
        .main {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          transform: translate(-50%, -50%);
          text-align: center;
          p {
            margin: 0;
            color: $lightBlack;
            font-size: 20px;
            font-weight: 400;
            min-height: 30px;
          }
        }
      }
    }
  }
</style>
