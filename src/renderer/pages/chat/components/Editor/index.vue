<template>
	<div id="input" :class="{hide,banned:bannedTime!==''}">
		<!-- 回复对象 -->
		<div class="reply-info" v-if="replyTarget.id">
			<span class="iconfont iconguanbi-1" @click="$emit('init-reply-target', {})"></span>
			<div class="reply-sender">
				{{replyTarget.senderName}}
			</div>
			<div class="reply-content" v-show="![$CHAT_MSG_TYPE.TYPE_IMAGE,$CHAT_MSG_TYPE.TYPE_EMOJI].includes(replyTarget.cForm)" ref="replyContent"></div>
			<div class="reply-img" v-if="replyTarget.cForm==$CHAT_MSG_TYPE.TYPE_IMAGE">
				<img :style="`width:${replyTarget.imgWidth||300}px;height:${replyTarget.imgHeight||300}px;`" :src="`file://${replyTarget.localPath}`">
			</div>
			<div class="reply-img" v-if="replyTarget.cForm==$CHAT_MSG_TYPE.TYPE_EMOJI">
				<img style="max-width:110px;max-height:110px;" :src="`file://${replyTarget.localPath}`">
			</div>
		</div>

		<!-- 表情 -->
		<emoticons @select="_inputEmoticon" @send="sendEmoji" v-show="showEmoticons" v-clickoutside.stop="_hideEmoticons"></emoticons>

		<!-- 工具栏 -->
		<div class="toolbar">
			<!--表情-->
			<a-tooltip placement="top" :title="$t('common.emoji')">
				<div
					class="iconfont iconbiaoqing"
					@click.stop="_chooseEmoticon"
				></div>
			</a-tooltip>

			<!--截图-->
			<a-dropdown placement="topLeft" :trigger="['click']">
				<a-tooltip placement="top" :title="$t('common.screenshot[0]')">
					<div class="iconfont iconjiandao"></div>
				</a-tooltip>
				<a-menu slot="overlay">
					<a-menu-item>
						<a href="javascript:;" @click="screenshotfun">{{$t('common.screenshot[0]')}}({{screenshot}})</a>
					</a-menu-item>
					<a-menu-item>
						<a href="javascript:;" @click="hideWinScreenshot">{{$t('common.screenshot[1]', { projectName: $PROJECT_NAME })}}</a>
					</a-menu-item>
				</a-menu>
			</a-dropdown>
			<!--文件-->
			<a-tooltip placement="top" :title="$t('common.sendFiles')">
				<div class="iconfont iconfasongwenjian1" @click="$refs.fileSelect.click()"></div>
			</a-tooltip>
			<input
				type="file"
				@change="fileSelectChange"
				v-if="hackFile"
				style="display:none"
				multiple
				ref="fileSelect"
			/>

			<slot name="tools"></slot>
			<!-- <a-tooltip placement="top" title="抖一抖" v-show="thread.type === 0">
        <div class="iconfont icondouyidou" @click="_ditherWin"></div>
      </a-tooltip>-->
		</div>

		<!-- 输入框 -->
		<div ref="textArea" class="editor" @contextmenu="_contextmenu">
			<a-dropdown
				:getPopupContainer="()=>$refs.textArea"
				overlayClassName="contextmenu"
				@visibleChange="_initContextmenu"
				:trigger="['contextmenu']"
				:visible="showContextMenu"
			>
				<div ref="editor" style="text-align:left;height:100%;" v-show="bannedTime==''"></div>
				<!-- 右键菜单 -->
				<a-menu slot="overlay" v-clickoutside="_hideContextMenu">
					<a-menu-item v-show="contextmenuItems.copy" @click="_copy">
						{{$t('common.copy')}}
					</a-menu-item>
					<a-menu-item @click="_paste">
						{{$t('common.paste')}}
					</a-menu-item>
				</a-menu>
			</a-dropdown>
			<!-- 禁言遮罩 -->
			<div class="tip" v-show="bannedTime!==''">
				<i class="iconfont iconjinzhi"></i>{{$t('chat.muttering')}}
				<!-- {{bannedTime=='ever'?'禁言中':`约${leftTimeCn}后解除禁言`}} -->
			</div>
		</div>

		<!-- 发送按钮 -->
		<div class="send">
			<span
				class="input-tip"
			>
				{{$utils.os.isMac ? $t('chat.sendTip[0]', { send: 'Return', newLine: 'Control+Return' }) : $t('chat.sendTip[0]', { send: 'Enter', newLine: 'Ctrl+Enter' })}}
			</span>

			<a-tooltip placement="topRight" :visible="noInput">
				<template slot="title">
					<span>{{$t('chat.sendTip[1]')}}</span>
				</template>
				<a-button class="send-btn" @click="_done">
					{{$t('common.send')}}
				</a-button>
			</a-tooltip>
		</div>

		<!-- 群成员列表 -->
		<div class="groupUsers"
			ref="groupUserList"
			v-show="thread.type==1&&ating&&coords.x&&groupUsers.length>0"
			:style="`bottom:${realCoords.y}px;left:${realCoords.x}px;`"
			v-clickoutside="_stopAt"
		>
			<div v-show="!searchResult" @click.stop="_at()" :class="{active:!searchResult&&atIndex==-1}">
				<span>@</span>
				<p>{{$t('chat.aite[0]')}}</p>
			</div>

			<div :class="{active:atIndex===index}" v-for="(user,index) in groupUsers" :key="`u${user.userId}`" @click.stop="_at(user)">
				<div v-show="thread.isAnoymous==1&&user.anonym" class="avatar" :style="`background:${$utils.message.getAvatarBgColor(user.anonym)}`">
					{{$utils.message.getAvatarText(user.anonym)}}
				</div>

				<!--头像-->
				<img
					v-show="thread.isAnoymous==0"
					class="avatar"
					:src="user.userAvatar || ''"
					@error="e => $utils.setDefaultAvatar(e, 0)"
				/>

				<p>{{thread.isAnoymous==1?user.anonym:(user.label||user.userLabel||user.nickName)}}</p>
			</div>
		</div>

		<!-- 选择文件弹窗 -->
		<a-modal :title="$t('common.prompt')" :closable="false" :after-close="closeSelectTip" centered class="notification-IM" :z-index="10000" :visible="selectTipVisible" :width="438">
			<p>{{$t('common.maxToSend', { number: 9 })}}</p>
			<template #footer>
				<a-button type="primary" @click="confirmSelectTip">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="selectTipVisible = false">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!-- 发送文件弹窗 -->
		<a-modal :title="$t('chat.sendFileTip[0]')" :closable="false" :after-close="() => {sizeTipMessage = []}" centered class="notification-IM" :z-index="10000" :visible="sizeTipVisible" :width="488">
			<div v-if="sizeTipMessage.length" :style="{'padding-bottom': dirTipMessage.length ? '20px' : '0'}">
				<div style="font-size: 16px;">
					{{$t('chat.sendFileTip[2]', { size: clientFileMaxSize })}}
				</div>
				<p v-for="(item, index) in sizeTipMessage" :key="index">
					{{index + 1}}、{{item.name}} - <span style="color: #8098F8">{{item.size}}</span>
				</p>
			</div>
			<!--<div v-if="dirTipMessage.length">
				<div style="font-size: 16px;">
					无法发送文件夹
				</div>
				<p v-for="(item, index) in dirTipMessage" :key="index">
					{{index + 1}}、{{item.name}}
				</p>
			</div>-->
			<template #footer>
				<a-button type="primary" @click="sizeTipVisible = false">
					{{$t('common.okBtn')}}
				</a-button>
			</template>
		</a-modal>
	</div>
