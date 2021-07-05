if (process.platform !== 'darwin') {
	let config = require('../config')
	config = JSON.parse(JSON.stringify(config.webConfig).replace(/\\"/g, ''))
	const { spawn, exec } = require('child_process')
	const fs = require('fs')
	const path = require('path')
	var { PROJECT_NAME, ENV_CONFIG, VERSION } = config
	ENV_CONFIG = '.' + ENV_CONFIG
	const buildExe = () => {
		return new Promise((resolve, reject) => {
			console.log('==================================build exe by nsis=============================')
			let configData = fs.readFileSync(path.join(__dirname, 'SetupScripts', 'config.template'), 'utf-8')
			configData = configData.replace(/\%PROJECT_NAME\%/g, PROJECT_NAME).replace(/\%VERSION\%/g, VERSION).replace(/\%ENV_CONFIG\%/g, ENV_CONFIG)
			fs.writeFileSync(path.join(__dirname, 'SetupScripts', PROJECT_NAME, 'config.nsi'), configData)
			const ls = spawn(path.join(__dirname, 'build.bat'), [`${PROJECT_NAME}`])
			ls.stdout.on('data', (data) => {
				console.log(`stdout: ${data}`)
			})
			ls.stderr.on('data', (data) => {
				console.log(`stderr: ${data}`)
			})
			ls.on('close', (code) => {
				resolve(code)
			})
		})
	}
	const signTool = () => {
		console.log('==================================start signature=============================')
		const signtoolPath = path.join(__dirname, 'signtool.exe')
		const certPath = path.join(__dirname, '..', 'certificate', 'win_cert.pfx')
		const extPath = path.join(__dirname, '..', 'release', `${PROJECT_NAME}_Setup_${VERSION}${ENV_CONFIG}.exe`)
		exec(`${signtoolPath} sign /f ${certPath} /p odzh-mext-zvuy-nmxa /fd sha256 /t http://timestamp.digicert.com ${extPath}`, function(err, stdout, stderr) {
			if (err) {
				console.log('get weather api error:' + stderr)
			} else {
				console.log(`stdout: ${stdout}`)
			}
		})
	}
	buildExe().then(() => {
		if (ENV_CONFIG !== '.dev' && ENV_CONFIG !== '.test') setTimeout(signTool, 4000)
	})
}
