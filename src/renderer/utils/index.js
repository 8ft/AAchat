const utils = {}

// 引入通用工具
const commonUtils = require.context('./common', false, /\.js$/)
commonUtils.keys().forEach(key => {
	utils[key.replace(/(\.\/|\.js)/g, '')] = commonUtils(key)
})

// 引入环境特供工具
let envUtils
if (!process.env.IS_WEB) {
	envUtils = require.context('./electron', false, /\.js$/)
} else {
	envUtils = require.context('./web', false, /\.js$/)
}

envUtils.keys().forEach(key => {
	utils[key.replace(/(\.\/|\.js)/g, '')] = envUtils(key)
})

export default function install(Vue) {
	Vue.prototype.$utils = utils
}
export { utils }
