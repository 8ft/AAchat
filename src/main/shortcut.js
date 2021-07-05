import { globalShortcut } from 'electron'

export default App => () => {
	const actions = {
		'shortcut-capture': () => App.shortcutCapture()
	}
	const keymap = App.setting.keymap

	if (!App.setting.enableCapture) delete actions['shortcut-capture']

	// 注销所有的快捷键
	globalShortcut.unregisterAll()
	Object.keys(actions).forEach(key => {
		if (keymap[key] && keymap[key].length) {
			globalShortcut.register(keymap[key].join('+'), actions[key])
		}
	})
}
