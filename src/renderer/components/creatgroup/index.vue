<!--<CreatGroup  ref="son"></CreatGroup>-->
<!--父组件中定义打开方法 this.$refs.son.addnewgroup = true;-->
<template>
	<div class="creatgroup" ref="creatgroup">
		<a-modal
			v-model="addnewgroup"
			:title="groupId?$t('chat.addGroupMembers') : $t('common.startNewGroupChat')"
			:footer="null"
			centered
			wrapClassName="add-newbody"
			:destroyOnClose="true"
			width="686px"
			:maskClosable="false"
			:getContainer="()=>$refs.creatgroup"
			:afterClose="closeall"
			@cancel="addnewgroup = false"
		>
			<a-spin :spinning="iscreated">
				<div class="addleft">
					<div class="searcharea" v-clickoutside="_hideDropdown">
						<a-input type="text" :placeholder="$t('common.search')" ref="searchmyfriends" v-model.trim="searchValue"
							@focus="startsearch" id="searchmyfriends"
						/>
						<div class="showsearch" v-if="searchoptons.length>0 && showsearcharea">
							<h2>{{$t('search.wantToFind')}}</h2>
							<div v-for="(item,index) in searchoptons" :key="index" @click.stop="selectsearch(item)">
								<AAlistItem
									:src="item.userAvatar"
									:title="item.title"
									:desc="item.desc"
								>
								</AAlistItem>
							</div>
						</div>
						<div class="nosearch" v-if="searchoptons.length ==0 && showsearcharea && searchValue.length>0">
							{{$t('search.noResultFound')}}
						</div>
					</div>
					<div class="the-addpeople" :class="{'the_addpeoples':friendsInGroup}" ref="scorllbom">
						<li v-for="(item, index) in alladdpeopel" :key="index" v-show="alladdpeopel.length > 0"
							:class="{'cantdelect':item.cantselect}"
						>
							{{item.label||item.nickName}}
							<span class="iconfont" :class="{'icontongyongguanbi':!item.cantselect}"
								@click.stop="deleteone(item)"
							></span>
						</li>
					</div>
					<div class="inputname" v-if="!friendsInGroup">
						<h2>{{$t('chat.groupName')}}</h2>
						<input type="text" :placeholder="$t('chat.tipEnterGroupName')" v-model.trim="creatparams.groupName"
							maxlength="16" @blur.prevent="_validatepwass2"
						>
					</div>
					<div class="anonymouschat" v-if="!friendsInGroup">
						{{$t('chat.anonymousChat')}}
						<a-switch :defaultChecked="false" @change="addgroup"></a-switch>
					</div>
					<p style="font-size: 14px;color: #999999;margin: 16px 30px 10px 30px;" v-if="!friendsInGroup">
						{{$t('chat.anonymousChatTip')}}
					</p>
					<div class="group_btn" :class="{'addgroup_btn':friendsInGroup}">
						<!--老板要求没选择联系人确定按钮也能点，wuxl-->
						<a-button type="primary" @click="surecreat" v-if="!friendsInGroup">
							{{$t('common.okBtn')}}（{{addpeoplenum}}/199）
						</a-button>
						<a-button type="primary" @click="sureaddgroup" v-else>
							{{$t('common.okBtn')}}（{{alreadyjoinnum > 0?addpeoplenum - alreadyjoinnum + 1 : 0}}/{{200 -
								friendsInGroup.length}}）
						</a-button>
						<a-button style="color: #999999" @click="addnewgroup = false">
							{{$t('common.exitBtn')}}
						</a-button>
					</div>
				</div>
				<div class="addright">
					<div @click.stop="showmyfriend" v-if="!myfriends">
						<AAlistItem :data="{title: $t('common.myFriends')}" style="padding-left: 15px; border-bottom: none">
							<template v-slot:left>
								<i class="iconfont iconfanhui" style="borderRadius:50%;"></i>
							</template>
						</AAlistItem>
					</div>
					<div class="group_item" v-if="myfriends">
						<div class="menuItem-list">
							<div @click.stop="showmyfriend()">
								<AAlist-item :data="{title: $t('common.myFriends')}">
									<template v-slot:left>
										<!--                    <span class="horn"></span>-->
										<i class="iconfont iconwodehaoyou" style="borderRadius:50%;"></i>
									</template>
								</AAlist-item>
							</div>
						</div>
					</div>
					<div class="menuItem-list" v-if="!myfriends">
						<div class="seloptions" v-for="(item,index) in myfriendlist" :key="index" @click="selectaddbody(item)"
							:class="{'notselect':item.cantselect || alladdpeopel.length > 199 && !item.isselect }"
							v-show="item.userId != accountInfo.userId"
						>
							<div class="criles" :class="{'isselect':item.isselect == true}">
								<span class="iconfont" :class="{'icongou':item.isselect == true}"></span>
							</div>
							<a-avatar :class="{'iconfont iconwodehaoyou': !item.userAvatar}" :src="item.userAvatar ? item.userAvatar : '@/assets/img/geren_default@2x.png'" :size="32" style="margin-right: 10px;" />
							<div class="name_linetime">
								<p>{{item.label||item.nickName}}</p>
								<p v-if="serverTime">
									{{getOnlineStatus(item.onlineState,item.onlineTime)}}
								</p>
							</div>
						</div>
						<div v-if="!nofriends" class="nodata">
							<img src="~@/assets/img/nothing.png" width="132" height="100">
							<p>{{$t('common.nothingTips')}}</p>
						</div>
					</div>
				</div>
			</a-spin>
		</a-modal>
	</div>
