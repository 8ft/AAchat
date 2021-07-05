let config = require('./config')
const { spawn } = require('child_process')
const moment = require('moment')
config = JSON.parse(JSON.stringify(config.webConfig).replace(/\\"/g, ''))
const fs = require('fs')
const path = require('path')
let packageData = fs.readFileSync(path.join(__dirname, './package.json'), 'utf-8')
const maxMemory = process.platform !== 'darwin' ? '2048' : '4096'
const { PROJECT_NAME, ENV_CONFIG, VERSION } = config
if (packageData) {
	packageData = JSON.parse(packageData)
	packageData.name = PROJECT_NAME
	packageData.productName = PROJECT_NAME
	packageData.author = PROJECT_NAME
	packageData.description = PROJECT_NAME
	packageData.keywords = [
		'macOS',
		'Windows',
		PROJECT_NAME
	]
	packageData.scripts = {}
	packageData.scripts.postinstall = 'electron-builder install-app-deps'
	packageData.scripts['build:nsis'] = `cross-env PROJECT_NAME=${PROJECT_NAME} ENV_CONFIG=${ENV_CONFIG} node ./nsis-release/release.js`
	packageData.scripts['dev'] = `cross-env PROJECT_NAME=${PROJECT_NAME} ENV_CONFIG=${ENV_CONFIG} node --experimental-worker .electron-vue/dev-runner.js`
	packageData.scripts['build'] = `cross-env PROJECT_NAME=${PROJECT_NAME} ENV_CONFIG=${ENV_CONFIG} node ./electron-builder-config/build.js && cross-env PROJECT_NAME=${PROJECT_NAME} ENV_CONFIG=${ENV_CONFIG} node --max_old_space_size=${maxMemory} .electron-vue/build.js && electron-builder --config ./electron-builder-config/${PROJECT_NAME}.json && npm run build:nsis`
	packageData = JSON.stringify(packageData, null, 2)
	fs.writeFileSync(path.join(__dirname, './package.json'), packageData)
	fs.writeFileSync(path.join(__dirname, './version'), VERSION)
	const startTime = moment()
	console.log(':::::::开始:::::::')
	const ls = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', [`run`, process.env.RUN_CONFIG])
	ls.stdout.on('data', (data) => {
		console.log(data.toString('UTF-8'))
	})
	ls.stderr.on('data', (data) => {
		console.log(`stderr: ${data.toString('UTF-8')}`)
	})
	ls.on('close', (code) => {
		const duration = moment.duration(moment().diff(startTime))
		console.log(`:::::::结束:::::::，时长:${duration.get('hours')}小时${duration.get('minutes')}分${duration.get('seconds')}秒${duration.get('milliseconds')}毫秒`)
	})
}