</template>

<script>
	import Editor from './wangeditor'
	import Emoticons from './Emoticons/index'
	import { clipboard, ipcRenderer } from 'electron'

	let editor
	export default {
		name: 'Editor',
		components: { Emoticons },
		props: {
			thread: Object,
			groupMembers: Array,
			replyTarget: Object,
			editData: Object,
			bannedTime: {
				type: String,
				default: ''
			},
			hide: {
				type: Boolean,
				default: false
			},
			setupOpened: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				writing: false,
				dirTipMessage: [],
				sizeTipVisible: false,
				selectTipVisible: false,
				showPlaceHolder: true,
				imgs: [],
				hackFile: true,
				rangeClone: null,
				showEmoticons: false,
				screenshot: this.$utils.os.isMac ? 'Shift+Control+A' : 'Shift+Ctrl+A',

				ating: false,
				atingID: '',
				atUsers: [],
				coords: {},
				atIndex: -1,
				searchResult: null,
				selectingUser: false,

				replyContent: '',

				showContextMenu: false,
				contextmenuItems: {
					paste: true,
					copy: false
				},
				isSendDither: false,
				editor: null,
				selectFilesArray: [],
				sizeTipMessage: [],
				noInput: false,
				countDownID: '',
				leftTime: 0,
				leftTimeCn: ''
			}
		},
		computed: {
			groupUsers() {
				if (this.searchResult) {
					this.atIndex = 0
					return this.searchResult
				} else {
					this.atIndex = -1
					return this.groupMembers.filter(user => {
						return user.userId != this.$store.state.User.accountInfo.userId
					})
				}
			},
			realCoords() {
				const x = this.coords.x
				const y = window.innerHeight - this.coords.y
				const maxX = window.innerWidth - 200

				return { x: x > maxX ? maxX : x, y }
			},
			clientFileMaxSize() {
				return parseInt(this.$store.state.Setting.paramsConfig && this.$store.state.Setting.paramsConfig.clientFileMaxSize) || 20
			}
		},
		beforeDestroy() {
			if (this.countDownID) {
				clearInterval(this.countDownID)
			}
			ipcRenderer.removeAllListeners('complateScreenshot')
		},
		mounted() {
			editor = new Editor(this.$refs.editor)
			editor.customConfig.onchangeTimeout = 16
			editor.customConfig.onchange = window._.debounce(html => {
				if (this.rangeClone) {
					this.rangeClone = null
				}
				// 保存草稿
				if (html == '<p></p>' || html == '<p><br></p>') {
					this.$store.dispatch('Chat/updateThread', {
						threadID: this.thread.id,
						updatingData: {
							draft: {}
						}
					})
				} else {
					this._save()
				}

				/**
				 * @开启时的相关处理
				 */
				if (this.ating) {
					// 根据用户输入进行模糊查询
					const atingDom = document.getElementById(this.atingID)
					if (atingDom) {
						const wordsArr = atingDom.innerText.split('@')
						const keywords = wordsArr[wordsArr.length - 1]

						if (keywords && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(keywords)) {
							const reg = new RegExp(keywords.toLowerCase())
							const myID = this.$store.state.User.accountInfo.userId
							const isAnoymous = this.thread.isAnoymous == 1

							let name
							const result = this.groupMembers.filter(user => {
								name = isAnoymous ? user.anonym : (user.label || user.userLabel || user.nickName)
								return user.userId != myID && reg.test((name || '').toLowerCase())
							})
							if (result.length > 0 && this.atIndex > 0) {
								this.atIndex = 0
							}
							this.searchResult = result
						} else if (keywords) {
							this.searchResult = []
						} else {
							this.searchResult = null
						}
					}
				}
			}, 100)

			editor.create()

			this.$nextTick(() => {
				this.editor = editor.$textElem[0]
				this.editor.addEventListener('keydown', window._.throttle(this.selectUser, 60))
				this.editor.addEventListener('keydown', this.editorKeyEvent)
				// 中文输入法会导致keyup失效，输入内容无法通过keydown屏蔽，改为监听beforeinput
				this.editor.addEventListener('beforeinput', this.beforeInput)

				// 输入法开启
				this.editor.addEventListener('compositionstart', () => {
					this.writing = true
				})
				// 输入法关闭
				this.editor.addEventListener('compositionend', () => {
					this.writing = false
				})

				this.editor.addEventListener('blur', (e) => {
					this._saveRange()
				})

				// this.editor.addEventListener('focus', () => {
				// 	if (this.rangeClone) {
				// 		const sel = window.getSelection()
				// 		const range = sel.getRangeAt(0)
				// 		range.setStart(this.rangeClone.startContainer, this.rangeClone.startOffset)
				// 	}
				// })

				if (this.editor.scrollHeight > 110) {
					this.editor.scrollTop = this.editor.scrollHeight
				}

				// 草稿
				const draft = this.thread.draft
				if (draft) {
					this.imgs = draft.imgs || []
					this.atUsers = draft.atUsers || []
					editor.txt.html(draft.html || draft.text)
					editor.change()
				}
			})

			ipcRenderer.on('complateScreenshot', this._pasteImg)
		},

		watch: {
			setupOpened(val) { // 关闭设置界面要重新聚焦输入框
				if (!val) {
					this.editor.focus()
					if (this.rangeClone) {
						const sel = window.getSelection()
						const range = sel.getRangeAt(0)
						range.setStart(this.rangeClone.startContainer, this.rangeClone.startOffset)
					}
				}
			},
			'thread.id'() {
				this.init()
			},
			bannedTime: {
				handler(val, oval) {
					if (this.countDownID) return
					if (val > 0 && val !== 'ever') {
						this.leftTime = Math.ceil(val / 1000)
						// this.leftTimeCn = this.$utils.time.getLeftBanTime(this.leftTime)
						console.log('剩余禁言时间', val, this.leftTime)
						this.countDownID = setInterval(() => {
							if (this.leftTime > 0) {
								this.leftTime -= 1
								if (this.leftTime % 60 == 0) {
									this.leftTimeCn = this.$utils.time.getLeftBanTime(this.leftTime)
								}
							} else {
								clearInterval(this.countDownID)
								this.$nextTick(() => {
									this.updateBanStatus().then(res => {
										if (!res) {
											this.countDownID = setInterval(() => {
												this.updateBanStatus()
											}, 5000)
										}
									})
								})
							}
							if (this.leftTime <= 60) {
								console.log('禁言倒计时:', this.leftTime)
							}
						}, 1000)
					} else if (val == 'banned') {
						this.updateBanStatus().then(res => {
							if (!res) {
								this.countDownID = setInterval(() => {
									this.updateBanStatus()
								}, 5000)
							}
						})
					}
				},
				immediate: true
			},
			'editData.id'(val) {
				if (val) {
					let html = this.editData.html
					let atUsers = this.editData.atUsers ? this.editData.atUsers.split('|') : []
					if (atUsers.length > 0) {
						atUsers = atUsers.map(id => {
							return `${id}@${this.$utils.fun.getServerTime('editData.id')}`
						})
					}

					if (atUsers.length > 0) {
						const atArr = html.match(/@[A-Za-z0-9\u4e00-\u9fa5]{1,16}/g)

						// 结果去重
						const newAtArr = []
						const obj = {}

						for (const i of atArr) {
							if (!obj[i]) {
								newAtArr.push(i)
								obj[i] = 1
							}
						}

						newAtArr.forEach((text, index) => {
							const reg = new RegExp(`${text}\s?`, 'g')
							html = html.replace(reg, `<span data-fromaa="true" id="${atUsers[index]}" class="at" contenteditable="false">${text} </span>`)
						})
					}

					const currentHTML = editor.txt.html()
					if (currentHTML === '<p><br></p>' || (/<br><\/p>/.test(currentHTML) && !/<br><br><\/p>/.test(currentHTML))) {
						editor.txt.html(editor.txt.html().replace('<br></p>', `${html.trim()}</p>`))
					} else {
						editor.txt.html(editor.txt.html().replace('</p>', `${html.trim()}</p>`))
					}

					const newAtUsers = [...this.atUsers, ...atUsers]
					this.atUsers = [...new Set(newAtUsers)]

					this._save()

					// 重置重新编辑数据
					this.$emit('init-reedit-data')
				}
			},
			'replyTarget.id'(val, oVal) {
				if (val) {
					this.editor.focus()
					this.$nextTick(() => {
						if (this.replyTarget.text) {
							this.$refs.replyContent.innerHTML = ''
							let text = this.replyTarget.text
							if (this.replyTarget.mType === 'link') text = `[${this.$t('common.link')}]${this.replyTarget.data.webTitle || this.replyTarget.text}`
							text = text.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
							text = this._restoreEmoji(text)
							this.$refs.replyContent.appendChild(this._buildDom(text))
						}

						const atUser = this.groupMembers.find(member => {
							return member.userId != this.$store.state.User.accountInfo.userId && member.userId == this.replyTarget.senderID
						})

						if (this.thread.type == 1 && atUser && this.atUsers.indexOf(atUser.userId) < 0) {
							this._at(atUser, 'reply')
						} else {
							this._save()
						}
					})
				}
			}
		},

		methods: {
			init() {
				if (this.countDownID) {
					clearInterval(this.countDownID)
				}
				// 初始化相关字段
				window._.assign(this.$data, {
					writing: false,
					dirTipMessage: [],
					sizeTipVisible: false,
					selectTipVisible: false,
					showPlaceHolder: true,
					imgs: [],
					hackFile: true,
					rangeClone: null,
					showEmoticons: false,

					ating: false,
					atingID: '',
					atUsers: [],
					coords: {},
					atIndex: -1,
					searchResult: null,
					selectingUser: false,

					replyContent: '',

					showContextMenu: false,
					isSendDither: false,
					selectFilesArray: [],
					sizeTipMessage: [],
					noInput: false,
					countDownID: '',
					leftTime: 0,
					leftTimeCn: ''
				})
				editor.txt.clear()

				// 草稿
				if (this.thread && this.thread.draft) {
					const draft = this.thread.draft
					this.imgs = draft.imgs || []
					this.atUsers = draft.atUsers || []
					editor.txt.html(draft.html || draft.text)
					editor.change()
				}
			},
			updateBanStatus() {
				return new Promise((resolve, reject) => {
					console.log('获取禁言状态')
					this.$utils.api.user.checkMemberSpeechState({
						groupId: this.thread.id
					}).get().then(res => {
						console.log(res)
						if (res.code == 0 && res.data.allowedSpeech == 1) {
							console.log('已经解禁，不再继续')
							this.$store.dispatch('MyGrounp/update_userRelation', {
								groupId: this.thread.id,
								userId: this.$store.state.User.accountInfo.userId
							})
							this.$store.dispatch('Chat/preUpdateThread', { threadID: this.thread.id })
							clearInterval(this.countDownID)
							this.countDownID = ''
							resolve(true)
						} else {
							resolve(false)
							console.log('未解禁，5秒后再次获取')
						}
					}).catch(e => {
						if (e.code == 1) {
							// 被移除群聊
							resolve(true)
						} else {
							resolve(false)
						}
						console.log('获取禁言状态异常', e)
					})
				})
			},
			_restoreEmoji(text) {
				return this.$utils.message.replaceEmojiCodeIntoEmojiIcon(text)
			},

			_buildDom(text, hasBurntAfterReadIcon) {
				const frag = document.createDocumentFragment()
				const domContainer = document.createElement('div')
				const text_arr = text.split('【##HTML##】')
				text_arr.map(node => {
					if (/<img data-fromaa/.test(node)) {
						domContainer.innerHTML = node
						frag.appendChild(domContainer.children[0])
					} else if (node == '<br>') {
						frag.appendChild(document.createElement('br'))
					} else {
						frag.appendChild(document.createTextNode(node))
					}
				})

				if (hasBurntAfterReadIcon) {
					domContainer.innerHTML = '<i class="iconfont iconyuehoujifenkaiqi"></i>'
					frag.appendChild(domContainer.children[0])
				}

				return frag
			},

			handleDrop(param) {
				if (param.length) {
					const directory = []
					const files = []
					for (let i = 0; i < param.length; i++) {
						const fileInfo = this.$utils.fun.getLocalFIleInfo(param[i].path)
						if (fileInfo.isDirectory) {
							directory.push({
								name: fileInfo.fileName
							})
							continue
						}
						files.push(param[i])
					}
					this.dirTipMessage = directory
					// 为了和钉钉保持一致，当只有一个文件时，图片得插入编辑框
					if (files.length) {
						if (files.length === 1) {
							const fileInfo = this.$utils.fun.getLocalFIleInfo(files[0].path)
							if (fileInfo.fileSize / (1024 * 1024) > this.clientFileMaxSize || fileInfo.fileSize === 0) {
								this.sizeTipMessage = [{
									name: fileInfo.fileName,
									size: this.$root.$options.filters.formatBytes(fileInfo.fileSize)
								}]
								this.showTipSize()
								return
							}
							if (this.$WEB_CONFIG.supportImageType.indexOf(fileInfo.ext) > -1) { // 支持的图片格式
								this._pasteImg(param[0].path)
							} else { // 别的文件
								this.$emit('done', {
									files: [
										{
											ext: fileInfo.ext,
											path: fileInfo.path,
											fileName: fileInfo.fileName,
											fileSize: fileInfo.fileSize,
											fileFrom: '' // 文件来源，用于标识是路径还是base64，默认空是文件路径
										}
									]
								})
							}
						} else {
							this.fileSelectChange({
								target: {
									files
								}
							})
						}
					} else {
						if (this.dirTipMessage.length) {
							this.addSelectDirTip()
						}
						if (this.sizeTipMessage.length) {
							this.showTipSize()
						}
					}
				}
			},

			_ditherWin() {
				if (this.isSendDither) return
				this.$utils.api.user
					.trembleMessage()
					.get({ groupId: this.thread.groupId, action: 1 })
					.then(res => {
						// console.log(res)
					})
			},

			editorKeyEvent(e) {
				// console.log(e)

				// arrowLeft,arrowRight
				if ((e.keyCode == 37 || e.keyCode == 39) && this.ating && !this.writing) {
					e.preventDefault()
					return
				}

				// pgUp,pgDn
				if (e.keyCode == 33 || e.keyCode == 34) {
					e.preventDefault()
					return
				}

				// 禁用加粗，下划线，斜体快捷键
				if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyB' || e.code === 'KeyU' || e.code === 'KeyI')) {
					e.preventDefault()
					return
				}
				// 拷贝
				if (
					(e.metaKey && e.code === 'KeyC' && this.$utils.os.isMac) ||
					(e.ctrlKey && e.code === 'KeyC' && this.$utils.os.isWindows)
				) {
					const sel = window.getSelection()
					const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null

					// 判断光标是否在可编辑区域之内
					if (range && range.endContainer.parentElement.offsetParent.className === 'w-e-text-container') {
						// 如果有选中内容
						if (!range.collapsed) {
							e.preventDefault()
							this._copy(e)
						}
					}
					return
				}

				// 全选
				if (
					(e.metaKey && e.code === 'KeyA' && this.$utils.os.isMac) ||
					(e.ctrlKey && e.code === 'KeyA' && this.$utils.os.isWindows)
				) {
					if (this.rangeClone) {
						this.rangeClone = null
					}
					return
				}

				// 剪切
				if (
					(e.metaKey && e.code === 'KeyX' && this.$utils.os.isMac) ||
					(e.ctrlKey && e.code === 'KeyX' && this.$utils.os.isWindows)
				) {
					this._backspace(e, true)
					return
				}

				// 黏贴
				if (
					(e.metaKey && e.code === 'KeyV' && this.$utils.os.isMac) ||
					(e.ctrlKey && e.code === 'KeyV' && this.$utils.os.isWindows)
				) {
					e.preventDefault()
					this._paste(e, true)
					return
				}

				// 退格
				if (e.code === 'Backspace') {
					this._backspace(e)
					return
				}

				if ((e.ctrlKey && e.code === 'Enter') || (e.ctrlKey && e.code === 'NumpadEnter')) {
					e.preventDefault()
					this._insertNode(document.createElement('br'))
					return
				}

				if ((e.shiftKey && e.code === 'Enter') || (e.shiftKey && e.code === 'NumpadEnter')) {
					e.preventDefault()
					this._insertNode(document.createElement('br'))
					return
				}

				if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !this.writing) {
					e.preventDefault()
					if (this.ating && this.thread.type == 1 && this.groupUsers.length > 0) {
						let atUser
						if (this.atIndex >= 0) {
							atUser = Object.assign({}, this.groupUsers[this.atIndex])
						} else {
							atUser = ''
						}
						this._at(atUser)
						this._stopAt()
					} else if (e.which === 13) {
						this._done(e)
					}
					return
				}
			},

			beforeInput(e) {
				if (e.data == '@') {
					e.preventDefault()

					const atingID = `${Date.now()}`
					const container = document.createElement('div')
					container.innerHTML = `<span data-fromaa="true" id="${atingID}" class="at">@</span>`
					this._insertNode(container.children[0])
					this.atingID = atingID
					this.ating = true

					this.$nextTick(() => {
						this.coords = this._getSelectionCoords()
					})
					return false
				}
			},

			selectUser(e) {
				if ((e.code === 'ArrowUp' || e.code === 'ArrowDown') && this.ating && !this.writing) {
					e.preventDefault()

					if (this.selectingUser) return
					this.selectingUser = true

					const diff = e.code === 'ArrowUp' ? -1 : 1
					const newIndex = this.atIndex + diff
					const curUserCount = this.groupUsers.length - 1

					if (newIndex >= 0 && newIndex <= curUserCount) {
						this.atIndex = newIndex
						const scrollTop = this.$refs.groupUserList.scrollTop
						const offsetHeight = this.$refs.groupUserList.offsetHeight - 44
						const newOffsetHeight = (this.searchResult ? (newIndex + 2) : (newIndex + 1)) * 44
						const heightDiff = newOffsetHeight - scrollTop

						if ((heightDiff > offsetHeight && diff > 0) || (heightDiff <= -44 && diff < 0)) {
							this.$refs.groupUserList.scrollTop += 44 * diff
						}
					} else if (newIndex > curUserCount) {
						this.atIndex = this.searchResult ? 0 : -1
						this.$refs.groupUserList.scrollTop = 0
					} else if (newIndex < 0) {
						if (this.searchResult) {
							this.atIndex = curUserCount
							this.$refs.groupUserList.scrollTop = this.$refs.groupUserList.scrollHeight
						} else if (newIndex < -1) {
							this.atIndex = curUserCount
							this.$refs.groupUserList.scrollTop = this.$refs.groupUserList.scrollHeight
						} else {
							this.atIndex = newIndex
							this.$refs.groupUserList.scrollTop += 44 * diff
						}
					}

					this.$nextTick(() => {
						this.selectingUser = false
					})

					return
				}
			},

			screenshotfun() {
				this.$nextTick(() => {
					this.$utils.screenShot(1)
				})
			},
			hideWinScreenshot() {
				this.$utils.screenShot(2)
			},
			_contextmenu(e) {
				e.preventDefault()
				this.showContextMenu = true
			},
			_hideContextMenu() {
				this.showContextMenu = false
			},
			_saveRange() {
				const sel = window.getSelection()
				const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
				this.rangeClone = range ? range.cloneRange() : null
			},
			_chooseEmoticon() {
				this.showEmoticons = true
			},
			sendEmoji(id) {
				this.$emit('done', {
					emoji: id
				})
			},
			_inputEmoticon(e) {
				this._hideEmoticons()
				const container = document.createElement('div')
				container.innerHTML = e.html
				this._insertNode(container.childNodes[0])
			},
			_hideEmoticons() {
				this.showEmoticons = false
			},
			closeSelectTip() {
				this.freshFileInput()
			},
			confirmSelectTip() {
				this.selectTipVisible = false
				this._handleSendFile()
			},
			showTipSelect() {
				this.selectTipVisible = true
			},
			showTipSize() {
				this.sizeTipVisible = true
			},
			fileSelectChange(e) {
				this.selectFilesArray = e.target.files
				if (e.target.files.length > 9) {
					this.showTipSelect()
				} else {
					this._handleSendFile()
				}
			},
			async _handleSendFile() {
				const selectFilesArray = this.selectFilesArray
				const files = []
				const errorFiles = []
				let fileName = ''
				let fileType = ''
				let fileExt = '' // 文件后缀
				let fileSize = 0
				for (let i = 0; i < selectFilesArray.length && i < 9; i++) {
					if (selectFilesArray[i].size / (1024 * 1024) > this.clientFileMaxSize || selectFilesArray[i].size === 0) {
						errorFiles.push({
							name: selectFilesArray[i].name,
							size: this.$root.$options.filters.formatBytes(selectFilesArray[i].size)
						})
						continue
					}
					fileName = selectFilesArray[i].name
					fileType = selectFilesArray[i].type
					fileSize = selectFilesArray[i].size
					if (/image\/(png|gif|bmp|jpg|jpeg)/i.test(fileType)) {
						fileExt = fileType.split('/')[1]
					} else {
						fileExt = fileName
							.split('.')
							.reverse()[0]
							.toLowerCase()
					}

					files.push({
						ext: fileExt,
						path: selectFilesArray[i].path,
						fileName,
						fileSize,
						fileFrom: '' // 文件来源，用于标识是路径还是base64，默认空是文件路径
					})
				}
				this.sizeTipMessage = errorFiles
				if (this.dirTipMessage.length) {
					this.addSelectDirTip()
				}
				if (this.sizeTipMessage.length) {
					this.showTipSize()
				}

				this.freshFileInput()
				if (!files.length) return
				this.$emit('done', {
					files
				})
			},
			freshFileInput() { // 刷新文件域
				this.hackFile = false
				this.$nextTick(() => {
					this.hackFile = true
				})
			},

			async _save() {
				if (this.thread.type == 10001 || (this.thread.draft && this.thread.draft.html == editor.txt.html())) return
				const nodes = editor.txt.getJSON()[0].children

				if (!nodes) return

				const nodesLen = nodes.length
				const lastNode = nodes[ nodesLen - 1]
				const nextToLastNode = nodes[nodesLen - 2]

				if (lastNode && nextToLastNode && lastNode.tag === 'br' && nextToLastNode.tag !== 'br') {
					nodes.pop(lastNode)
				}

				let text = ''
				nodes.forEach(node => {
					if (node.tag === 'img') {
						const emoji = node.attrs.find(attr => {
							return attr.name === 'code'
						})
						if (emoji) {
							text += `[${emoji.value}]`
						} else {
							text += `[${this.$t('common.image')}]`
						}
					} else if (node.tag === 'br') {
						text += '\r\n'
					} else if (node.tag === 'span') {
						text += node.children[0]
					} else if (node.tag === 'meta') { // 在mac下复制表情，会多一个<meta charset='utf-8'>标签，如果不去掉，发消息会有[object object]，2.1.0添加，wuxl
					} else {
						text += node
					}
				})

				let draft = {}

				if (!/^[\s|\r|\n]*$/.test(text)) {
					let atUsers = []
					let userId = ''
					this.atUsers.forEach(atUser => {
						userId = atUser.split('@')[0]
						if (atUsers.indexOf(userId) < 0) {
							if (userId !== '0') {
								atUsers.push(userId)
							} else {
								atUsers = ['0']
							}
						}
					})

					draft = {
						text,
						html: editor.txt.html(),
						imgs: JSON.parse(JSON.stringify(this.imgs)),
						atUsers: JSON.parse(JSON.stringify(this.atUsers)),
						updateTime: this.$utils.fun.getServerTime('_save')
					}
				}

				this.$store.dispatch('Chat/updateThread', {
					threadID: this.thread.id,
					updatingData: { draft }
				})
			},

			writeFile(data) {
				const savePath = this.$utils.fun.getGlobalByName('userDataPath').otherFilesPath
				const filePath = `${savePath}/long_text_${window.$moment(new Date()).format('YYYY-MM-DD-HH-mm-ss')}.txt`
				const err = this.$utils.fun.writeFile(filePath, data)
				if (err) {
					console.log(err)
					return null
				} else {
					return this.$utils.fun.getLocalFIleInfo(decodeURIComponent(filePath))
				}
			},

			_done(e) {
				editor.txt.html(editor.txt.html().replace(/\u200B/g, ''))// 清除不可见字符
				const nodes = editor.txt.getJSON()[0].children
				if (!nodes) return

				const nodesLen = nodes.length
				const lastNode = nodes[nodesLen - 1]
				const nextToLastNode = nodes[nodesLen - 2]

				if (lastNode && nextToLastNode && lastNode.tag === 'br' && nextToLastNode.tag !== 'br') {
					nodes.pop(lastNode)
				}

				let text = ''
				nodes.forEach(node => {
					if (node.tag === 'img') {
						const emoji = node.attrs.find(attr => {
							return attr.name === 'code'
						})
						if (emoji) {
							text += `[${emoji.value}]`
						} else { // 处理别的途径加入的图片，比如windows下的搜狗输入法加入的表情是以图片形式插入的
							const localPath = node.attrs.find(attr => {
								return attr.name === 'src'
							})
							const id = node.attrs.find(attr => {
								return attr.name === 'id'
							})
							if (!id) {
								this.imgs.push({
									id: `img_${this.$utils.fun.getServerTime('_done')}`,
									detail: {
										path: localPath.value.replace(/^file\:\/\/\//i, ''),
										ext: this.$utils.fun.getFileExtByPath(localPath.value)
									}
								})
							}
						}
					} else if (node.tag === 'br') {
						text += '\r\n'
					} else if (node.tag === 'span') {
						text += node.children[0] || ''
					} else if (node.tag === 'meta') { // 在mac下复制表情，会多一个<meta charset='utf-8'>标签，如果不去掉，发消息会有[object object]，2.1.0添加，wuxl
					} else {
						text += node
					}
				})

				if (/^[\s|\r|\n]*$/.test(text) && this.imgs.length === 0) { // 没有输入内容
					if (!this.noInput) {
						this.noInput = true
						setTimeout(() => {
							this.noInput = false
						}, 2000)
					}
					return
				} else if (this.imgs.length > 0 && /^[\s|\r|\n]*$/.test(text)) { // 输入内容仅有图片
					text = ''
				}

				// 清除草稿
				this.$store.dispatch('Chat/updateThread', {
					threadID: this.thread.id,
					updatingData: {
						draft: {}
					}
				})

				const files = this.imgs.map(img => {
					return img.detail
				})

				let atUsers = []
				let userId = ''
				let replyTarget
				let replyTargetData

				text = text.trim()
				if (text.length > 2000) {
					replyTarget = null
					const fileInfo = this.writeFile(text)
					if (fileInfo) {
						files.unshift({
							ext: fileInfo.ext,
							path: fileInfo.path,
							fileName: fileInfo.fileName,
							fileSize: fileInfo.fileSize,
							fileFrom: '' // 文件来源，用于标识是路径还是base64，默认空是文件路径
						})
						text = ''
					} else {
						return
					}
				} else {
					replyTarget = this.replyTarget
					replyTargetData = replyTarget.data || {}
					this.atUsers.forEach(atUser => {
						userId = atUser.split('@')[0]
						if (atUsers.indexOf('0') < 0 && atUsers.indexOf(userId) < 0) {
							if (userId !== '0') {
								atUsers.push(userId)
							} else {
								atUsers = ['0']
							}
						}
					})
				}
				this.$emit('done', {
					text,
					files,
					atUsers: atUsers.join('|'),
					replyInfo: replyTarget && replyTarget.id ? {
						duration: replyTarget.duration || 0,
						width: replyTarget.width || 0,
						height: replyTarget.height || 0,
						fileName: replyTarget.newFileName || replyTarget.fileName || '',
						fileSize: replyTarget.fileSize || 0,
						fileType: replyTarget.ext || '',
						content: replyTarget.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI ? replyTarget.url : replyTarget.text,
						msgTime: replyTarget.timestamp,
						id: replyTarget.id,
						mType: replyTarget.mType,
						webTitle: replyTargetData.webTitle,
						webDescription: replyTargetData.webDescription,
						shareLink: replyTargetData.shareLink,
						form: replyTarget.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY ? this.$CHAT_MSG_TYPE.TYPE_TEXT : replyTarget.cForm,
						nickname: replyTarget.senderName,
						headImgUrl: replyTarget.senderAvater,
						path: replyTarget.url || replyTargetData.url || '',
						userId: replyTarget.senderID,
						localPath: replyTarget.localPath || '',
						thumbnail: replyTarget.thumbnail || '',
						groupId: replyTarget.threadID
					} : null
				})

				// 初始化
				editor.txt.clear()
				if (this.imgs.length > 0) this.imgs = []
				if (this.atUsers.length > 0) this.atUsers = []
				this.$emit('init-reply-target', {})
			},

			_initContextmenu(visible) {
				if (visible && this.$utils.selection.getSelectionContent()) {
					this.contextmenuItems.copy = true
				} else {
					this.contextmenuItems.copy = false
				}
			},

			_copy() {
				this.showContextMenu = false
				const selectionContent = this.$utils.selection.getSelectionContent()
				if (selectionContent) {
					this.$utils.fun.writeToClipboard(selectionContent)
				}
			},

			_at(user, from) {
				this.editor.focus()

				const time = this.$utils.fun.getServerTime('_at')
				const atID = user ? `${user.userId}@${time}` : `0@${time}`

				this.atUsers.push(atID)

				let atName
				if (from === 'reply' && this.replyTarget.id && this.replyTarget.isAnoymous != 1) {
					atName = user ? (user.userLabel || user.nickName) : this.$t('chat.aite[0]')
					const container = document.createElement('div')
					container.innerHTML = `<span data-fromaa="true" id="${atID}" class="at" contenteditable="false">@${atName} </span>`
					this._insertNode(container.children[0])
					this._insertNode(document.createTextNode('\u200b'))
				} else {
					atName = user ? (this.thread.isAnoymous == 1 ? user.anonym : (user.userLabel || user.nickName)) : this.$t('chat.aite[0]')
					const atingDom = document.getElementById(this.atingID)
					if (atingDom) {
						atingDom.setAttribute('id', atID)
						atingDom.setAttribute('contenteditable', 'false')
						atingDom.innerText = `@${atName} `
						const sel = window.getSelection()
						const range = sel.getRangeAt(0)
						range.setStartAfter(atingDom)
						this._insertNode(document.createTextNode('\u200b'))
					}
				}

				this._stopAt()
				editor.change()
			},

			_stopAt() {
				this.ating = false
				this.$refs.groupUserList.scrollTop = 0
				this.atingID = ''
				this.atIndex = -1
				this.searchResult = null
				this.coords = {}
				this.selectingUser = false
			},
			addSelectDirTip() {
				// const { lastMessage } = this.thread
				// 如果最后一条消息也是发送文件夹错误，则不再提示
				// if (lastMessage.mType === 'tip_selectDir') return
				const timestamp = new Date().getTime()
				this.$store.dispatch('Chat/addTip', {
					id: timestamp,
					threadID: this.thread.groupId,
					text: this.$t('common.sendFoldNot'),
					mType: 'tip_selectDir',
					timestamp,
					threadType: this.thread.type,
					senderID: this.$store.state.User.accountInfo.userId
				})
			},
			async _paste(e, onKeydown) {
				this.showContextMenu = false
				onKeydown && e.preventDefault()
				let filePath = ''
				const clipboardTEXT = clipboard.readText()
				if (clipboardTEXT.length > 2000) {
					const fileInfo = this.writeFile(clipboardTEXT)
					if (fileInfo) {
						this.$emit('done', {
							files: [
								{
									ext: fileInfo.ext,
									path: fileInfo.path,
									fileName: fileInfo.fileName,
									fileSize: fileInfo.fileSize,
									fileFrom: '' // 文件来源，用于标识是路径还是base64，默认空是文件路径
								}
							]
						})
					}
					return
				}

				if (this.$utils.os.isMac) {
					filePath = clipboard.read('public.file-url').replace('file://', '')
				} else {
					const rawFilePath = clipboard.readBuffer('FileNameW').toString('ucs2')
					filePath = rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '')
				}

				const clipboardHTML = clipboard.readHTML().replace(/>[\r\n]+</g, '><')
				/*
				if (!clipboard.readImage().isEmpty() && filePath.toLowerCase().indexOf('.pdf') === -1) { // 剪贴板中有图片、mac下直接复制图片和pdf文件也走这里
					this._pasteImg(clipboard.readImage().toDataURL())
				} else */
				if (filePath) {
					const fileInfo = this.$utils.fun.getLocalFIleInfo(decodeURIComponent(filePath))
					if (fileInfo.isDirectory) {
						/* this.dirTipMessage = [{
							name: fileInfo.fileName
						}]
						this.showTipSize()*/
						this.addSelectDirTip()
						return
					}
					if (fileInfo.fileSize / (1024 * 1024) > this.clientFileMaxSize || fileInfo.fileSize === 0) {
						this.sizeTipMessage = [{
							name: fileInfo.fileName,
							size: this.$root.$options.filters.formatBytes(fileInfo.fileSize)
						}]
						this.showTipSize()
						return
					}
					if (this.$WEB_CONFIG.supportImageType.indexOf(fileInfo.ext) > -1) { // 支持的图片格式
						// const imageData = await this.$utils.fun.getLocalImage(filePath)
						this._pasteImg(decodeURIComponent(filePath))
					} else { // 别的文件
						this.$emit('done', {
							files: [
								{
									ext: fileInfo.ext,
									path: fileInfo.path,
									fileName: fileInfo.fileName,
									fileSize: fileInfo.fileSize,
									fileFrom: '' // 文件来源，用于标识是路径还是base64，默认空是文件路径
								}
							]
						})
					}
				} else if (!clipboard.readImage().isEmpty() && filePath.toLowerCase().indexOf('.pdf') === -1) { // 剪贴板中有图片、mac下直接复制图片和pdf文件也走这里
					this._pasteImg()
				} else if (clipboardHTML && clipboardHTML != clipboardTEXT) {
					let text = clipboardHTML.replace(/style=".+?"/g, '')
					// 如果包含内部html
					if (/data-fromaa/g.test(text)) {
						// 如果内部html包含图片，加入图片数组
						const imgs_fromAA = text.match(/<img data-fromaa="true" id="img_\d+?" src=".+?"/g)
						if (imgs_fromAA) {
							imgs_fromAA.forEach(img => {
								const imgId = img.match(/id="(.+?)"/)[1]
								const imgSrc = img.match(/src="(.+?)"/)[1].replace(/file:\/\/\/|file:\/\//i, '')
								const ext = this.$utils.fun.getFileExtByPath(imgSrc)
								this.imgs.push({
									id: imgId,
									detail: {
										path: decodeURIComponent(imgSrc),
										ext
									}
								})
							})
						}
					} else {
						text = text
							.replace(/<style((.|[\r\n])+?)<\/style>/g, '')
							.replace(/(<[a-z][^>]*><br\/?><\/[a-z][^>]*>|<br[^>]*?\/?>|<\/(p|div|li|tr|h[1-6])>)/g, '<br>')
							.replace(/<\/(?!\/?script)[^>]+>[\r\n]?/g, '')
							.replace(/<(?!\/?(script|br))[^>]+>/g, '')
					}

					const container = document.createElement('div')
					container.innerHTML = text
					const nodeArr = Array.prototype.slice.call(container.childNodes)
					nodeArr.forEach(node => {
						if (node.tagName === 'SCRIPT') {
							this._insertNode(document.createTextNode(node.outerHTML.replace(/\r\n/g, '\n').replace(/\r/g, '\n')))
						} else {
							this._insertNode(node)
						}
					})
				} else if (clipboardTEXT) {
					this._insertNode(document.createTextNode(clipboardTEXT.replace(/\r\n/g, '\n').replace(/\r/g, '\n')))
				}

				// 滚动到底部
				this.$nextTick(() => {
					const textarea = editor.$textElem[0]
					textarea.scrollTop = textarea.scrollHeight
				})
			},

			async _pasteImg(imgData) {
				if (this.bannedTime !== '') {
					return
				}
				const imgId = `img_${this.$utils.fun.getServerTime('_pasteImg')}`
				let imageInfo = {}
				if (typeof imgData === 'object' || imgData === undefined) { // 从截图控件来的图片
					imgData = clipboard.readImage().toDataURL()
					const imgDataBuffer = imgData.replace(/^data:image\/\w+;base64,/i, '')
					const tempExt = imgData.match(/^data:image\/(\w+);base64,/i)
					const ext = tempExt ? tempExt[1] : 'jpg'
					imageInfo = await this.$utils.fun.saveFile({
						ext,
						data: imgDataBuffer
					}, 1)
				} else {
					imageInfo.ext = this.$utils.fun.getFileExtByPath(imgData)
					imageInfo.localPath = imgData
				}
				this.imgs.push({
					id: imgId,
					detail: {
						path: imageInfo.localPath,
						ext: imageInfo.ext
					}
				})
				const container = document.createElement('div')
				container.innerHTML = `<img data-fromaa="true" id="${imgId}" src="file://${imageInfo.localPath}"/>`
				this._insertNode(container.childNodes[0])
			},

			_backspace(e, isCut) {
				const sel = window.getSelection()// 光标数据
				if (this.writing || !sel) return

				const range = sel.getRangeAt(0)
				let preNode
				// 判断光标是否在可编辑区域之内
				if (range && range.endContainer.parentElement.offsetParent.className === 'w-e-text-container') {
					if (editor.txt.html() === '<p><br></p>') {
						// 最后剩下一个空行，就不再删除了
						e.preventDefault()
						return
					}

					// 有选中内容
					if (!range.collapsed) {
						// 如果是剪切，在删除之前复制选中内容
						if (isCut) {
							this._copy(e)
						}
						this.removeFromArr(range)
						return
					}

					if (range.startContainer.nodeName === 'P') {
						if (range.startContainer.children.length <= 0) return

						const nodeArr = Array.prototype.slice.call(range.startContainer.childNodes)
						let nodeI
						let deletingNode = {}
						for (let i = sel.anchorOffset - 1; i >= 0; i--) {
							nodeI = nodeArr[i]
							if (/^\u200B$/.test(nodeI.nodeValue)) { // 不可见字符直接删除
								range.startContainer.removeChild(nodeI)
							} else {
								deletingNode = nodeI
								break
							}
						}

						const isAt = deletingNode.nodeName === 'SPAN' && deletingNode.className == 'at'// @
						const isIMG = deletingNode.nodeName === 'IMG' && deletingNode.className != 'emoji'// 图片
						if (!isAt && !isIMG) return

						e.preventDefault()
						if (isAt) {
							if (this.atUsers.includes(deletingNode.id)) {
								this.atUsers.splice(this.atUsers.indexOf(deletingNode.id), 1)
								deletingNode.parentNode.removeChild(deletingNode)
								if (editor.txt.html() === '<p></p>') {
									editor.txt.html('<p><br></p>')
								}
							} else if (this.atingID == deletingNode.id) {
								preNode = nodeArr[range.startOffset - 2]
								if (preNode && preNode.tagName === 'SPAN' && !/@/.test(preNode.id)) {
									this.atingID = preNode.id
									setTimeout(() => {
										this.coords = this._getSelectionCoords()
									}, 50)
								} else {
									this._stopAt()
								}
							} else {
								deletingNode.parentNode.removeChild(deletingNode)
								if (editor.txt.html() === '<p></p>') {
									editor.txt.html('<p><br></p>')
								}
							}
						}

						if (isIMG && deletingNode.dataset.fromaa) {
							const indexOf_deletingNode = this.imgs.findIndex(img => {
								return img.id == deletingNode.id
							})
							this.imgs.splice(indexOf_deletingNode, 1)
							deletingNode.parentNode.removeChild(deletingNode)
							if (editor.txt.html() === '<p></p>') {
								editor.txt.html('<p><br></p>')
							}
						}
					} else if (range.startContainer.parentNode.nodeName === 'SPAN' && range.startContainer.parentNode.className == 'at' && this.atingID == range.startContainer.parentNode.id) {
						preNode = range.startContainer.parentNode.previousElementSibling
						if (preNode && preNode.tagName === 'SPAN' && preNode.className != 'emoji' && !/@/.test(preNode.id)) {
							this.atingID = preNode.id
							setTimeout(() => {
								this.coords = this._getSelectionCoords()
							}, 50)
						} else if (range.startContainer.nodeValue === '@') {
							this._stopAt()
						}
					} else if (
						/^\u200B$/.test(range.startContainer.nodeValue) &&
						range.startContainer.previousElementSibling &&
						range.startContainer.previousElementSibling.tagName == 'SPAN' &&
						range.startContainer.previousElementSibling.className == 'at' &&
						range.startContainer.parentNode
					) {
						range.startContainer.parentNode.removeChild(range.startContainer.previousElementSibling)
						range.startContainer.parentNode.removeChild(range.startContainer)
					}
				}
			},

			removeFromArr(range) {
				const selectionArr = range.cloneContents().children
				if (selectionArr.length > 0) {
					let preNode
					let indexOf_deletingNode
					for (let i = selectionArr.length - 1; i >= 0; i--) {
						// 如果选中内容包含@或图片，则从对应队列删除
						if (selectionArr[i].id) {
							if (selectionArr[i].tagName === 'SPAN' && selectionArr[i].className == 'at') {
								if (this.atUsers.includes(selectionArr[i].id)) {
									this.atUsers.splice(this.atUsers.indexOf(selectionArr[i].id))
								}

								if (this.atingID == selectionArr[i].id) {
									preNode = selectionArr[i - 1]
									if (preNode && preNode.tagName === 'SPAN' && preNode.className == 'at' && !/@/.test(preNode.id)) {
										this.atingID = preNode.id
										setTimeout(() => {
											this.coords = this._getSelectionCoords()
										}, 50)
									} else {
										this._stopAt()
									}
								} else if (this.ating) {
									this._stopAt()
								}
							} else if (selectionArr[i].tagName === 'IMG' && selectionArr[i].className != 'emoji') {
								indexOf_deletingNode = this.imgs.findIndex(img => {
									return img.id == selectionArr[i].id
								})
								this.imgs.splice(indexOf_deletingNode, 1)
							}
						}
					}
				}
			},

			// 获取最后一个有效节点
			_lastNode(nodeArr) {
				let lastNode
				for (let i = nodeArr.length - 1; i >= 0; i--) {
					if (nodeArr[i].parentNode && !(nodeArr[i].nodeName === '#text' && nodeArr[i].nodeValue === '')) {
						lastNode = nodeArr[i]
						break
					}
				}
				return lastNode
			},

			// 插入节点
			_insertNode(node) {
				if (!node) return
				let sel
				let range
				if (this.rangeClone) {
					range = this.rangeClone
				} else {
					sel = window.getSelection()
					range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
				}

				let isEnd = false// 光标是否在末尾

				// 判断光标是否在可编辑区域之内
				if (range && range.endContainer.parentElement.offsetParent && range.endContainer.parentElement.offsetParent.className === 'w-e-text-container') {
					// 如果有选中内容，则清空
					if (!range.collapsed) {
						range.deleteContents()
					}
					this.editor.focus()
					range.setStart(range.startContainer, range.startOffset)

					sel = window.getSelection()
					range = sel.getRangeAt(0)

					// 判断光标是否在末尾
					const nodeName = range.startContainer.nodeName
					const childNodesLen = range.startContainer.childNodes.length
					if (nodeName === 'P' && childNodesLen > 0 && (range.startOffset === childNodesLen || (range.startOffset === childNodesLen - 1 && range.startContainer.lastChild.nodeName === '#text' && range.startContainer.lastChild.textContent === ''))) {
						isEnd = true
					} else if (nodeName === '#text' && !range.startContainer.nextElementSibling && range.startOffset === range.startContainer.length) {
						isEnd = true
					}
				} else {
					const tailIndex = this.editor.childNodes[0].childNodes.length
					const tailNode = this.editor.childNodes[0]
					this.editor.focus()
					sel = window.getSelection()
					range = sel.getRangeAt(0)
					range.setStart(tailNode, tailIndex)
					isEnd = true
				}

				// 由于末尾换行需要2个<br>,换行后如若要在末尾输入内容则需要去掉一个<br>,否则会换2行
				if (isEnd) {
					const currentHTML = editor.txt.html()

					// 如果是非正常的@，由于span可编辑，需要将光标移出span
					if (range.startContainer.parentNode && range.startContainer.parentNode.tagName == 'SPAN' && range.startContainer.parentNode.className == 'at') {
						range.setStartAfter(range.startContainer.parentNode)
						sel = window.getSelection()
						range = sel.getRangeAt(0)
					}

					const nodeArr = Array.prototype.slice.call(range.startContainer.childNodes)
					const lastNode = this._lastNode(nodeArr)
					// if (node.nodeName !== 'BR' && lastNode !== undefined && lastNode.nodeName === 'BR') {
					if ((currentHTML === '<p><br></p>' || /<br><br><\/p>/.test(currentHTML)) && node.nodeName !== 'BR') {
						lastNode.parentNode.removeChild(lastNode)
					} else if (node.nodeName === 'BR' && (lastNode === undefined || lastNode.nodeName !== 'BR')) {
						const nodeBR = document.createElement('br')
						range.insertNode(nodeBR)
						range.setStartAfter(nodeBR)
					}
				}

				this.$nextTick(() => {
					range.insertNode(node)
					range.setStartAfter(node)
					editor.change()
					// 清空记录的光标信息
					if (this.rangeClone) {
						this.rangeClone = null
					}
				})
			},

			// 获取光标坐标
			_getSelectionCoords(win) {
				win = win || window

				const doc = win.document

				let sel = doc.selection
				let range
				let rects
				let rect

				let x = 0
				let y = 0

				if (sel) {
					if (sel.type != 'Control') {
						range = sel.createRange()

						range.collapse(true)

						x = range.boundingLeft

						y = range.boundingTop
					}
				} else if (win.getSelection) {
					sel = win.getSelection()

					if (sel.rangeCount) {
						range = sel.getRangeAt(0).cloneRange()

						if (range.getClientRects) {
							range.collapse(true)

							rects = range.getClientRects()

							if (rects.length > 0) {
								rect = rects[0]
							}

							// 光标在行首时，rect为undefined

							if (rect) {
								x = rect.left

								y = rect.top
							}
						}

						if ((x == 0 && y == 0) || rect === undefined) {
							const span = doc.createElement('span')

							if (span.getClientRects) {
								span.appendChild(doc.createTextNode('\u200b'))

								range.insertNode(span)

								rect = span.getClientRects()[0]

								x = rect.left

								y = rect.top

								const spanParent = span.parentNode

								spanParent.removeChild(span)

								spanParent.normalize()
							}
						}
					}
				}

				return { x: x, y: y }
			}
		}
	}
