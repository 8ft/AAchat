<!--/**
* author:huangtianhe
* time: 2019-07-16
* usage: <custom-select
  @selectResault="_selectResault" // 选择后触发的派发事件
  :defaultAreaCode="初始化areaCode"
  ></custom-select>
**/-->
<template>
	<div class="select-container">
		<div class="select-wrapper" ref="selectDropdown">
			<div @click="isShowSelect = !isShowSelect;_initPosition()" class="select-tmp">
				<span class="select-text">{{selectResult}}</span>
				<i class="iconfont iconxiala" :class="isShowSelect ? 'rotate' : ''"></i>
			</div>
			<!-- 选择下拉框 -->
			<div v-show="isShowSelect" class="select-dropdown">
				<div class="scrollbar">
					<div class="search-box">
						<i class="iconfont iconsousuo"></i>
						<input v-model="searchValue" ref="search" type="text" :placeholder="$t('common.search')">
					</div>
					<ul class="scroll-outer" ref="queryDown">
						<li v-for="(item, index) in selectOptons" :key="index">
							<strong class="group-name">{{item.groupName}}</strong>
							<!-- 如果点击需要高亮，可以在li里面加个点击遮罩 -->
							<ul>
								<li ref="selectItems" v-for="child in item.list" :key="child.value" @click="_select(child.value)"
									class="select-item" :value="child.value" :class="{selected: selectResult == child.value}"
								>
									<span :value="child.value" v-html="child.name"></span>
									<span :value="child.value" v-html="child.code"></span>
								</li>
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	/* eslint vue/require-prop-type-constructor: */
	import { DEFAULT_LANG } from '~/lang/index'
	export default {
		name: 'CustomSelect',
		props: {
			defaultAreaCode: String,
			defalut: ''
		},
		data() {
			return {
				isShowSelect: false,
				searchValue: '',
				selectResult: '+86',
				selectOptons: [],
				selectList: []
			}
		},
		mounted() {
			this.selectResult = this.defaultAreaCode || '+86'
			this._getSelectList()
			document.addEventListener('click', this._queryHide)
			this.$refs.search.addEventListener('input', this.debounce(e => this.handleInput(this.searchValue)))
		},
		watch: {
			'$store.state.Setting.lang'() {
				this._getSelectList()
			}
		},
		beforeDestroy() {
			document.removeEventListener('click', this._queryHide)
		},
		methods: {
			async _getSelectList() {
				let telephoneCode = this.$store.state.Setting.sysConfig.telephoneCode[this.$store.state.Setting.lang || DEFAULT_LANG]
				if (!telephoneCode) {
					telephoneCode = (await this.$utils.api.public.getOneDicts({ dictType: 'telephone_code' }).get()).data
					const update = {}
					update[this.$store.state.Setting.lang] = telephoneCode
					await this.$utils.fun.setSysConfig({
						telephoneCode: update
					})
					this.$store.dispatch('Setting/set_sysConfig', {
						data: await this.$utils.fun.getSysConfig()
					})
				}
				this.selectList = this._formatList(telephoneCode)
				this.selectOptons = this._formatList(telephoneCode) // 按字母归类
				/* this.$nextTick(() => {
					this._initPosition()
				})
				this.handleInput(this.searchValue)*/
			},
			// 下拉框关闭
			_queryHide(e) {
				if (!this.$refs.selectDropdown.contains(e.target)) this.isShowSelect = false
			},
			_select(value) {
				this.selectResult = value
				this.isShowSelect = false
				this.$emit('selectResault', this.selectResult)
			},
			// 防抖
			debounce(fn, timeout = 300) {
				let timer
				return (...args) => {
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => {
						fn.apply(fn, args)
					}, timeout)
				}
			},
			// 搜索
			handleInput(value) {
				value = value.replace(/\+/g, '') // '+'号不参与检索
				if (!value) {
					this.selectOptons = this.selectList
					this.$nextTick(() => {
						this._initPosition()
					})
				} else {
					this.selectOptons = []
					this._clearAll()
					const reg = new RegExp(value, 'g')
					this.selectList.forEach(item => {
						const resaultObj = {
							groupName: item.groupName,
							list: []
						}
						item.list.forEach(obj => {
							// 匹配name或者code
							if (reg.test(obj.name) || reg.test(obj.code)) {
								resaultObj.list.push({
									name: obj.name.replace(reg, '<i style="color: #2D7BFF" value="' + obj.value + '">' + value + '</i>'),
									code: obj.code.replace(reg, '<i style="color: #2D7BFF" value="' + obj.value + '">' + value + '</i>'),
									value: obj.value // 选择用的值，不需要替换
								})
							}
						})
						// 有子集的存起来
						if (resaultObj.list.length > 0) {
							// 再次判断是否已经存过一次
							if (this.selectOptons.length > 0) {
								let hasBeing = false // 判断是否存过相同首字母的数组
								let num = 0 // 记录第几组相同
								for (let i = 0; i < this.selectOptons.length; i++) {
									if (this.selectOptons[i].groupName === resaultObj.groupName) {
										hasBeing = true
										num = i
										break
									}
								}
								if (hasBeing) {
									// 已存在相同首字母数组
									resaultObj.list.forEach(v => {
										this.selectOptons[num].list.push(v)
									})
								}
								this.selectOptons.push(resaultObj)
							} else this.selectOptons.push(resaultObj)
						}
					})
					// 清空的时候，原数组最后一组数据会重复，需要清理
					if (!value) this.selectOptons = this.selectOptons.slice(0, this.selectOptons.length - 1)
				}
			},
			// 字母分组归类
			_formatList(arr) {
				const resuleList = []
				for (let i = 0; i < 26; i++) {
					const key = String.fromCharCode(65 + i) // A-Z赋给key当作键
					const map = {}
					map[key] = {
						groupName: key,
						list: []
					}
					arr.map((v, k) => {
						const firstIndex = v.spell // 首字母
						if (firstIndex.toUpperCase() === key) {
							map[key].list.push({ name: v.dictName, code: v.dictValue, value: v.dictValue }) // push进相对应的数组里头
						}
					})
					// 如果当前的数组里头为空，则跳过。
					if (map[key].list === undefined || map[key].list.length === 0) continue
					else resuleList.push(map[key]) // 将分类好的每个对象 合并在一个数组里面
				}
				return resuleList
			},
			// 已选下拉框回显高亮
			_initPosition() {
				const domArr = this.$refs.selectItems
				for (let i = 0; i < domArr.length; i++) {
					// 找到回显的节点
					if (this.selectResult === domArr[i].attributes[1].value) {
						this.$nextTick(() => {
							this.$refs.queryDown.scrollTop = domArr[i].offsetTop - 140
						})
						break
					}
				}
			},
			// 清空高亮
			_clearAll() {
				// this.selectResult = ''
			}
		}
	}
