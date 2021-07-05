// 此文件不能用es6写法，谨记！wxl
var merge = require('webpack-merge')
var ENV_CONFIG = process.env.ENV_CONFIG || 'dev'
var NODE_ENV = process.env.NODE_ENV || 'development'
var PROJECT_NAME = process.env.PROJECT_NAME || 'WhatChat'
var config = require(`./${PROJECT_NAME}/${ENV_CONFIG}.env`)
const packageConfig = require('../package.json')
const subVersion = ''
const isECodeMust = { // 企业代码是否必须。true必须，false可选
	WhatChat: 'true',
	DuoBe: 'false'
}
module.exports = {
  webConfig: merge({
	  isECodeMust: '"' + isECodeMust[PROJECT_NAME] + '"',
    VERSION: '"' + packageConfig.version + subVersion + '"',
    pstring: '"796f757469616e6b656a69"', // 密码MD5加密字符串
    client_type: process.platform === 'darwin' ? '"21"' : '"20"', // 10-app(ios) 11-app(android) 20-windows端 21-mac端 30-wap端 40-微信 50-运维
    api_version: '"' + packageConfig.version + '"',
    ENV_CONFIG: '"' + ENV_CONFIG + '"',
    NODE_ENV: '"' + NODE_ENV + '"',
    PROJECT_NAME: '"' + PROJECT_NAME + '"',
	  HERMES_VERSION: '"2.5.11"',
	  REVISION: '"20045"', // SVN版本
	  DEV_PORT: 9080,
	  DEFAULT_MAINWIN_WIDTH: 1000,
	  DEFAULT_MAINWIN_HEIGHT: 680,
	  VISIBLE_MSG_TYPE: '[78,101,102,103,104,105,106,108,109,110,111,112,113,114]',
	  CHAT_MSG_TYPE: '{' +
		  '"TYPE_TEXT": 101,' +
		  '"TYPE_IMAGE": 102,' +
		  '"TYPE_FILE": 103,' +
		  '"TYPE_VOICE": 104,' +
		  '"TYPE_VIDEO": 105,' +
		  '"TYPE_REALAUDIO": 106,' +
		  '"TYPE_CHATRECORD": 108,' +
		  '"TYPE_CARD": 109,' +
		  '"TYPE_NOTE": 110,' +
		  '"TYPE_LINK": 111,' +
		  '"TYPE_REPLY": 112,' +
		  '"TYPE_EMOJI": 113,' +
		  '"TYPE_LOCATION": 114,' +
		  '"TYPE_REALAUDIO_REQUEST": 201,' + // 实时语音请求
		  '"TYPE_REALAUDIO_AGREE": 202,' + // 实时语音同意
		  '"TYPE_REALAUDIO_END": 203,' + // 实时语音结束
		  '"TYPE_REALAUDIO_BUSY": 204,' + // 实时语音忙
		  '"TYPE_REALAUDIO_OFFONLINE": 205,' + // 实时语音离线
		  '"TYPE_REALAUDIO_CANCEL": 206,' + // 实时语音取消
		  '"TYPE_REALAUDIO_REJECT": 207,' + // 实时语音拒绝
		  '"TYPE_REALAUDIO_TIMEOUT": 208' + // 实时语音超时
		  '}',
	  supportVideoType: '[\'mp4\', \'mov\', \'avi\', \'3gp\', \'mpg\', \'mpeg\', \'mkv\', \'wmv\']',
	  supportImageType: '[\'png\', \'gif\', \'bmp\', \'jpg\', \'jpeg\',\'jfif\']',
	  supportFileType: '[\'docx\', \'doc\', \'xls\', \'xlsx\', \'pdf\', \'txt\', \'html\', \'ppt\', \'pptx\']',
	  publicWebKey: '"MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDghfCFcxpjyM0N+HTqmYkw827TUhld2+QDdgrG2Jbwv7buiLs0Ia2fsbFA+2fDf3pbmS2GchVjwKxyWnPAl8j2hXYXSdhiw6lHEQW/+mnEOTSRESfLZiwCwRsy20U3POWbguSMPWjTFxB2t4P1w4aTcfo1tqpKsB8QG0rG7AEzwIDAQAB"'
  }, config)
}
