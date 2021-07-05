import utils from '~/utils/'
import { ipcRenderer } from 'electron'
// const axios = require('@/utils/common/axios')
const methods = [
	'selectData',
	'insertData',
	'updateData',
	'deleteData',

	'setConfig',
	'getConfig',

	'setAccountInfo',
	'getAccountInfo',

	'getThreadData',
	'insertThreadData',
	'deleteThreadData',
	'updateThreadData',

	'getChatData',
	'insertChatData',
	'updateChatData',
	'deleteChatData',
	'deleteChatTable',

	'insertLastMessage',
	'getLastMessage',

	'getCollectData',
	'insertCollectData',
	'updateCollectData',
	'deleteCollectData',
	'getUserConfig',
	'setUserConfig',

	'userDbBeginTransaction', // 用户数据库事务开始
	'userDbEndTransaction', // 用户数据库事务处理完成
	'userDbRollBackTransaction' // 用户数据库事务回滚

]
const a = {}
for (let i = 0; i < methods.length; i++) {
	a[methods[i]] = function(params) {
		return new Promise((resolve, reject) => {
			/* axios.post(`/sqlite/${methods[i]}`, { param: [...arguments] }).then(data => {
				if (data.code === 0) {
					// console.info(`sqlite@${methods[i]}#info:${JSON.stringify(data)}`)
					data.data ? resolve(data.data) : resolve(data)
				} else {
					console.warn(`sqlite@${methods[i]}#error:${JSON.stringify(data)}`)
					reject(data)
				}
			}).catch(e => {
				resolve(e)
			})*/
			const id = utils.randomId()
			ipcRenderer.send('sqlite', { id, type: methods[i], params: [...arguments] })
			ipcRenderer.once('sqlite-' + methods[i] + '-reply-' + id, function replay(event, data) {
				if (data.code === 0) {
					// console.info(`sqlite@${methods[i]}#info:${JSON.stringify(data)}`)
					data.data ? resolve(data.data) : resolve(data)
				} else {
					console.warn(`sqlite@${methods[i]}#error:${JSON.stringify(data)}`)
					reject(data)
				}
			})
		})
	}
}
module.exports = a
