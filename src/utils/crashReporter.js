export function crashReportParam() {
	let deviceModel
	let deviceSystem
	let deviceType
	if (typeof window !== 'undefined') {
		const fun = require('@/utils/electron/fun')
		deviceModel = fun.getGlobalByName('deviceModel')
		deviceSystem = fun.getGlobalByName('deviceSystem')
		deviceType = fun.getGlobalByName('deviceType')
	} else {
		deviceModel = global.deviceModel
		deviceSystem = global.deviceSystem
		deviceType = global.deviceType
	}
	return {
		clientType: process.env.webConfig.client_type,
		deviceType,
		logType: '1',
		netType: '0',
		runState: '0',
		appVersion: process.env.webConfig.VERSION,
		deviceModel,
		deviceSystem
	}
	// file,token,fromType:'pc'
}
export function crashReports() {
	const crashReporter = typeof window !== 'undefined' ? require('electron').remote.crashReporter : require('electron').crashReporter
	const extra = crashReportParam()
	crashReporter.start({
		productName: process.env.PROJECT_NAME,
		companyName: process.env.PROJECT_NAME,
		submitURL: process.env.webConfig.crashReportServer,
		extra
		// uploadToServer: false
	})
}
