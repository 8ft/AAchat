import logger from 'electron-log'
import path from 'path'
import moment from 'moment'

export default () => {
	let logsPath
	if (typeof window !== 'undefined') {
		const fun = require('@/utils/electron/fun')
		logsPath = fun.getGlobalByName('logsPath')
	} else {
		logsPath = global.logsPath
	}
	logger.transports.file.resolvePath = (variables) => {
		// return path.join(variables.libraryTemplate.replace('{appName}', process.env.PROJECT_NAME), variables.fileName)
		return path.resolve(logsPath, moment().format('YYYY-MM-DD') + '.' + variables.fileName)
	}
	logger.transports.file.level = 'error'
	logger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
	logger.transports.console.level = true
	if (process.env.ENV_CONFIG === 'prod') Object.assign(console, logger.functions)
}
