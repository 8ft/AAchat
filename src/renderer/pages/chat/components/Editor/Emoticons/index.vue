<template>
	<div id="emoticons" ref="emoticons">
		<div v-show="folder==='emoji'" class="emoticon">
			<div class="emoji" v-for="(code,index) in codes" :key="index" @click="select(code)">
				<img :src="$utils.message.getEmojiSrc(code)" />
			</div>
		</div>

		<input
			type="file"
			accept="image/gif, image/jpeg, image/png, image/bmp, image/jpg"
			@change="fileSelectChange"
			v-if="hackFile"
			style="display:none"
			multiple
			ref="emojiSelect"
		/>

		<div v-show="folder==='favorite'" class="emoticon	favorite">
			<div class="emoji img add" @click="selectEmoji">
				<a-spin :spinning="adding">
					<i class="iconfont icontianjia1"></i>
				</a-spin>
			</div>

			<template v-for="id in sort">
				<div :key="id" v-if="!!emojis[id]" class="emoji img" @contextmenu="e=>{contextmenu(e,id)}" @click.stop="send(id)">
					<a-dropdown
						:getPopupContainer="()=>$refs.emoticons"
						:trigger="['contextmenu']"
						:visible="contextMenuID==id&&!!emojis[id].localPath"
					>
						<a-spin :spinning="!emojis[id].localPath">
							<img v-if="!!emojis[id].localPath" :src="'file://' + emojis[id].localPath">
						</a-spin>
						<!--右键菜单-->
						<a-menu
							slot="overlay"
							v-clickoutside="hideContextMenu"
						>
							<a-menu-item @click="remove(id)">
								{{$t('common.delete')}}
							</a-menu-item>
						</a-menu>
					</a-dropdown>
				</div>
			</template>
		</div>

		<div class="folders">
			<div :class="{folder:true,active:folder==='emoji'}" @click.stop="folder='emoji'">
				<img src="@/assets/img/emoji.png">
			</div>
			<div :class="{folder:true,active:folder==='favorite'}" @click.stop="folder='favorite'">
				<img src="@/assets/img/heart.png">
			</div>
		</div>
	</div>
