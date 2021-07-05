const Electron = require('electron')

module.exports = {
	restore: function() {
		Electron.remote.getCurrentWindow().restore()
	},
	isVisible: function() {
		return Electron.remote.getCurrentWindow().isVisible()
	},
	setOpacity: function(opacity) {
		Electron.remote.getCurrentWindow().setOpacity(opacity)
	},
	isMinimized: function() {
		return Electron.remote.getCurrentWindow().isMinimized()
	},
	hide: function() {
		Electron.remote.getCurrentWindow().hide()
	},
	close: function() {
		Electron.remote.getCurrentWindow().close()
	},
	show: function() {
		Electron.remote.getCurrentWindow().show()
	},
	focus: function() {
		Electron.remote.getCurrentWindow().focus()
	},
	min: function() {
		Electron.remote.getCurrentWindow().minimize()
	},
	max: function() {
		Electron.remote.getCurrentWindow().maximize()
	},
	unMax: function() {
		Electron.remote.getCurrentWindow().unmaximize()
	},
	isMax: function() {
		return Electron.remote.getCurrentWindow().isMaximized()
	},
	setSimpleFullScreen: function(flag) {
		Electron.remote.getCurrentWindow().setSimpleFullScreen(flag)
	},
	setFullScreen: function(flag) {
		Electron.remote.getCurrentWindow().setFullScreen(flag)
	},
	isFullScreen: function() {
		return Electron.remote.getCurrentWindow().isFullScreen()
	}
}
