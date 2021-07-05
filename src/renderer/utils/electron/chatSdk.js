import utils from '~/utils/'
import { ipcRenderer } from 'electron'
// const axios = require('@/utils/common/axios')
const methods = require('~/c-shared/hermes/config').default
methods.initChat = ''
const apiMap = {}
for (const key in methods) {
	apiMap[key] = function() {
		const arg = arguments.length ? arguments : []
		return new Promise((resolve, reject) => {
			/* axios.post(`/chatSdk/${key}`, { param: [...arg] }).then(res => {
				resolve(res)
			}).catch(e => {
				resolve(e)
			})*/
			const id = utils.randomId()
			ipcRenderer.send('chatSdk', { type: key, id, param: [...arg] })
			ipcRenderer.once('chatSdk-' + key + '-reply-' + id, function reply(event, data) {
				// ipcRenderer.removeListener('chatSdk-' + key + '-reply-'+id, reply)
				/* if (typeof data !== 'object') {
					resolve(data)
				} else {
					if (data.code === 0) {
						resolve(data)
					} else {
						reject(data)
					}
				}*/
				// console.info(`chatSdk@${key}#info:${JSON.stringify(data)}`)
				resolve(data)
			})
		})
	}
}
module.exports = apiMap
