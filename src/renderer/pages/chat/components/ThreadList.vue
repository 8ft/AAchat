<template>
	<div class="left-list-content">
		<global-search />
		<div class="left-list">
			<vue-scroll id="threadList" ref="threadList" :ops="scrollOptions">
				<div class="thread-banner" v-show="$store.state.User.userConfig.showThreadCreateOrganBanner" @click="$store.commit('setOrganizationPage','index')">
					<h1>{{$t('organization.threadBannerText[0]')}}</h1>
					<p>{{$t('organization.threadBannerText[1]')}}</p>
					<img src="@/assets/img/thread-banner-1.png">
					<a-button size="small" type="primary" class="join-btn">
						{{$t('organization.threadBannerText[2]')}}
					</a-button>
					<i class="iconfont iconguanbi" @click.stop="closeThreadBanner"></i>
				</div>
				<template v-if="threads&&threads.length>0">
					<thread v-for="thread in threads"
						v-show="thread.hidden==0"
						:key="`threadLi_${thread.id}`"
						:thread="thread"
						:active="thread.id === $store.state.Chat.currentThreadID"
						:id="'thread_inList_' + thread.id"
						@last-message-changed="scrollIntoThread(thread.id)"
						@delThread="preDelThread"
						@notExist="notExist"
					></thread>
				</template>
			</vue-scroll>
		</div>
		<!--删除会话弹窗-->
		<a-modal
			:visible="confirmDelThread"
			class="notification-IM"
			:title="$t('chat.deleteChat[0]')"
			centered
			:width="436"
			:maskClosable="false"
			@cancel="confirmDelThread=false"
		>
			<p>{{$t('chat.deleteChat[1]')}}</p>
			<template #footer>
				<a-button
					type="primary"
					:loading="deleteingThread"
					@click="delThread"
				>
					{{$t('common.yesBtn')}}
				</a-button>
				<a-button @click="cancelDelThread">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
		<!--被移出群聊弹窗-->
		<a-modal
			:visible="notExistThreadID!==''"
			class="notification-IM"
			:title="$t('common.prompt')"
			centered
			:width="436"
			:maskClosable="false"
			:closable="false"
		>
			<p>{{notExistThreadTip}}</p>
			<template #footer>
				<a-button
					type="primary"
					:loading="killingThread"
					@click="killThread"
				>
					{{$t('common.gotIt')}}
				</a-button>
			</template>
		</a-modal>
	</div>
</template>

<script>
	import Thread from './Thread.vue'
	import GlobalSearch from '@/components/GlobalSearch'
	import { mapGetters } from 'vuex'
	import vueScroll from 'vuescroll/dist/vuescroll-native'
	export default {
		name: 'ThreadList',
		components: {
			Thread,
			GlobalSearch,
			vueScroll
		},
		computed: mapGetters({
			threads: 'sortedThreads'
		}),
		watch: {
			'$store.state.Chat.currentThreadID'(val) {
				if (val) {
					this.scrollIntoThread(val)
				}
			}
		},
		data() {
			return {
				notExistThreadID: '',
				notExistThreadStatus: '',
				notExistThreadTip: '',
				killingThread: false,

				deleteingThreadID: '',
				confirmDelThread: false,
				deleteingThread: false,
				scrollOptions: {
					vuescroll: {
						wheelScrollDuration: 300
					},
					scrollPanel: {
						scrollingX: false
					},
					rail: {
						gutterOfSide: '1px',
						specifyBorderRadius: '4px'
					},
					bar: {
						background: 'lightGray',
						onlyShowBarOnScroll: false,
						minSize: 0.15,
						size: '6px'
					}
				}
			}
		},
		methods: {
			closeThreadBanner() {
				this.$store.dispatch('User/set_userConfig', {
					showThreadCreateOrganBanner: 0
				})
			},
			scrollIntoThread(threadID) {
				const threadInview = this.$refs.threadList.getCurrentviewDom()
				const threadIDInview = threadInview.map(thread => {
					return thread.id
				})
				if (!threadIDInview.includes(`thread_inList_${threadID}`)) {
					this.$refs.threadList.scrollIntoView(`#thread_inList_${threadID}`)
				}
			},
			notExist({ threadID, status }) {
				// 状态类型 “1”—-好友销号，
				// “2”—好友被移除当前企业，
				// “3”—不是好友，
				// “4”—好友关系正常
				// “5”—当前用户单向解除好友 ,
				// ”6”—群组解散，
				// “7”—群组被锁定，
				// “8”—群组正常
				// “9”-被移出群聊
				let tip = ''
				switch (status) {
				case '1':// 好友销号
					tip = this.$t('userCard.accountCancel')
					break
				// case '2':// 好友被移除当前企业
				// 	tip = this.$t('organization.quit')
				// 	break
				case '6':// 群组解散
					tip = this.$t('chat.removeGroupChatTip1[0]')
					break
				case '9':// 被移出群聊
					tip = this.$t('chat.removeGroupChatTip1[1]', [this.$t('chat.removeGroupChat[0]')])
					break
				}

				this.notExistThreadID = threadID
				this.notExistThreadTip = tip
				this.notExistThreadStatus = status
			},
			async killThread() {
				this.killingThread = true
				await this.$store.dispatch('Chat/killThread', {
					groupId: this.notExistThreadID,
					killLocalOnly: true
				})

				this.notExistThreadID = ''
				this.notExistThreadStatus = ''
				this.notExistThreadTip = ''
				this.killingThread = false
			},
			preDelThread(threadID) {
				this.deleteingThreadID = threadID
				this.confirmDelThread = true
			},
			async delThread() {
				this.deleteingThread = true

				if (this.deleteingThreadID == 'notify') {
					this.$utils.api.message.clearNotify().get().then(async res => {
						if (res.code != 0) {
							console.log('删除系统会话接口异常', res)
						}
						await this.$store.dispatch('Chat/hideThread', {
							threadID: this.deleteingThreadID,
							timestamp: this.$utils.fun.getServerTime('hideThread1')
						})
						this.$utils.chatSdk.cMsgToSelfAsync('DeleteSystem', '')
						this.cancelDelThread()
					}).catch(e => {
						this.cancelDelThread()
					})
				} else if (this.deleteingThreadID == 'point') {
					this.$utils.api.message.delPointNotify().get().then(async res => {
						if (res.code != 0) {
							console.log('删除积分助手会话接口异常', res)
						}
						await this.$store.dispatch('Chat/hideThread', {
							threadID: this.deleteingThreadID,
							timestamp: this.$utils.fun.getServerTime('hideThread1')
						})
						this.$utils.chatSdk.cMsgToSelfAsync('clearBonusNotice', '')
						this.cancelDelThread()
					}).catch(e => {
						this.cancelDelThread()
					})
				} else {
					this.$utils.chatSdk.cDelSessionAsync(this.deleteingThreadID, JSON.stringify({
						clientType: process.env.webConfig.client_type
					})).then(async res => {
						if (res.code != 0) {
							console.log('删除会话接口异常', res)
						}
						await this.$store.dispatch('Chat/hideThread', {
							threadID: this.deleteingThreadID,
							timestamp: this.$utils.fun.getServerTime('hideThread2')
						})
						this.cancelDelThread()
					}).catch(e => {
						this.cancelDelThread()
					})
				}
			},
			cancelDelThread() {
				this.deleteingThreadID = ''
				this.confirmDelThread = false
				this.deleteingThread = false
			}
		}
	}
</script>