</template>
<script>
	import emojiCodes_zh_CN from './emojiCodes_zh_CN'
	export default {
		name: 'Emoticons',
		data() {
			return {
				adding: false,
				contextMenuID: '',
				hackFile: true,
				codes: [],
				emojiData: {},
				folder: 'emoji'
			}
		},
		computed: {
			sort() {
				// console.log(this.$store.state.Chat.emojiSort)
				return this.$store.state.Chat.emojiSort
			},
			emojis() {
				// console.log(this.$store.state.Chat.emojis)
				return this.$store.state.Chat.emojis
			}
		},
		mounted() {
			this.emojiData = emojiCodes_zh_CN
			this.codes = Object.keys(emojiCodes_zh_CN)
		},
		methods: {
			selectEmoji() {
				if (this.adding) return
				if (this.sort.length >= 300) {
					this.$message.error(this.$t('chat.addEmojiTip[3]', [300]))
				} else {
					this.$refs.emojiSelect.click()
				}
			},
			send(id) {
				this.$emit('send', id)
			},
			contextmenu(e, id) {
				e.preventDefault()
				this.contextMenuID = id
			},
			hideContextMenu() {
				this.contextMenuID = ''
			},
			remove(id) {
				this.$utils.chatSdk.cDeleteEmoticonAsync(id)
				this.contextMenuID = ''
			},
			async fileSelectChange(e) {
				this.adding = true
				const selectFilesArray = e.target.files
				let fileType = ''
				let fileSize = 0
				let uri
				let uploadInfo
				let sameCount = 0
				let overSizeCount = 0
				let successCount = 0
				let unsupportCount = 0
				const currentToken = this.$store.state.User.accountInfo.token

				for (let i = 0; i < selectFilesArray.length; i++) {
					// 处理未传完退出登录的情况---串号
					if (currentToken != this.$store.state.User.accountInfo.token) {
						console.log('账号登陆状态变化，终止上传表情')
						this.$store.commit('Chat/getAllEmojis', [])
						this.$store.commit('Chat/setDownloadingEmojis', [])
						this.$store.commit('Chat/updateEmojiSort', [])
						this.freshFileInput()
						return
					}

					fileType = selectFilesArray[i].type
					if (!/image\/(png|gif|bmp|jpg|jpeg)/i.test(fileType)) {
						unsupportCount += 1
						continue
					}

					fileSize = selectFilesArray[i].size
					if (fileSize / (1024 * 1024) > 1) {
						overSizeCount += 1
						continue
					}

					// 上传图片
					uploadInfo = await this.$utils.chatSdk.cUploadAsync(selectFilesArray[i].path)
					uri = await this.$store.dispatch('Chat/getUploadInfo', uploadInfo.data)

					// 添加表情
					if (uri.code == 0) {
						if (!process.env.webConfig.supportImageType.includes(uri.data && uri.data.split('.')[1])) {
							continue
						}
						const imgInfo = await this.$utils.fun.getImgInfo(selectFilesArray[i].path)
						const res = await this.$utils.chatSdk.cAddEmoticonAsync(uri.data, JSON.stringify({
							width: imgInfo.width,
							height: imgInfo.height
						}))
						// console.log(res)
						if (res.code == 2044) {
							sameCount += 1
						} else if (res.code == 0) {
							successCount += 1
						}
					}
					// await this.$utils.time.sleep(500)
				}

				if (selectFilesArray.length == unsupportCount) {
					this.$message.error('暂不支持该类型')
				} else if (selectFilesArray.length == sameCount) {
					this.$message.success(this.$t('chat.addEmojiTip[0]'))
				} else if (selectFilesArray.length == overSizeCount) {
					this.$message.error(this.$t('chat.addEmojiTip[2]', [1]))
				} else if (selectFilesArray.length > 1 && successCount > 0) {
					let tip = this.$t('chat.addEmojiTip[4]', { successCount })
					if (overSizeCount > 0) {
						tip += `,${this.$t('chat.addEmojiTip[5]', { overSizeCount })}`
					}
					this.$message.success(tip)
				} else if (selectFilesArray.length == 1 && successCount == 1) {
					this.$message.success(this.$t('chat.addEmojiTip[0]'))
				}

				this.freshFileInput()

				this.adding = false
			},
			freshFileInput() { // 刷新文件域
				this.hackFile = false
				this.$nextTick(() => {
					this.hackFile = true
				})
			},
			select(code) {
				const text = this.emojiData[code][this.$store.state.Setting.lang]
				const html = `<img data-fromaa="true" code="${text}" src="${this.$utils.message.getEmojiSrc(code)}" class="emoji" />`
				this.$emit('select', { html })
			}
		}
	}
</script>

<style lang='scss'>
  #emoticons {
    width: 508px;
    height: 326px;
    position: fixed;
    bottom: 185px;
    left: 220px;
    background: #fff;
    z-index: 4;
    border: 1px solid rgba(230, 230, 230, 1);
    border-radius: 5px;
    box-shadow: 0 0 10px lightgray;
    padding: 10px 0 40px;
    box-sizing: border-box;

    .emoticon {
      width: 100%;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-wrap: wrap;
      padding: 0 20px 10px;
      border: 0;
			&.favorite{padding: 8px 20px 10px;}
      .emoji {
        width: 38px;
        height: 38px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          width: 74%;
          height: 74%;
        }

        &:not(.img):hover {
          background: rgba(88, 88, 88, 0.2);
        }

        &.img{
          width: 64px;
          height: 64px;
          margin-right: 15px;
		  margin-bottom: 15px;

		  .ant-spin-nested-loading,.ant-spin-container{width:100%!important;height:100%!important;}
		  .ant-spin-container{
			  display: flex;
        		align-items: center;
        		justify-content: center;
			}

          &.add{
            background: #f4f6f8;
          }

          &:nth-of-type(6n){
            margin-right: 0;
          }

          .icontianjia1{
            font-size: 24px;
            color:#d8d8d8;
          }
          img{
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 100%;
          }
        }
      }
    }

    .folders{
      position: absolute;
      padding-left: 18px;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 40px;
      background: #f4f6f8;
      border-radius: 0 0 5px 5px;
      display:flex;
      align-items: center;

      .folder{
        width: 36px;
        height: 36px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        img{
          width: 22px;
          height: 22px;
        }
        &.active{
          background-color: #ffffff;
        }
      }
    }
  }
</style>
