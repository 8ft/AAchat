<template>
	<div class="img-view">
		<a-spin :spinning="spinning" size="large" />
		<!--<img :src="item" v-for="(item,index) in imgs"/>-->
		<ul id="lightgallery">
			<li data-responsive="" v-for="(item,index) in imgs" :key="index" :data-src="item"></li>
		</ul>
	</div>
</template>

<script>
	import $ from 'jquery'
	import 'lightgallery'
	import './lg-zoom-rotate/'
	import 'lg-pager'
	import 'lg-fullscreen'
	import 'lightgallery/dist/css/lightgallery.css'

	export default {
		name: 'ImgView',
		data() {
			return {
				imgs: [],
				spinning: true
			}
		},
		watch: {
			'$route.query.url'() {
				this.getImages()
			}
		},
		async mounted() {
			await this.getImages()
			this.$nextTick(() => {
				$(document).ready(() => {
					var $lg = $('#lightgallery')
					$lg.lightGallery({
						closable: false,
						rotate: true
					})
					this.spinning = false
					$lg.on('onCloseAfter.lg', () => {
						this.$utils.currentWindow.close()
					})
				})
			})
		},
		methods: {
			async getImages() {
				let temp = []
				if (this.$route.query.url) temp = this.$route.query.url.split(',')
				for (let i = 0; i < temp.length; i++) {
					/* let tempImg = await this.$utils.fun.getLocalImage(temp[i])
            if (!tempImg) tempImg = noimg*/
					this.imgs.push(temp[i])
				}
			}
		}
	}
</script>

<style scoped lang="scss">
  .img-view {
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    .img-responsive {
      display: none
    }
  }
</style>
<style lang="scss">
  .lg-on {
    background: transparent !important;
    .lg-backdrop.in {
      opacity: .85;
    }
    #lg-counter {
      display: none;
    }
    .lg-toolbar {
      background: #000;
      opacity: 1 !important;
      -webkit-app-region: drag;
      transform: translate3d(0, 0, 0) !important;
      * {
        -webkit-app-region: no-drag
      }
    }
    .lg-inner {
      top: 47px;
      height: auto;
      bottom: 0;
    }
    .lg-outer {
      -webkit-app-region: no-drag;
    }
  }
</style>
