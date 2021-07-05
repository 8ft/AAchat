// 语言配置
import i18n from 'i18n'
import path from 'path'
import { lang, DEFAULT_LANG } from '~/lang'
import { app } from 'electron'
export default class AppLang {
	_App = null
	langArray = []
	constructor({ App }) {
		this._App = App
		for (const key in lang) {
			this.langArray.push(key)
		}
		i18n.configure({
			locales: this.langArray,
			directory: path.resolve(process.env.NODE_ENV === 'development' ? __dirname : app.getAppPath(), '..', 'lang'),
			defaultLocale: DEFAULT_LANG,
			register: this._App.i18n,
			objectNotation: true,
			updateFiles: false
		})
	}
	setLocale(locale) {
		if (!locale) {
			locale = this._App.sysConfig.lang === '0' ? app.getLocale() : this._App.sysConfig.lang
		}
		locale = locale.replace('-', '_')
		this._App.locale = this.langArray.indexOf(locale) > -1 ? locale : DEFAULT_LANG
		i18n.setLocale(locale)
	}
}