</script>

<style lang="scss" scoped>
  .select-container {
    .select-wrapper {
      position: relative;
      width: 70px;
      height: 40px;
      margin-top: 1px;
      color: #333;
      font-size: 14px;
      user-select: none;
	    -webkit-app-region: no-drag;
      &::after {
        content: '';
        position: absolute;
        top: 13px;
        right: 6px;
        width: 1px;
        height: 16px;
        background: #E6E6E6;
      }
      .select-tmp {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 70px;
        height: 40px;
        padding-right: 12px;
        cursor: pointer;
        .select-text {
          color: #333;
          font-size: 14px;
        }
        i {
          font-size: 12px;
          transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
          &.rotate {
            transform: rotate(180deg);
          }
        }
      }
      .select-dropdown {
        position: absolute;
        top: 50px;
        left: 20px;
        width: 220px;
        padding-left: 5px;
        background: rgba(255, 255, 255, 1);
        /*border:1px solid rgba(229,229,229,1);*/
        box-shadow: 0px 1px 5px 1px #e5e5e5;
        border-radius: 4px;
        z-index: 1;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
	      -webkit-app-region: no-drag;
        .scrollbar {
          height: 160px;
          .search-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 209px;
            height: 24px;
            margin: 8px 0;
            background: rgba(248, 248, 248, 1);
            border: 1px solid rgba(240, 240, 240, 1);
            border-radius: 4px;
            i {
              margin: 0 8px 0 10px;
              font-size: 12px;
              color: #999;
              cursor: pointer;
            }
            input::-webkit-input-placeholder {
              color: #999;
              font-size: 12px;
            }
            input {
              flex: 1;
              height: 14px;
              font-size: 12px;
              color: #333;
              &:focus {
                outline: none !important;
              }
            }
          }
          ul {
            margin: 0;
            padding: 0;
          }
          .scroll-outer {
            overflow-y: auto;
            overflow-x: hidden;
            height: 126px;
            .group-name {
              margin-left: 6px;
              color: #333;
              font-size: 14px;
              font-family: PingFang SC;
              font-weight: 400;
              color: rgba(153, 153, 153, 1);
            }
            .select-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              height: 20px;
              padding: 12px 6px;
              font-size: 14px;
              color: #333;
              line-height: 20px;
              cursor: pointer;
              user-select: none;
              &:hover {
                background-color: #f5f7fa;
              }
              &.selected {
                background-color: #f5f7fa;
                span {
                  color: #2E87FF;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
