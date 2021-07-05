import Vue from 'vue'
import VueI18n from 'vue-i18n'
import fun from '@/utils/electron/fun'
import store from '@/store/'
import { lang as langConfig, DEFAULT_LANG } from '~/lang/'

Vue.use(VueI18n)
const messages = langConfig
/* export const setup = async() => {
	const sysConfig = await fun.getSysConfig()
	let lang = sysConfig.lang
	if (messages[lang] === undefined) {
		lang = DEFAULT_LANG
	}
	Object.keys(messages).forEach(lang => {
		document.body.classList.remove(`lang-${lang}`)
	})
	document.body.classList.add(`lang-${lang}`)
	document.body.setAttribute('lang', lang)
	i18n.locale = lang
	Vue.prototype.$nextTick(() => {
		store.dispatch('Setting/set_lang', lang)
	})
}*/
// 获取应用语言
const getAppLang = async(lang) => {
	let langTemp
	if (lang === '0') {
		langTemp = await fun.getOperationLang()
	} else {
		langTemp = lang
	}
	langTemp = langTemp.replace('-', '_')
	if (messages[langTemp] === undefined) {
		langTemp = DEFAULT_LANG
	}
	return Promise.resolve(langTemp)
}
export const setLang = async(lang) => {
	const langTemp = await getAppLang(lang)
	Object.keys(messages).forEach(lang => {
		document.body.classList.remove(`lang-${lang}`)
	})
	document.body.classList.add(`lang-${langTemp}`)
	document.body.setAttribute('lang', langTemp)
	i18n.locale = langTemp
	store.commit('Setting/SET_LANG', langTemp)
	store.dispatch('Setting/set_sys_lang', lang)
}

export const setMainThreadLang = async(lang) => {
	await fun.setSysConfig({ lang })
	return Promise.resolve()
}

const i18n = new VueI18n({
	fallbackLocale: DEFAULT_LANG,
	locale: DEFAULT_LANG,
	messages
})

window.i18n = i18n
export default i18n
