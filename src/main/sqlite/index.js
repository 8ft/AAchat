import path from 'path'
import { ipcMain } from 'electron'
import utils from '~/utils'
import * as tableConfig from './config'
import telephoneCode from '../telephoneCode'
// import { Column } from 'ant-design-vue/types/table/column'
// import { duration } from 'moment'
const sqlite3 = require('@journeyapps/sqlcipher').verbose()
export default class Index {
	_App = null
	// 配置数据库名
	configDbName = process.platform !== 'darwin' ? 'setting.dll' : 'setting.dylib'
	// 用户数据库名
	userDbName = process.platform !== 'darwin' ? 'data.dll' : 'data.dylib'
	// 配置数据库链接
	configDb = null
	// 用户数据库链接
	userDb = null

	constructor({ App }) {
		this._App = App
		this.initIpcMain()
	}

	initIpcMain() {
		ipcMain.on('sqlite', async(event, arg) => {
			var data
			const type = arg.type
			try {
				if (arg.params && arg.params.length) {
					data = await this[type](...arg.params)
				} else {
					data = await this[type]()
				}
				/* arg.params = arg.params || {}
				switch(arg.type) {
					case 'deleteChatData':
						data = await this[type](arg.params.tableName, arg.params.where)
						break
					case 'getChatData':
						data = await this[type](arg.params.tableName, arg.params.where, arg.params.order)
						break
					case 'updateChatData':
						data = await this[type](arg.params.tableName, arg.params.data, arg.params.where)
						break
					case 'getThreadData':
						data = await this[type](arg.params.where, arg.params.order)
						break
					case 'updateThreadData':
						data = await this[type](arg.params.data, arg.params.where)
						break
					default:
						data = await this[type](arg.params || '')
						data = await this[type](...arg.params)
				}*/
				if (process.env.ENV_CONFIG !== 'prod') console.log('sqlite:', type, 'success')
			} catch (e) {
				data = { code: 999999, type, message: e }
				console.error('sqlite:', type, e)
			}
			event.sender.send('sqlite-' + type + '-reply-' + arg.id, data)
		})
	}

	close() {
		try {
			this.closeConfigDB()
			this.closeUserDB()
		} catch (e) {
			console.error(e)
		}
	}

	closeConfigDB() {
		if (this.configDb) {
			try {
				this.configDb.close()
			} catch (e) {
				console.error('closeConfigDB@', e)
			}
		}
	}
	userDbBeginTransaction() {
		this.userDb.run('BEGIN;')
		return Promise.resolve({ code: 0 })
	}
	userDbRollBackTransaction() {
		this.userDb.run('ROLLBACK;')
		return Promise.resolve({ code: 0 })
	}
	userDbEndTransaction() {
		this.userDb.run('COMMIT;')
		return Promise.resolve({ code: 0 })
	}

	closeUserDB() {
		if (this.userDb) {
			try {
				this.userDb.close()
				this.userDb = null
			} catch (e) {
				console.error('closeUserDB@', e)
			}
		}
	}

	connSetting(databasePath) {
		return new Promise(async(resolve, reject) => {
			try {
				const db = new sqlite3.Database(databasePath)
				await this.runSql(`PRAGMA KEY='${process.env.webConfig.DBPD}'`, db) // 加密
				// await this.runSql(`PRAGMA foreign_keys = ON`, db) // 开启外键功能
				// 'FOREIGN KEY (threadID) REFERENCES threads(id) ON DELETE CASCADE ON UPDATE CASCADE'

				db.transaction_level = 8
				resolve(db)
			} catch (e) {
				reject(e)
			}
		})
	}

	runSql(sql, db) {
		return new Promise((resolve, reject) => {
			db.run(sql, (err) => {
				if (err) {
					reject(err)
				} else {
					resolve(db)
				}
			})
		})
	}

