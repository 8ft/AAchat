<template>
	<div id="noteEditor">
		<div class="toolbar">
			<span :class="{disable:imgCount>=3}" @click="$refs.fileSelect.click()">{{$t('common.addPic')}}</span>
			<span class="iconfont iconguanbi-1" @click="_done"></span>
			<input
				type="file"
				accept="image/gif, image/jpeg, image/png, image/bmp, image/jpg"
				multiple="multiple"
				@change="_handleChange"
				v-if="hackFile"
				style="display:none"
				ref="fileSelect"
			/>
		</div>

		<div ref="textArea" class="editor" @contextmenu="_contextmenu">
			<a-dropdown
				:getPopupContainer="()=>$refs.textArea"
				overlayClassName="contextmenu"
				@visibleChange="_initContextmenu"
				:trigger="['contextmenu']"
				:visible="showContextMenu"
			>
				<div ref="editor" style="text-align:left;height:100%;"></div>
				<a-menu slot="overlay" v-clickoutside="_hideContextMenu">
					<a-menu-item v-show="contextmenuItems.copy" @click="_copy">
						{{$t('common.copy')}}
					</a-menu-item>
					<a-menu-item @click="_paste">
						{{$t('common.paste')}}
					</a-menu-item>
				</a-menu>
			</a-dropdown>
		</div>

		<div class="words-count">
			{{$t('common.lengthOfWord')}}:{{wordsCount}}/1000
		</div>
	</div>
</template>

