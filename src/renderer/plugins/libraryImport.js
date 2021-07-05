import lodash from 'lodash'
import moment from 'moment-timezone'

function install(Vue) {
	Object.defineProperty(window, '_', {
		value: lodash
	})
	Object.defineProperty(window, '$moment', {
		value: moment
	})
	Object.defineProperty(window, 'getServerTime', {
		value: async() => {
			// let standardTime = Vue.prototype.$utils.fun.getServerTime()
			return Vue.prototype.$utils.fun.getServerTime()
		}
	})
}

export default {
	install
}
