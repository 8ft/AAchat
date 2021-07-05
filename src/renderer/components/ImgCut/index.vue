<!--/**
* creater: chenrenbin
* creatTime: 2019.07.25
* use: <ImgCut
*        :url=""           // 要裁剪的图片地址
*        :getCutImg=""     //  获取截图文件回调
*        :cancel=""        //  关闭组件
*      />
*
*  ps: 获取截图文件回调接收的是batse64格式的文件
**/-->
<template>
	<a-modal class="img-cut" centered :title="$t('common.modifyAvatar')" :maskClosable="false" :visible="true" :width="436"
		@cancel="cancel"
	>
		<a-spin :spinning="loading">
			<div class="cropper">
				<cropper
					ref="cropper"
					:img="imgUrl"
					:outputType="'png'"
					:autoCrop="true"
					:autoCropWidth="200"
					:autoCropHeight="200"
					:info="false"
					:centerBox="true"
					:fixedBox="true"
					:canMoveBox="false"
					:canScale="false"
					:enlarge="1"
					:mode="'cover'"
				></cropper>
			</div>
			<div class="icon-wrapper">
				<i class="iconfont iconjian" @click="changeScale(-1)"></i>
				<a-slider class="slide" :max="maxScale" @change="handleChange" :value="scale" />
				<i class="iconfont iconjia" @click="changeScale(1)"></i>
			</div>
		</a-spin>
		<img :src="blodUrl" alt="" width="200" height="200">
		<template #footer>
			<a-upload :fileList="[]" :beforeUpload="beforeUpload" accept=".png,.jpg,.jpeg,.gif,.bmp">
				<a-button key="back" :disabled="loading">
					{{$t('common.modifyAvatar')}}
				</a-button>
			</a-upload>
			<a-button key="submit" type="primary" @click="doSave" :disabled="(imgUrl == url && scale == 0) || loading">
				{{$t('common.saveClose')}}
			</a-button>
		</template>
	</a-modal>
</template>

<script>
	import cropper from './cropper.vue'

	export default {
		name: 'ImgCut',
		components: { cropper },
		filters: {},
		props: {
			url: String,
			getCutImg: Function,
			cancel: Function,
			spinning: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				imgUrl: '',
				fileInfo: {},
				scale: 0, // 图片放大挡位
				maxScale: 20, // 图片能被放大的最大挡位
				cutting: false,
				blodUrl: ''
			}
		},
		computed: {
			loading() {
				return this.$props.spinning || this.cutting
			}
		},
		created() {
			this.imgUrl = this.$props.url
			/* this.cutting = true
      if (this.$props.url) {
        this.$utils.fun.getRemoteImage(this.$props.url).then(res => {
          if (res) {
            this.imgUrl = res
            this.$nextTick(() => { this.cutting = false })
          }
        })
      } else {
        this.cutting = false
      }*/
		},
		beforeMount() {
		},
		mounted() {
		},
		beforeDestroy() {
		},
		methods: {
			doSave() {
				//        this.$refs.cropper.getCropBlob(file => {
				//          console.log(99,file)
				//          this.blodUrl = window[window.webkitURL ? 'webkitURL' : 'URL']['createObjectURL'](file)
				// //          this.getCutImg(file, blodUrl)
				//        })
				//        return
				this.cutting = true
				this.$refs.cropper.getCropData((data) => {
					this.getCutImg(data)
					this.cutting = false
				})
			},
			// 将剪裁后base64的图片转化为file格式
			convertBase64UrlToBlob(urlData) {
				const bytes = window.atob(urlData.split(',')[1])// 去掉url的头，并转换为byte
				// 处理异常,将ascii码小于0的转换为大于0
				const ab = new ArrayBuffer(bytes.length)
				const ia = new Uint8Array(ab)
				for (var i = 0; i < bytes.length; i++) {
					ia[i] = bytes.charCodeAt(i)
				}
				return new Blob([ab], { type: 'image/jpeg' })
			},
			beforeUpload(file, fileList) {
				this.cutting = true
				const imgType = ['image/jpeg', 'image/jpg', 'image/png']
				let isImage = false
				imgType.forEach(item => {
					if (item == file.type) {
						isImage = true
					}
				})
				const ismore5M = file.size / 1024 / 1024 < 5
				if (!isImage) {
					this.$message.error(this.$t('common.uploadImageLimitTip[1]'))
				} else if (!ismore5M) {
					this.$message.error(this.$t('common.uploadImageLimitTip[0]', { size: 5 }))
				} else {
					this.imgUrl = window[window.webkitURL ? 'webkitURL' : 'URL']['createObjectURL'](file)
					this.scale = 0
				}
				this.$nextTick(() => {
					this.cutting = false
				})
				return false
			},
			handleChange(value) {
				if (value > this.scale) {
					for (let i = 0; i < value - this.scale; i++) {
						this.$refs.cropper.changeScale(1)
					}
				} else if (value < this.scale) {
					for (let i = 0; i < this.scale - value; i++) {
						this.$refs.cropper.changeScale(-1)
					}
				}
				this.scale = value
			},
			changeScale(num) {
				if ((this.scale == 0 && num < 0) || (this.scale == this.maxScale && num > 0)) return
				this.scale += num
				this.$refs.cropper.changeScale(num)
			}
		}
	}
</script>

<style lang="scss">
  .img-cut {
    .ant-modal-header {
      background-color: #F1F2F5;
      border: none;
      .ant-modal-title {
        color: #333;
        font-size: 16px;
        font-weight: 400;
      }
    }
    .ant-modal-body {
      padding: 10px 20px;
      .cropper {
        width: 200px;
        height: 200px;
        margin: auto;
        .vue-cropper {
          background-image: none;
        }
        .cropper-view-box {
          outline: none;
          border: 1px solid $darkBlue;
          border-radius: 100px;
        }
      }
      .icon-wrapper {
        padding: 10px 110px 0;
        display: flex;
        align-items: center;
        i {
          flex: 0 0 auto;
          color: $gray;
          line-height: 1;
          border: 1px solid $gray;
          cursor: pointer;
          &:hover {
            color: $darkBlue;
            border-color: $darkBlue;
          }
        }
        .slide {
          flex: 1 1 auto;
          margin: 10px 15px;
          .ant-slider-handle {
            width: 10px;
            height: 10px;
            margin: -3px 0 0 -3px;
            border: none;
            background-color: $darkBlue;
          }
        }
      }
    }
    .ant-modal-footer {
      margin: 0px 20px;
      padding: 22px 0;
      text-align: center;
      .ant-upload-list {
        display: inline-block;
        margin-right: 29px;
      }
    }
  }
</style>