<script>
	import Editor from './editor'
	import { clipboard } from 'electron'

	let editor
	export default {
		name: 'Editor',
		props: {
			noteData: {
				type: Object,
				default: () => ({})
			},
			visible: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				edited: false,
				wordsCount: 0,
				supportImgType: ['image/gif', 'image/jpeg', 'image/png', 'image/bmp', 'image/jpg'],
				imgCount: 0,
				hackFile: true,
				selection: null,

				showContextMenu: false,
				contextmenuItems: {
					paste: true,
					copy: false
				},
				editor: null
			}
		},
		computed: {
			clientFileMaxSize() {
				return parseInt(this.$store.state.Setting.paramsConfig && this.$store.state.Setting.paramsConfig.clientFileMaxSize) || 20
			}
		},
		beforeDestroy() {
			this.editor.removeEventListener('keydown', this.editorKeyEvent)
		},
		mounted() {
			editor = new Editor(this.$refs.editor)
			editor.customConfig.onchangeTimeout = 16
			editor.customConfig.onchange = html => {
				if (!this.edited) {
					this.edited = true
				}

				if (html) {
					const imgs = html.match(/<img.*?\/?>/g)
					if (imgs) {
						this.imgCount = imgs.length
					} else if (this.imgCount > 0) {
						this.imgCount = 0
					}
					this.wordsCount = editor.txt.text().trim().length
				} else {
					this.wordsCount = 0
					this.imgCount = 0
				}
			}
			editor.create()
			this.$nextTick(() => {
				this.editor = this.$refs.editor.children[1].children[0]
				this.editor.addEventListener('keydown', this.editorKeyEvent)

				if (this.noteData.content) {
					const text = this.noteData.content
						.replace(/<style>.*?<\/style>/g, '')
						.replace(/<img src="/gi, '<img src="' + this.$store.state.Setting.fileDomainURL)
					const imgs = text.match(/<img.*?\/?>/g)
					if (imgs) {
						this.imgCount = imgs.length
					} else if (this.imgCount > 0) {
						this.imgCount = 0
					}

					this.editor.focus()
					editor.txt.html(text)
					this.wordsCount = editor.txt.text().trim().length
				}
			})
		},

		methods: {
			editorKeyEvent(e) {
				if (
					(e.metaKey && e.code === 'KeyV' && this.$utils.os.isMac) ||
					(e.ctrlKey && e.code === 'KeyV' && this.$utils.os.isWindows)
				) {
					e.preventDefault()
					this._paste(e, true)
					return
				}
			},
			_contextmenu(e) {
				e.preventDefault()
				this.showContextMenu = true
			},
			_hideContextMenu() {
				this.showContextMenu = false
			},
			async _handleChange(e) {
				const selectedImgs = e.target.files
				const selectedImgsCount = selectedImgs.length

				let hasNotSupportImg = false
				if (this.imgCount < 3) {
					let fileSizeTotal = 0
					for (let i = 0; i < selectedImgsCount; i++) {
						if (this.imgCount >= 3) {
							this.$message.error(this.$t('note.noteAddPicNumber', [3]))
							break
						}
						if (this.supportImgType.indexOf(selectedImgs[i].type) < 0) {
							hasNotSupportImg = true
							continue
						}
						fileSizeTotal += selectedImgs[i].size
						if (fileSizeTotal / (1024 * 1024) > this.clientFileMaxSize) {
							// this.$message.error(`图片最大不能超过${this.clientFileMaxSize}MB`)
							continue
						}
						await this._uploadImg(selectedImgs[i].path)
					}
				}
				if (hasNotSupportImg) {
					this.$message.error('只支持添加格式为(gif|jpeg|png|bmp|jpg)的图片')
				}

				this.freshFileInput()
			},

			freshFileInput() { // 刷新文件域
				this.hackFile = false
				this.$nextTick(() => {
					this.hackFile = true
				})
			},

			_uploadImg(imgLocalPath) {
				return new Promise(async(resolve, reject) => {
					const container = document.createElement('div')
					const res = await this.$utils.chatSdk.cUploadAsync(imgLocalPath)
					const retrypath = await this.$store.dispatch('Chat/getUploadInfo', res.data)
					this.imgCount += 1
					container.innerHTML = `<img src="${this.$store.state.Setting.fileDomainURL + retrypath.data}"/>`

					this._insertNode(container.children[0])

					resolve()
				})
			},

			async _done() {
				if (this.edited) {
					const myInfo = this.$store.state.User.accountInfo
					const reg = new RegExp(this.$store.state.Setting.fileDomainURL.replace(/\//, '\/'), 'g')
					// const html = '<!DOCTYPE html>' +
					// 	'<html xmlns="http://www.w3.org/1999/xhtml">' +
					// 	'<head>' +
					// 	'  <meta charset="utf-8" />' +
					// 	'  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' +
					// 	'  <meta name="apple-mobile-web-app-capable" content="yes" />' +
					// 	'  <meta name="apple-mobile-web-app-status-bar-style" content="black" />' +
					// 	'  <meta name="format-detection" content="telephone=no, email=no" />' +
					// 	'  <style>body{font-size:14px;color:#333;font-weight:400;line-height:22px;}img{dispaly:block;max-width:100%;}</style>' +
					// 	'</head>' +
					// 	'<body>' +
					// 	`${editor.txt.html().replace(reg, '')}` +
					// 	'</body>' +
					// 	'</html>'
					// const res = await this.$utils.chatSdk.cNoteFavoriteAsync(this.noteData.id || '', myInfo.userId, JSON.stringify(meta), html)

					const text = editor.txt.text()
					if (text.length > 1000) {
						this.$message.error(this.$t('note.noteWordLength', [1000]))
						return
					}

					let res
					if (!/^[\s|\r|\n]*$/.test(text) || this.imgCount > 0) {
						const html = `${editor.txt.html().replace(reg, '')}`
						const meta = {
							userId: myInfo.userId,
							nickName: myInfo.nickName,
							userAvatar: myInfo.userAvatar
						}
						res = await this.$utils.chatSdk.cNoteFavoriteAsync(this.noteData.id || '', myInfo.userId, JSON.stringify(meta), html)
						if (!this.noteData.id) {
							this.$store.commit('Chat/addNote', res.data)
						// await this.$store.dispatch('Chat/saveCollect', res.data)
						} else if (res.code == 0) {
							this.$store.dispatch('Chat/updateCollect', { updatemsg: res.data, isnote: true })
						}
					} else if (this.noteData.id) {
						res = await this.$store.dispatch('Chat/deletCollect', {
							collectID: this.noteData.id
						})

						if (res.code === 0) {
							this.$message.success(this.$t('common.delStatus[0]'))
						} else {
							this.$message.error(this.$t('common.delStatus[1]'))
						}
					}
				}
				this.$emit('done')
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

			async _paste(e, onKeydown) {
				this.selection = window.getSelection()// 记录当前光标信息
				this.showContextMenu = false
				onKeydown && e.preventDefault()
				let filePath
				if (this.$utils.os.isMac) {
					filePath = clipboard.read('public.file-url').replace('file://', '')
				} else {
					const rawFilePath = clipboard.readBuffer('FileNameW').toString('ucs2')
					filePath = rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '')
				}

				const clipboardTEXT = clipboard.readText()
				const clipboardHTML = clipboard.readHTML().replace(/>[\r\n]+</g, '><')

				if (!clipboard.readImage().isEmpty()) { // 剪贴板中有图片、mac下直接复制图片文件也走这里
					this._pasteImg(clipboard.readImage().toDataURL())
				} else if (filePath) { // 复制文件，win要特别处理图片文件
					const fileInfo = this.$utils.fun.getLocalFIleInfo(decodeURIComponent(filePath))
					if (fileInfo.isDirectory) {
						// this.$message.error('暂不支持发送文件夹')
						return
					}
					if (fileInfo.fileSize / (1024 * 1024) > this.clientFileMaxSize) {
						// this.$message.error(`文件最大不能超过${this.clientFileMaxSize}MB`)
						this.$message.error(this.$t('common.fileSizeLimit', [this.clientFileMaxSize]))
						return
					}
					if (this.$WEB_CONFIG.supportImageType.indexOf(fileInfo.ext) > -1) { // 支持的图片格式
						const imageData = await this.$utils.fun.getLocalImage(filePath)
						this._pasteImg(imageData)
					}
				} else if (clipboardHTML && clipboardHTML != clipboardTEXT) {
					let text = clipboardHTML
					text = text.replace(/style=".+?"/g, '')
					if (/data-fromaa/g.test(text)) {
						// let imgs_fromAA = text.match(/<img data-fromaa="true" id="img_\d+?" src=".+?"/g)
						// if (imgs_fromAA) {
						// 	if (this.imgs.length < 3) {
						// 		imgs_fromAA = imgs_fromAA.slice(0, 3 - this.imgs.length)
						// 		for (let i = 0; i < imgs_fromAA.length; i++) {
						// 			await this._pasteImg(imgs_fromAA[i].match(/src="(.+?)"/)[1])
						// 		}
						// 	} else {
						// 		this.$message.error(this.$t('note.noteAddPicNumber', [3]))
						// 	}
						// }

						// 将剪切板的HTML转化为文本
						text = text
							// .replace(/<\/?[a-z]+?\s((?!data-fromaa).)*?\/?>/g, '')
							.replace(/<(?!\/?br)[^>]+>[\n|\r|\r\n]?/g, '')
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
					let node
					for (let i = 0; i < nodeArr.length; i++) {
						node = nodeArr[i]
						if (node.tagName === 'IMG') {
							if (node.className === 'emoji') {
								this._insertNode(document.createTextNode(node.attributes.code.value))
							} else {
								if (this.imgCount < 3) {
									await this._pasteImg(node.attributes.src.value)
								}
							}
						} else if (node.tagName === 'SCRIPT') {
							this._insertNode(document.createTextNode(node.outerHTML.replace(/\r\n/g, '\n').replace(/\r/g, '\n')))
						} else {
							this._insertNode(node)
						}
					}
				} else if (clipboardTEXT) {
					this._insertNode(document.createTextNode(clipboardTEXT.replace(/\r\n/g, '\n').replace(/\r/g, '\n')))
				}

				// // 滚动到底部
				// this.$nextTick(() => {
				// 	const textarea = editor.$textElem[0]
				// 	if (textarea.scrollTop < textarea.scrollHeight) {
				// 		textarea.scrollTop = textarea.scrollHeight
				// 	}
				// })
			},

			_pasteImg(imgData) {
				return new Promise(async(resolve, reject) => {
					if (this.imgCount < 3) {
						const imgDataBuffer = imgData.replace(/^data:image\/\w+;base64,/i, '')
						const tempExt = imgData.match(/^data:image\/(\w+);base64,/i)
						const ext = tempExt ? tempExt[1] : 'jpg'

						const fileInfo = await this.$utils.fun.saveFile({
							data: Buffer.alloc(imgDataBuffer.length, imgDataBuffer, 'base64'),
							ext
						})

						await this._uploadImg(fileInfo.localPath)
					} else {
						this.$message.error(this.$t('note.noteAddPicNumber', [3]))
					}

					resolve()
				})
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
				const el = editor.$textElem[0]
				let sel = this.selection || window.getSelection()// 光标数据
				let range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
				let isEnd = false// 光标是否在末尾

				// 判断光标是否在可编辑区域之内
				if (range && range.endContainer.parentElement.offsetParent && range.endContainer.parentElement.offsetParent.className === 'w-e-text-container') {
					// 如果有选中内容，则清空
					if (!range.collapsed) {
						range.deleteContents()
					}
					el.focus()
					range.setStart(range.startContainer, range.startOffset)

					// 判断光标是否在末尾
					const nodeName = sel.focusNode.nodeName
					const childNodesLen = sel.focusNode.childNodes.length
					if (nodeName === 'P' && childNodesLen > 0 && (sel.focusOffset === childNodesLen || (sel.focusOffset === childNodesLen - 1 && sel.focusNode.lastChild.nodeName === '#text' && sel.focusNode.lastChild.textContent === ''))) {
						isEnd = true
					} else if (nodeName === '#text' && !sel.focusNode.nextElementSibling && sel.focusOffset === sel.focusNode.length) {
						isEnd = true
					}
				} else {
					const tailIndex = el.childNodes[0].childNodes.length
					const tailNode = el.childNodes[0]
					el.focus()
					sel = window.getSelection()
					range = sel.getRangeAt(0)
					range.setStart(tailNode, tailIndex)
					isEnd = true
				}

				// 由于末尾换行需要2个<br>,换行后如若要在末尾输入内容则需要去掉一个<br>,否则会换2行
				if (isEnd) {
					const currentHTML = editor.txt.html()
					const nodeArr = Array.prototype.slice.call(sel.anchorNode.childNodes)
					const lastNode = this._lastNode(nodeArr)
					if (currentHTML === '<p><br></p>' && node.nodeName !== 'BR') {
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
					if (this.selection) {
						this.selection = null
					}
				})
			}
		}
	}
</script>

<style lang="scss">
  @import url('./editor.css');
  #noteEditor{
	.contextmenu {
		min-width: 50px !important;
	}

	.w-e-toolbar,
	.w-e-text-container {
		border: none !important;
	}

	.w-e-text-container {
		user-select: text!important;
		height: 100% !important;
		z-index: 1 !important;
		.w-e-text{
			padding:0 10px!important;
			overflow-y: auto!important;
		}
		.w-e-text p{
			word-wrap: break-word;
			white-space: pre-wrap;
			word-break: break-word;
			color: #333;
		}
		img {
		max-width: 100%;
		padding: 4px 8px;
		cursor: default;
		&:hover{
			box-shadow: none;
		}
		}
	}
  }

</style>

<style lang="scss" scoped>
  #noteEditor {
    display: flex;
    flex-direction: column;
    background: #fff;
    height: 500px;
	z-index: unset !important;
	position: relative;
	padding-bottom: 30px;

	.words-count{
		position: absolute;
		bottom:0;
		width:100%;
		text-align: right;
		line-height: 30px;
		z-index: 1;
		padding: 0 20px;
		border-top: 1px solid #e7e8ea;
	}

    .toolbar {
		position: absolute;
		top:-55px;
		right:24px;
		display: flex;
		align-items: flex-end;
		height: 55px;
		line-height: 55px;
		font-size: 16px;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.85);
		-webkit-app-region: no-drag;
	  span{
		  cursor: pointer;
		  &:not(.disable):hover {
          color: $darkBlue;
		  }
		  &.disable{
			pointer-events: none;
			color:lightgray;
		  }
	  }
      .iconfont {
        font-size: 20px;
        margin-left: 20px;
        cursor: pointer;
        &:hover {
          color: $darkBlue;
        }
      }
    }

    .editor {
	  flex: 1;
	  overflow-y: auto;
    }
  }
</style>
