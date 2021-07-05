const path = require('path')
const fs = require('fs')
let config = require('../config')
config = JSON.parse(JSON.stringify(config.webConfig).replace(/\\"/g, ''))
var template = require('./template')

const writeFile = () => {
	return new Promise(async(resolve, reject) => {
		var data = template(config)
		fs.writeFile(path.join(__dirname, './' + config.PROJECT_NAME + '.json'), JSON.stringify(data), 'utf8', (err) => {
			if (err) {
				reject(err)
			}
			resolve()
		})
	})
}

writeFile()
