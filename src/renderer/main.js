import Vue from 'vue'
import i18n from './assets/lang'
import App from './App'
import router from './router'
import store from './store'
import directive from './directive'
import libraryImport from './plugins/libraryImport'
import AsyncComputed from 'vue-async-computed'
import Antd from 'ant-design-vue'
import { sync } from 'vuex-router-sync'
import utils from './utils/'
import * as filters from './filters'
import mixins from './mixins'
// import windowListener from './utils/electron/windowListener'
import 'ant-design-vue/dist/antd.css'
import VueQriously from 'vue-qriously'
import ref from 'vue-ref'
import logger from '../utils/logger'
import { crashReports } from '~/utils/crashReporter'

// electron内置崩溃收集
crashReports()
logger()
require('./assets/style/' + process.env.PROJECT_NAME + '.scss')

Vue.use(ref, { name: 'ant-ref' })
Vue.prototype.$PROJECT_NAME = process.env.PROJECT_NAME
Vue.prototype.$WEB_CONFIG = process.env.webConfig
Vue.prototype.$CHAT_MSG_TYPE = process.env.webConfig.CHAT_MSG_TYPE
Vue.prototype.$ENV_CONFIG = process.env.ENV_CONFIG
Vue.prototype.$supportVideoType = process.env.webConfig.supportVideoType
Vue.prototype.$supportImageType = process.env.webConfig.supportImageType
Vue.prototype.$eventBus = new Vue()
Vue.config.productionTip = false
Vue.use(AsyncComputed)
Vue.use(Antd)
Vue.use(utils)
Vue.use(directive)
// Plugins
Vue.use(libraryImport)
// 二维码
Vue.use(VueQriously)
Vue.mixin(mixins)

// 过滤器
Object.keys(filters).forEach(key => {
	Vue.filter(key, filters[key])
})

// 保存初始状态
store.state.originState = JSON.parse(JSON.stringify(store.state))
// console.log('originState:', store.state.originState)

// windowListener(Vue)
sync(store, router)

/* eslint-disable no-new */
const vm = new Vue({
	components: { App },
	i18n,
	router,
	store,
	template: '<App/>'
}).$mount('#app')

vm.$message.config({ maxCount: 1 })
