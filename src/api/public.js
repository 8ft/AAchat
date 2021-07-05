module.exports = {
	getCode: '/public/validateCode/sendValidateCode', // 获取验证码
	checkCode: '/public/validateCode/verifyValidateCode', // 校验验证码
	getOneDicts: '/public/dictCommon/getOneDicts', // 获取国际电话区号
	upload: '/public/file/base64Upload', // 文件预上传（base64)
	uploadLogs:	'/logs/appErrorLog/upload', // 日志上传
	pcLogUpload: '/logs/appErrorLog/pcLogUpload', // PC日志上传
	userProtocolInfoGetList: '/public/userProtocolInfo/getList',
	checkVersion: '/public/appVersionInfo/checkVersion', // 版本检查接口
	getParamsByName: '/public/paramConfig/getParamsByName', // 获取参数配置信息
	getOrganParamsByName: '/public/paramConfig/getOrganParamsByName', // 获取企管配置
	getVersionList: '/public/appVersionInfo/getVersionList' // 获取更新日志接口
}
