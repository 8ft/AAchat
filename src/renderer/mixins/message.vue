<script>
	// const { ipcRenderer } = require('electron')
	export default {
		data() {
			return {
				retryTime: 0
			}
		},
		methods: {
			// 初始化历史记录
			syncHistory() {
				if (this.$store.state.organizationPage !== 'preInvite') {
					this.$store.dispatch('Setting/set_pageLoading', { content: this.$t('common.syncing[0]'), translucent: true })
				} else {
					this.$store.dispatch('Setting/set_pageLoading', this.$t('common.syncing[0]'))
				}
				this.getHistory().then(async res => {
					console.log(`历史记录同步完毕`)
					await this.$utils.chatSdk.cGetDoneAsync()
					this.$store.commit('Chat/updateUnSortedMsgs', {
						action: 'init',
						msg: []
					})
					// 关闭事务
					await this.$utils.sqlite.userDbEndTransaction()

					if (!this.$store.state.User.accountInfo.hasInitHistory) {
						await this.$store.dispatch('User/set_accountInfo', { hasInitHistory: 1 })
					}
					// 初始化置顶数据
					this.$store.dispatch('Chat/setTopInit')

					// 下载未保存到本地的表情
					const downloadingEmojis = this.$store.state.Chat.downloadingEmojis
					if (downloadingEmojis.length) {
						console.log(`开始下载表情`)
						const curToken = this.$store.state.User.accountInfo.token
						// let lastProgress
						// let newProgress
						for (let i = 0; i < downloadingEmojis.length; i++) {
							// newProgress = Math.floor(Math.round((i + 1) / downloadingEmojis.length * 10000) / 100)
							// if (newProgress != lastProgress) {
							// 	lastProgress = newProgress
							// 	this.$store.dispatch('Setting/set_pageLoading', this.$t('common.syncing[1]', { progress: newProgress }))
							// }

							this.$store.dispatch('Setting/set_pageLoading', { content: this.$t('common.syncing[1]', { totle: downloadingEmojis.length, done: i + 1 }), translucent: true })

							// 如果退出登录，清空表情数据，并终止下载
							if (curToken != this.$store.state.User.accountInfo.token) {
								console.log('账号登陆状态变化，终止下载表情')
								this.$store.commit('Chat/getAllEmojis', [])
								this.$store.commit('Chat/setDownloadingEmojis', [])
								this.$store.commit('Chat/updateEmojiSort', [])
								break
							}
							await this.$store.dispatch('Chat/downloadEmoji', downloadingEmojis[i])
							// await this.$utils.time.sleep(500)
						}
					}

					this.$store.dispatch('Setting/set_pageLoading', '')

					// 拉取新消息
					this.cGet(true)
				}).catch(async e => {
					console.log('同步历史记录异常', e)
					await this.$utils.chatSdk.cGetDoneAsync()
					// 关闭事务
					await this.$utils.sqlite.userDbEndTransaction()

					if (e.code != 5999 && this.retryTime < 3) {
						this.syncHistory()// 重试
						this.retryTime += 1
						console.log(`尝试重新同步历史记录（第${this.retryTime}次）`)
					} else {
						this.$store.dispatch('Setting/set_pageLoading', '')
						console.log(`不再重试，直接调用get接口拉取消息`)

						// 初始化置顶数据
						this.$store.dispatch('Chat/setTopInit')
						// 拉取新消息
						this.cGet(true)
					}
				})
			},

			// 同步历史记录
			getHistory() {
				return new Promise(async(resolve, reject) => {
					// 当前时间
					const curTime = `${this.$utils.fun.getServerTime('getHistory')}000000`

					const accountInfo = await this.$utils.fun.getAccountInfo()
					let lastLocalMsgTime = accountInfo.lastMessageTime || ''
					if (!lastLocalMsgTime) {
						// 本地最后一条消息时间
						const lastLocalMsg = (await this.$utils.sqlite.getChatData({
							where: 'threadType!=10001',
							order: 'timestamp DESC',
							size: 1
						}))[0]
						lastLocalMsgTime = lastLocalMsg ? (lastLocalMsg.timeStr || `${lastLocalMsg.timestamp}000000`) : '0'
					}

					console.log('上次登录收到的最后一条消息时间', lastLocalMsgTime)

					let isInit = false
					if (!this.$store.state.User.accountInfo.hasInitHistory) {
						console.log('---------- 首次同步历史 ----------')
						isInit = true
						lastLocalMsgTime = '0'
					}

					// 开启事务
					await this.$utils.sqlite.userDbBeginTransaction()

					if (!isInit) {
						const toasts = await this.loadToast(lastLocalMsgTime, 0)
						console.log('拉取65，126', toasts)

						if (toasts.length) { // 126存在单个会话多次操作（多次清空未读角标，多次清除【有人@我】），只需取最后一次操作便可
							let action = ''
							let threadID = ''
							let meta = {}
							let content = {}
							const todoAction = []
							const todo = []
							for (let i = 0; i < toasts.length; i++) {
								if (toasts[i].form == 65) {
									content = this.$utils.JSON.foramtJsonLikeString(toasts[i].content)
									if (content.clientType != 60) {
										action = `kill_${i}`
									}
								} else if (toasts[i].form == 126) {
									meta = this.$utils.JSON.foramtJsonLikeString(toasts[i].meta)
									threadID = meta.groupId || ''
									if (meta.groupType == -1) {
										threadID = 'notify'
									}
									action = `${threadID}_${toasts[i].content}`
								} else {
									continue
								}
								if (!todoAction.includes(action)) {
									todoAction.push(action)
									todo.push(toasts[i])
								}
							}
							if (todo.length) {
								console.log('处理过滤后的65,126', todo)
								await this.reveiveHistory(todo, `batch_${this.$utils.fun.getServerTime('reveiveHistory')}_toast`)
							}
						}
					}

					// 获取本地最后一条消息时间至今所有群组未同步的消息数
					this.$utils.chatSdk.cNewHisAsync(lastLocalMsgTime, '0', 10, '', this.ignoreMsgForms(isInit)).then(async result => {
						if (result.code == 0) {
							console.log('各组未同步的消息：', result)

							let res
							let threadID
							let visibleMsgs = [] // 实际显示在界面上的消息
							let lastMsgIdOfThread

							const syncBatch = `batch_${curTime}`// 记录批次
							const firstPages = {} // 各会话的第一页数据
							const newMsgInfo = result.data

							const lastMsgIdOfThreads = {}

							// 遍历会话，拉取第一页数据
							for (let i = 0; i < newMsgInfo.length; i++) {
								threadID = newMsgInfo[i].groupId

								// 最后再处理发送给我的透传
								if (threadID == this.$store.state.User.accountInfo.userId) continue

								const threadInfo = this.$store.getters['Chat/someThread'](threadID)
								lastMsgIdOfThread = threadInfo ? threadInfo.lastMessageID : ''
								if (lastMsgIdOfThread) {
									lastMsgIdOfThreads[threadID] = lastMsgIdOfThread
								}
								console.log('该会话本地最后一条消息', threadInfo ? threadInfo.lastMessage : null)

								const res = await this.loadMoreHistory({
									threadID,
									time: '0',
									syncBatch,
									preMsgID: lastMsgIdOfThread,
									isInit
								})

								if (res.code == 0 && !res.nomore && res.data) {
									firstPages[threadID] = res.data
								}
							}

							console.log('各会话第一页消息加载完毕，开始补全未读消息')

							// 遍历会话，拉取未读数据
							const threads = this.$store.getters.sortedThreads
							let firstPageMsgs = []
							for (let i = 0; i < threads.length; i++) {
								threadID = threads[i].id

								firstPageMsgs = firstPages[threadID]
								// 如果没有数据，不处理
								if (!firstPageMsgs || firstPageMsgs.length === 0) continue

								// 是否存在已读消息
								let existReadMsg = firstPageMsgs.some(msg => {
									return msg.form != 53 && msg.fresh == false
								})

								// 如果都是未读，则继续拉取，直到取得一条已读，但若未读超过100，则只拉取100
								if (!existReadMsg) {
									let unreadCount = firstPageMsgs.length // 未读数消息数
									let earliestMsg = firstPageMsgs[firstPageMsgs.length - 1] // 最早的消息

									visibleMsgs = []
									while (!existReadMsg) {
										res = await this.loadMoreHistory({
											threadID,
											preMsgID: lastMsgIdOfThreads[threadID],
											time: `${earliestMsg.timeStr}`,
											syncBatch,
											isInit
										})

										if (res.code == 0 && !res.nomore && !res.includeLocalMsg && res.data) {
											visibleMsgs = res.data.filter(msg => {
												return process.env.webConfig.VISIBLE_MSG_TYPE.includes(msg.form)
											})

											unreadCount += visibleMsgs.length
											if (unreadCount >= 100) {
												break
											}

											existReadMsg = res.data.some(msg => {
												return msg.form != 53 && msg.fresh == false
											})

											earliestMsg = res.data[res.data.length - 1]
										} else {
											break
										}
									}
								}
							}

							// 拉取本地最后一条消息至今的所有透传，必须全部拉完
							if (!isInit) {
								const toasts = await this.loadToast(lastLocalMsgTime, 2)
								console.log('拉取剩余的所有透传', toasts)
								if (toasts.length) {
									await this.reveiveHistory(toasts, `batch_${this.$utils.fun.getServerTime('cNewHisAsync')}_toast`)
								}
							}

							resolve()
						} else {
							reject(result)
						}
					}).catch((e) => {
						reject(e)
					})
				})
			},

			loadToast(lastLocalMsgTime, step) {
				return new Promise(async(resolve, reject) => {
					let res
					let nomoreToast = false
					let maxTime = '0'
					let newToasts
					let toasts = []

					while (!nomoreToast) {
						res = await this.$utils.chatSdk.cNewHisAsync(lastLocalMsgTime, maxTime, 0, this.$store.state.User.accountInfo.userId, this.ignoreMsgForms(false, step))
						if (res && res.code === 0) {
							newToasts = res.data[0].msgs
							if (newToasts && newToasts.length > 0) {
								toasts = toasts.concat(this.filterHistoryMsgs(newToasts, false, this.$store.state.User.accountInfo.userId))
								maxTime = `${newToasts[newToasts.length - 1].timeStr}`
								if (maxTime <= lastLocalMsgTime) {
									nomoreToast = true
									break
								}
							} else {
								nomoreToast = true
								break
							}
						} else {
							break
						}
					}
					resolve(toasts)
				})
			},

			// 加载历史记录
			loadMoreHistory({ threadID, form = 0, time, size = this.$store.state.Chat.pageSize, syncBatch, preMsgID, isInit = false }) {
				return new Promise(async(resolve, reject) => {
					if (threadID == 'notify') return resolve({ code: 0, nomore: true })
					try {
						let res
						let endTime = time // 拉取消息的结束时间
						let loadedMsgsCount = 0// 已经加载的有用数据的数量
						let moreHistory// 当次拉取的消息
						let usefulMsg // 有效的消息
						let indexOf_withDrawAll = -1// 拉到的数据是否存在双向撤回
						let indexOf_preMsg = -1// 拉到的是否跟本地数据重复了
						const updatingMsgs = this.messages ? this.messages.filter(msg => {
							return msg.threadID == threadID && msg.syncBatch == syncBatch
						}) : []

						while (loadedMsgsCount < size) {
							res = await this.$utils.chatSdk.cNewHisAsync('0', endTime, size, threadID, this.ignoreMsgForms(isInit))
							console.log(`拉取时间： ${endTime}`)
							console.log('拉取结果', res)

							// 异常
							if (res.code !== 0) {
								console.log('拉取历史记录异常', res)
								return resolve({ code: -1 })
							}

							// 没有更多了
							if (res.data[0] && res.data[0].msgs.length == 0) {
								console.log('服务器没有更多数据了，结束拉取')
								if (syncBatch && preMsgID) {
									await this.$utils.sqlite.updateChatData({
										where: `threadID='${threadID}' and syncBatch='${syncBatch}'`,
										data: {
											syncBatch: ''
										}
									})
								}
								return resolve({ code: 0, nomore: true })
							}

							endTime = `${res.data[0].msgs[res.data[0].msgs.length - 1].time - 1000}`
							moreHistory = this.filterHistoryMsgs(res.data[0].msgs, isInit, threadID)

							// 如果拉取到的数据包含本地的数据
							if (syncBatch && preMsgID) {
								indexOf_preMsg = moreHistory.findIndex(msg => {
									return msg.id == preMsgID
								})
								if (indexOf_preMsg >= 0) {
									console.log('存在与本地消息重复的消息', moreHistory[indexOf_preMsg])
								}
							}

							// 如果存在双向撤回
							indexOf_withDrawAll = moreHistory.findIndex(msg => {
								return msg.form == 123
							})
							if (indexOf_withDrawAll >= 0) {
								console.log('存在双向撤回', moreHistory[indexOf_withDrawAll])
								const meta = this.$utils.JSON.foramtJsonLikeString(moreHistory[indexOf_withDrawAll].meta)
								// 如果不是群主
								if (!(meta.isGroupOwner != 0 || meta.action == 1)) {
									console.log('撤回人不是群主')
									indexOf_withDrawAll = -1
								}
							}

							// 如果拉取到的数据包含本地的数据，则说明该批次已经拉取完毕
							// 如果存在群主双向撤回，则不用再继续了，该批次拉取完毕
							if (indexOf_preMsg >= 0 || indexOf_withDrawAll >= 0) {
								if (!isInit) {
									console.log(`该批次拉取完毕，更新数据库，去除批次号【${syncBatch}】`)
									await this.$utils.sqlite.updateChatData({
										where: `threadID='${threadID}' and syncBatch='${syncBatch}'`,
										data: {
											syncBatch: ''
										}
									})
									this.$store.commit('Chat/updateMsg', {
										ids: updatingMsgs.map(msg => {
											return msg.id
										}),
										updatingData: {
											syncBatch: ''
										}
									})
								}

								let endIndex
								let returnData

								if (indexOf_withDrawAll >= 0) {
									if (indexOf_preMsg >= 0) {
										endIndex = indexOf_preMsg > indexOf_withDrawAll ? indexOf_withDrawAll + 1 : indexOf_preMsg
									} else {
										endIndex = indexOf_withDrawAll + 1
									}

									returnData = { code: 0, nomore: true }
								} else {
									endIndex = indexOf_preMsg
									returnData = { code: 0, includeLocalMsg: true }
								}

								const leftData = moreHistory.slice(0, endIndex)// 本次拉取过滤后剩余的数据
								console.log(`将过滤后的消息写入【${threadID}】`, leftData)
								await this.reveiveHistory(leftData)

								returnData.data = res.data[0].msgs
								return resolve(returnData)
							}

							console.log(`将过滤后的消息写入【${threadID}】`, moreHistory)
							await this.reveiveHistory(moreHistory, syncBatch)
							usefulMsg = moreHistory.filter(msg => {
								return process.env.webConfig.VISIBLE_MSG_TYPE.includes(msg.form)
							})
							loadedMsgsCount += usefulMsg.length
						}

						resolve({ code: 0, data: res.data[0].msgs })
					} catch (e) {
						console.log('拉取历史记录异常', e)
						resolve({ code: -1 })
					}
				})
			},

			reveiveHistory(data, syncBatch) {
				return new Promise(async(resolve, reject) => {
					try {
						if (data.length === 0) {
							return resolve()
						}

						let cContentString
						let threadInfo

						const myGroups = this.$store.state.MyGrounp.list.map(group => {
							return group.groupId
						})

						for (let i = 0; i < data.length; i++) {
							cContentString = this.$utils.JSON.foramtJsonLikeString(data[i].content)
							switch (data[i].form) {
							case 53:
								if ([8, 10, 11, 14].indexOf(cContentString.action) >= 0) continue
								if (myGroups.indexOf(cContentString.groupId) < 0 && !this.$store.getters['Chat/someThread'](cContentString.groupId)) continue
								cContentString.syncBatch = syncBatch || ''
								cContentString.id = data[i].id
								cContentString.isHistory = true
								await this.$store.dispatch(
									'Chat/threadChange',
									cContentString
								)
								break
							case 54:
								threadInfo = this.$store.getters['Chat/someThread'](cContentString.groupId)
								const time = new Date(Math.ceil(data[i].time / 1000000)) // 服务端时间经确到纳秒，存在误差导致重复数据，通过向上取整来避免拉取重复数据
								const timestamp = time.getTime()

								if ((cContentString.action == 1 || cContentString.action == 3) && (!threadInfo || !threadInfo.lastMessageID)) {
									await this.$store.dispatch('Chat/getNewFriend', {
										friendID: cContentString.userId,
										isApplicant: cContentString.action == 1,
										switchToThread: false,
										content: cContentString.content || '',
										agreeTime: cContentString.timestamp, // 服务端时间经确到纳秒，存在误差导致重复数据，通过向上取整来避免拉取重复数据
										applyTime: timestamp,
										syncBatch: syncBatch || ''
									})
								}
								break
							case 65:
								if (myGroups.includes(cContentString.groupId)) {
									if (cContentString.userId.endsWith('_')) cContentString.userId += this.$store.state.User.accountInfo.organId
									await this.$store.dispatch('Chat/killAccount', cContentString)
									this.$store.dispatch('Chat/deletCollect', { clearall: cContentString })
								}
								break
							case 124:
								await this.$store.dispatch('Chat/deletCollect', { collectID: cContentString })
								break
							default:
								await this.receiveMsg(data[i], syncBatch || '')
								break
							}
						}
					} catch (e) {}
					resolve()
				})
			},

			ignoreMsgForms(isInit, step = 1) {
				// 不处理的消息类型
				let exclude = [
					21,
					22, // 网络连接成功
					23, // 网络连接失败或断开
					24, // 网络连接失败或断开
					41, // get结束
					51, // 密钥更换
					52, // 用户信息变更（头像、昵称）
					// 53, //群成员变动通知推送（群信息、加入群聊、退出群聊、群主变更...）
					// 54, //添加好友推送--- 对方
					55, // 双向撤回
					// 56, // 账号在其他设备登录
					57, // 账号密码变更
					// 58, // 非app端登录、退出登录、app端手动退出其他端
					59, // 群组，好友设置同步
					60, // 在线状态变更
					63, // 好友分组变更
					// 65, // 注销账号
					66, // 系统参数更新
					67, // 群组解锁定
					68, // 禁用企业
					69, // 管理员变更
					70, // 企业信息变更
					71, // 黑名单
					72, // 举报处理反馈
					// 73,	// 禁言
					74, // 置頂
					75, // 系统消息免打扰
					77, // 领红包
					// 78, // 发红包
					79, // 红包状态变更
					80, // 被移出企业
					81, // 工作状态变更
					82, // 企业变更
					84, // 有新的消息通知
					85, // 企业解散
					86, // 企业禁用启用
					87, // 二次验证开关
					106, // 语音通话
					// 113, //自定义表情
					// 114, //地理定位
					// 121, // 消息已读
					// 122, // 消息删除
					// 123, // 双向撤回
					// 124 // 收藏删除
					// 125, //删除会话同步
					// 126, //发给自己的消息
					127, // 更改密钥
					128 // 表情图变更
				]

				if (isInit) { // 初始化
					exclude = exclude.concat([65, 121, 124])
				} else if (step == 0) { // 拉取新消息之前
					exclude = exclude.concat([53, 54, 73, 125, 121, 122, 123, 124])
				} else if (step == 2) { // 拉取消息之后
					exclude = exclude.concat([65, 126])
				}

				return exclude.join(',')
			},

			filterHistoryMsgs(data, isInit, threadID) {
				// 不处理的消息类型
				// const exclude = this.ignoreMsgForms(isInit).split(',')

				let filteredMsgs = data.filter(msg => {
					return (
						msg.group &&
						!/secret/.test(msg.group)
						// &&exclude.indexOf(msg.form) < 0
					)
				})

				// 过滤本地清空的数据
				if (threadID && filteredMsgs.length > 0) {
					const threadInfo = this.$store.getters['Chat/someThread'](threadID)
					if (threadInfo) {
						const clearTime = threadInfo.clearTime || 0
						if (clearTime) {
							console.log(`存在清空消息时间${clearTime}，将过滤掉比清空消息时间早的记录`)
							filteredMsgs = filteredMsgs.filter(msg => {
								return Math.ceil(msg.time / 1000000) >= clearTime
							})
						}
					}
				}

				return filteredMsgs
			},

			async cGet(isHistory) {
				// 第一次调cget，lastMsgTime为true，后面为空。用于控制页面loading和主线程tray
				try {
					// if (this.$ENV_CONFIG !== 'dev') console.log(':::::::::::cget::::::::::')
					const getMsg = await this.$utils.chatSdk.cGetAsync()
					// if (this.$ENV_CONFIG !== 'dev') console.log('getMsg:::', getMsg)
					if (getMsg && getMsg.code === 0) {
						// 链接成功,更新SDK链接状态
						if (!this.$store.state.Setting.sdkOnline) {
							console.log('sdk已链接')
							this.$store.dispatch('Setting/set_sdkOnline', true)
						}

						// 如果api还未链接,等待它连接再继续
						if (!this.$store.state.Setting.online) {
							let apiReady = await this.waitingForApiReady()
							while (!apiReady) {
								console.log('api还未链接')
								apiReady = await this.waitingForApiReady()
							}
							console.log('api已链接')
						}

						// 处理收到的消息
						if (getMsg.data.length > 0) {
							const newMessages = getMsg.data
							let res
							for (let i = 0; i < newMessages.length; i++) {
								if (newMessages[i].form == 41) continue
								res = await this.receiveMsg(newMessages[i])
								// 终止处理消息，准备登出。自己销号或者被移出企业处理后会返回:dying
								if (res && res === 'dying') {
									return
								}
							}
						}
					} else if (getMsg && getMsg.code !== 0) {
						// 去掉 || getMsg.code === 5999，问培文5999是给app那边用来标记拉取中的状态，去掉原因：因为每次用户注册都会提示5999导致正在重连的提示一闪而过 --lz
						if ((getMsg.code === 5002) && this.$store.state.Setting.sdkOnline === true) {
							// 链接失败
							await this.$store.dispatch('Setting/set_sdkOnline', false)
						} else if (getMsg.code === 2009) { // token不存在
						}
						if (getMsg.code !== 5999) console.log(getMsg)
					}
					try {
						await this.$utils.chatSdk.cGetDoneAsync()
					} catch (e) {}
					if (getMsg.code !== 800506 && getMsg.code !== 2009) this.startGet(isHistory)
					if (getMsg.code === 2009) {
						this.tokenTimeout()
						this.noticeData	=	{
							title: this.$t('common.systemNotification'),
							messages: this.$t('common.loginInfoExpired')
						}
						this.$store.dispatch('Setting/set_showModal', 'AAmodal')
					}
				} catch (e) {
					try {
						await this.$utils.chatSdk.cGetDoneAsync()
					} catch (e) {}
					if (e.code !== 800506 && e.code !== 2009) this.startGet(isHistory)
					if (e.code === 2009) {
						this.tokenTimeout()
						this.noticeData	=	{
							title: this.$t('common.systemNotification'),
							messages: this.$t('common.loginInfoExpired')
						}
						this.$store.dispatch('Setting/set_showModal', 'AAmodal')
					}
				}
			},
			waitingForApiReady() {
				return new Promise(async(resolve, reject) => {
					setTimeout(() => {
						if (this.$store.state.Setting.online) {
							resolve(true)
						} else {
							resolve(false)
						}
					}, 1000)
				})
			},

			async tokenTimeout() {
				this.$store.dispatch('Setting/set_autoLogin', false)
				await this.$utils.fun.logout()
				this.$store.commit('initState')
			},
			async startGet(isHistory) {
				if (isHistory !== undefined) {
					this.$nextTick(() => {
						this.$utils.fun.firstGetCompleted()
						this.$store.dispatch('Setting/set_pageLoading', '')
					})
				}
				this.cGet()
			},

			receiveMsg(msgData, syncBatch = '') {
				return new Promise(async(resolve, reject) => {
					try {
						const isSecretChat = /secret/.test(msgData.group)
						if (isSecretChat) return resolve()

						const id = msgData.id
						const threadID = msgData.group
						let cForm = msgData.form
						const meta = this.$utils.JSON.foramtJsonLikeString(msgData.meta)
						const cContentString = this.$utils.JSON.foramtJsonLikeString(msgData.content)
						const sender = msgData.sender
						const time = new Date(Math.ceil(msgData.time / 1000000)) // 服务端时间经确到纳秒，存在误差导致重复数据，通过向上取整来避免拉取重复数据
						const timestamp = time.getTime()
						const timeStr = msgData.timeStr || ''
						const fresh = msgData.fresh
						const isHistory = timestamp < this.$store.state.User.accountInfo.timestamp// 消息时间小于最后登录时间则认为是历史消息
						// console.log(
						// 	`############ 收到数据-处理前 #############\n\nid:${id}\n\ntime:${time}\n\ngroupId:${threadID}\n\nfresh:${fresh}\n\nsender:${sender}\n\ncForm:${cForm}\n\nmeta:${
						// 		typeof meta === 'object' ? '\n' + JSON.stringify(meta) : meta
						// 	}\n\ncontent:${
						// 		typeof cContentString === 'object'
						// 			? '\n' + JSON.stringify(cContentString)
						// 			: cContentString
						// 	}\n\n\n\n`
						// )
						// 如果cContentString.timestamp不存在才新建，避免原始cContentString.timestamp被覆盖
						if (typeof cContentString === 'object' && !cContentString.timestamp) {
							cContentString.timestamp = timestamp
							cContentString.timeStr = timeStr
						}

						// if (!isHistory) {
						console.log(
							`############ 收到数据-处理后 #############\n\nid:${id}\n\ntime:${time}\n\ngroupId:${threadID}\n\nfresh:${fresh}\n\nsender:${sender}\n\ncForm:${cForm}\n\nmeta:${
								typeof meta === 'object' ? '\n' + JSON.stringify(meta) : meta
							}\n\ncontent:${
								typeof cContentString === 'object'
									? '\n' + JSON.stringify(cContentString)
									: cContentString
							}\n\n\n\n`
						)
						// }

						// 更新本地最新消息时间
						if (![21, 22, 23, 41].includes(cForm)) {
							// 排除自动连接及其结果
							// await this.$store.dispatch('User/set_lastMessage', {
							// 	messageId: id,
							// 	timestamp: `${timestamp}`
							// })
							if (timeStr > this.$store.state.User.accountInfo.lastMessageTime) {
								await this.$store.dispatch('User/set_accountInfo', { lastMessageTime: timeStr })
							}
						}

						const unSortedMsgs = this.$store.state.Chat.unSortedMsgs
						if (isHistory && unSortedMsgs.length > 0) {
							let msg
							let msgTime
							let msgTimeStr
							const sortedMsgIDs = []
							for (let i = 0; i < unSortedMsgs.length; i++) {
								msg = unSortedMsgs[i]
								msgTimeStr = `${msg.data.messageTimestamp}`.length > 13 ? msg.data.messageTimestamp : `${msg.data.messageTimestamp}000000`
								if (threadID == msg.threadID && timeStr < msgTimeStr) {
									msgTime = new Date(Math.ceil(msgTimeStr / 1000000)).getTime()
									await this.$utils.sqlite.updateChatData({
										where: `id='${msg.id}'`,
										data: {
											status: 1,
											timestamp: msgTime,
											timeStr: msgTimeStr
										}
									})

									// 如果目标会话没有lastMessageID,说明此消息是最后一条消息，更新会话
									const targetThread = this.$store.getters['Chat/someThread'](threadID)
									if (targetThread && !targetThread.lastMessageID) {
										const targetMsg = Object.assign(msg, {
											status: 1,
											timestamp: msgTime,
											timeStr: msgTimeStr
										})
										await this.$store.dispatch('Chat/updateThread', {
											threadID,
											updatingData: {
												id: threadID,
												lastMessage: targetMsg,
												lastMessageID: targetMsg.id,
												lastMessageTimestamp: targetMsg.timestamp
											}
										})
									}

									sortedMsgIDs.push(msg.id)
								}
							}
							this.$store.commit('Chat/updateUnSortedMsgs', {
								action: 'del',
								sortedMsgIDs
							})
						}

						// 网络连接成功
						if (cForm == 22) {
							await this.$store.dispatch('Setting/set_sdkOnline', true)
							// 重新拉取数据
							const res = await this.$utils.api.user.myGroupsAndUsers().get()
							if (!res.data) return resolve()
							const { groups, groupUsers, friends, users } = res.data
							await this.$store.dispatch('MyGrounp/set_list', groups || [])
							await this.$store.dispatch(
								'MyGrounp/set_userRelationList',
								groupUsers || []
							)
							await this.$store.dispatch('MyFriend/set_list', friends || [])
							await this.$store.dispatch('User/set_list', users || [])
							await this.$store.dispatch('NewFriend/set_list')
						} else if (cForm == 23 || cForm == 24) { // 网络连接失败或断开
							await this.$store.dispatch('Setting/set_sdkOnline', false)
						} else if (cForm == 51) { // 密钥更换
							await this.keyChange(cContentString)
						} else if (cForm == 52 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { // 用户信息变更（头像、昵称）
							await this.userInfoChange(cContentString)
						} else if (cForm == 53) { // 群成员变动通知推送（群信息、加入群聊、退出群聊、群主变更...）
							cContentString.id = id
							await this.groupChange(cContentString) // {userId,groupId,action,content...}
						} else if (cForm == 54) { // 添加好友推送--- 对方
							cContentString.threadID = threadID
							cContentString.agreeTime = timestamp
							await this.addUserChange(cContentString, isHistory) //  {"userId": "对方用户ID", "action":"0-添加好友申请 1-同意好友申请 2-删除好友","content": "填写的信息"}
						} else if (
							(cForm == 123 || (cForm == 122 && meta.userId)) &&
							meta &&
							!(
								!isHistory &&
								meta.userId == this.$store.state.User.accountInfo.userId &&
								meta.clientType == this.$WEB_CONFIG.client_type
							)
						) { // 双向撤回
							const threadType = meta.action == 1 ? 0 : 1
							const groupId = meta.groupId

							let groupInfo
							let friendInfo
							if (threadType == 1) {
								groupInfo = this.$store.getters['MyGrounp/groupInfo'](groupId)
								if (!groupInfo.groupId) return resolve()
							} else {
								friendInfo = this.$store.getters['MyFriend/groupInfo'](groupId)
								if (!friendInfo.groupId) return resolve()
							}

							console.log('双向撤回', meta, syncBatch)

							let operatorName
							const isMyAction = meta.userId == this.$store.state.User.accountInfo.userId// 是否是自己操作的
							const isMsgOwner = meta.messageUserId && meta.messageUserId == meta.userId// 操作的是否是自己的某条消息
							const isGroupOwner = meta.isGroupOwner == 1 || meta.isGroupOwner == 2

							if (threadType == 1 && isGroupOwner && !(cForm == 123 && isMyAction) && !isMsgOwner) {
								operatorName = this.$t('chat.ownerAndAdmin')
							} else if (meta.userId == this.$store.state.User.accountInfo.userId) {
								operatorName = this.$t('common.you')
							} else {
								const senderDetail = this.$store.getters.userDetail(
									groupId,
									meta.userId
								)
								if (!senderDetail) {
									operatorName = meta.userName
								} else if (threadType == 1 && groupInfo.isAnoymous == 1) {
									operatorName = senderDetail.anonym
								} else {
									operatorName =
										senderDetail.label ||
										senderDetail.userLabel ||
										senderDetail.nickName ||
										meta.userName
								}
							}

							const messageId = meta.messageId
							if (messageId) {
								const targetMsg = (await this.$utils.sqlite.getChatData({
									where: `id='${messageId}'`
								}))[0]

								if (targetMsg) {
									// meta.isGroupOwner == 1说明是群主撤回的消息，不需要考虑发送者
									this.$store.dispatch('Chat/progressQueue', { messageId, threadId: groupId, senderId: isGroupOwner ? '' : meta.userId })

									// 如果消息发送时间距今小于2分钟，则将该消息的基本信息保存到data，用于重新编辑
									const msgData = targetMsg.data || {}
									if (
										meta.userId == targetMsg.senderID &&
										targetMsg.isSend &&
										[this.$CHAT_MSG_TYPE.TYPE_TEXT, this.$CHAT_MSG_TYPE.TYPE_REPLY].indexOf(targetMsg.cForm) >= 0 &&
										!(msgData && msgData.editable)
									) {
										const pastTime = Math.floor((this.$utils.fun.getServerTime('receiveMsg') - targetMsg.timestamp) / 60000)
										if (pastTime <= 2) {
											msgData.editable = true
										}
									}

									await this.$store.dispatch('Chat/updateMsg', {
										id: messageId,
										updatingData: {
											// senderID: isMsgOwner ? targetMsg.senderID : '',
											senderID: meta.userId,
											text: this.$t('chat.withdrewMessages[0]', { name: operatorName }),
											mType: 'tip_withdraw',
											cForm: 53,
											data: msgData,
											syncBatch
										}
									})
								} else {
									// 如果本地不存在目标消息，说明是拉历史，先按透传时间生成一条撤回的消息占位，等拉到比它早的消息再更新时间为被撤回消息的时间并显示
									await this.$store.dispatch('Chat/addTip', {
										threadID: groupId,
										threadType,
										id: messageId,
										// senderID: isMsgOwner ? meta.userId : '',
										senderID: meta.userId,
										text: this.$t('chat.withdrewMessages[0]', { name: operatorName }),
										mType: 'tip_withdraw',
										cForm: 53,
										status: 3,
										data: meta,
										syncBatch,
										timestamp,
										timeStr: timeStr
									})
								}
							} else {
								if (meta.action == 1 || isGroupOwner) {
									await this.$store.dispatch('Chat/clearMsg', {
										threadID: groupId,
										timestamp
									})
								} else {
									await this.$store.dispatch('Chat/clearMsg', {
										threadID: groupId,
										userId: meta.userId,
										timestamp,
										exclude:
											`(cForm!=53 or mType in ('tip_withdraw','tip_withdrawAll'))`
									})
								}
								await this.$store.dispatch('Chat/addTip', {
									id,
									threadID: groupId,
									threadType,
									text: this.$t('chat.withdrewMessages[1]', { name: operatorName }),
									mType: 'tip_withdrawAll',
									timestamp,
									timeStr,
									senderID: meta.userId,
									syncBatch
								})
							}
						} else if (cForm == 56 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { // 账号在其他设备登录
							if (cContentString.clientType == 20 || cContentString.clientType == 21) {
								this.tokenTimeout()
								this.$store.dispatch('Setting/set_showModal', 'offNotification')
								await this.$utils.chatSdk.cGetDoneAsync()
								return resolve('dying')
							}
						} else if (cForm == 57 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { // 账号密码变更：0-密码变更 1-状态变更（锁定强退）
							this.tokenTimeout()
							if (cContentString.type == 0) {
								this.$store.dispatch('Setting/set_showModal', 'pwchangeNotification')
							}	else if (cContentString.type == 1) {
								this.noticeData	=	{
									title: this.$t('common.offlineNotification'),
									// messages: '您的账号已被禁用，请联系管理员处理！'
									messages: this.$t('common.aboutAccountTip[0]')
								}
								this.$store.dispatch('Setting/set_showModal', 'AAmodal')
							}
							await this.$utils.chatSdk.cGetDoneAsync()
							return resolve('dying')
						// } else if (cForm == 58 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { // 非app端登录、退出登录、app端手动退出其他端
						// 	const fromAPP = cContentString.clientType == 10 || cContentString.clientType == 11 // clientType: 10/11-app 20-win 21-mac 30-web; type: 0-登录 1-退出
						// 	if (fromAPP && cContentString.type == 1) {
						// 		this.tokenTimeout()
						// 		this.$store.dispatch('Setting/set_showModal', 'phoneOut')
						// 		await this.$utils.chatSdk.cGetDoneAsync()
						// 		return resolve('dying')
						// 	}
						} else if (cForm == 59) { // 群组、好友设置同步
							await this.settingsChange(cContentString)
						} else if (cForm == 60) { //  好友在线状态变更
							//  1.3版本改用轮询
							// await this.onlineStateChange(cContentString, isHistory);
						} else if (cForm == 61 && !isHistory) { // 收到抖一抖
							//   let userDetail = this.$store.getters.userDetail(
							//     cContentString.groupId,
							//     cContentString.userId
							//   );

							//   await this.$store.dispatch("Chat/receiveMessage", {
							//     id,
							//     threadID: cContentString.groupId,
							//     senderID: cContentString.userId,
							//     threadType: 0,
							//     name: cContentString.userName,
							//     timestamp: cContentString.timestamp,
							//     text:
							//       cContentString.userId === this.$store.state.User.accountInfo.userId
							//         ? "你发送了一个窗口抖动"
							//         : `${userDetail.label || userDetail.nickName}发送了一个窗口抖动`,
							//     cForm: 53
							//   });
							//   await this.$store.dispatch("Chat/openThread", {
							//     id: cContentString.groupId,
							//     type: 0
							//   });
							//   this.ditherWin();
						} else if (cForm == 63 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { //  好友分组变更
							await this.friendGroupChange(cContentString)
						} else if (cForm == 65 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { //  注销账号
							if (cContentString.userId.endsWith('_')) cContentString.userId += this.$store.state.User.accountInfo.organId
							const res = await this.deleteAccount(cContentString, cForm)
							if (res && res === 'dying') {
								return resolve('dying')
							}
						} else if (cForm == 66 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { //  更新企业设置
							await this.$store.dispatch('Setting/get_organParamsConfig')
							await this.$store.dispatch('Setting/get_paramsConfig')
						} else if (cForm == 67 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { //  群组(解)锁定
							await this.$store.dispatch('MyGrounp/update_info', {
								groupId: cContentString.groupId,
								state: cContentString.state
							})
							if (cContentString.state === 0) { // 群锁定
								const groupInfo = this.$store.getters['MyGrounp/groupInfo'](cContentString.groupId)
								let groupName = ''
								if (groupInfo && groupInfo.groupId) {
									groupName = groupInfo.groupLabel || groupInfo.groupName || ''
								}
								this.$store.dispatch('Chat/abortDownload', { threadId: cContentString.groupId })
								this.$utils.fun.closePlayerWin({
									threadId: cContentString.groupId,
									deleteType: 'lockedGroup',
									groupName
								})
							}
							this.$store.dispatch('Chat/preUpdateThread', { threadID: cContentString.groupId })
						} else if (cForm == 68 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { //  企管平台-用户禁用
							this.tokenTimeout()
							this.noticeData	=	{
								title: this.$t('common.offlineNotification'),
								// messages: cContentString.clientType	== 60 ? '您的账号在当前企业被禁用，请联系管理员处理！' : '您的账号已被禁用，请联系管理员处理！'
								messages: cContentString.clientType	== 60 ? this.$t('common.aboutAccountTip[1]') : this.$t('common.aboutAccountTip[0]')
							}
							this.$store.dispatch('Setting/set_showModal', 'AAmodal')
							await this.$utils.chatSdk.cGetDoneAsync()
							return resolve('dying')
						} else if (cForm == 69) { //  企管平台设置管理员-是否开放登录运管入口isAdmin:0-不是管理 1-是管理
							this.$store.dispatch('Setting/get_organParamsConfig')	// 更新企管参数配置
							this.$store.dispatch('Setting/get_paramsConfig')	// 更新参数配置
							this.$store.dispatch('User/set_accountInfo', { empAdminFlag: cContentString.isAdmin == 1 })
						} else if (cForm == 71) { //  黑名单操作-移入/移除
							this.$store.dispatch('MyFriend/set_list')
						} else if (cForm == 72) { // 举报处理反馈,积分助手
							if (cContentString.type == 0 || cContentString.type == 2) {
								await this.$store.dispatch('Chat/getNotify')// 获取系统公告
							} else if (cContentString.type == 1) {
								await this.$store.dispatch('Chat/getPointNotify')// 获取积分助手
							}
						} else if (cForm == 73) { // 禁言
							const type = cContentString.type
							let action
							let tip
							if (type == 0) {
								action = cContentString.action == 1 ? 2 : 1
								tip = this.$t('chat.allMemberSilence[' + (action - 1) + ']')
								if (!isHistory) {
									await this.$store.dispatch('MyGrounp/update_info', {
										groupId: cContentString.groupId,
										bannedSpeech: cContentString.action
									})
								}
							} else {
								const userIds = cContentString.userIds ? cContentString.userIds.split('|') : []
								const updatingData = {
									groupId: cContentString.groupId
								}

								const names = []
								let userInfo
								let userName

								userIds.forEach((id, index) => {
									userInfo = this.$store.getters.userDetail(cContentString.groupId, id)
									userName = userInfo.label || userInfo.userLabel || userInfo.nickName
									if (userName) {
										names.push(userName)
									}
								})

								// 将被禁言人中的我的昵称改为‘你’
								const myIndex = window._.indexOf(userIds, `${this.$store.state.User.accountInfo.userId}`)
								if (myIndex >= 0) {
									names[myIndex] = this.$t('common.you')
								}
								const userNames = names.join('、')

								if (type == 1) { // 设置禁言
									if (userNames === this.$t('common.you')) {
										tip = cContentString.action == 1 ? this.$t('chat.silencedTime[1]', { name: userNames, time: this.$utils.time.getLeftBanTime(cContentString.bannedTime * 60) }) : this.$t('chat.silencedTime[3]', { name: userNames })
									} else {
										tip = cContentString.action == 1 ? this.$t('chat.silencedTime[0]', { name: userNames, time: this.$utils.time.getLeftBanTime(cContentString.bannedTime * 60) }) : this.$t('chat.silencedTime[2]', { name: userNames })
									}
								} else if (type == 2) { // 设置可发言
									let index
									if (userNames === this.$t('common.you') || names.length > 1) {
										index = cContentString.action == 1 ? 5 : 7
									} else {
										index = cContentString.action == 1 ? 4 : 6
									}
									tip = this.$t(`chat.silencedTime[${index}]`, { name: userNames })
								}

								if (!isHistory) {
									if (userIds.length > 0 && userIds.includes(this.$store.state.User.accountInfo.userId)) {
										updatingData.userId = this.$store.state.User.accountInfo.userId
									}
									await this.$store.dispatch('MyGrounp/update_userRelation', updatingData)
								}
							}
							// 更新会话信息
							this.$store.dispatch('Chat/preUpdateThread', { threadID: cContentString.groupId })
							// 显示透传
							await this.$store.dispatch('Chat/addTip', {
								id,
								threadID: cContentString.groupId,
								text: tip,
								mType: 'tip_ban',
								timestamp,
								timeStr,
								threadType: 1,
								syncBatch
							})
						} else if (cForm == 74) { // 会话置顶
							const threadID = cContentString.businessId == `10001_${cContentString.organId}` ? 'notify' : cContentString.businessId
							let targetThread = this.$store.getters['Chat/someThread'](threadID)

							if (!targetThread) {
								let threadType = 1
								const groupInfo = this.$store.getters['MyGrounp/groupInfo'](threadID)
								if (!groupInfo || !groupInfo.groupId) {
									threadType = 0
								}
								await this.$store.dispatch('Chat/createThread', { threadID, threadType })
								targetThread = this.$store.getters['Chat/someThread'](threadID)
							}

							const opType = targetThread.topTime ? 1 : 0
							const curTopTime = targetThread.topTime || 0

							if ((cContentString.opType != opType || cContentString.timestamp > curTopTime)) {
								const curTime = this.$utils.fun.getServerTime('cForm == 74')
								const updatingData = {
									topTime: cContentString.opType == 1 ? cContentString.timestamp : 0
								}
								if (cContentString.opType == 0) {
									updatingData.activeTime = curTime
								} else if (targetThread.hidden == 1 && targetThread.topTime !== undefined && targetThread.topTime < cContentString.timestamp) {
									updatingData.hidden = 0
								}
								this.$store.dispatch('Chat/updateThread', {
									threadID,
									updatingData
								})
							}
						} else if (cForm == 75) { // 系统消息免打扰
							if (
								cContentString.userId == this.$store.state.User.accountInfo.userId &&
								cContentString.clientType == this.$WEB_CONFIG.client_type
							) { //  过滤当前用户自己操作自己当前端接收推送再次处理
								return resolve()
							} else {
								this.$store.dispatch('Chat/updateThread', {
									threadID: 'notify',
									updatingData: { notDisturb: parseInt(cContentString.opType) }
								})
							}
						} else if (cForm == 77) { // 领取红包
						// 	const myInfo = this.$store.state.User.accountInfo
						// 	if (cContentString.toUserId == myInfo.userId) { // 如果是我领取的
						// 		const threadType = cContentString.fromGroupId ? 1 : 0

						// 		const message = {
						// 			id,
						// 			threadID,
						// 			senderID: myInfo.userId,
						// 			name: myInfo.nickName,
						// 			avatar: myInfo.userAvatar,
						// 			threadType,
						// 			timestamp,
						// 			timeStr: timeStr,
						// 			cForm,
						// 			text: this.$t('point.openedPackte'),
						// 			status: 1,
						// 			isSend: 1,
						// 			read: 1,
						// 			syncBatch: syncBatch || ''
						// 		}

						// 		await this.$store.dispatch('Chat/receiveMessage', { message })
						// 	}
						} else if (cForm === 80) { // 用户被移出企业
							if (cContentString.userId == this.$store.state.User.accountInfo.userId && this.$store.state.clearLocalDataTime >= cContentString.timestamp) {
								return resolve()
							}
							const res = await this.deleteAccount(cContentString, cForm)
							if (res && res === 'dying') {
								return resolve('dying')
							}
						} else if (cForm == 81) { // 工作状态变更
							const targetUserId = `${cContentString.userId}${this.$store.state.User.accountInfo.organId}`
							if (
								targetUserId == this.$store.state.User.accountInfo.userId &&
								cContentString.clientType == this.$WEB_CONFIG.client_type
							) { return resolve() } //  过滤当前用户自己操作自己当前端接收推送再次处理

							const data = {
								userId: targetUserId,
								workingStatusId: cContentString.workingStatusId,
								workingStatusValue: cContentString.workingStatusValue,
								workingStatusExpression: cContentString.workingStatusExpression
							}
							await this.$store.dispatch('User/update_info', data)
							if (targetUserId == this.$store.state.User.accountInfo.userId) {
								await this.$store.dispatch('User/set_accountInfo', data)
							}
							await this.$store.dispatch('Chat/preUpdateThread', { userId: `${targetUserId}` })
						} else if (cForm == 82) { // 企业列表变更
							if (// 如果是当前企业，不处理
								cContentString.organId == this.$store.state.User.accountInfo.organId
							) { return resolve() }

							this.getAllOrgans()
							if (cContentString.type == 2) {
								await this.$store.dispatch('Chat/getNotify')
							}
						} else if (cForm == 85) { // 企业解散
							if (cContentString.organId == this.$store.state.User.accountInfo.organId) {
								const myID = this.$store.state.User.accountInfo.userId
								// 中断下载任务
								this.$store.dispatch('Chat/abortDownload', { senderId: myID })
								// 关闭播放页面
								this.$utils.fun.closePlayerWin({
									senderId: myID,
									deleteType: 'destroyUserId'
								})

								await this.$utils.chatSdk.cGetDoneAsync()
								await this.$utils.fun.deleteAccount('quit')
								this.$store.commit('User/UPDATE_ACCOUNTINFO', { token: '', p: '' })
								this.$store.commit('Chat/switchThread', '') // 清空vuex里的currentThreadID
								this.$store.commit('Setting/UPDATE_SYSCONFIG', { autoLogin: false }) // 企业解散不用清空记住的登录号
								this.$store.commit('setOrganizationPage', '')
								this.$store.dispatch('Setting/set_showModal', 'organDied')
								return resolve('dying')
							} else {
								this.getAllOrgans()
								await this.$store.dispatch('Chat/getNotify')
							}
						} else if (cForm == 86 && this.$store.state.User.accountInfo.timestamp < cContentString.timestamp) { //  企业启用禁用
							const isCurOrgan = cContentString.organId == this.$store.state.User.accountInfo.organId
							if (isCurOrgan && cContentString.type == 0) { // 0禁用 1启用
								this.tokenTimeout()
								this.noticeData	=	{
									title: this.$t('common.offlineNotification'),
									messages: this.$t('organization.disabled')
								}
								this.$store.dispatch('Setting/set_showModal', 'AAmodal')
								await this.$utils.chatSdk.cGetDoneAsync()
								return resolve('dying')
							} else if (!isCurOrgan) {
								this.getAllOrgans()
							}
						} else if (// 更新二次验证开关状态
							cForm == 87
						) {
							const userId = this.$store.state.User.accountInfo.userId.split('_')[0]
							if (userId == this.$store.state.User.accountInfo.userId.split('_')[0]) {
								this.$store.commit('User/UPDATE_ACCOUNTINFO', {
									userSecurityConfig: Object.assign({}, this.$store.state.User.accountInfo.userSecurityConfig, { secondValidSwitch: cContentString.switchState })
								})
							}
						} else if (cForm == 88 && cContentString.token == this.$store.state.User.accountInfo.token) {
							this.tokenTimeout()
							await this.$utils.chatSdk.cGetDoneAsync()
							setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
							return resolve('dying')
						} else if (cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO) { // 单独处理语音通话状态
							/* const message = {
								id,
								threadID,
								text: '[语音通话]',
								senderID: meta.userId,
								threadType:0,
								name: meta.nickName,
								avatar: meta.userAvatar,
								burntAfterRead: 0,
								triggered: cContentString.form === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_END ? 1 : 0,
								atUsers: meta.atUsers === undefined ? '' : meta.atUsers,
								isAnoymous: meta.isAnoymous || 0,
								mType: meta.mType || '',
								timestamp,
								cForm,
								data: cContentString,
								status: 1,
								isSend: meta.userId == this.$store.state.User.accountInfo.userId ? 1 : 0,
								// read: isHistory ? (msgData.fresh ? 0 : 1) : meta.userId == this.$store.state.User.accountInfo.userId ? 1 : 0,
								read: meta.userId == this.$store.state.User.accountInfo.userId ? 1 : (msgData.fresh ? 0 : 1),
								unreadCount: msgData.unread,
								syncBatch: syncBatch || ''
							}
							await this.$store.dispatch('Chat/receiveMessage', { message, meta })*/
						} else if ( // 收到聊天信息
							process.env.webConfig.VISIBLE_MSG_TYPE.includes(cForm) &&
							!(
								!isHistory &&
								meta.userId == this.$store.state.User.accountInfo.userId &&
								meta.clientType == this.$WEB_CONFIG.client_type
							)
						) {
							const isAnoymous = meta.isAnoymous || 0
							const threadType = parseInt(meta.groupType)
							const nickName = meta.nickName

							// if (!isAnoymous) {
							// 	nickName = this.$store.getters.latestUsername(meta.userId, threadType, threadID)
							// }
							// 用于处理安卓端以文件103代码发送的视频和图片
							if (cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
								if (this.$supportImageType.includes(meta.fileType) && meta.width && meta.height) {
									cForm = this.$CHAT_MSG_TYPE.TYPE_IMAGE
								} else if (this.$supportVideoType.includes(meta.fileType) && meta.width && meta.height && meta.duration) {
									cForm = this.$CHAT_MSG_TYPE.TYPE_VIDEO
								}
							}
							let message = {
								id,
								threadID,
								senderID: meta.userId,
								threadType,
								name: nickName,
								avatar: meta.userAvatar,
								burntAfterRead: cForm == this.$CHAT_MSG_TYPE.TYPE_FILE ? 0 : (meta.burntAfterRead || 0),
								triggered: 0,
								atUsers: meta.atUsers === undefined ? '' : meta.atUsers,
								isAnoymous,
								mType: meta.mType || '',
								timestamp,
								timeStr: timeStr,
								cForm,
								status: 1,
								isSend: meta.userId == this.$store.state.User.accountInfo.userId ? 1 : 0,
								// read: isHistory ? (msgData.fresh ? 0 : 1) : meta.userId == this.$store.state.User.accountInfo.userId ? 1 : 0,
								read: meta.userId == this.$store.state.User.accountInfo.userId ? 1 : (msgData.fresh ? 0 : 1),
								unreadCount: msgData.unread,
								syncBatch: syncBatch || ''
							}

							switch (cForm) {
							case 78:
								const myInfo = this.$store.state.User.accountInfo
								const isSend = cContentString.fromUserId == myInfo.userId

								let text = this.$t('point.received')
								if (isSend) { // 如果是自己发的
									text = this.$t('point.sent')
								}

								message = {
									id,
									threadID,
									senderID: cContentString.fromUserId,
									name: cContentString.fromUserName,
									avatar: cContentString.fromUserAvatar,
									data: cContentString,
									threadType,
									timestamp,
									timeStr: timeStr,
									cForm,
									text,
									status: 1,
									isSend,
									read: isSend ? 1 : (msgData.fresh ? 0 : 1),
									unreadCount: msgData.unread,
									syncBatch: syncBatch || ''
								}
								break
							case this.$CHAT_MSG_TYPE.TYPE_TEXT:
								message.text = msgData.content
								break
							case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
								const extTemp = typeof cContentString === 'string' ? cContentString.split('.') : []
								Object.assign(message, {
									text: `[${this.$t('common.image')}]`,
									width: meta.width || 150,
									height: meta.height || 120,
									url: cContentString,
									localPath: '',
									ext: meta.fileType || extTemp[extTemp.length - 1] || ''
								})
								break
							case this.$CHAT_MSG_TYPE.TYPE_EMOJI:
								Object.assign(message, {
									text: `[${this.$t('common.emoji')}]`,
									width: meta.width || 300,
									height: meta.height || 300,
									url: cContentString,
									localPath: '',
									ext: cContentString.split('.')[1] || ''
								})
								break
							case this.$CHAT_MSG_TYPE.TYPE_FILE:
								Object.assign(message, {
									text: `[${this.$t('common.file')}] ` + meta.fileName,
									url: cContentString,
									localPath: '',
									ext: meta.fileType || '',
									fileName: meta.fileName,
									fileSize: meta.fileSize
								})
								break
							case this.$CHAT_MSG_TYPE.TYPE_VOICE:
								Object.assign(message, {
									text: `[${this.$t('common.voice')}]`,
									url: cContentString,
									localPath: '',
									ext: 'aac',
									duration: meta.duration
								})
								break
							case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
								Object.assign(message, {
									text: `[${this.$t('common.video')}]`,
									url: cContentString,
									localPath: '',
									ext: 'mp4',
									duration: meta.duration,
									fileSize: meta.fileSize,
									height: meta.height,
									width: meta.width,
									fileName: meta.fileName || ''
								})
								break
							case 107:
								// console.log(cContentString)
								// await this.$utils.rtc.sendVideoStream(await this.$utils.chatSdk.cContent())
								break
							case this.$CHAT_MSG_TYPE.TYPE_REPLY:
								message.text = msgData.content
								let replyInfo = meta.replyInfo
								if (typeof replyInfo === 'string') {
									replyInfo = this.$utils.JSON.foramtJsonLikeString(replyInfo)
								}
								message.replyInfo = replyInfo
								// 2.2.0页面启用缓存，收藏转发会带上本地地址用于解决发送方报错的问题，接收方要清除，wuxl
								message.replyInfo.thumbnail = ''
								message.replyInfo.localPath = ''
								// 查找回复的消息是否存在
								const targetMsg = this.$store.getters['Chat/someMessage'](replyInfo.id)
								if (targetMsg) {
									message.replyInfo.thumbnail = targetMsg.thumbnail || ''
									message.replyInfo.localPath = targetMsg.localPath || ''
								}
								break
							case this.$CHAT_MSG_TYPE.TYPE_CHATRECORD:
								if (typeof cContentString.items === 'string') {
									cContentString.items = this.$utils.JSON.foramtJsonLikeString(cContentString.items)
								}

								message.text = `[${this.$t('chat.chatHistory')}]`
								message.data = cContentString
								// console.log('聊天记录', message)
								break
							case this.$CHAT_MSG_TYPE.TYPE_CARD:
								message.text = `[${this.$t('common.contactCard')}]`
								message.data = cContentString
								break
							case this.$CHAT_MSG_TYPE.TYPE_NOTE:
								message.text = `[${this.$t('common.note')}]`
								message.data = {
									noteId: meta.noteId || '',
									content: cContentString
								}
								break
							case this.$CHAT_MSG_TYPE.TYPE_LOCATION:
								message.text = message.isSend ? this.$t('location.sent') : this.$t('location.received')
								break
							}

							await this.$store.dispatch('Chat/receiveMessage', { message, meta })
							if (cForm === this.$CHAT_MSG_TYPE.TYPE_FILE && meta.fileName) {
								this.$store.commit('Chat/setReFilaNameQueue', {
									action: 'add',
									data: {
										id,
										fileName: meta.fileName,
										threadID,
										ext: meta.fileType || ''
									}
								})
							}
							// 消息桌面通知
							const threadInfo = this.$store.getters['Chat/someThread'](message.threadID)
							if (isHistory || threadInfo.notDisturb == 1 || meta.userId == this.$store.state.User.accountInfo.userId) return resolve()// 离线消息，历史消息，开启免打扰，自己发的消息不通知

							if (
								threadInfo.notDisturb == 0 &&
								!(
									meta.userId == this.$store.state.User.accountInfo.userId &&
									meta.clientType == this.$WEB_CONFIG.client_type &&
									!isHistory
								)
							) {
								this.allsetting.openSounds
									? this.$refs.msgSound.play()
									: this.$refs.msgSound.pause() // 消息通知音

								if (this.allsetting.allowNotice) {
									const senderDetail = this.$store.getters.userDetail(
										message.threadID,
										message.senderID
									)
									if (cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
										// 如果收到的是文件，等待1000毫秒，等待重命名完成
										await this.$utils.fun.waiting(1000)
										const tempMessage = this.$store.getters['Chat/someMessage'](id)
										message = window._.assign({}, message, tempMessage)
									}

									this.$utils.fun.notifyMessage(
										window._.assign(
											{},
											message,
											{
												name:
													(threadInfo.isAnoymous == 1 ? senderDetail.anonym : false) ||
													senderDetail.label ||
													senderDetail.userLabel ||
													senderDetail.nickName
											},
											message.burntAfterRead == 1 && { text: this.$t('chat.burnAfterReading') },
											threadInfo.type == 1 ? { groupName: threadInfo.name } : {}
										)
									)
								}
							}
						} else if (
							cForm == 125 &&
							!(sender == this.$store.state.User.accountInfo.userId &&
								meta.clientType == this.$WEB_CONFIG.client_type)
						) { // 删除会话同步
							await this.$store.dispatch('Chat/hideThread', {
								threadID: cContentString,
								timestamp
							})
						} else if (
							cForm == 126 &&
							!(sender == this.$store.state.User.accountInfo.userId &&
								meta.clientType == this.$WEB_CONFIG.client_type)
						) { // 给自己发消息
							// 同步清空未读角标 content:UpdateUnread
							// 同步删除系统会话 content:DeleteSystem
							// 同步删除系统会话 content:clearBonusNotice
							if (cContentString == 'DeleteSystem') {
								await this.$store.dispatch('Chat/hideThread', {
									threadID: 'notify',
									timestamp
								})
							} else if (cContentString == 'clearBonusNotice') {
								await this.$store.dispatch('Chat/hideThread', {
									threadID: 'point',
									timestamp
								})
							} else if (cContentString == 'UpdateUnread') {
								let threadID = meta.groupId
								if (meta.groupType == -1) {
									threadID = 'notify'
								} else if (meta.groupType == -2) {
									threadID = 'point'
								}

								const targetThread = this.$store.getters['Chat/someThread'](threadID)
								if (!targetThread) return resolve()

								if (targetThread.unreadCount > 0) {
									if (targetThread.lastMessageTimestamp && targetThread.lastMessageTimestamp > timestamp) return resolve()

									// 清空未读数
									const updatingData = {
										unreadCount: 0
									}

									// 清除[有人@我]
									if (targetThread.firstAtMeID) {
										updatingData.firstAtMeID = ''
										updatingData.firstAtMeTime = ''
									}

									await this.$store.dispatch('Chat/updateThread', { threadID, updatingData })
								}
							}
						} else if (cForm == 121) { // 消息已读
							const ids = cContentString.split(',')
							const data = {
								updatingData: {
									unreadCount: msgData.unread
								}
							}
							if (ids.length === 1) {
								data.id = cContentString
							} else {
								data.ids = ids
							}
							await this.$store.dispatch('Chat/updateMsg', data)
						} else if (cForm == 122 && !meta.userId) { // 消息删除
							// 如果是阅后即焚消息，则更新该消息为已读
							const deletingMsg = (await this.$utils.sqlite.getChatData({
								where: `id='${cContentString}'`
							}))[0]
							if (deletingMsg) {
								const isMyself = sender == this.$store.state.User.accountInfo.userId

								if (meta.burntAfterRead !== undefined) {
									await this.$store.dispatch('Chat/updateMsg', {
										id: cContentString,
										updatingData: {
											unreadCount: 0
										}
									})
								} else if (isMyself) {
									await this.$store.dispatch('Chat/delMsg', {
										threadID: deletingMsg.threadID,
										ids: [cContentString]
									})
								}
							}
						} else if (cForm == 124) { // 删除收藏
							await this.$store.dispatch('Chat/deletCollect', { collectID: cContentString })
						} else if (cForm == 128) { // 表情变更
							if (cContentString.type == 'add') {
								await this.$store.dispatch('Chat/addEmoji', cContentString)
							} else if (cContentString.type == 'delete') {
								await this.$store.dispatch('Chat/removeEmoji', cContentString.id.split(','))
							} else if (cContentString.type == 'sort') {
								await this.$store.commit('Chat/updateEmojiSort', cContentString.ids)
							}
						} else if (cForm >= this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST && cForm <= this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_TIMEOUT && sender !== this.$store.state.User.accountInfo.userId) {
							/* const userInfo = this.$store.getters['User/userInfo'](sender)
							const friendInfo = this.$store.getters['MyFriend/friendInfo'](sender)
							const name = friendInfo.label || userInfo.nickName
							const avatar = userInfo.userAvatar || meta.userAvatar
							const data = {
								cForm,
								userName: name,
								userAvatar: avatar,
								timestamp: timestamp,
								messageId: id,
								threadId: threadID,
								meta,
								content: cContentString,
								isSend: sender == this.$store.state.User.accountInfo.userId
							}
							this.$utils.fun.createWin({
								action: 'openRealAudioWin',
								params: data
							})*/
						}	else if (cForm >= 231 && cForm <= 233) { // 231-实时记录新增，232-已读，233-删除
							this.$store.dispatch('OPcomponent/set_callRecords')
						} else { // 接收到未约定处理的消息推送
							console.log('接收到未约定处理的消息推送：', this.$store.state.User.accountInfo.timestamp, msgData)
						}
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			groupChange(data) {
				return new Promise(async(resolve, reject) => {
					try {
						// 如果不存在群组,不做任何处理
						let existGroup = true
						const groupInfo = this.$store.getters['MyGrounp/groupInfo'](data.groupId)
						existGroup = groupInfo && groupInfo.groupId

						if (!existGroup) {
							const res = await this.$utils.api.user.getGroupDetail({ groupId: data.groupId }).get()
							if (res.code == 0 && res.data) {
								existGroup = true
							} else {
								return resolve()
							}
						}

						if (data.action == 0) {
							// 群名称修改
							await this.$store.dispatch('MyGrounp/update_info', {
								groupId: data.groupId,
								groupName: data.content
							})
						} else if (data.action == 1) {
							// 群成员信息变更(有人加入)---更新我的群组信息，群组关系列表;用户列表
							// await this.$store.dispatch('MyGrounp/update_info', {
							// 	groupId: data.groupId,
							// 	reload: true
							// })
							// await this.$store.dispatch('MyGrounp/update_userRelation', {
							// 	groupId: data.groupId
							// })
							await this.$store.dispatch('MyGrounp/refreshSettings', data.groupId)
							const userRelationUserId = (await this.$store.getters['MyGrounp/groupUsers'](data.groupId)).map(groupUser => {
								return groupUser.userId
							})
							await this.$store.dispatch('User/update_info', {
								userId: userRelationUserId.join('|')
							})
						} else if (data.action == 2) {
							// 有人退群
							// 更新我的群组信息，群组关系列表;用户列表
							// await this.$store.dispatch('MyGrounp/update_info', {
							// 	groupId: data.groupId,
							// 	reload: true
							// })
							// await this.$store.dispatch('MyGrounp/update_userRelation', {
							// 	groupId: data.groupId
							// })
							await this.$store.dispatch('MyGrounp/refreshSettings', data.groupId)
							await this.$store.dispatch('User/update_info', { userId: data.userId })
						} else if (data.action == 3) {
							// 你加入了群---更新我的群组;更新群组关系列表;更新群成员个人信息
							// await this.$store.dispatch('MyGrounp/update_info', {
							// 	groupId: data.groupId
							// })
							// await this.$store.dispatch('MyGrounp/update_userRelation', {
							// 	groupId: data.groupId
							// })
							await this.$store.dispatch('MyGrounp/refreshSettings', data.groupId)
							const userRelationUserId = (await this.$store.getters['MyGrounp/groupUsers'](data.groupId)).map(groupUser => {
								return groupUser.userId
							})
							await this.$store.dispatch('User/update_info', {
								userId: userRelationUserId.join('|')
							})
						} else if (data.action == 4) {
							// 你退出群
							// 删除在群里的下载队列
							this.$store.dispatch('Chat/abortDownload', { threadId: data.groupId })
							// ---更新我的群组;更新群组关系列表
							await this.$store.dispatch('MyGrounp/delete_info', {
								groupId: data.groupId
							})
							await this.$store.dispatch('MyGrounp/delete_userRelation', {
								groupId: data.groupId
							})
						} else if (data.action == 5) {
							// 群主变更---更新我的群组;更新群组关系列表
							// await this.$store.dispatch('MyGrounp/update_info', {
							// 	groupId: data.groupId,
							// 	// groupOwnerId: data.userId,
							// 	reload: true// 群设置变更不会推给群成员，转移的新群主没有最新的群设置信息
							// })
							// await this.$store.dispatch('MyGrounp/update_userRelation', {
							// 	groupId: data.groupId
							// })
							await this.$store.dispatch('MyGrounp/refreshSettings', data.groupId)
						} else if (data.action == 6) {
							// 开启匿名模式---更新我的群组;更新群组关系列表
							await this.$store.dispatch('MyGrounp/update_info', {
								groupId: data.groupId,
								isAnoymous: '1'
							})
							await this.$store.dispatch('MyGrounp/update_userRelation', {
								groupId: data.groupId
							})
						} else if (data.action == 7) {
							// 关闭匿名模式---更新我的群组
							await this.$store.dispatch('MyGrounp/update_info', {
								groupId: data.groupId,
								isAnoymous: '0'
							})
						} else if (data.action == 8) {
							// 群用户设置变更(不允许其他成员添加我,显示名称)---更新群组关系列表
							await this.$store.dispatch('MyGrounp/update_userRelation', {
								groupId: data.groupId,
								userId: data.userId
							})
						} else if (data.action == 9) {
							// 群解散---更新我的群组;更新群组关系列表

							const groupInfo = this.$store.getters['MyGrounp/groupInfo'](data.groupId)
							let groupName = ''
							if (groupInfo && groupInfo.groupId) {
								groupName = groupInfo.groupLabel || groupInfo.groupName || ''
							}
							this.$store.dispatch('Chat/abortDownload', { threadId: data.groupId })
							this.$utils.fun.closePlayerWin({
								threadId: data.groupId,
								deleteType: 'dismissGroup',
								groupName
							})
							await this.$store.dispatch('Chat/updateThread', {
								threadID: data.groupId,
								updatingData: { memberNum: 0 }
							})

							await this.$store.dispatch('MyGrounp/delete_info', {
								groupId: data.groupId
							})
							await this.$store.dispatch('MyGrounp/delete_userRelation', {
								groupId: data.groupId
							})
						} else if (data.action == 10) {
							// 申请进群(userId多个用竖线分隔)---更新用户列表
							await this.$store.dispatch('NewFriend/set_list')
						} else if (data.action == 11) {
							// 创建群组同步
							// await this.$store.dispatch('MyGrounp/update_info', {
							// 	groupId: data.groupId
							// })
							// await this.$store.dispatch('MyGrounp/update_userRelation', {
							// 	groupId: data.groupId
							// })
							await this.$store.dispatch('MyGrounp/refreshSettings', data.groupId)
						} else if (data.action == 12 || data.action == 13) { // 管理员
							await this.$store.dispatch('MyGrounp/update_userRelation', {
								groupId: data.groupId
							})
						} else if (data.action == 14) {
							// 进群申请的处理同步（拒绝/同意）---目前只存在同意的操作；涉及角标的数据故不能手动更改数据
							// 实际就是群主的操作同步，此时接口还会给群成员发data.action == 1的推送，群主也会收到故不在此处理群信息更新
							await this.$store.dispatch('NewFriend/set_list')
						} else if (data.action == 17 || data.action == 16) {
							// 禁止|允许群成员修改群名称
							await this.$store.dispatch('MyGrounp/update_info', {
								groupId: data.groupId,
								forbidEditGroupName: data.action == 17 ? 1 : 0
							})
						} else {
							console.log('接收到群变动未约定的行为：', data.action)
						}

						// 更新会话信息
						await this.$store.dispatch('Chat/threadChange', data)
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			addUserChange(data, isHistory) {
				return new Promise(async(resolve, reject) => {
					try {
						// 如果不存在用户,不做任何处理
						let existUser = true
						existUser = this.$store.getters[
							'User/userInfo'
						](data.userId).userId !== undefined

						if (!existUser) {
							const res = await this.$utils.api.user.pullUserInfo({ userIds: data.userId }).get()
							if (res.code == 0 && res.data.length > 0) {
								existUser = true
							} else {
								return resolve()
							}
						}

						// 处理添加好友相关推送
						if (
							!isHistory &&
							data.threadID == this.$store.state.User.accountInfo.userId &&
							data.clientType == this.$WEB_CONFIG.client_type &&
							(data.action == 2 || data.action == 3 || data.action == 4)
						) {
							// 过滤当前用户自己操作自己当前端接收推送再次处理
							return resolve()
						} else if (data.action == 0) {
							// 添加好友申请---更新新的好友
							this.$store.dispatch('NewFriend/set_list')
						} else if (data.action == 1 || data.action == 3) {
							// 1：同意好友申请 3：添加好友同步（被加者同意时的异地登录账号接收）---更新我的好友;更新用户列表
							await this.$store.dispatch('User/update_info', { userId: data.userId })
							await this.$store.dispatch('MyFriend/update_info')
							//  别人已发送过添加好友申请
							const friendApplicate = await this.$store.state.NewFriend.list.filter(
								newFriend => {
									return data.userId == newFriend.fromUserId && newFriend.type == '0'
								}
							)
							if (friendApplicate.length) { await this.$store.dispatch('NewFriend/set_list') }

							await this.$store.dispatch('Chat/getNewFriend', {
								friendID: data.userId,
								isApplicant: data.action == 1,
								switchToThread: false,
								content: data.content || '',
								applyTime: data.timestamp,
								agreeTime: data.agreeTime
							})
						} else if (data.action == 2) {
							await this.$store.dispatch('Chat/killThread', {
								groupId: data.groupId
							})
							// 删除好友同步
							await this.$store.dispatch('MyFriend/delete_info', { userId: data.userId })
							await this.$store.dispatch('NewFriend/set_list')
						} else if (data.action == 4) {
							// 修改好友备注同步
							await this.$store.dispatch('MyFriend/update_info', {
								userId: data.userId,
								label: data.content
							})
						} else {
							console.log('接收到添加好友未约定的行为：', data.action)
						}
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			userInfoChange(data) {
				return new Promise(async(resolve, reject) => {
					try {
						// 会推给所有企业，所以userId的值不会拼接orangeId
						data.userId	+= this.$store.state.User.accountInfo.organId

						// 如果不存在用户,不做任何处理
						let existUser = true
						existUser = this.$store.getters[
							'User/userInfo'
						](data.userId).userId !== undefined

						if (!existUser) {
							const res = await this.$utils.api.user.pullUserInfo({ userIds: data.userId }).get()
							if (res.code == 0 && res.data.length > 0) {
								existUser = true
							} else {
								return resolve()
							}
						}

						// 用户信息变更（头像、昵称）----只修改一方时，另一方数据接口返回为空
						if ( //	会推送给所有登录企业的用户
							data.userId == this.$store.state.User.accountInfo.userId &&
							data.clientType == this.$WEB_CONFIG.client_type	&&
							this.$store.state.User.accountInfo.organId ==	data.organId
						) { return resolve() } //  过滤当前用户自己操作自己当前端接收推送再次处理

						for (var key in data) {
							if (!data[key] || key == 'organId') delete data[key]
						}
						await this.$store.dispatch('User/update_info', data)
						if (data.userId == this.$store.state.User.accountInfo.userId) {
							delete data.firstLetter
							await this.$store.dispatch(
								'User/set_accountInfo',
								Object.assign({}, this.account, data)
							)
						}
						this.$store.dispatch('Chat/preUpdateThread', { userId: `${data.userId}` })
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			settingsChange(data) {
				return new Promise(async(resolve, reject) => {
					try {
						// 群组、好友设置同步(部分群设置依旧走群成员变更的推送)---action: 0-群设置同步 1-好友设置同步
						const { action, ...settings } = data
						Reflect.deleteProperty(settings, 'timestamp')
						// action	== 2会推给所有企业，所以userId的值不会拼接orangeId
						if (action == 2) data.userId += this.$store.state.User.accountInfo.organId

						// if (
						// 	data.userId == this.$store.state.User.accountInfo.userId &&
						// 	data.clientType == this.$WEB_CONFIG.client_type
						// ) { return resolve() } //  过滤当前用户自己操作自己当前端接收推送再次处理

						if (action == 0) {
							await this.$store.dispatch('MyGrounp/update_info', settings)
							this.$store.dispatch('Chat/preUpdateThread', { threadID: data.groupId })
						} else if (data.action == 1) {
							await this.$store.dispatch('MyFriend/update_info', settings)
							this.$store.dispatch('Chat/preUpdateThread', { userId: data.userId })
						} else if (data.action == 2) {
							if (data.userMobile) {
								if (data.userId === this.$store.state.User.accountInfo.userId) {
									await this.$store.dispatch('User/set_accountInfo', { userMobile: data.userMobile, areaCode: data.areaCode })
								}
								await this.$store.dispatch('User/update_info', {
									userId: data.userId,
									userMobile: data.userMobile,
									areaCode: data.areaCode
								})
							}
							if (data.userEmail) {
								if (data.userId === this.$store.state.User.accountInfo.userId) {
									await this.$store.dispatch('User/set_accountInfo', { userEmail: data.userEmail })
								}
								await this.$store.dispatch('User/update_info', {
									userId: data.userId,
									userEmail: data.userEmail
								})
							}
						}
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			onlineStateChange(data) {
				return new Promise(async(resolve, reject) => {
					try {
						// ---action: 0-下线 1-上线
						await this.$store.dispatch('User/update_info', {
							userId: data.userId,
							onlineState: data.action,
							onlineTime: data.timestamp
						})
					} catch (e) { console.log(e) }
				})
			},

			friendGroupChange(data) {
				return new Promise(async(resolve, reject) => {
					try {
						// action: 1-保存 2-删除 3-好友移入
						if (data.clientType == this.$WEB_CONFIG.client_type) return resolve()
						if (data.action == 1) {
							await this.$store.dispatch('MyFriend/update_friendGroupInfo', {
								friendGroupId: data.friendGroupId,
								friendGroupName: data.friendGroupName
							})
						} else if (data.action == 2) {
							await this.$store.dispatch('MyFriend/delete_friendGroupInfo', {
								friendGroupId: data.friendGroupId
							})
							// 更新所有关系用户列表：接口未提供根据friendGroupId获取分组下的所有人信息接口；前端更新friendGroupId=0为我的好友不保险；获取所有好友列表接口附带了群组列表查询较慢
							const firstGroupFriend = this.$store.state.MyFriend.list.find(item => {
								return data.friendGroupId == item.friendGroupId
							})
							if (firstGroupFriend) await this.$store.dispatch('MyFriend/update_info')
						} else if (data.action == 3) {
							await this.$store.dispatch('MyFriend/update_info', {
								userId: data.userId,
								friendGroupId: data.friendGroupId
							})
						}
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			deleteAccount(data, cForm) {
				return new Promise(async(resolve, reject) => {
					try {
						// 如果不存在该用户,不进行处理
						if (data.userId && !this.$store.getters['User/userInfo'](data.userId).userId) return resolve()
						// 如果是当前设备销号的推送，不进行处理
						if (data.userId && data.clientType == this.$WEB_CONFIG.client_type && this.$store.state.User.accountInfo.organId == data.organId) return resolve()

						const isQuit = cForm == 80 || (cForm == 65 && data.clientType == 60)// 移出企业
						const isKill = cForm == 65 && data.clientType != 60// 注销
						// 中断下载任务
						this.$store.dispatch('Chat/abortDownload', { senderId: data.userId })
						// 关闭播放页面
						this.$utils.fun.closePlayerWin({
							senderId: data.userId,
							deleteType: 'destroyUserId'
						})

						if (data.userId == this.$store.state.User.accountInfo.userId) {
							await this.$utils.chatSdk.cGetDoneAsync()
							await this.$utils.fun.deleteAccount(isKill ? 'kill' : 'quit')
							this.$store.commit('User/UPDATE_ACCOUNTINFO', { token: '', p: '' })
							this.$store.commit('Chat/switchThread', '') // 清空vuex里的currentThreadID
							if (isKill) {
								this.$store.commit('Setting/UPDATE_SYSCONFIG', { autoLogin: false, loginName: '' })
								this.$store.commit('setOrganizationPage', '')
								setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
							} else if (isQuit) {
								this.$store.commit('Setting/UPDATE_SYSCONFIG', { autoLogin: false })
								this.$store.dispatch('Setting/set_showModal', 'kickOut')
							}
							return resolve('dying')
						} else {
							if (isKill) {
								await this.$store.dispatch('Chat/killAccount', data)
								await this.$store.dispatch('Chat/deletCollect', { clearall: data })
							} else if (isQuit) {
								await this.$store.dispatch('Chat/removeAccount', data)
							}

							data.ownGroupId.split('|').forEach(async item => {
								if (isKill) {
									await this.$store.dispatch('MyGrounp/delete_info', { groupId: item })
								}
								await this.$store.dispatch('MyGrounp/delete_userRelation', {
									groupId: item
								})
							})
							data.joinGroupId.split('|').forEach(async item => {
								const groupInfo	= this.$store.getters['MyGrounp/groupInfo'](item)
								if (groupInfo && groupInfo.groupId) {
									await this.$store.dispatch('MyGrounp/update_info', {
										groupId: item,
										reload: true
									})
									await this.$store.dispatch('MyGrounp/update_userRelation', {
										groupId: item
									})

									this.$store.dispatch('Chat/preUpdateThread', { threadID: groupInfo.groupId })
								}
							})
							await this.$store.dispatch('MyFriend/delete_info', { userId: data.userId })
							await this.$store.dispatch('NewFriend/delete_info', {
								fromUserId: data.userId
							})
							await this.$store.dispatch('User/delete_info', { userId: data.userId })
							this.$store.dispatch('Chat/preUpdateThread', { userId: data.userId })
						}
					} catch (e) { console.log(e) }
					resolve()
				})
			},

			keyChange(data) {
				return new Promise(async(resolve, reject) => {
					try {
						if (data.action == 0) {
							// 0-公钥更换(所有人)
							await this.$store.dispatch('User/update_info', {
								userId: data.userId,
								pubKeyAddress: data.pubKeyAddress
							})
						} else if (
							data.action == 1 &&
							data.clientType != this.$WEB_CONFIG.client_type
						) {
							//  1-密钥更新(本人)
							await this.$store.dispatch('User/update_info', {
								userId: data.userId,
								pubKeyAddress: data.pubKeyAddress
							})
							await this.$store.dispatch(
								'User/set_accountInfo',
								Object.assign({}, this.$store.state.User.accountInfo, { secretKey: data.secretKey })
							)
							const res = await this.$utils.api.thirdpart.queryAddress().get()
							if (!res.data) return resolve()
							this.$utils.chatSdk.initChat(
								data.secretKey,
								res.data.address,
								res.data.public
							)
							resolve()
						}
					} catch (e) { console.log(e) }
					resolve()
				})
			}
		}
	}
</script>
