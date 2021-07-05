<template>
	<div class="Enter_PriseId">
		<div class="inputPrise" v-show="!isinto">
			<div class="goback_title">
				<!--<i v-if="!isinto" @click="_link" class="back iconfont iconfanhui"> {{$t('login.returnToLogin')}}</i>-->
				<i @click="_goback" class="back iconfont iconfanhui"> {{$t('common.return')}}</i>
			</div>
			<h2>
				{{$t('login.enterpriseCode')}}
			</h2>
			<p style="line-height: 150%">
				{{$t('login.regTip1', { number: 6 })}}
			</p>
			<div class="form">
				<a-auto-complete
					v-model="organCode"
					@select="onSelect"
					@search="onSearch"
					@change="onChange"
					option-label-prop="value"
					ref="search"
				>
					<template slot="dataSource">
						<a-select-option v-for="item in hisList" :key="item.organCode" :value="item.organCode">
							<span class="Name_left">{{item.priseName}}</span><span class="Name_right">{{item.organCode}}<span class="iconfont iconcuo" @click.stop="_deleteName(item)"></span></span>
						</a-select-option>
					</template>
					<input :placeholder="$t('login.enterEnterpriseCode')" oninput="value=value.replace(/[^\d]/g,'')" maxlength="6" />
				</a-auto-complete>
				<!--<a-dropdown @visibleChange="getHisname" :visible="showsearch">
					<input type="text" :placeholder="$t('login.enterEnterpriseCode')" v-model="organCode" oninput="value=value.replace(/[^\d]/g,'')" maxlength="6" @keydown.13="gotoprise" ref="search" v-clickoutside="closename">
					<a-menu slot="overlay" v-if="hisList.length > 0">
						<a-menu-item :key="index" v-for="(item, index) in hisList" @click="selectName(item)" v-if="index < 5 && item">
							<span class="Name_left">{{item.priseName}}</span><span class="Name_right">{{item.organCode}}<span class="iconfont iconcuo" @click.stop="_deleteName(item)"></span></span>
						</a-menu-item>
					</a-menu>
				</a-dropdown>-->
				<!--<input type="text" placeholder="请输入企业代码" v-model="organCode" oninput="value=value.replace(/[^\d]/g,'')" maxlength="6" @keydown.13="gotoprise">-->
				<a-button type="primary" @click="gotoprise" :loading="goloading" style="margin-top: 40px;">
					{{$t('common.confirmBtn')}}
				</a-button>
			</div>
			<!--<span @click="_link" v-if="!$utils.os.isWindows" class="goback">{{$t('common.return')}}</span>-->
		</div>
		<div class="intoPrise" v-if="isinto">
			<div>
				<div class="priselogo">
					{{Array.from(priseName)[0]}}
				</div>
				<h2>{{priseName}}</h2>
				<a-button type="primary" @click="gotoNext">
					{{$t('common.enter')}}
				</a-button>
				<!--<span @click="_goback" class="goback" v-if="!$utils.os.isWindows">{{$t('common.return')}}</span>-->
				<i18n path="login.notThisCompany" tag="p" for="login.changeCompany">
					<span @click="isinto = false, organCode = ''" style="padding: 10px 0px;">{{$t('login.changeCompany')}}</span>
				</i18n>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'EnterPrise',
		data() {
			return {
				priseName: '',
				organCode: '', // 企业代码
				organId: '', // 企业id
				isinto: false, // 进入企业
				goloading: false,
				replacecode: '',
				hisList: [],
				showsearch: false,
				dataSource: [],
				regParams: {
					...this.$route.query
				}
			}
		},
		methods: {
			onSearch(searchText) {
				this.searchHisname(searchText)
			},
			onSelect(value) {
				// console.log('onSelect', value)
			},
			onChange(value) {
				// console.log('onChange', value)
			},
			gotoLogin() {
				this.$router.push({
					path: '/login',
					query: {
						loginByQr: true
					}
				})
			},
			// 防抖
			debounce(fn, timeout = 500) {
				let timer
				return (...args) => {
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => {
						fn.apply(fn, args)
					}, timeout)
				}
			},
			getHisname() {
				if (this.organCode === '') this.hisList = this.filterHisorgan()
			},
			closename() {
				this.showsearch = false
			},
			_deleteName(val) {
				const temp = window._.cloneDeep(this.$store.state.Setting.sysConfig.hisorganNameList)
				this.hisList = this.hisList.filter(list => {
					return val.organCode != list.organCode
				})
				this.$store.dispatch('Setting/set_hisorganNameList', temp.filter(list => {
					return val.organCode != list.organCode
				}))
			},
			selectName(val) {
				this.organCode = val.organCode
			},
			searchHisname(searchText) {
				const reg = new RegExp(searchText, 'i')
				const _test = str => reg.test(str)
				const allList = []
				const currList = this.filterHisorgan()
				if (searchText !== '') {
					this.hisList = []
					currList.forEach(item => {
						if (_test(item.organCode)) {
							allList.push(item)
						}
					})
					this.hisList = allList
				} else {
					this.hisList = this.filterHisorgan()
				}
			},
			_link() {
				this.$router.push('/login')
			},
			_goback() {
				this.$router.push('/register')
				/* if (this.$route.query.type === 'login2') {
					this.$router.push('/login')
				} else {
					this.isinto = false
				}*/
			},
			gotoprise() {
				if (this.organCode !== '') {
					if (this.organCode.length === 6) {
						this.goloading = true
						this.$utils.api.user.getOrganInfo({ organCode: this.organCode }).get().then(res => {
							this.priseName = res.data.organName
							this.organId = res.data.organId
							this.replacecode = this.organCode
							this.isinto = true
							this.goloading = false
							const hisname = window._.cloneDeep(this.$store.state.Setting.sysConfig.hisorganNameList)
							const index = hisname.findIndex(msg => {
								return msg.organCode == this.organCode
							})
							// 运维修改企业名称时，确认企业时修改历史记录的企业名称
							if (index === -1) {
								if (hisname.length >= 5) hisname.pop()
								hisname.unshift({ priseName: this.priseName, organCode: this.organCode })
							} else {
								hisname.splice(index, 1)
								hisname.unshift({ priseName: this.priseName, organCode: this.organCode })
							}
							this.$store.dispatch('Setting/set_hisorganNameList', hisname)
						}).catch(err => {
							this.goloading = false
							console.log(err)
						})
					} else {
						this.$message.error(this.$t('login.enterpriseCodeIncorrect'))
					}
				} else {
					this.$message.error(this.$t('login.enterEnterpriseCode'))
				}
			},
			gotoNext() {
				this.$store.dispatch('Setting/set_organInfo', {
					organName: this.priseName,
					organCode: this.replacecode,
					organId: this.organId
				})
				this.regParams.organId = this.organId
				this.$router.push({
					path: '/register2',
					query: this.regParams
				})
			},
			getorgan() {
				if (this.$store.state.Setting.sysConfig.organCode !== '') {
					this.organCode = this.$store.state.Setting.sysConfig.organCode
					this.$utils.api.user.getOrganInfo({ organCode: this.$store.state.Setting.sysConfig.organCode }).get().then(res => {
						this.priseName = res.data.organName
						this.organId = res.data.organId
						this.replacecode = this.$store.state.Setting.sysConfig.organCode
						this.$store.state.Setting.sysConfig.organCode ? this.isinto = true : this.isinto = false
					})
				} else {
					this.isinto = false
				}
			},
			filterHisorgan() {
				return this.$store.state.Setting.sysConfig.hisorganNameList.filter(item => {
					return item.organCode !== '000000'
				})
			}
		},
		mounted() {
			this.hisList = this.filterHisorgan()
			// this.$refs.search.addEventListener('input', this.debounce(e => this.searchHisname()))
			/* this.$refs.search.addEventListener('focus', () => {
				this.showsearch = true
				this.searchHisname()
			})*/
			this.$refs.search.focus()
			// this.$refs.search.addEventListener('blur', (e) => {
			// 	this.showsearch = false
			// })
		},
		beforeRouteEnter(to, from, next) {
			next()
			/* next(vm => {
				// 通过 `vm` 访问组件实例
				if (from.path === '/login' && to.query.type === 'login2') {
					vm.getorgan()
				} else if (to.query.type === 'login1' || (from.path === '/login' && to.query.type === 'reg')) {
					vm.isinto = false
					vm.organCode = ''
				} else {
					vm.getorgan()
				}
			})*/
		},
		watch: {
			showsearch() {
				if (document.activeElement === this.$refs.search) {
					this.showsearch = true
				} else {
					this.showsearch = false
				}
			}
		}
	}
