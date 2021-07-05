import store from '../../store'
import fun from '../electron/fun'
import { foramtJsonLikeString } from './JSON'
import emojiCodes_zh_CN from '../../pages/chat/components/Editor/Emoticons/emojiCodes_zh_CN'
import emojiCodes_zh_TW from '../../pages/chat/components/Editor/Emoticons/emojiCodes_zh_TW'
import emojiCodes_en_US from '../../pages/chat/components/Editor/Emoticons/emojiCodes_en_US'
const emojiForWorkStatus = {
	'闹钟': require('@/assets/img/emoji-icon/[闹钟]@2x.png'),
	'飞机': require('@/assets/img/emoji-icon/[飞机]@2x.png'),
	'会议': require('@/assets/img/emoji-icon/[会议]@2x.png'),
	'公文包': require('@/assets/img/emoji-icon/[公文包]@2x.png')
}
const emojiArray = {}
for (const key in emojiCodes_zh_CN) {
	emojiArray[key] = require(`@/assets/img/emoji-icon/[${key}]@2x.png`)
}
const CHAT_MSG_TYPE = process.env.webConfig.CHAT_MSG_TYPE
module.exports = {
	getAvatarText(name) {
		return name.substring(0, 2)
	},
	getAvatarBgColor(name) {
		if (store.state.Chat.avatarBgColors[name]) {
			return store.state.Chat.avatarBgColors[name]
		} else {
			const colors = ['#FF755E', '#FB9646', '#FFCD5E', '#74D773', '#6EABFF', '#D593FC']
			const index = Math.round((Math.random() * 5))
			const color = colors[index]
			store.commit('Chat/addAvatarBgColor', { name, color })
			return color
		}
	},

	buildDom(text, hasBurntAfterReadIcon, ignoreLinks = false) {
		const frag = document.createDocumentFragment()
		const domContainer = document.createElement('div')
		const text_arr = text.split('【##HTML##】')
		text_arr.map(node => {
			if (/<img data-fromaa/.test(node)) {
				domContainer.innerHTML = node
				frag.appendChild(domContainer.children[0])
			} else if (node == '<br>') {
				frag.appendChild(document.createElement('br'))
			} else if (!ignoreLinks) {
				// 先过滤出疑似链接
				let linkArray = node.replace(/(((http|https|ftp)\:\/\/)?(localhost|(([a-zA-Z0-9][-a-zA-Z0-9@]{0,62})(\.[a-zA-Z0-9][-a-zA-Z0-9@]{0,62})+))(:\d+)?\/?([^\s]*)?)/ig, '【###link###】$1【###link###】')
				linkArray = linkArray.split('【###link###】')
				if (linkArray && linkArray.length) {
					for (let i = 0; i < linkArray.length; i++) {
						if (linkArray[i]) {
							if (fun.validUrl(linkArray[i])) {
								const hrefDom = document.createElement('a')
								// hrefDom.href = linkArray[i]
								hrefDom.textContent = linkArray[i]
								frag.appendChild(hrefDom)
							} else {
								frag.appendChild(document.createTextNode(linkArray[i]))
							}
						}
					}
				}
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

	getEmojiSrc(name) {
		const key = name.replace(/[\[,\]]/g, '')
		let imgName = ''

		if (emojiForWorkStatus[key]) {
			return emojiForWorkStatus[key]
		} else if (emojiCodes_zh_CN[key]) {
			imgName = emojiCodes_zh_CN[key]['zh_CN']
		} else if (emojiCodes_zh_TW[key]) {
			imgName = emojiCodes_zh_TW[key]['zh_CN']
		} else if (emojiCodes_en_US[key]) {
			imgName = emojiCodes_en_US[key]['zh_CN']
		}

		if (imgName) {
			return emojiArray[imgName]
		} else {
			return ''
		}
	},
	filterEmojiCodes(text) {
		if (!/\[.*?\]/.test(text)) {
			return []
		}

		const emojis = text.match(/\[.*?\]/g)
		// 结果去重
		const emojiCodes = []
		const obj = {}

		let imgName = ''
		let key = ''
		for (const i of emojis) {
			key = i.replace(/[\[,\]]/g, '')

			if (!obj[key]) {
				if (emojiCodes_zh_CN[key]) {
					imgName = emojiCodes_zh_CN[key]['zh_CN']
				} else if (emojiCodes_zh_TW[key]) {
					imgName = emojiCodes_zh_TW[key]['zh_CN']
				} else if (emojiCodes_en_US[key]) {
					imgName = emojiCodes_en_US[key]['zh_CN']
				} else {
					imgName = ''
				}
				if (imgName) {
					emojiCodes.push({
						text: key,
						imgName
					})
				}
				obj[key] = 1
			}
		}
		return emojiCodes
	},
	replaceEmojiCodeIntoEmojiIcon(text, tag = '【##HTML##】') {
		const emojiCodes = this.filterEmojiCodes(text)
		if (emojiCodes.length === 0) {
			return text
		}

		let src = ''
		emojiCodes.forEach(code => {
			src = emojiArray[code.imgName]
			text = text.replace(
				new RegExp(`\\[${code.text}\\]`, 'g'),
				`${tag}<img data-fromaa="true" code="${code.text}" src="${src}" class="emoji">${tag}`
			)
		})

		return text
	},
	replaceEmojiCodeIntoEmojiHTML(text) {
		const emojiCodes = this.filterEmojiCodes(text)
		if (emojiCodes.length === 0) {
			return text
		}

		emojiCodes.forEach(code => {
			text = text.replace(
				new RegExp(`\\[${code.text}\\]`, 'g'),
				`<span class="emoji" contenteditable="false">[${code.text}]</span>`
			)
		})

		return text
	},
	getSpecialMsgTag(cForm) {
		let content = ''
		switch (parseInt(cForm)) {
			case CHAT_MSG_TYPE.TYPE_IMAGE:
				content = `[${window.i18n.t('common.image')}]`
				break
			case CHAT_MSG_TYPE.TYPE_EMOJI:
				content = `[${window.i18n.t('common.emoji')}]`
				break
			case CHAT_MSG_TYPE.TYPE_FILE:
				content = `[${window.i18n.t('common.file')}]`
				break
			case CHAT_MSG_TYPE.TYPE_VOICE:
				content = `[${window.i18n.t('common.voice')}]`
				break
			case CHAT_MSG_TYPE.TYPE_VIDEO:
				content = `[${window.i18n.t('common.video')}]`
				break
			case CHAT_MSG_TYPE.TYPE_CARD:
				content = `[${window.i18n.t('common.contactCard')}]`
				break
			case CHAT_MSG_TYPE.TYPE_NOTE:
				content = `[${window.i18n.t('common.note')}]`
				break
			case CHAT_MSG_TYPE.TYPE_LOCATION:
				content = `${window.i18n.t('location.name')}`
				break
			}
			return content
	},
	getChildMsgData(threadID, originData, msgID) {
		if (typeof originData === 'string') {
			originData = foramtJsonLikeString((originData))
		} else {
			originData = window._.assign({}, originData)
		}
		originData.extra = foramtJsonLikeString(originData.extra)
		const cForm = parseInt(originData.type)
		const message = {
			id: `${msgID}`,
			threadID,
			threadType: 10001,
			senderID: originData.sendUserId,
			name: originData.nickName,
			avatar: originData.headImgUrl,
			timestamp: new Date(originData.msgTime).getTime(),
			cForm,
			status: 1,
			isSend: 0,
			read: 1,
			isAnoymous: originData.isAnoymous
		}

		switch (cForm) {
			case CHAT_MSG_TYPE.TYPE_TEXT:
				message.text = originData.content
				break
			case CHAT_MSG_TYPE.TYPE_IMAGE:
				Object.assign(message, {
					text: `[${window.i18n.t('common.image')}]`,
					width: originData.width || 150,
					height: originData.height || 120,
					url: originData.extra,
					localPath: '',
					ext: originData.fileType || originData.extra.split('.').reverse()[0]
				})
				break
			case CHAT_MSG_TYPE.TYPE_EMOJI:
				Object.assign(message, {
					text: `[${window.i18n.t('common.emoji')}]`,
					width: originData.width || 150,
					height: originData.height || 120,
					url: originData.extra,
					localPath: '',
					ext: originData.fileType || originData.extra.split('.').reverse()[0]
				})
				break
			case CHAT_MSG_TYPE.TYPE_FILE:
				Object.assign(message, {
					text: `[${window.i18n.t('common.file')}] ` + (originData.newFileName || originData.fileName),
					url: originData.extra,
					localPath: '',
					ext: originData.fileType || originData.fileName.split('.').reverse()[0],
					fileName: originData.fileName,
					fileSize: originData.fileSize
				})
				break
			case CHAT_MSG_TYPE.TYPE_VOICE:
				Object.assign(message, {
					text: `[${window.i18n.t('common.voice')}]`,
					url: originData.extra,
					localPath: '',
					ext: 'aac',
					duration: originData.duration
				})
				break
			case CHAT_MSG_TYPE.TYPE_VIDEO:
				Object.assign(message, {
					text: `[${window.i18n.t('common.video')}]`,
					url: originData.extra,
					localPath: '',
					ext: 'mp4',
					duration: originData.duration,
					fileSize: originData.fileSize,
					height: originData.height,
					width: originData.width,
					fileName: originData.fileName || ''
				})
				break
			case CHAT_MSG_TYPE.TYPE_CARD:
				message.text = `[${window.i18n.t('common.contactCard')}]`
				message.data = originData.extra
				break
			case CHAT_MSG_TYPE.TYPE_NOTE:
				message.text = `[${window.i18n.t('common.note')}]`
				message.data = originData.extra
				break
			case CHAT_MSG_TYPE.TYPE_REPLY:
				message.text = originData.extra.replyContent
				message.replyInfo = foramtJsonLikeString(originData.extra.replyInfo)
				break
			case CHAT_MSG_TYPE.TYPE_LOCATION:
				message.text = `${window.i18n.t('location.name')}`
				message.data = originData.extra
				break
		}

		return message
	}
}
