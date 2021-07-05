module.exports = function(paylod) {
	const { PROJECT_NAME, ENV_CONFIG, VERSION } = paylod
	const macCertName = {
		'DuoBe': 'CLOUD TIACE TECHNOLOGY CO., LTD. (93YY26VS48)',
		'WhatChat': 'Cloud Speed Technology Limited Co. (LG3CDG6Y8H)'
	}
  const options = {
	  'productName': PROJECT_NAME,
	  'appId': `com.${PROJECT_NAME}.desktop`,
	  'artifactName': PROJECT_NAME + '_Setup_' + VERSION + '.' + ENV_CONFIG + '.${ext}',
	  'asar': false,
	  'directories': {
		  'buildResources': `src/resources/${PROJECT_NAME}/icons`,
		  'output': 'release'
	  },
	  'electronDownload': {
		  'mirror': 'https://npm.taobao.org/mirrors/electron/'
	  },
	  /* 'publish': [
		  {
			  'provider': 'generic',
			  'url': ''
		  }
	  ],*/
	  'files': [
		  'dist/desktop/**/*'
	  ],
	  'extraResources': [
		  /* {
			  'from': `./src/resources/${PROJECT_NAME}`,
			  'to': './resources'
		  },
		  {
		  	'from': './version',
			  'to': './version'
		  },*/
			{
				'from': './src/main/renderProcessApi.js',
				'to': './renderProcessApi.js'
			},
		  {
			  'from': './src/lang/',
			  'to': './lang/'
		  }
	  ],
	  'dmg': {
		  'sign': false,
		  'contents': [
			  {
				  'x': 410,
				  'y': 150,
				  'type': 'link',
				  'path': '/Applications'
			  },
			  {
				  'x': 130,
				  'y': 150,
				  'type': 'file'
			  }
		  ]
	  },
	  'mac': {
		  'hardenedRuntime': true,
		  'gatekeeperAssess': false,
		  'entitlements': './certificate/entitlements.mac.plist',
		  'entitlementsInherit': './certificate/entitlements.mac.plist',
		  'icon': `./src/resources/${PROJECT_NAME}/icons/mac_icon_128.icns`,
		  'extraResources': [
			  /* {
				  'from': `./src/c-library/hermes/hermes${HERMES_VERSION ? ('-' + HERMES_VERSION) : ''}.dylib`,
				  'to': `./c-library/hermes/hermes${HERMES_VERSION ? ('-' + HERMES_VERSION) : ''}.dylib`
			  },*/
			  {
				  'from': './src/renderer/components/capture/mac',
				  'to': './capture/mac'
			  }
		  ]
		  /* "extendInfo": {
			  "URL types": [
				  {
					  "URL identifier": "Joy Security",
					  "URL Schemes": [
						  "joy-security"
					  ]
				  }
			  ]
		  }*/
	  },
	  'win': {
		  'icon': `./src/resources/${PROJECT_NAME}/icons/win_icon_256.ico`,
		  // 'requestedExecutionLevel': 'highestAvailable',
		  'requestedExecutionLevel': 'asInvoker',
		  'extraResources': [
			  /* {
				  'from': `./src/c-library/hermes/hermes${HERMES_VERSION ? ('-' + HERMES_VERSION) : ''}.dll`,
				  'to': `./c-library/hermes/hermes${HERMES_VERSION ? ('-' + HERMES_VERSION) : ''}.dll`
			  },*/
			  {
				  'from': './src/renderer/components/capture/win',
				  'to': './capture/win'
			  }
		  ],
		  'verifyUpdateCodeSignature': false
	  }
	  /* "nsis": {
		  "oneClick": false,
		  "perMachine": true,
		  "allowElevation": true,
		  "allowToChangeInstallationDirectory": true,
		  "createDesktopShortcut": true,
		  "createStartMenuShortcut": true,
		  "shortcutName": PROJECT_NAME
	  }*/
  }
  if (ENV_CONFIG !== 'dev' && ENV_CONFIG !== 'test') {
  	options['afterSign'] = './certificate/notarize.js'
	  options.mac['identity'] = macCertName[PROJECT_NAME]
	  options.mac['gatekeeperAssess'] = false
	  options.mac['entitlements'] = './certificate/entitlements.mac.plist'
	  options.mac['entitlementsInherit'] = './certificate/entitlements.mac.plist'
	  options.win['signingHashAlgorithms'] = ['sha256']
	  options.win['signDlls'] = true
	  options.win['rfc3161TimeStampServer'] = 'http://timestamp.digicert.com'
	  options.win['certificateFile'] = './certificate/win_cert.pfx'
	  options.win['certificatePassword'] = 'odzh-mext-zvuy-nmxa'
  }
  return options
}