</script>

<style lang="scss">
	.Enter_PriseId{
		.change-login-wrapper {
			position: absolute;
			top: 0px;
			right: 0px;
			width: 70px;
			height: 70px;
			&:hover {
				.hover-msg {
					display: block;
				}
			}
			.QR-code-login {
				width: 70px;
				height: 70px;
				@include retinize('erweima');
				background-size: cover;
				cursor: pointer;
				&:hover {
					@include retinize('erweimayiru');
				}
			}
			.routine-login {
				width: 70px;
				height: 70px;
				@include retinize('zhanghao');
				background-size: cover;
				cursor: pointer;
				&:hover {
					@include retinize('zhanghao2');
				}
			}
			.hover-msg {
				display: none;
				position: absolute;
				top: 10px;
				right: 60px;
				height: 34px;
				line-height: 34px;
				color: #fff;
				font-size: 12px;
				padding-left: 12px;
				@include retinize('xingzhuang596');
				background-size: cover;
				background-position: right center;
				border-radius: 5px 0 0 5px;
				padding-right: 20px;
				white-space:nowrap
			}
		}
		height: 100%;
		overflow: auto;
		position: relative;
		.form{
			text-align: center;
		}
		span{
			cursor: pointer;
		}
		h2{
			font-size: 16px;
			font-weight: bold;
			text-align: center;
		}
		/deep/ .ant-btn {
			width: 240px;
			height: 30px;
			padding: 0 5px;
			span {
				// color: #fff;
				font-size: 14px;
				line-height: 24px;
			}
		}
		.inputPrise{
			padding: 35px 30px 0;
			.goback_title{
				cursor: pointer;
				.iconfont{
					font-size: 14px;
				}
			}
			h2{
				margin: 60px 0 0;
				text-align: left;
				font-size: 22px;
				font-weight: bold;
			}
			p{
				font-size: 14px;
				color: #666666;
				text-align: left;
				margin: 8px 0 45px 0;
			}
			input{
				border-radius: 0;
				border: none;
				border-bottom: 1px solid #E6E6E6;
				width: 320px;
				font-size: 12px;
				padding: 5px 0px;
				&:focus {
					outline: none !important;
				}
			}
			input::-webkit-input-placeholder {
				color: #999999;
			}
			button{
				margin-bottom: 10px;
				text-align: center;
				width: 320px;
				height: 36px;
			}
			.goback{
				margin-left: 30px;
			}
		}
		.intoPrise{
			height: 100%;
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			.priselogo{
				display: block;
				width: 100px;
				height: 100px;
				margin: 0 auto 34px;
				background:-webkit-gradient(linear, 0% 0%, 0% 100%, from(#319ff7), to(#2a89f8));
				font-size: 40px;
				color: #ffffff;
				border-radius: 50%;
				display: flex;
				justify-content: center;
				align-items: center;
			}
			button{
				width: 320px;
				height: 36px;
			}
			h2{
				width: 280px;
				margin: 0 auto 66px;
			}
			.goback{
				display: block;
				text-align: left;
				margin-left: 30px;
				margin-top: 15px;
			}
			p{
				font-size: 14px;
				width: 300px;
				line-height: 40px;
				height: 40px;
				text-align: center;
				position: fixed;
				right: 170px;
				bottom: 7px;
				color: #999999;
				span{
					color: #2E87FF;
				}
			}
		}
	}
	.Name_left, .Name_right{
		width: 208px;
		display: inline-block;
		vertical-align: bottom;
		overflow: hidden;
		font-size: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 25px;
	}
	.Name_right{
		float: right;
		width: 80px;
		// margin-left: 20px;
		line-height: 25px;
		.iconcuo{
			font-size: 8px;
			color: #9a9a9a;
			background: #e6e6e6;
			border-radius: 50%;
			margin-left: 10px;
			display: inline-block;
			width: 14px;
			height: 14px;
			margin-bottom: 1px;
			line-height: 14px;
			text-align: center;
			vertical-align: middle;
			cursor: pointer;
		}
	}
</style>
