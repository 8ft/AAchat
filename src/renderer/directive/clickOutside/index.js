/**
 * v-clickoutside
 * @desc 点击元素外面才会触发的事件
 * @example
 * ```vue
 * <div v-clickoutside="eventHandler">
 * ```
 */
const clickoutsideContext = '@@clickoutsideContext'

export default {
	bind(el, binding, vnode) {
		const documentHandler = function(e) {
			if (e.target.className === 'mx-btn mx-btn-text mx-btn-current-year' || e.target.className === 'ant-calendar-month-panel-year-select-content' || e.target.className === 'ant-calendar-year-panel-year' || e.target.className === 'ant-calendar-month-panel-month' || e.target.className === 'ant-calendar-month-panel-cell' || e.target.className === 'ant-calendar-year-panel-cell') {
				return
			}
			if (vnode.context && !el.contains(e.target)) {
				vnode.context[el[clickoutsideContext].methodName](e)
			}
		}
		el[clickoutsideContext] = {
			documentHandler,
			methodName: binding.expression,
			arg: binding.arg || 'click'
		}

		document.addEventListener(el[clickoutsideContext].arg, documentHandler)
	},

	update(el, binding) {
		el[clickoutsideContext].methodName = binding.expression
	},

	unbind(el) {
		document.removeEventListener(
			el[clickoutsideContext].arg,
			el[clickoutsideContext].documentHandler)
	},

	install(Vue) {
		Vue.directive('clickoutside', {
			bind: this.bind,
			unbind: this.unbind
		})
	}
}
