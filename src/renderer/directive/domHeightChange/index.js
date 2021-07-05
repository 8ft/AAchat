/**
 * v-heightChange
 * @desc 监听元素高度变化
 * @example
 * ```vue
 * <div v-heightChange="eventHandler">
 * ```
 */
export default {
    bind(el, binding) {
      const MutationObserver = window.MutationObserver || window.webkitMutationObserver || window.MozMutationObserver
      let recordHeight = 0
    //   const onHeightChange = window._.throttle(function() {
      const onHeightChange = function() {
        const height = window.getComputedStyle(el).getPropertyValue('height')
        if (height === recordHeight) {
          return
        }
        binding.value({ new: height, old: recordHeight })
        recordHeight = height
    }
    //   }, 16)

      el.__onHeightChange__ = onHeightChange

    //   el.addEventListener('animationend', onHeightChange)

    //   el.addEventListener('transitionend', onHeightChange)

      el.__observer__ = new MutationObserver((mutations) => {
        onHeightChange()
      })

      el.__observer__.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      })
    },

    unbind(el) {
      if (el.__observer__) {
        el.__observer__.disconnect()
        el.__observer__ = null
      }
      // el.removeEventListener('animationend', el.__onHeightChange__)
      // el.removeEventListener('transitionend', el.__onHeightChange__)
      el.__onHeightChange__ = null
    },

    install(Vue) {
		Vue.directive('heightChange', {
			bind: this.bind,
			unbind: this.unbind
		})
	}
}
