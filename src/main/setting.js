import fs from 'fs'

export const initAppFolder = App => () => {
	if (!fs.existsSync(App.appUserDataPath)) fs.mkdirSync(App.appUserDataPath)
	if (!fs.existsSync(App.logsPath)) fs.mkdirSync(App.logsPath)
	if (!fs.existsSync(App.updatePath)) fs.mkdirSync(App.updatePath)
}