</script>

<style lang="scss">
  @import url('./wangEditor.css');
  #input {
	.reply-info{
		position: relative;
		border-top: 1px solid #E6E6E6;
		padding:16px 17px 10px;
		box-sizing: border-box;

		.iconguanbi-1{
			position: absolute;
			top:0;
			font-size: 13px;
			top:12px;
			right:29px;
			cursor: pointer;
		}
		.reply-sender{
			padding-left:4px;
			border-left: 1px solid #E6E6E6;
			color:#999;
		}
		.reply-content{
			padding-left:4px;
			border-left: 1px solid #E6E6E6;
			color:#999;
			font-size: 12px;
			line-height: 18px;
			display: -webkit-box;
			overflow: hidden;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
			word-break: break-word;
		}
		.emoji{
				width:16px!important;
				height:16px!important;
			}

		.reply-img{
			max-width: 340px;
			height: 87px;
			overflow: hidden;
		}
	}

	.contextmenu {
		min-width: 50px !important;
	}

	.w-e-toolbar,
	.w-e-text-container {
		border: none !important;
	}

	.w-e-text-container {
		height: 100px!important;
		z-index: 1 !important;
		.w-e-text p{
			margin-top: 0!important;
			word-wrap: break-word;
			white-space: pre-wrap;
			word-break: break-word;
			color: #333;
		}
		img {
		max-width: 80px!important;
		max-height: 80px!important;
		vertical-align: text-bottom;
		box-shadow: none!important;
		cursor:text!important;
		&.emoji {
			width: 20px;
			height: 20px;
			&:hover {
			box-shadow: none;
			cursor: text;
			}
		}
		}
		span{
			user-select: all;
			cursor: pointer;
			display: inline-block;
			min-width: 1px;
		}
	}
  }
