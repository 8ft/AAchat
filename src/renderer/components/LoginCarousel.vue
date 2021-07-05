<template>
	<div class="all_carousel" ref="all_carousel">
		<div class="change-lang">
			<a-dropdown :getPopupContainer="() => $refs.all_carousel">
				<span class="change-lang-btn" :title="langShowTxt">
					<i class="iconfont iconqiehuanyuyan"></i>
					<span>{{langShowTxt}}</span>
					<i class="iconfont iconshouqi1" style="font-size:10px; margin-left: 5px;"></i>
				</span>
				<a-menu slot="overlay" @click="changeLang">
					<a-menu-item key="0" class="change-lang-menu" :class="{active: $store.state.Setting.sysConfig.lang == '0'}">
						{{$t('setting.useSysLang')}} <i class="iconfont icongou"></i>
					</a-menu-item>
					<a-menu-item key="zh_CN" class="change-lang-menu" :class="{active: $store.state.Setting.sysConfig.lang === 'zh_CN'}">
						简体中文<i class="iconfont icongou"></i>
					</a-menu-item>
					<a-menu-item key="zh_TW" class="change-lang-menu" :class="{active: $store.state.Setting.sysConfig.lang === 'zh_TW'}">
						繁體中文<i class="iconfont icongou"></i>
					</a-menu-item>
					<a-menu-item key="en_US" class="change-lang-menu" :class="{active: $store.state.Setting.sysConfig.lang === 'en_US'}">
						English<i class="iconfont icongou"></i>
					</a-menu-item>
				</a-menu>
			</a-dropdown>
		</div>
		<a-carousel dot-position="bottom" :autoplay-speed="4600" :autoplay="autoplay" :after-change="afterChange" :before-change="beforeChange">
			<div class="car-item">
				<h3>{{$t('banner.banner1.title')}}</h3>
				<p v-html="$t('banner.banner1.content')"></p>
				<img :src="banner[0]" alt="" class="images">
			</div>
			<div class="car-item">
				<h3>{{$t('banner.banner2.title')}}</h3>
				<p v-html="$t('banner.banner2.content')"></p>
				<img :src="banner[1]" alt="" class="images">
			</div>
			<div class="car-item">
				<h3>{{$t('banner.banner3.title')}}</h3>
				<p v-html="$t('banner.banner3.content')"></p>
				<img :src="banner[2]" alt="" class="images">
			</div>
		</a-carousel>
		<!--<div class="bottom_orangetitle" v-if="!($route.fullPath.indexOf('/EnterPrise') > -1) && $route.query.loginByQr === undefined">
			<span @click="$router.push('/EnterPrise?type=login1')"><i class="iconfont iconqiehuan-3"></i>{{$t('login.switchEnterprise')}}</span>
			<p class="bottom_orangeName" v-if="$store.state.Setting.sysConfig.organName && $store.state.Setting.sysConfig.organId != 0" :title="$store.state.Setting.sysConfig.organName">
				{{$store.state.Setting.sysConfig.organName}}
			</p>
		</div>-->
	</div>
</template>

<script>
	import banner0 from '@/assets/img/login-gif/one.gif'
	import banner1 from '@/assets/img/login-gif/two.gif'
	import banner2 from '@/assets/img/login-gif/three.gif'
	import { setLang } from '@/assets/lang'

	const banner = [
		banner0,
		banner1,
		banner2
	]
	export default {
		name: 'LoginCarousel',
		data() {
			return {
				// banner: Object.assign([], banner),
				banner: [banner0, null, null],
				current: 0,
				autoplay:	true
			}
		}, /*
		watch: {
			'$store.state.Setting.sysConfig.lang'() {
				this.formatLang()
			}
		},*/
		computed: {
			langShowTxt() {
				switch (this.$store.state.Setting.sysConfig.lang) {
				case '0':
					return this.$t('setting.useSysLang')
				case 'zh_CN':
					return '简体中文'
				case 'zh_TW':
					return '繁體中文'
				case 'en_US':
					return 'English'
				default:
					return this.$t('setting.useSysLang')
				}
			}
		},
		methods: {
			changeLang({ key }) {
				setLang(key)
			},
			afterChange(current) {
				/* const tempCurrent = this.current
				this.$set(this.banner, tempCurrent, '')
				setTimeout(() => {
					this.$set(this.banner, tempCurrent, banner[tempCurrent])
				}, 1000)
				this.current = current*/
				if (this.banner.length - 1 === current) {
					this.autoplay = false
				}
			},
			beforeChange(from, to) {
				// console.log('beforeChange:::', to)
				// this.$set(this.banner, to, banner[to])
				this.banner = new	Array(3).fill(null)
				this.$set(this.banner, to, banner[to])
			}
		}
	}
</script>
<style scoped lang="scss">
	.all_carousel{
		.change-lang-menu {
			font-size: 12px;
			&.active{
				color: #2e87ff;
				i{
					visibility: visible;
				}
			}
			i {
				float: right;
				font-size: 10px;
				margin-left: 10px;
				visibility: hidden;
			}
		}
		.change-lang{
			position: absolute;
			bottom: 34px;
			left: 30px;
			color: #666;
			z-index: 3;
			.change-lang-btn{
				span{
					display: inline-block;
					max-width: 100px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				display: flex;
				align-items: center;
				cursor: pointer;
				i{
					margin-right: 5px;
				}
			}
		}
		.bottom_orangetitle{
			width: 400px;
			display: flex;
			justify-content: center;
			position: absolute;
			bottom: 34px;
			.bottom_orangeName{
				color: #666666;
				font-size: 14px;
				max-width: 150px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				margin: 0 0 0 10px;
			}
			span{
				cursor: pointer;
				display: flex;
				align-items: center;
				i{
					margin-right: 5px;
				}
			}
		}
		.car-item{
			// padding: 44px 10px 50px 10px;
			padding: 44px 0px 50px;
			text-align: center;
			h3{
				font-size: 22px;
				font-weight: normal;
				font-stretch: normal;
				line-height: 22px;
				letter-spacing: 4px;
				color: #333333;
			}
			p{
				font-size: 14px;
				font-weight: normal;
				font-stretch: normal;
				letter-spacing: 0px;
				color: #999999;
			}
			.images{
				width: 400px;
				height: 280px;
				margin: 0px auto;
			}
		}
		/deep/ .slick-dots{
			height: 10px;
			bottom: 40px;
			li{
				height: 10px;
				width: 10px;
				border-radius: 50%;
				background-color: #eff0f1;
				margin-left: 10px;
				&:first-child{
					margin-left: 0;
				}
				button{
					height: 10px;
					width: 10px!important;
					border-radius: 50%;
					background: #dee0e3!important;
				}
			}
			.slick-active{
				height: 10px;
				width: 10px;
				border-radius: 50%;
				background-color: #dee0e3;
			}
		}
	}
</style>
