exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }
  process.env.DEBUG = '*'
  const config = {
    'DuoBe': {
      appleId: 'yeslist77@gmail.com',
      appleIdPassword: 'apds-zikh-njuk-vdvm'
    },
    'WhatChat': {
      appleId: 'jares336@gmail.com',
      appleIdPassword: 'jhsy-egwj-dogw-eska'
    }
  }
  const { notarize } = require('electron-notarize')
  const appName = context.packager.appInfo.productFilename
  console.log('start notarizing')
  try {
    return await notarize({
      appBundleId: `com.${appName}.desktop`,
      appPath: `${appOutDir}/${appName}.app`,
      ...config[appName]
    })
  } catch (e) {
    console.log('notarize::::', e)
  }
}