</style>

<style lang="scss" scoped>
  #input {
    background: #fff;
    z-index: unset !important;

	&.hide{
		visibility: hidden;
		.editor{height: 80px;}
	}

    .toolbar {
      display: flex;
      align-items: flex-end;
      height: 30px;
      .iconfont {
        font-size: 20px;
        margin-left: 20px;
        cursor: pointer;
				color: #606366;
        &:hover {
          color: $darkBlue;
        }
      }
    }

    .editor {
	  height: 100px;
      padding-top: 10px;
	  transition: height .1s ease-out;
    }

    .groupUsers {
      position: fixed;
      background: #fff;
      z-index: 4;
      border: 1px solid rgba(230, 230, 230, 1);
      box-shadow: 0 0 10px lightgray;
      box-sizing: border-box;
      max-height: 308px;
      border-radius: 5px;
      overflow-y: auto;
      width: 180px;
      overflow-x: hidden;

      div {
        display: flex;
        align-items: center;
        height: 44px;
        cursor: default;

        .avatar,
        span{
          display: block;
          width: 26px;
          height: 26px;
		  line-height: 26px;
          margin: 0 9px 0 15px;
          border-radius: 50%;
		  color: #fff;
          text-align: center;
		  background: $darkBlue;
        }
        p {
          flex: 1;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        &:nth-first-of-type() {
          border-radius: 5px 5px 0 0;
        }

        &:nth-last-of-type() {
          border-radius: 0 0 5px 5px;
        }

        &:hover,&.active {
          background: #f1f2f5;
        }
      }
    }

    .send {
      height: 50px;
      text-align: right;
      font-size: 12px;

      .input-tip {
        color: $lightGray;
      }

      .send-btn {
        width: 50px;
        height: 22px;
        margin: 14px 30px auto 20px;
        padding: 0;
        font-size: 12px;
        background: rgba(249, 249, 249, 1);
        border: 1px solid rgba(240, 240, 240, 1);
        border-radius: 2px;
      }
    }

	&.banned{
		pointer-events: none;
		background: #f3f3f3;
		color:#cccccc!important;

		.tip{
		  text-align: center;
		  line-height: 110px;
		  font-size: 20px;
		  .iconjinzhi{
			  margin-right: 8px;
		  }
	  }

		.send-btn{
			background: #f0f0f0;
			border-color: #e9e9e9;
			color:#cccccc;
		}
	}
  }
</style>
