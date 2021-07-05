/*
右键菜单
在需要添加右键菜单的dom上添加指令v-rightmenu
比如<div v-rightmenu:[{a:id,b:2,rightMenuType:rightMenuType}].stop.auto="menu"></div>
[{a:id,b:2}]为指令入参（可选），用于一些需要入参的操作菜单，比如用户列表的删除操作，需要传入用户id。rightMenuType菜单类型，用于区别是否重构dom
stop指令配置参数（可选），是否冒泡，没有此参数允许冒泡
auto指令配置参数（可选），是否自动隐藏，没有此参数不自动隐藏
menu为菜单结构数据必填，为数组，
label菜单名，
children下级菜单数组，
callback点击事件回调，参数为指令入参
[
          {
            label: '菜单一菜单一菜单一菜单一菜单一',
            children: [
              {
                label: '二级菜单一'
              },
              { label: '二级菜单二二级菜单二二级菜单二',
                children: [
                  { label: '三级菜单一' },
                  { label: '三级菜单二' },
                  { label: '三级菜单三', callback: (arg) => {
                      console.log(1, arg)
                    } }
                ]
              },
              { label: '二级菜单三' }
            ]
        },
          {
            label: '菜单二',
            callback: (arg) => {
              console.log(1, arg)
            }
          },
          {
            label: '菜单三'
          },
          {
            label: '菜单四'
          }]
      }
    },
* */
require('./style.scss')
const initMenu = function(menuData, arg, auto, rightMenuType) {
	if (menuData && menuData.length) {
		var div = buildMenu(menuData, true, 'right-menu', arg, rightMenuType)
		if (auto) {
			div.onmouseleave = function() {
				var timer = setTimeout(() => {
					clearAllRightMenu(rightMenuType)
					clearTimeout(timer)
				}, 1000)
			}
		}
		document.body.appendChild(div)
		return div
	} else {
		return ''
	}
}
const buildMenu = function(menuData, first, className, arg, rightMenuType) {
	var mainDiv = ''
	if (menuData.length) {
		mainDiv = document.createElement('div')
		mainDiv.className = 'main-menu'
		if (className) {
			mainDiv.className = className + ' main-menu'
			if (rightMenuType) mainDiv.id = rightMenuType
		}
		for (let i = 0; i < menuData.length; i++) {
			if (menuData[i].showType === arg.showType || menuData[i].showType === undefined) {
				var div = document.createElement('div')
				div.innerHTML = '<div class="label">' + menuData[i].label + '</div>'
				div.className = 'sub-menu'
				div.onclick = function($event) {
					$event.stopPropagation()
					if (menuData[i].callback && typeof menuData[i].callback === 'function') {
						menuData[i].callback(arg)
						clearAllRightMenu(rightMenuType)
					}
				}
				if (menuData[i].children && menuData[i].children.length) {
					div.className += ' more'
					var subDiv = buildMenu(menuData[i].children, true, '', arg, rightMenuType)
					div.onmouseenter = function($event) {
						positionMenu($event, subDiv)
					}
					div.appendChild(subDiv)
				}
				mainDiv.appendChild(div)
			}
		}
	}
	return mainDiv
}
const selectText = function() {
	if (document.selection) {
		// ie浏览器
		return document.selection.createRange().text
	} else {
		// 标准浏览器
		return window.getSelection().toString()
	}
}
const positionMenu = function($event, element) {
	const { clientX, clientY } = $event
	var { width, height, x, y } = element.getBoundingClientRect()
	const windowWidth = document.body.clientWidth
	const windowHeight = document.body.clientHeight
	if ($event.type === 'contextmenu') {
		x = clientX
		y = clientY
		if (clientX + width > windowWidth) {
			x = clientX - width
		}
		x += 'px'
		if (clientY + height > windowHeight) {
			y = clientY - height
		}
		y += 'px'
	} else {
		if (x + width > windowWidth) {
			x = -width + 'px'
		}
		if (y + height > windowHeight) {
			y = -height + $event.target.clientHeight + 'px'
		}
	}
	element.style.top = y
	element.style.left = x
	return {
		x,
		y
	}
}
const clearAllRightMenu = function(rightMenuType) {
	var temp = rightMenuType ? document.getElementById(rightMenuType) : document.getElementsByClassName('right-menu')
	try {
		if (rightMenuType) {
			temp.style.display = 'none'
		} else {
			if (temp.length) {
				for (var i = 0; i < temp.length; i++) {
					if (!temp[i].id) document.body.removeChild(temp[i])
				}
			}
		}
	} catch (e) {
	}
}
const clickOutside = function() {
	clearAllRightMenu()
}
export default {
	install: function(Vue) {
		Vue.directive('rightmenu', {
			binding() {
				// 指令第一次绑定到元素时调用
			},
			inserted(el, binding, vnode, oldVnode) {
				var rightMenuBody
				var arg = binding.arg || {}
				var rightMenuType
				if (arg.rightMenuType) {
					rightMenuType = arg.rightMenuType
				}
				// 被绑定元素插入父节点时调用
				el.oncontextmenu = function($event) {
					if (!selectText()) {
						$event.preventDefault()
						if (binding.modifiers.stop) $event.stopPropagation()
						const menuData = el.menuData || binding.value
						clearAllRightMenu(rightMenuType)
						rightMenuBody = document.getElementById(rightMenuType) ? document.getElementById(rightMenuType) : initMenu(menuData, arg, binding.modifiers.auto, rightMenuType)
						if (rightMenuBody) {
							rightMenuBody.style.display = 'block'
							positionMenu($event, rightMenuBody)
						}
					}
				}
				document.body.onclick = clickOutside
				/* el._vueClickOutside = function() {
					clearAllRightMenu(rightMenuType)
				}*/
				// document.addEventListener('click', clickOutside)
			},
			update(el, binding, vnode) {
				// 所在组件的 VNode 更新时调用
			},
			componentUpdated(el, binding, vnode) {
				// 指令所在组件的 VNode 及其子 VNode 全部更新后调用
				el.menuData = binding.value
			},
			unbind(el) {
				// 只调用一次，指令与元素解绑时调用
				//  document.removeEventListener('click', el._vueClickOutside)
				// delete el._vueClickOutside
				el.oncontextmenu = function() {
				}
			}
		})
	}
}
