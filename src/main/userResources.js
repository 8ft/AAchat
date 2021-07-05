// 初始化用户数据
import utils from '~/utils/'
import path from 'path'
import fs from 'fs'
import { ipcMain } from 'electron'

const md5UserId = (userId) => {
	const MD51userId = utils.md5(userId)
	const MD52userId = utils.md5(MD51userId.substr(0, 10) + MD51userId + MD51userId.substr(14, MD51userId.length - 1))
	return MD52userId
}

export default App => async() => {
	ipcMain.on('userResources', async(event, arg) => {
		try {
			const userId = arg.userId
			const MD52userId = md5UserId(userId)
			const MD53userId = md5UserId(userId.split('_')[0])
			const dataPath = path.resolve(App.appUserDataPath, 'data')
			const emojisPath = path.resolve(dataPath, 'emojis')// 缓存文件夹 - 表情
			const userEmojisPath = path.resolve(emojisPath, MD53userId)// 缓存文件夹 - 用户表情
			const accountPath = path.resolve(dataPath, MD52userId)// 账户主文件夹
			const cachesPath = path.resolve(accountPath, 'Caches')// 缓存文件夹
			const imagesPath = path.resolve(cachesPath, 'images')// 缓存文件夹 - 图片
			const voicesPath = path.resolve(cachesPath, 'voices')// 缓存文件夹 - 语音
			const videosPath = path.resolve(cachesPath, 'videos')// 缓存文件夹 - 视频
			const otherFilesPath = path.resolve(cachesPath, 'otherFiles')// 缓存文件夹 - 其他文件

			let isInit = false// 是否第一次创建
			if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath)
			if (!fs.existsSync(accountPath)) {
				isInit = true
				fs.mkdirSync(accountPath)
			}
			if (!fs.existsSync(cachesPath)) fs.mkdirSync(cachesPath)
			if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath)
			if (!fs.existsSync(emojisPath)) fs.mkdirSync(emojisPath)
			if (!fs.existsSync(userEmojisPath)) fs.mkdirSync(userEmojisPath)
			if (!fs.existsSync(voicesPath)) fs.mkdirSync(voicesPath)
			if (!fs.existsSync(videosPath)) fs.mkdirSync(videosPath)
			if (!fs.existsSync(otherFilesPath)) fs.mkdirSync(otherFilesPath)
			App.userDataPath = accountPath
			App.imagesPath = imagesPath
			App.emojisPath = userEmojisPath
			App.voicesPath = voicesPath
			App.videosPath = videosPath
			App.otherFilesPath = otherFilesPath
			global.userDataPath = {
				root: accountPath,
				cachesPath,
				imagesPath,
				emojisPath: userEmojisPath,
				voicesPath,
				videosPath,
				otherFilesPath
			}
			await App.sqliteDb.initUserDb(accountPath, userId.split('_')[0])
			// 2.4.0开始，用户表情表从用户数据库移到共用的setting数据库里
			// 查询用户数据库里是否存在表情表
			/* const hasEmojisTable = await App.sqliteDb.isExistTable('emojis', 'user')
			if (hasEmojisTable) {
				const emojis = await App.sqliteDb.selectData({
					tableName: 'emojis',
					db: 'user'
				})
				if (emojis.code == 0 && emojis.data.length) {
					await App.sqliteDb.userDbBeginTransaction()
					for (const item of emojis.data) {
						try {
							await App.sqliteDb.insertData('emojis_' + userId.split('_')[0], item, 'config')
							await App.sqliteDb.deleteData({
								tableName: 'emojis',
								where: `id='${item.id}'`,
								db: 'user'
							})
						} catch (e) {
							console.log('import::::', item)
							console.log('import::::', e)
						}
					}
					await App.sqliteDb.deleteTable({
						tableName: 'emojis',
						db: 'user'
					})
					await App.sqliteDb.userDbEndTransaction()
				}
			}*/
			if (arg.userInfo) {
				await App.getAccountInfo()
				await App.setAccountInfo(arg.userInfo)
			}
			App.isLogout = false
			event.sender.send('userResources-reply', { code: 0, isInit })
		} catch (e) {
			console.error('userResources@', e)
			event.sender.send('userResources-reply', { code: 999999, message: '系统错误，请重试' })
		}
	})
}