</template>
<script>
	import AAlistItem from '@/components/AAlist/item'
	import { debounce, searchfilter } from '@/utils/common/fuzzySearch'
	import getLetter from '@/utils/common/pinyin'
	import utils from '~/utils'

	export default {
		name: 'CreatGroup',
		components: {
			AAlistItem
		},
		props: {
			groupId: String,
			friendsInGroup: Array,
			forbidMemberJoin: Number,
			joinAudit: Number
		},
		data() {
			return {
				serverTime: 0,
				addnewgroup: false, // 显示弹窗框
				myfriends: false, // 打开我的好友列表
				iscancreat: true, // 确认按钮是否可按
				searchValue: '', // 搜索
				searchoptons: [], // 搜索下拉内容
				showsearcharea: false, // 是否显示搜索下拉框
				iscreated: false,
				alreadyjoinnum: 0, // 已经在群内的好友人数
				alladdpeopel: [], // 添加群成员列表
				addpeoplenum: 0, // 添加的人数
				creatparams: {
					isAnoymous: '0',
					groupName: '',
					userIds: '',
					uniqueTag: ''
				},
				// 添加群成员参数
				addGroupparams: {
					groupId: '',
					userIds: ''
				},
				myfriendlist: [], // 我的好友列表
				shoumygruop: '',
				nofriends: false
			}
		},
		computed: {
			accountInfo() {
				return this.$store.state.User.accountInfo
			},
			friendList() {
				//        return this.$store.state.MyFriend.list
				const result = []
				this.$store.state.MyFriend.list.forEach(friend => {
					if (friend.isOnBlacklist !== '1') { // 黑名单里的好友不显示在创建群聊好友里
						const userInfo = this.$store.state.User.list.filter(userInfo => userInfo.userId == friend.userId)
						//          result.push({...friend, userInfo: userInfo[0] || {}})
						if (userInfo.length > 0) {
							result.push({
								...friend,
								userAvatar: userInfo[0] && userInfo[0].userAvatar,
								nickName: userInfo[0] && userInfo[0].nickName,
								userMobile: userInfo[0] && userInfo[0].userMobile,
								accountCode: userInfo[0] && userInfo[0].accountCode,
								onlineState: userInfo[0] && userInfo[0].onlineState,
								onlineTime: userInfo[0] && userInfo[0].onlineTime
							})
						}
					}
				})
				return result
			},
			users() { // 平台所有用户原始数据
				return this.$store.state.User.list
			},
			friendGroups() {
				const result = []
				this.$store.state.MyFriend.friendGroups.forEach(item => {
					item.isopen = false
					result.push({ ...item })
				})
				return result
				//        return this.$store.state.MyFriend.friendGroups
			}
			//      myNewFriends() { // 搜索  联系人使用的数据
			//        return this._initMyFriends()
			//      },
		},
		watch: {
			'alladdpeopel'(nval, oval) {
				let alladdidstr = ''
				this.creatparams.userIds = ''
				if (!this.friendsInGroup) {
					this.alladdpeopel.length < 1 ? this.iscancreat = true : this.iscancreat = false
				} else {
					this.alladdpeopel.length - this.alreadyjoinnum + 1 > 0 ? this.iscancreat = false : this.iscancreat = true
				}
				this.addpeoplenum = this.alladdpeopel.length
				if (this.alladdpeopel.length > 0) {
					//          this.iscancreat = false
					if (this.alladdpeopel.length >= 2) {
						this.alladdpeopel.forEach(item => {
							alladdidstr += item.userId + '|'
						})
						alladdidstr.slice(0, alladdidstr.length - 1)
					} else {
						alladdidstr = this.alladdpeopel[0].userId
					}
				}
				if (this.alladdpeopel.length > 199) {
					this.iscancreat = true
				}
				this.creatparams.userIds = this.accountInfo.userId + '|' + alladdidstr
				//        if (this.alladdpeopel.length > 2) {
				//          this.alladdpeopel = oval
				//        }
				//        this.timer = setInterval(() => {
				//          let speed = 80
				//          this.$refs.scorllbom.scrollTop += speed
				//          if (this.$refs.scorllbom.scrollTop >= this.$refs.scorllbom.scrollHeight - this.$refs.scorllbom.clientHeight - 5) {
				//            clearInterval(this.timer)
				//            speed = 0
				//          }
				//        }, 10)
			},
			'addnewgroup'(nVal, oVal) {
				if (this.addnewgroup) {
					setTimeout(() => {
						this.serverTime = this.$utils.fun.getServerTime('formatOnlineTime')
					}, 500)
					// this.$nextTick(() => {
					// 	this.$refs.searchmyfriends.focus()
					// })
					this.showmyfriends()
					// 避免重复创建key
					this.creatparams.uniqueTag = utils.randomId()
				}
				this.$store.dispatch('Setting/set_onlineStatePollForModel', nVal)
			}
			//      'creatparams.groupName' () {
			//        this.alladdpeopel.length<1 || !this.creatparams.groupName ? this.iscancreat = true : this.iscancreat = false
			//      }
		},
		mounted() {
		},
		methods: {
			getOnlineStatus(state, timestamp) {
				if (state == 1) {
					return this.$t('common.online')
				} else {
					// return this.$t('common.offline')
					return this.$utils.time.formatOnlineTime(timestamp, this.serverTime)
				}
			},
			doSort(list = []) {
				let onlineList = []
				let offlineList = []
				list.forEach(item => {
					item.onlineState == 1 ? onlineList.push(item) : offlineList.push(item)
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
					const value = item.label || item.nickName
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
			showfriend(value) {
				//        this.shoumygruop = value.friendGroupId
				this.myfriendlist.forEach((item, index) => {
					if (item.friendGroupId === value.friendGroupId) {
						//            item.isopen = true
						this.$set(this.myfriendlist[index], 'isopen', !item.isopen)
					}
				})
			},
			closeall() {
				this.serverTime = 0
				this.alladdpeopel = []
				this.myfriends = false
				this.searchValue = ''
				this.creatparams.groupName = ''
				this.iscreated = false
				this.myfriendlist = []
				this.alreadyjoinnum = 0
				this.creatparams.isAnoymous = '0'
			},
			deleteone(value) {
				if (this.alladdpeopel.length > 0) {
					this.alladdpeopel.forEach((item, index) => {
						if (value.userId == item.userId) {
							this.alladdpeopel.splice(index, 1)
						}
					})
					this.myfriendlist.forEach(item => {
						if (item.userId == value.userId) {
							item.isselect = false
						}
					})
				}
			},
			// 选中搜索出的好友
			selectsearch(selectvalue) {
				if (selectvalue.userId == this.accountInfo.userId) {
					this.$message.warning(this.$t('common.alreadyExists', { name: this.$t('common.you') }))
				} else {
					let ishave = false
					//          this.myfriends = false
					if (this.alladdpeopel.length < 200 > 0) {
						this.alladdpeopel.forEach((item, index) => {
							if (selectvalue.userId == item.userId) {
								this.friendList.forEach(f => {
									if (f.userId == item.userId) {
										if (f.label) {
											this.$message.warning(this.$t('common.alreadyExists', { name: f.label }))
										} else {
											this.$message.warning(this.$t('common.alreadyExists', { name: f.nickName }))
										}
									}
								})
								ishave = true
								return
							}
						})
						if (!ishave) {
							this.showsearcharea = false
							this.searchValue = ''
							this.myfriendlist.forEach(item => {
								if (item.userId == selectvalue.userId) {
									item.isselect = true
								}
							})
							this.alladdpeopel.push(selectvalue)
						}
					} else if (this.alladdpeopel.length == 0) {
						this.showsearcharea = false
						this.searchValue = ''
						this.alladdpeopel.push(selectvalue)
						this.myfriendlist.forEach(item => {
							if (item.userId == selectvalue.userId) {
								item.isselect = true
							}
						})
					} else {
						this.$message.warning(this.$t('common.selectionLimit[1]', { number: 200 }))
					}
				}
			},
			_hideDropdown() {
				this.showsearcharea = false
			},
			// 选择好友
			selectaddbody(selec) {
				if (!selec.cantselect) {
					let isallhave = false
					if (this.alladdpeopel.length > 0) {
						this.alladdpeopel.forEach((item, index) => {
							if (selec.userId == item.userId) {
								this.alladdpeopel.splice(index, 1)
								isallhave = true
							}
						})
					}
					if (!isallhave) {
						if (this.alladdpeopel.length > 199) {
							this.$message.warning(this.$t('common.selectionLimit[1]', { number: 200 }))
						} else {
							this.alladdpeopel.push(selec)
						}
					}

					this.myfriendlist.forEach(item => {
						if (item.userId == selec.userId) {
							item.isselect = !item.isselect
						}
					})
				}
			},
			showmyfriend() {
				this.myfriends = !this.myfriends
				const allfriendarr = []
				this.myfriendlist = this.doSort(this.myfriendlist)
				this.myfriendlist.forEach(item => {
					if (item.userId !== this.accountInfo.userId) {
						allfriendarr.push(item)
					}
				})
				if (allfriendarr.length > 0) this.nofriends = true
			},
			// 显示我的好友列表
			showmyfriends() {
				this.myfriendlist = this.friendList
				this.myfriendlist = this.doSort(this.myfriendlist)
				if (this.myfriendlist.length > 0) this.nofriends = true
				this.alreadyjoinnum = 0
				this.myfriendlist.forEach(item => {
					if (this.friendsInGroup) {
						item.cantselect = false
						this.friendsInGroup.forEach(selected => {
							if (selected.userId == item.userId) {
								item.isselect = false
								item.cantselect = true
								let allishave = false
								this.alreadyjoinnum += 1
								this.alladdpeopel.forEach(allready => {
									if (allready.userId == selected.userId) {
										allishave = true
									}
								})
								if (!allishave) {
									this.alladdpeopel.push(item)
								}
							} else {
								item.isselect = false
							}
						})
					} else {
						item.isselect = false
					}
					if (this.alladdpeopel.length > 0) {
						this.alladdpeopel.forEach((iselect, index) => {
							if (iselect.userId == item.userId) {
								item.isselect = true
							}
							if (iselect.userId == this.accountInfo.userId) {
								this.alladdpeopel.splice(index, 1)
							}
						})
					}
				})
			},

			// 是否开启匿名聊天
			addgroup(checked) {
				this.creatparams.isAnoymous = checked ? '1' : '0'
			},

			// 创建群聊
			surecreat() {
				if (this.iscancreat) {
					this.addnewgroup = false
					return
				}
				if (this.alladdpeopel.length === 1) {
					const id = this.alladdpeopel[0].groupId
					const type = 0 // 0:单聊  1：群聊  2：临时聊天
					this.$store.dispatch('Chat/openThread', { id, type })
					this.alladdpeopel = []
					this.addnewgroup = false
					this.creatparams.isAnoymous = '0'
					return
				}
				this.iscancreat = true
				this.iscreated = true
				this.$utils.api.user.createGroup(this.creatparams).get().then(async res => {
					const groupId = res.data.groupId
					await this.$store.dispatch('MyGrounp/refreshSettings', groupId)
					await this.$store.dispatch('Chat/createThread', { threadID: groupId, threadType: 1 })
					await this.$store.dispatch('Chat/switchThread', { threadID: groupId })

					this.alladdpeopel = []
					this.addnewgroup = false
					this.creatparams.isAnoymous = '0'
					this.iscreated = false
				}).catch((e) => {
					this.iscancreat = false
					if (e.code === 605001) {
						this.iscreated = false
						return
					}
					this.iscreated = false
					this.$message.error(e.message)
				})
			},

			// 添加成员
			sureaddgroup() {
				if (this.iscancreat) {
					this.addnewgroup = false
					return
				}
				this.iscreated = true
				const addingMembers = []
				const ids = []
				this.alladdpeopel.forEach(user => {
					if (!user.cantselect && !this.friendsInGroup.find(member => {
						return member.userId == user.userId
					})) {
						addingMembers.push(user.label || user.nickName)
						ids.push(user.userId)
					}
				})

				this.addGroupparams.userIds = ids.join('|')
				this.addGroupparams.groupId = this.groupId

				this.$utils.api.user.addGroupUsers(this.addGroupparams).get().then(async res => {
					if (res.code == 0) {
						if (res.data.joinState == '2') {
							this.$message.error(this.$t('chat.inviteFailed'))
							this.iscreated = false
						} else if (res.data.joinState == '0') {
							if (!res.data.blackIdByOthers) {
								this.$message.success(this.$t('chat.waitOwnerPass'))
							}
						} else if (res.data.joinState == '3') {
							this.$message.error(this.$t('common.selectionLimit[1]', { number: 200 }))
							this.iscreated = false
						}
						this.alladdpeopel = []
						this.addnewgroup = false
					}
				}).catch((e) => {
					this.alladdpeopel = []
					this.addnewgroup = false
					this.$message.error(e.message)
				})
			},

			_validatepwass2() {
				this.creatparams.groupName = this.creatparams.groupName.replace(/(^\s*)|(\s*$)/g, '')
			},
			startsearch() {
				document.querySelector('#searchmyfriends').addEventListener('input', debounce(e => {
					this.searchoptons = searchfilter(this.searchValue, this.friendList)
					this.searchoptons = this.searchoptons.filter(userInfo => userInfo.userId !== this.accountInfo.userId)
					this.showsearcharea = true
				}))
				document.querySelector('#searchmyfriends').addEventListener('focus', debounce(e => {
					this.searchoptons = searchfilter(this.searchValue, this.friendList)
					this.searchoptons = this.searchoptons.filter(userInfo => userInfo.userId !== this.accountInfo.userId)
					this.showsearcharea = true
				}))
			}
		}
	}
</script>
<style lang="scss">
  .creatgroup {
    .add-newbody {
      /deep/ .ant-modal-content {
        height: 544px;
        .ant-modal-header {
          background: #F1F2F5;
          padding: 13px 24px;
          border-bottom: none;
        }
        .ant-modal-close-x {
          line-height: 48px;
          height: 48px;
        }
        .ant-modal-body {
          padding: 0px !important;
        }
      }
      /deep/ .ant-checkbox-group {
        overflow-y: scroll;
        width: 100%;
        height: 416px;
      }
      .addleft, .addright {
        display: inline-block;
        vertical-align: top;
        margin-top: 0px;
        height: 496px;
        margin-bottom: -24px;
      }
      .addleft {
        width: 65%;
        border-right: 1px solid #E6E6E6;
        input {
          margin-top: 15px;
          padding: 10px 15px;
          width: 382px;
          height: 40px;
          border: 1px solid #E5E5E5;
          border-radius: 2px;
          margin-left: 30px;
          text-indent: 2px;
          &:focus {
            border: 1px solid #2E87FF;
            outline: none;
          }
        }
        .searcharea {
          position: relative;
          .showsearch {
            position: absolute;
            left: 30px;
            top: 65px;
            border: 1px solid #E5E5E5;
            width: 382px;
            max-height: 294px;
            overflow-y: auto;
            background: #FFFFFF;
            z-index: 100;
            h2 {
              color: #999999;
              font-size: 14px;
              padding: 12px;
              border-bottom: 1px solid #E6E6E6;
              margin-bottom: 0px;
            }
            .AAlist-item {
              padding: 10px;
              &:hover {
                background: #F8F8F8;
              }
            }
          }
          .nosearch {
            position: absolute;
            background: #ffffff;
            border: 1px solid #E5E5E5;
            text-align: center;
            font-size: 12px;
            color: #999999;
            left: 30px;
            padding: 20px;
            width: 382px;
            border-top: none;
          }
        }
        .the-addpeople {
          height: 190px;
          overflow-y: auto;
          padding: 0px 0px 10px 30px;
          border-bottom: 1px solid #E6E6E6;
          margin-top: 10px;
          li {
            display: inline-block;
            font-size: 14px;
            color: #333333;
            padding: 6px 11px;
            background: #F1F2F5;
            border-radius: 4px;
            margin: 8px 10px 0px 0px;
            span {
              font-size: 10px;
              color: #999999;
              cursor: pointer;
            }
          }
          .cantdelect {
            opacity: 0.4;
            display: none;
          }
        }
        .the_addpeoples {
          height: 350px !important;
          border-bottom: none;
        }
        .inputname {
          h2 {
            font-size: 14px;
            margin: 12px 30px;
          }
          input {
            padding: 3px 5px;
            font-size: 14px;
            margin: 0px 0px 0px 30px;
            height: 34px;
            /*&:focus{*/
            /*border: 1px solid #2E87FF;*/
            /*}*/
          }
        }
        .anonymouschat {
          margin: 20px 30px 16px;
          /deep/ .ant-switch {
            float: right;
          }
        }
        .group_btn {
          width: 413px;
          text-align: right;
          button {
            margin-left: 13px;
          }
        }
        .addgroup_btn {
          text-align: left;
          margin-left: 30px;
        }
      }
      .addright {
        width: 35%;
        overflow-x: hidden;
        .AAlist-item {
          padding-left: 10px;
          height: 66px;
        }
        .group_item {
          overflow-y: auto;
          height: 440px;
          padding-bottom: 20px;
        }
        .menuItem-list {
					overflow-y: auto;
					overflow-x: hidden;
					height: 410px;
          .seloptions {
            padding-left: 15px;
          }
          .horn {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-left: 2px solid #E9E9E9;
            border-bottom: 2px solid #E9E9E9;
          }
          .name_linetime {
            display: inline-block;
            height: 32px;
            vertical-align: bottom;
            p {
              margin-top: -5px;
              margin-bottom: 2px;
              width: 130px;
              overflow: hidden;
              text-overflow: ellipsis;
              &:nth-of-type(2) {
                font-size: 10px;
                margin-top: -2px;
              }
            }
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
        i {
          font-size: 14px;
          color: #999999;
          display: inline-block;
          vertical-align: bottom;
          margin-bottom: -1px;
        }
        .iconwodequnzu {
          font-size: 24px;
          background: #FF872F;
          color: #FFFFFF;
          padding: 0px 5px;
          border-radius: 4px;
        }
        .iconwodehaoyou {
          font-size: 25px;
          color: #FFFFFF;
          background: #2E87FF;
          padding: 0px 5px;
					width: 36px;
          /*border-radius: 4px;*/
        }
        .allfriends {
          border-bottom: none;
          .ant-avatar-circle {
            width: 40px;
            height: 40px;
          }
        }
        /*.selectbox{*/
        /*height: 415px;*/
        /*overflow-y: auto;*/
        /*.seloptions{*/
        /*padding: 5px 10px;*/
        /*width: 218px;*/
        /*overflow: hidden;*/
        /*text-overflow: ellipsis;*/
        /*height:41px;*/
        /*white-space: nowrap;*/
        /*margin-top: 10px;*/
        /*cursor: pointer;*/
        /*.isselect{*/
        /*background: #2E87FF;*/
        /*.icongou{*/
        /*color: #FFFFFF;*/
        /*display: inline-block;*/
        /*vertical-align: top;*/
        /*margin-left: 2px;*/
        /*font-size: 12px;*/
        /*}*/
        /*}*/
        /*}*/
        /*.notselect{*/
        /*cursor: not-allowed;*/
        /*opacity: 0.4;*/
        /*}*/
        /*.criles,img{*/
        /*display: inline-block;*/
        /*vertical-align: bottom;*/
        /*}*/
        /*.criles{*/
        /*width: 18px;*/
        /*height: 18px;*/
        /*background: #FBFBFC;*/
        /*border: 1px solid #E6E6E6;*/
        /*border-radius: 50%;*/
        /*margin: 0px 10px 6px 0px;*/
        /*}*/
        /*}*/
        .seloptions {
          padding: 5px 10px;
          width: 218px;
          /*overflow: hidden;*/
          /*text-overflow: ellipsis;*/
          height: 41px;
          white-space: nowrap;
          margin-top: 10px;
          cursor: pointer;
          .isselect {
            background: #2E87FF;
            .icongou {
              color: #FFFFFF;
              display: inline-block;
              vertical-align: top;
              margin-left: 2px;
              font-size: 12px;
            }
          }
					iconwodehaoyou{
						padding: 0px;
						font-size: 26px !important;
						line-height: 38px !important;
						background: #9999;
					}
        }
        .notselect {
          cursor: not-allowed;
          opacity: 0.4;
        }
        .criles, img {
          display: inline-block;
          vertical-align: bottom;
        }
        .criles {
          width: 18px;
          height: 18px;
          background: #FBFBFC;
          border: 1px solid #E6E6E6;
          border-radius: 50%;
          margin: 0px 10px 6px 0px;
        }
      }

    }
  }
</style>