	getConfig() {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'sysConfig',
					order: 'DBid DESC',
					limit: 1,
					db: this.configDb
				})
				data[0].autoLogin = data[0].autoLogin === 'true'
				data[0].isECodeMust = data[0].isECodeMust === 'true'
				resolve({ code: 0, data: data[0] })
			} catch (e) {
				reject(e)
			}
		})
	}
	getUserConfig(userId) { // 用户多企业共用配置
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'config_' + userId,
					order: 'DBid DESC',
					limit: 1,
					db: this.configDb
				})
				resolve({ code: 0, data: data[0] })
			} catch (e) {
				reject(e)
			}
		})
	}
	setUserConfig(data, userId) {
		return new Promise(async(resolve, reject) => {
			try {
				await this.updateData({
					tableName: 'config_' + userId,
					data,
					where: 'DBid=(select DBid from config_' + userId + ' order by DBid desc limit 1)',
					db: this.configDb
				})
				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}
	setConfig(config) {
		return new Promise(async(resolve, reject) => {
			try {
				if (config.autoLogin !== undefined && config.autoLogin !== null) config.autoLogin = config.autoLogin.toString()
				if (config.isECodeMust !== undefined && config.isECodeMust !== null) config.isECodeMust = config.isECodeMust.toString()
				await this.updateData({
					tableName: 'sysConfig',
					data: config,
					where: 'DBid=(select DBid from sysConfig order by DBid desc limit 1)',
					db: this.configDb
				})
				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}

	getAccountInfo() {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'userInfo',
					order: 'DBid DESC',
					limit: 1,
					db: this.userDb
				})
				if (data[0].userNoticeConfig && utils.isJSONString(data[0].userNoticeConfig)) {
					data[0].userNoticeConfig = JSON.parse(data[0].userNoticeConfig)
				} else {
					data[0].userNoticeConfig = {}
				}
				if (data[0].userSecurityConfig && utils.isJSONString(data[0].userSecurityConfig)) {
					data[0].userSecurityConfig = JSON.parse(data[0].userSecurityConfig)
				} else {
					data[0].userSecurityConfig = {}
				}
				resolve({ code: 0, data: data[0] })
			} catch (e) {
				reject(e)
			}
		})
	}

	setAccountInfo(data) {
		return new Promise(async(resolve, reject) => {
			if (!this.userDb) {
				resolve({ code: 0 })
				return
			}
			try {
				await this.updateData({
					tableName: 'userInfo',
					data,
					where: 'DBid=(select DBid from userInfo order by DBid desc limit 1)',
					db: this.userDb
				})
				resolve({ code: 0 })
			} catch (e) {
				console.error('setAccountInfo@:', e)
				reject(e)
			}
		})
	}
	formatTable(tableData) {
		const tempTable = []
		for (const key in tableData) {
			tempTable.push(`${key} ${tableData[key]}`)
		}
		return tempTable
	}
	initConfigDb() {
		return new Promise(async(resolve, reject) => {
			try {
				this.configDb = await this.connSetting(path.join(this._App.appUserDataPath, this.configDbName))
				if (!(await this.isExistTable('sysConfig', this.configDb))) {
					await this.createTable('sysConfig', this.formatTable(tableConfig.sysConfigTable), this.configDb)
					await this.insertData('sysConfig', {
						appEnv: process.env.webConfig.ENV_CONFIG + '_' + process.env.webConfig.PROJECT_NAME,
						lastLogin: '',
						apiUrlConfig: process.env.webConfig.APIURLCONFIG,
						appVersion: process.env.webConfig.VERSION
					}, this.configDb)
				} else {
					// 2.2.0覆盖安装，用于升级数据库电话区号字段
					const sysConfig = await this.getConfig()
					const currentAppVersion = sysConfig.data.appVersion.split('.')
					const newAppVersion = process.env.webConfig.VERSION.split('.')
					if (currentAppVersion[0] <= newAppVersion[0] && currentAppVersion[1] < newAppVersion[1]) {
						await this.setConfig({
							telephoneCode: telephoneCode
						})
					}
				}
				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}

	initUserDb(userAccount, userId) { // userId不带企业id
		return new Promise(async(resolve, reject) => {
			try {
				this.userDb = await this.connSetting(path.join(userAccount, this.userDbName))

				if (!(await this.isExistTable('userInfo', this.userDb))) {
					// 创建用户信息表
					await this.createTable('userInfo', this.formatTable(tableConfig.userInfoTable), this.userDb)
					await this.insertData('userInfo', { token: '' }, this.userDb)
				}

				// 创建用户配置表
				await this.createTable('userConfig', this.formatTable(tableConfig.userConfigTable), this.userDb)

				// 创建会话表
				await this.createTable('threads', this.formatTable(tableConfig.threadsTable), this.userDb)

				// 创建聊天记录表
				await this.createTable('messages', this.formatTable(tableConfig.messagesTable), this.userDb)

				// 创建收藏记录表
				await this.createTable('collects', this.formatTable(tableConfig.collectsTable), this.userDb)

				// 创建表情表,表情需要多企业共享，所以表情表存在系统配置里
				await this.createTable('emojis_' + userId, this.formatTable(tableConfig.emojisTable), this.configDb)
				// 创建用户配置表,用于需要多企业共享的配置
				if (!(await this.isExistTable('config_' + userId, this.configDb))) {
					await this.createTable('config_' + userId, this.formatTable(tableConfig.configTable), this.configDb)
					await this.insertData('config_' + userId, { showThreadCreateOrganBanner: 1 }, this.configDb)
				}
				// 如果数据库版本小于某个版本，则按顺序更新到最新版本
				const accountInfo = (await this.getAccountInfo()).data
				const currentVersion = accountInfo.dbVersion
				// if (!currentVersion||currentVersion < 20200671) { await this.updateDB_20200671() }
				if (!currentVersion || currentVersion < 20200917) { await this.updateDB_20200917() }

				// 添加索引
				// const indexs = await this.getAllIndex(this.userDb)
				// if (indexs.data && indexs.data.length && !indexs.data.some(index => {
				// 	return index.name == 'message_loadmore'
				// })) {
				// 	const sql = 'CREATE INDEX message_loadmore on messages (threadID,timestamp)'
				// 	await this.addIndex({ sql, db: this.userDb })
				// }

				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}

	updateDB_20200671() {
		// const dbVersion=20200671
		// if (!(await this.isExistTable(`messages${dbVersion}`, this.userDb))) {
		// 	// 重命名聊天记录表，用作备份
		// 	await this.updateTableName({ tableName: 'messages', newName: `messages${dbVersion}`, db: this.userDb })
		// }

		// // 创建新聊天记录表
		// await this.createTable('messages', this.formatTable(tableConfig.messagesTable), this.userDb)

		// // 防止用户中途退出，再次执行拷贝出错，得先删除数据
		// await this.deleteData({
		// 	tableName: 'messages',
		// 	db: this.userDb
		// })

		// // 过滤列,只插入新表存在的列
		// const newColumnsData = (await this.getTableColumns({ tableName: `messages`, db: this.userDb })).data
		// const newColumns = []
		// newColumnsData.forEach(column => {
		// 	if (column.name != 'DBid') {
		// 		newColumns.push(column.name)
		// 	}
		// })
		// console.log('newColumns', newColumns)

		// const columnsData = (await this.getTableColumns({ tableName: `messages${dbVersion}`, db: this.userDb })).data
		// const columns = []
		// columnsData.map(column => {
		// 	if (column.name != 'DBid' && newColumns.includes(column.name)) {
		// 		columns.push(column.name)
		// 	}
		// })
		// console.log('columns', columns)

		// // 拷贝聊天记录
		// await this.copyDataFromTable({ from: `messages${dbVersion}`, to: 'messages', columns: columns.join(','), db: this.userDb })

		// 更新文件数据
		// const fileMessages = (await this.getChatData({
		// 	where: 'cForm in (102,103,105)'
		// })).data

		// let msg
		// for (let i = 0; i < fileMessages.length; i++) {
		// 	msg = fileMessages[i]
		// 	if (msg.data.url && !msg.url) {
		// 		const updatingData = {
		// 			fileName: msg.data.fileName || '',
		// 			fileNameIndex: -1,
		// 			newFileName: '',
		// 			ext: msg.data.ext || '',
		// 			fileSize: msg.data.fileSize ? parseInt(msg.data.fileSize) : 0,
		// 			width: msg.data.width || 0,
		// 			height: msg.data.height || 0,
		// 			url: msg.data.url || '',
		// 			localPath: msg.data.localPath || '',
		// 			thumbnail: msg.data.thumbnail || '',
		// 			isEncode: msg.data.isEncode || 1,
		// 			duration: msg.data.duration ? parseInt(msg.data.duration) : 0
		// 		}

		// 		await this.updateChatData({
		// 			data: updatingData,
		// 			where: `id='${msg.id}'`
		// 		})
		// 	}
		// }

		// 更新版本号
		// await this.setAccountInfo({ dbVersion: 20200671 })
	}

	// v2.3	messages表新增originID字段,在此将历史消息的id赋值给originID
	updateDB_20200917() {
		return new Promise(async(resolve, reject) => {
			let columns = await this.getTableColumns({ tableName: 'messages', db: this.userDb })
			let existColumn = false
			if (columns.code == 0 && columns.data.length) {
				columns = columns.data
				existColumn = columns.some(column => {
					return column.name === 'originID'
				})
			}

			if (!existColumn) {
				await this.addColumn('messages', 'originID', this.userDb)
			}

			const sql = 'update messages set originID = id'
			await this.userDb.run(sql)
			// 更新版本号
			await this.setAccountInfo({ dbVersion: 20200917 })
			resolve({ code: 0 })
		})
	}

	getAllIndex(db) {
		return new Promise(async(resolve, reject) => {
			const sql = "SELECT * FROM sqlite_master WHERE type = 'index'"
			db.all(sql, (err, data) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0, data })
				}
			})
		})
	}

	addIndex({ sql, db }) {
		return new Promise(async(resolve, reject) => {
			if (process.env.ENV_CONFIG !== 'prod') console.log('添加索引', sql)
			db.run(sql, (err, data) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	getTableColumns({ tableName, db }) {
		return new Promise(async(resolve, reject) => {
			const sql = `PRAGMA table_info('${tableName}')`
			db.all(sql, (err, data) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0, data })
				}
			})
		})
	}

	copyDataFromTable({ from, to, columns, db }) {
		return new Promise(async(resolve, reject) => {
			let sql = `insert into ${to} select * from ${from}`
			if (columns) {
			 sql = `insert into ${to} (${columns}) select ${columns} from ${from}`
			}

			db.run(sql, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	getLastMessage() {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'userConfig',
					order: 'DBid DESC',
					limit: 1,
					db: this.userDb
				})
				resolve({ code: 0, data: data[0] })
			} catch (e) {
				reject(e)
			}
		})
	}

	insertLastMessage(payload) {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'userConfig',
					order: 'DBid DESC',
					limit: 1,
					db: this.userDb
				})
				if (data.length) {
					await this.updateData({
						tableName: 'userConfig',
						data: payload,
						where: 'DBid=(select DBid from userConfig order by DBid desc limit 1)',
						db: this.userDb
					})
				} else {
					await this.insertData('userConfig', payload, this.userDb)
				}
				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}

	// 获取会话数据
	getThreadData(where, order) {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'threads',
					where,
					order,
					db: this.userDb
				})
				resolve({ code: 0, data })
			} catch (e) {
				reject(e)
			}
		})
	}

	// 插入会话数据
	insertThreadData(data) {
		return new Promise(async(resolve, reject) => {
			this.insertData('threads', data, this.userDb)
				.then(res => {
					resolve({ code: 0 })
				}).catch(e => {
				reject(e)
			})
		})
	}

	// 修改会话数据
	updateThreadData(data, where) {
		return new Promise(async(resolve, reject) => {
			if (!data) return resolve({ code: 0 })
			try {
				await this.updateData({
					tableName: 'threads',
					data,
					where,
					db: this.userDb
				})
				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}

	// 删除会话数据
	deleteThreadData({ threadID }) {
		return new Promise(async(resolve, reject) => {
		Promise.all([
				this.deleteData({
					tableName: 'threads',
					where: `id ${threadID}`,
					db: this.userDb
				}),
				this.deleteChatData({ where: `threadID ${threadID}` })
			]).then(res => {
				resolve({ code: 0 })
			}).catch(e => {
				reject(e)
			})
		})
	}

	// 插入聊天数据
	insertChatData(data, updatingThreadData) {
		return new Promise(async(resolve, reject) => {
			Promise.all([
				this.insertData('messages', data, this.userDb),
				this.updateThreadData(updatingThreadData, `id='${data.threadID}'`)
			]).then(res => {
				resolve({ code: 0 })
			}).catch(e => {
				reject(e)
			})
		})
	}

	// 修改聊天数据
	updateChatData({ data, where, updaingThreadData }) {
		return new Promise(async(resolve, reject) => {
			const actions = []

			if (updaingThreadData) {
				// this.userDb.run('BEGIN;')
				actions.push(this.updateThreadData(updaingThreadData, `id='${updaingThreadData.id}'`))
			}

			actions.push(
				this.updateData({
					tableName: 'messages',
					data,
					where,
					db: this.userDb
				})
			)

			Promise.all(actions).then(res => {
				// updaingThreadData && (this.userDb.run('COMMIT;'))
				resolve({ code: 0 })
			}).catch(e => {
				// updaingThreadData && (this.userDb.run('ROLLBACK;'))
				reject(e)
			})
		})
	}

	// 删除聊天数据
	deleteChatData({ id, where, updatingThreadData }) {
		return new Promise(async(resolve, reject) => {
			const actions = []

			if (updatingThreadData) {
				// this.userDb.run('BEGIN;')
				actions.push(this.updateThreadData(updatingThreadData, `id='${updatingThreadData.id}'`))
			}

			actions.push(
				this.deleteData({
					tableName: 'messages',
					where: id ? `id='${id}'` : where,
					db: this.userDb
				})
			)

			Promise.all(actions).then(res => {
				// updatingThreadData && (this.userDb.run('COMMIT;'))
				resolve({ code: 0 })
			}).catch(e => {
				// updatingThreadData && (this.userDb.run('ROLLBACK;'))
				reject(e)
			})
		})
	}

	// 获取聊天数据
	getChatData({ select, where, order, size, index, returnCount, groupBy, params }) {
		return new Promise((resolve, reject) => {
			this.getData({
				tableName: 'messages',
				select,
				where,
				groupBy,
				order,
				db: this.userDb,
				limit: size,
				offset: index ? index * size : 0,
				params
			}).then(messages => {
				if (returnCount) {
					this.selectData({
						select: 'count(*)',
						tableName: 'messages',
						where,
						db: this.userDb
					}).then(res => {
						return resolve({
							 code: 0,
							 data: {
								 messages,
								 count: res.data[0]['count(*)']
								}
							})
					})
				} else {
					return resolve({ code: 0, data: messages })
				}
			}).catch(err => {
				const key = this.checkAddColumn(err.message)
				if (key) {
					let column = key
					if (tableConfig['messagesTable'][column]) {
						column += ' ' + tableConfig['messagesTable'][column]
						this.addColumn('messages', column, this.userDb).then(res => {
							return this.getChatData({ select, where, order, size, index, returnCount, groupBy, params })
						}).catch(e => {
							return reject(e)
						})
					} else {
						return reject(err)
					}
				} else {
					return reject(err)
				}
			})
		})
	}

	// 获取收藏数据
	getCollectData({ where, order, size, index }) {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.getData({
					tableName: 'collects',
					where,
					order,
					db: this.userDb,
					limit: size,
					offset: index ? index * size : 0
				})
				resolve({ code: 0, data })
			} catch (e) {
				reject(e)
			}
		})
	}

	// 插入收藏数据
	insertCollectData(data) {
		return new Promise(async(resolve, reject) => {
			this.insertData('collects', data, this.userDb)
				.then(res => {
					resolve({ code: 0 })
				}).catch(e => {
				reject(e)
			})
		})
	}

	// 修改收藏数据
	updateCollectData({ data, where }) {
		return new Promise(async(resolve, reject) => {
			if (!data) return resolve({ code: 0 })
			try {
				await this.updateData({
					tableName: 'collects',
					data,
					where,
					db: this.userDb
				})
				resolve({ code: 0 })
			} catch (e) {
				reject(e)
			}
		})
	}

	// 删除收藏数据
	deleteCollectData({ collectID, where }) {
		return new Promise(async(resolve, reject) => {
			this.deleteData({
				tableName: 'collects',
				where: collectID ? `id='${collectID}'` : where,
				db: this.userDb
			}).then(res => {
				resolve({ code: 0 })
			}).catch(e => {
				reject(e)
			})
		})
	}
	// 查找数据
	selectData({ select, tableName, join, where, order, limit, offset, db = 'user' }) {
		return new Promise((resolve, reject) => {
			if (db === 'user') {
				db = this.userDb
			} else if (db === 'config') {
				db = this.configDb
			}
			this.getData({
				select,
				join,
				tableName,
				where,
				order,
				limit,
				offset,
				db
			}).then(async messages => {
				resolve({ code: 0, data: messages })
			}).catch(e => {
				reject(e)
			})
		})
	}

	// 获取数据
	getData({ select, tableName, join, where, groupBy, order, limit, offset, db, params }) {
		let sql = `select ${select || '*'} from`
		if (tableName) sql = `${sql} ${tableName}`
		if (join) sql = `${sql} ${join}`
		if (where) sql = `${sql} where ${where}`
		if (groupBy) sql = `${sql} group by ${groupBy}`
		if (order) sql = `${sql} order by ${order}`
		if (limit) sql = `${sql} limit ${limit}`
		if (offset) sql = `${sql} offset ${offset}`
		if (process.env.ENV_CONFIG !== 'prod') {
			console.log(sql)
			console.log(params)
		}
		return new Promise(async(resolve, reject) => {
			db.all(sql, params || {}, (err, data) => {
				if (err) {
					reject({ code: 999999, message: err.toString() })
				} else {
					const arr = []
					let dataItem
					let dataItemVal

					for (let i = 0; i < data.length; i++) {
						dataItem = data[i]
						for (const key in dataItem) {
							dataItemVal = dataItem[key]
							if (typeof dataItemVal === 'string') {
								if (tableName !== 'sqlite_master' && /【obj】/.test(dataItemVal)) {
									dataItemVal = JSON.parse(dataItemVal.substr(5))
								}
								dataItem[key] = dataItemVal
							}
						}
						delete dataItem.DBid
						arr.push(dataItem)
					}
					resolve(arr)
				}
			})
		})
	}

	// 更新数据
	updateData({ tableName, data, where, db = 'user' }) {
		return new Promise((resolve, reject) => {
			if (db === 'user') {
				db = this.userDb
			} else if (db === 'config') {
				db = this.configDb
			}
			const tableConfigTableName = this.getTableName(tableName)
			let sql = []
			const params = []
			for (const key in data) {
				if (!tableConfig[tableConfigTableName][key]) continue // 过滤没在字典里的数据
				if (utils.isObject(data[key]) || utils.isArray(data[key])) {
					sql.push(`${key}=?`)
					params.push(`【obj】${JSON.stringify(data[key])}`)
				} else if (typeof data[key] === 'string') {
					sql.push(`${key}=?`)
					params.push(`${data[key]}`)
				} else if (data[key] === undefined) { // 如果字段没值，取表配置的默认值
					const keyData = tableConfig[tableConfigTableName][key].split(' ')
					sql.push(`${key}=?`)
					params.push(`${keyData[keyData.length - 1] === '""' ? '' : keyData[keyData.length - 1]}`)
				} else {
					if (key === 'unreadCount' && data[key] < 0) {
						sql.push(`unreadCount=?`)
						params.push(`unreadCount${data[key]}`)
					} else {
						sql.push(`${key}=?`)
						params.push(data[key])
					}
				}
			}
			const where1 = where ? ` where ${where}` : ''
			sql = sql.join(',')
			sql = `update ${tableName} set ${sql}${where1}`

			if (process.env.ENV_CONFIG !== 'prod') {
				console.log(sql)
				console.log(params)
			}
			db.run(sql, params, (err) => {
				if (err) {
					console.error(err)
					const key = this.checkAddColumn(err)
					if (key) {
						let column = key
						if (tableConfig[tableConfigTableName][column]) {
							column += ' ' + tableConfig[tableConfigTableName][column]
						} else {
							if (typeof data[key] === 'number') {
								column += ' integer DEFAULT 0'
							} else {
								column += ' text DEFAULT ""'
							}
						}
						this.addColumn(tableName, column, db).then(res => {
							this.updateData({ tableName, data, where, db }).then(res1 => resolve(res1)).catch(e1 => reject(e1))
						}).catch(e => {
							reject(e)
						})
					} else {
						reject({ code: 999999, message: err.toString(), sql })
					}
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}
	getTableName(tableName) {
		if (tableName.indexOf('emojis_') > -1) {
			tableName = 'emojisTable'
		} else if (tableName.indexOf('config_') > -1) {
			tableName = 'configTable'
		} else {
			tableName = tableName + 'Table'
		}
		return tableName
	}
	// 插入数据
	insertData(tableName, data, db = 'user') { // tableName表名，data插入数据的json，db数据库
		return new Promise((resolve, reject) => {
			if (db === 'user') {
				db = this.userDb
			} else if (db === 'config') {
				db = this.configDb
			}
			const tableConfigTableName = this.getTableName(tableName)
			let sql = 'insert into ' + tableName
			const columns = []
			const values = []
			const params = []
			for (const key in data) {
				if (!tableConfig[tableConfigTableName][key]) continue // 过滤没在字典里的数据
				columns.push(key)
				values.push('?')
				if (utils.isObject(data[key]) || utils.isArray(data[key])) {
					params.push(`【obj】${JSON.stringify(data[key])}`)
				} else if (typeof data[key] === 'string') {
					params.push(`${data[key]}`)
				} else if (data[key] === undefined) { // 如果字段没值，去表配置的默认值
					const keyData = tableConfig[tableConfigTableName][key].split(' ')
					params.push(`${keyData[keyData.length - 1] === '""' ? '' : keyData[keyData.length - 1]}`)
				} else {
					params.push(data[key])
				}
			}
			sql = `${sql} (${columns.join(',')}) values(${values.join(',')})`
			if (process.env.ENV_CONFIG !== 'prod') {
				console.log(sql)
				console.log(params)
			}

			db.run(sql, params, (err) => {
				if (err) {
					const key = this.checkAddColumn(err)
					if (key) {
						let column = key
						if (tableConfig[tableConfigTableName][column]) {
							column += ' ' + tableConfig[tableConfigTableName][column]
						} else {
							if (typeof data[key] === 'number') {
								column += ' integer DEFAULT 0'
							} else {
								column += ' text DEFAULT ""'
							}
						}
						this.addColumn(tableName, column, db).then(res => {
							this.insertData(tableName, data, db).then(res1 => resolve(res1)).catch(e1 => reject(e1))
						}).catch(e => {
							reject(e)
						})
					} else {
						reject({ code: 999999, message: err.toString(), sql })
					}
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	// 创建表
	createTable(tableName, data, db, foreignKey) { // tableName表名，data字段数组，db数据库
		return new Promise((resolve, reject) => {
			const sql = `create table if not exists ${tableName} (DBid integer PRIMARY KEY AUTOINCREMENT,${data.join(',')}${foreignKey ? `,${foreignKey}` : ''})`
			db.run(sql, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	// 删除表
	dropTable({ tableName, db }) { // tableName表名，data字段数组，db数据库
		return new Promise((resolve, reject) => {
			const sql = `drop table ${tableName}`
			if (!db) {
				db = this.userDb
			}
			db.run(sql, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	// 删除数据
	deleteData({ tableName, where, db = 'user' }) {
		return new Promise((resolve, reject) => {
			if (db === 'user') {
				db = this.userDb
			} else if (db === 'config') {
				db = this.configDb
			}
			let sql = `delete from ${tableName}`
			if (where) sql = `${sql} where ${where}`
			if (process.env.ENV_CONFIG !== 'prod') console.log(sql)
			db.run(sql, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}
	// 删除表
	deleteTable({ tableName, db = 'user' }) {
		return new Promise((resolve, reject) => {
			if (db === 'user') {
				db = this.userDb
			} else if (db === 'config') {
				db = this.configDb
			}
			db.run('drop table ' + tableName, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString() })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	// 查询表是否存在
	isExistTable(tableName, db = 'user') {
		return new Promise((resolve, reject) => {
			if (db === 'user') {
				db = this.userDb
			} else if (db === 'config') {
				db = this.configDb
			}
			db.all(`select COUNT(*) from sqlite_master where type='table' and name='${tableName}'`, (err, data) => {
				if (err) {
					reject({ code: 999999, message: err.toString() })
				} else {
					resolve(data[0]['COUNT(*)'] !== 0)
				}
			})
		})
	}

	// 插入新列
	addColumn(tableName, column, db) {
		return new Promise((resolve, reject) => {
			const sql = `alter table ${tableName} add ${column}`
			db.run(sql, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	// 修改表名
	updateTableName({ tableName, newName, db }) {
		return new Promise((resolve, reject) => {
			const sql = `alter table ${tableName} rename to ${newName}`
			if (process.env.ENV_CONFIG !== 'prod') console.log(sql)
			db.run(sql, (err) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve({ code: 0 })
				}
			})
		})
	}

	//
	checkAddColumn(err) {
		err = err.toString()
		var temp
		if (err.toLowerCase().indexOf('no such column') > -1) {
			temp = err.split('no such column:')
			return temp[1].trim()
		} else if (err.toLowerCase().indexOf('has no column named') > -1) {
			temp = err.split('has no column named')
			return temp[1].trim()
		} else {
			return ''
		}
	}

	// 查询记录数
	count(tableName, where, db) {
		return new Promise((resolve, reject) => {
			let sql = `select COUNT(*) AS count from ${tableName}`
			if (where) sql = sql = `${sql} where ${where}`
			db.all(sql, (err, data) => {
				if (err) {
					reject({ code: 999999, message: err.toString(), sql })
				} else {
					resolve(data[0].count)
				}
			})
		})
	}
}
