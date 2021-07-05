(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory()
	// : typeof define === 'function' && define.amd ? define(factory)
	: (global.wangEditor = factory())
}(this, function() {
 'use strict'

/*
    poly-fill
*/

var polyfill = function() {
    // Object.assign
    if (typeof Object.assign != 'function') {
        Object.assign = function(target, varArgs) {
            // .length of function is 2
            if (target == null) {
                // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object')
            }

            var to = Object(target)

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index]

                if (nextSource != null) {
                    // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey]
                        }
                    }
                }
            }
            return to
        }
    }

    // IE 中兼容 Element.prototype.matches
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s)
                var i = matches.length
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1
        }
    }
}

/*
    DOM 操作 API
*/

// 根据 html 代码片段创建 dom 对象
function createElemByHTML(html) {
    var div = void 0
    div = document.createElement('div')
    div.innerHTML = html
    return div.children
}

// 是否是 DOM List
function isDOMList(selector) {
    if (!selector) {
        return false
    }
    if (selector instanceof HTMLCollection || selector instanceof NodeList) {
        return true
    }
    return false
}

// 封装 document.querySelectorAll
function querySelectorAll(selector) {
    var result = document.querySelectorAll(selector)
    if (isDOMList(result)) {
        return result
    } else {
        return [result]
    }
}

// 记录所有的事件绑定
var eventList = []

// 创建构造函数
function DomElement(selector) {
    if (!selector) {
        return
    }

    // selector 本来就是 DomElement 对象，直接返回
    if (selector instanceof DomElement) {
        return selector
    }

    this.selector = selector
    var nodeType = selector.nodeType

    // 根据 selector 得出的结果（如 DOM，DOM List）
    var selectorResult = []
    if (nodeType === 9) {
        // document 节点
        selectorResult = [selector]
    } else if (nodeType === 1) {
        // 单个 DOM 节点
        selectorResult = [selector]
    } else if (isDOMList(selector) || selector instanceof Array) {
        // DOM List 或者数组
        selectorResult = selector
    } else if (typeof selector === 'string') {
        // 字符串
        selector = selector.replace('/\n/mg', '').trim()
        if (selector.indexOf('<') === 0) {
            // 如 <div>
            selectorResult = createElemByHTML(selector)
        } else {
            // 如 #id .class
            selectorResult = querySelectorAll(selector)
        }
    }

    var length = selectorResult.length
    if (!length) {
        // 空数组
        return this
    }

    // 加入 DOM 节点
    var i = void 0
    for (i = 0; i < length; i++) {
        this[i] = selectorResult[i]
    }
    this.length = length
}

// 修改原型
DomElement.prototype = {
    constructor: DomElement,

    // 类数组，forEach
    forEach: function forEach(fn) {
        var i = void 0
        for (i = 0; i < this.length; i++) {
            var elem = this[i]
            var result = fn.call(elem, elem, i)
            if (result === false) {
                break
            }
        }
        return this
    },

    // clone
    clone: function clone(deep) {
        var cloneList = []
        this.forEach(function(elem) {
            cloneList.push(elem.cloneNode(!!deep))
        })
        return $(cloneList)
    },

    // 获取第几个元素
    get: function get(index) {
        var length = this.length
        if (index >= length) {
            index = index % length
        }
        return $(this[index])
    },

    // 第一个
    first: function first() {
        return this.get(0)
    },

    // 最后一个
    last: function last() {
        var length = this.length
        return this.get(length - 1)
    },

    // 绑定事件
    on: function on(type, selector, fn) {
        // selector 不为空，证明绑定事件要加代理
        if (!fn) {
            fn = selector
            selector = null
        }

        // type 是否有多个
        var types = []
        types = type.split(/\s+/)

        return this.forEach(function(elem) {
            types.forEach(function(type) {
                if (!type) {
                    return
                }

                // 记录下，方便后面解绑
                eventList.push({
                    elem: elem,
                    type: type,
                    fn: fn
                })

                if (!selector) {
                    // 无代理
                    elem.addEventListener(type, fn)
                    return
                }

                // 有代理
                elem.addEventListener(type, function(e) {
                    var target = e.target
                    if (target.matches(selector)) {
                        fn.call(target, e)
                    }
                })
            })
        })
    },

    // 取消事件绑定
    off: function off(type, fn) {
        return this.forEach(function(elem) {
            elem.removeEventListener(type, fn)
        })
    },

    // 获取/设置 属性
    attr: function attr(key, val) {
        if (val == null) {
            // 获取值
            return this[0].getAttribute(key)
        } else {
            // 设置值
            return this.forEach(function(elem) {
                elem.setAttribute(key, val)
            })
        }
    },

    // 添加 class
    addClass: function addClass(className) {
        if (!className) {
            return this
        }
        return this.forEach(function(elem) {
            var arr = void 0
            if (elem.className) {
                // 解析当前 className 转换为数组
                arr = elem.className.split(/\s/)
                arr = arr.filter(function(item) {
                    return !!item.trim()
                })
                // 添加 class
                if (arr.indexOf(className) < 0) {
                    arr.push(className)
                }
                // 修改 elem.class
                elem.className = arr.join(' ')
            } else {
                elem.className = className
            }
        })
    },

    // 删除 class
    removeClass: function removeClass(className) {
        if (!className) {
            return this
        }
        return this.forEach(function(elem) {
            var arr = void 0
            if (elem.className) {
                // 解析当前 className 转换为数组
                arr = elem.className.split(/\s/)
                arr = arr.filter(function(item) {
                    item = item.trim()
                    // 删除 class
                    if (!item || item === className) {
                        return false
                    }
                    return true
                })
                // 修改 elem.class
                elem.className = arr.join(' ')
            }
        })
    },

    // 修改 css
    css: function css(key, val) {
        var currentStyle = key + ':' + val + ';'
        return this.forEach(function(elem) {
            var style = (elem.getAttribute('style') || '').trim()
            var styleArr = void 0
                var resultArr = []
            if (style) {
                // 将 style 按照 ; 拆分为数组
                styleArr = style.split(';')
                styleArr.forEach(function(item) {
                    // 对每项样式，按照 : 拆分为 key 和 value
                    var arr = item.split(':').map(function(i) {
                        return i.trim()
                    })
                    if (arr.length === 2) {
                        resultArr.push(arr[0] + ':' + arr[1])
                    }
                })
                // 替换或者新增
                resultArr = resultArr.map(function(item) {
                    if (item.indexOf(key) === 0) {
                        return currentStyle
                    } else {
                        return item
                    }
                })
                if (resultArr.indexOf(currentStyle) < 0) {
                    resultArr.push(currentStyle)
                }
                // 结果
                elem.setAttribute('style', resultArr.join('; '))
            } else {
                // style 无值
                elem.setAttribute('style', currentStyle)
            }
        })
    },

    // 显示
    show: function show() {
        return this.css('display', 'block')
    },

    // 隐藏
    hide: function hide() {
        return this.css('display', 'none')
    },

    // 获取子节点
    children: function children() {
        var elem = this[0]
        if (!elem) {
            return null
        }

        return $(elem.children)
    },

    // 获取子节点（包括文本节点）
    childNodes: function childNodes() {
        var elem = this[0]
        if (!elem) {
            return null
        }

        return $(elem.childNodes)
    },

    // 增加子节点
    append: function append($children) {
        return this.forEach(function(elem) {
            $children.forEach(function(child) {
                elem.appendChild(child)
            })
        })
    },

    // 移除当前节点
    remove: function remove() {
        return this.forEach(function(elem) {
            if (elem.remove) {
                elem.remove()
            } else {
                var parent = elem.parentElement
                parent && parent.removeChild(elem)
            }
        })
    },

    // 是否包含某个子节点
    isContain: function isContain($child) {
        var elem = this[0]
        var child = $child[0]
        return elem.contains(child)
    },

    // 尺寸数据
    getSizeData: function getSizeData() {
        var elem = this[0]
        return elem.getBoundingClientRect() // 可得到 bottom height left right top width 的数据
    },

    // 封装 nodeName
    getNodeName: function getNodeName() {
        var elem = this[0]
        return elem.nodeName
    },

    // 从当前元素查找
    find: function find(selector) {
        var elem = this[0]
        return $(elem.querySelectorAll(selector))
    },

    // 获取当前元素的 text
    text: function text(val) {
        if (!val) {
            // 获取 text
            var elem = this[0]
            return elem.innerHTML.replace(/<.*?>/g, function() {
                return ''
            })
        } else {
            // 设置 text
            return this.forEach(function(elem) {
                elem.innerHTML = val
            })
        }
    },

    // 获取 html
    html: function html(value) {
        var elem = this[0]
        if (value == null) {
            return elem.innerHTML
        } else {
            elem.innerHTML = value
            return this
        }
    },

    // 获取 value
    val: function val() {
        var elem = this[0]
        return elem.value.trim()
    },

    // focus
    focus: function focus() {
        return this.forEach(function(elem) {
            elem.focus()
        })
    },

    // parent
    parent: function parent() {
        var elem = this[0]
        return $(elem.parentElement)
    },

    // parentUntil 找到符合 selector 的父节点
    parentUntil: function parentUntil(selector, _currentElem) {
        var results = document.querySelectorAll(selector)
        var length = results.length
        if (!length) {
            // 传入的 selector 无效
            return null
        }

        var elem = _currentElem || this[0]
        if (elem.nodeName === 'BODY') {
            return null
        }

        var parent = elem.parentElement
        var i = void 0
        for (i = 0; i < length; i++) {
            if (parent === results[i]) {
                // 找到，并返回
                return $(parent)
            }
        }

        // 继续查找
        return this.parentUntil(selector, parent)
    },

    // 判断两个 elem 是否相等
    equal: function equal($elem) {
        if ($elem.nodeType === 1) {
            return this[0] === $elem
        } else {
            return this[0] === $elem[0]
        }
    },

    // 将该元素插入到某个元素前面
    insertBefore: function insertBefore(selector) {
        var $referenceNode = $(selector)
        var referenceNode = $referenceNode[0]
        if (!referenceNode) {
            return this
        }
        return this.forEach(function(elem) {
            var parent = referenceNode.parentNode
            parent.insertBefore(elem, referenceNode)
        })
    },

    // 将该元素插入到某个元素后面
    insertAfter: function insertAfter(selector) {
        var $referenceNode = $(selector)
        var referenceNode = $referenceNode[0]
        if (!referenceNode) {
            return this
        }
        return this.forEach(function(elem) {
            var parent = referenceNode.parentNode
            if (parent.lastChild === referenceNode) {
                // 最后一个元素
                parent.appendChild(elem)
            } else {
                // 不是最后一个元素
                parent.insertBefore(elem, referenceNode.nextSibling)
            }
        })
    }
}

// new 一个对象
function $(selector) {
    return new DomElement(selector)
}

// 解绑所有事件，用于销毁编辑器
$.offAll = function() {
    eventList.forEach(function(item) {
        var elem = item.elem
        var type = item.type
        var fn = item.fn
        // 解绑
        elem.removeEventListener(type, fn)
    })
}

/*
    配置信息
*/

var config = {

    // 编辑区域的 z-index
    zIndex: 10000,

    // 是否开启 debug 模式（debug 模式下错误会 throw error 形式抛出）
    debug: false

    // onchange 事件
    // onchange: function (html) {
    //     // html 即变化之后的内容
    //     console.log(html)
    // },

}

/*
    工具
*/

// 和 UA 相关的属性
var UA = {
    _ua: navigator.userAgent,

    // 是否 webkit
    isWebkit: function isWebkit() {
        var reg = /webkit/i
        return reg.test(this._ua)
    },

    // 是否 IE
    isIE: function isIE() {
        return 'ActiveXObject' in window
    }
}

// 遍历对象
function objForEach(obj, fn) {
    var key = void 0
        var result = void 0
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            result = fn.call(obj, key, obj[key])
            if (result === false) {
                break
            }
        }
    }
}

// 遍历类数组
function arrForEach(fakeArr, fn) {
    var i = void 0
        var item = void 0
        var result = void 0
    var length = fakeArr.length || 0
    for (i = 0; i < length; i++) {
        item = fakeArr[i]
        result = fn.call(fakeArr, item, i)
        if (result === false) {
            break
        }
    }
}

// 获取随机数
function getRandom(prefix) {
    return prefix + Math.random().toString().slice(2)
}

// 获取一个 elem.childNodes 的 JSON 数据
function getChildrenJSON($elem) {
    var result = []
    var $children = $elem.childNodes() || [] // 注意 childNodes() 可以获取文本节点
    $children.forEach(function(curElem) {
        var elemResult = void 0
        var nodeType = curElem.nodeType

        // 文本节点
        if (nodeType === 3) {
            elemResult = curElem.textContent
        }

        // 普通 DOM 节点
        if (nodeType === 1) {
            elemResult = {}

            // tag
            elemResult.tag = curElem.nodeName.toLowerCase()
            // attr
            var attrData = []
            var attrList = curElem.attributes || {}
            var attrListLength = attrList.length || 0
            for (var i = 0; i < attrListLength; i++) {
                var attr = attrList[i]
                attrData.push({
                    name: attr.name,
                    value: attr.value
                })
            }
            elemResult.attrs = attrData
            // children（递归）
            elemResult.children = getChildrenJSON($(curElem))
        }

        result.push(elemResult)
    })
    return result
}

// 构造函数
function Text(editor) {
    this.editor = editor
}

// 修改原型
Text.prototype = {
    constructor: Text,

    // 初始化
    init: function init() {
        // 绑定事件
        this._bindEvent()
    },

    // 清空内容
    clear: function clear() {
        this.html('<p><br></p>')
    },

    // 获取 设置 html
    html: function html(val) {
        var editor = this.editor
        var $textElem = editor.$textElem
        var html = void 0
        if (val == null) {
            html = $textElem.html()
            // 未选中任何内容的时候点击“加粗”或者“斜体”等按钮，就得需要一个空的占位符 &#8203 ，这里替换掉
            html = html.replace(/\u200b/gm, '')
            return html
        } else {
            $textElem.html(val)

            // 初始化选取，将光标定位到内容尾部
            editor.initSelection()
        }
    },

    // 获取 JSON
    getJSON: function getJSON() {
        var editor = this.editor
        var $textElem = editor.$textElem
        return getChildrenJSON($textElem)
    },

    // 获取 设置 text
    text: function text(val) {
        var editor = this.editor
        var $textElem = editor.$textElem
        var text = void 0
        if (val == null) {
            text = $textElem.text()
            // 未选中任何内容的时候点击“加粗”或者“斜体”等按钮，就得需要一个空的占位符 &#8203 ，这里替换掉
            text = text.replace(/\u200b/gm, '')
            return text
        } else {
            $textElem.text('<p>' + val + '</p>')

            // 初始化选取，将光标定位到内容尾部
            editor.initSelection()
        }
    },

    // 追加内容
    append: function append(html) {
        var editor = this.editor
        var $textElem = editor.$textElem
        $textElem.append($(html))

        // 初始化选取，将光标定位到内容尾部
        editor.initSelection()
    },

    // 绑定事件
    _bindEvent: function _bindEvent() {
        // 实时保存选取
        this._saveRangeRealTime()

        // 按回车建时的特殊处理
        this._enterKeyHandle()

        // 清空时保留 <p><br></p>
        this._clearHandle()

        // 粘贴事件（粘贴文字，粘贴图片）
        // this._pasteHandle()

        // tab 特殊处理
        this._tabHandle()

        // img 点击
        // this._imgHandle()

        // 拖拽事件
        // this._dragHandle()
    },

    // 实时保存选取
    _saveRangeRealTime: function _saveRangeRealTime() {
        var editor = this.editor
        var $textElem = editor.$textElem

        // 保存当前的选区
        function saveRange(e) {
            // 随时保存选区
            editor.selection.saveRange()
        }
        // 按键后保存
        $textElem.on('keyup', saveRange)
        $textElem.on('mousedown', function(e) {
            // mousedown 状态下，鼠标滑动到编辑区域外面，也需要保存选区
            $textElem.on('mouseleave', saveRange)
        })
        $textElem.on('mouseup', function(e) {
            saveRange()
            // 在编辑器区域之内完成点击，取消鼠标滑动到编辑区外面的事件
            $textElem.off('mouseleave', saveRange)
        })
    },

    // 按回车键时的特殊处理
    _enterKeyHandle: function _enterKeyHandle() {
        var editor = this.editor
        var $textElem = editor.$textElem

        function insertEmptyP($selectionElem) {
            var $p = $('<p><br></p>')
            $p.insertBefore($selectionElem)
            editor.selection.createRangeByElem($p, true)
            editor.selection.restoreSelection()
            $selectionElem.remove()
        }

        // 将回车之后生成的非 <p> 的顶级标签，改为 <p>
        function pHandle(e) {
            var $selectionElem = editor.selection.getSelectionContainerElem()
            var $parentElem = $selectionElem.parent()

            if (!$parentElem.equal($textElem)) {
                // 不是顶级标签
                return
            }

            var nodeName = $selectionElem.getNodeName()
            if (nodeName === 'P') {
                // 当前的标签是 P ，不用做处理
                return
            }

            if ($selectionElem.text()) {
                // 有内容，不做处理
                return
            }

            // 插入 <p> ，并将选取定位到 <p>，删除当前标签
            insertEmptyP($selectionElem)
        }

        $textElem.on('keyup', function(e) {
            if (e.keyCode !== 13) {
                // 不是回车键
                return
            }
            // 将回车之后生成的非 <p> 的顶级标签，改为 <p>
            pHandle(e)
        })
    },

    // 清空时保留 <p><br></p>
    _clearHandle: function _clearHandle() {
        var editor = this.editor
        var $textElem = editor.$textElem

        $textElem.on('keydown', function(e) {
            if (e.keyCode !== 8) {
                return
            }
            var txtHtml = $textElem.html().toLowerCase().trim()
            if (txtHtml === '<p><br></p>') {
                // 最后剩下一个空行，就不再删除了
                e.preventDefault()
                return
            }
        })

        $textElem.on('keyup', function(e) {
            if (e.keyCode !== 8) {
                return
            }
            var $p = void 0
            var txtHtml = $textElem.html().toLowerCase().trim()

            // firefox 时用 txtHtml === '<br>' 判断，其他用 !txtHtml 判断
            if (!txtHtml || txtHtml === '<br>') {
                // 内容空了
                $p = $('<p><br/></p>')
                $textElem.html('') // 一定要先清空，否则在 firefox 下有问题
                $textElem.append($p)
                editor.selection.createRangeByElem($p, false, true)
                editor.selection.restoreSelection()
            }
        })
    },

    // tab 特殊处理
    _tabHandle: function _tabHandle() {
        var editor = this.editor
        var $textElem = editor.$textElem

        $textElem.on('keydown', function(e) {
            if (e.keyCode !== 9) {
                return
            }
            if (!editor.cmd.queryCommandSupported('insertHTML')) {
                // 必须原生支持 insertHTML 命令
                return
            }
            // var $selectionElem = editor.selection.getSelectionContainerElem()
            // if (!$selectionElem) {
            //     return
            // }
            // var $parentElem = $selectionElem.parent()
            // var selectionNodeName = $selectionElem.getNodeName()
            // var parentNodeName = $parentElem.getNodeName()

            // if (selectionNodeName === 'CODE' && parentNodeName === 'PRE') {
            //     // <pre><code> 里面
            //     editor.cmd.do('insertHTML', '    ')
            // } else {
            //     // 普通文字
            //     editor.cmd.do('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
            // }
            e.preventDefault()
            editor.cmd.do('insertHTML', '    ')
        })
    }
}

/*
    命令，封装 document.execCommand
*/

// 构造函数
function Command(editor) {
    this.editor = editor
}

// 修改原型
Command.prototype = {
    constructor: Command,

    // 执行命令
    do: function _do(name, value) {
        var editor = this.editor

        // 使用 styleWithCSS
        if (!editor._useStyleWithCSS) {
            document.execCommand('styleWithCSS', null, true)
            editor._useStyleWithCSS = true
        }

        // 如果无选区，忽略
        if (!editor.selection.getRange()) {
            return
        }

        // 恢复选取
        editor.selection.restoreSelection()

        // 执行
        var _name = '_' + name
        if (this[_name]) {
            // 有自定义事件
            this[_name](value)
        } else {
            // 默认 command
            this._execCommand(name, value)
        }

        // 最后，恢复选取保证光标在原来的位置闪烁
        editor.selection.saveRange()
        editor.selection.restoreSelection()

        // 触发 onchange
        editor.change && editor.change()
    },

    // 自定义 insertHTML 事件
    _insertHTML: function _insertHTML(html) {
        var editor = this.editor
        var range = editor.selection.getRange()

        if (this.queryCommandSupported('insertHTML')) {
            // W3C
            this._execCommand('insertHTML', html)
        } else if (range.insertNode) {
            // IE
            range.deleteContents()
            range.insertNode($(html)[0])
        } else if (range.pasteHTML) {
            // IE <= 10
            range.pasteHTML(html)
        }
    },

    // 插入 elem
    _insertElem: function _insertElem($elem) {
        var editor = this.editor
        var range = editor.selection.getRange()

        if (range.insertNode) {
            range.deleteContents()
            range.insertNode($elem[0])
        }
    },

    // 封装 execCommand
    _execCommand: function _execCommand(name, value) {
        document.execCommand(name, false, value)
    },

    // 封装 document.queryCommandValue
    queryCommandValue: function queryCommandValue(name) {
        return document.queryCommandValue(name)
    },

    // 封装 document.queryCommandState
    queryCommandState: function queryCommandState(name) {
        return document.queryCommandState(name)
    },

    // 封装 document.queryCommandSupported
    queryCommandSupported: function queryCommandSupported(name) {
        return document.queryCommandSupported(name)
    }
}

/*
    selection range API
*/

// 构造函数
function API(editor) {
    this.editor = editor
    this._currentRange = null
}

// 修改原型
API.prototype = {
    constructor: API,

    // 获取 range 对象
    getRange: function getRange() {
        return this._currentRange
    },

    // 保存选区
    saveRange: function saveRange(_range) {
        if (_range) {
            // 保存已有选区
            this._currentRange = _range
            return
        }

        // 获取当前的选区
        var selection = window.getSelection()
        if (selection.rangeCount === 0) {
            return
        }
        var range = selection.getRangeAt(0)

        // 判断选区内容是否在编辑内容之内
        var $containerElem = this.getSelectionContainerElem(range)
        if (!$containerElem) {
            return
        }

        // 判断选区内容是否在不可编辑区域之内
        if ($containerElem.attr('contenteditable') === 'false' || $containerElem.parentUntil('[contenteditable=false]')) {
            return
        }

        var editor = this.editor
        var $textElem = editor.$textElem
        if ($textElem.isContain($containerElem)) {
            // 是编辑内容之内的
            this._currentRange = range
        }
    },

    // 折叠选区
    collapseRange: function collapseRange(toStart) {
        if (toStart == null) {
            // 默认为 false
            toStart = false
        }
        var range = this._currentRange
        if (range) {
            range.collapse(toStart)
        }
    },

    // 选中区域的文字
    getSelectionText: function getSelectionText() {
        var range = this._currentRange
        if (range) {
            return this._currentRange.toString()
        } else {
            return ''
        }
    },

    // 选区的 $Elem
    getSelectionContainerElem: function getSelectionContainerElem(range) {
        range = range || this._currentRange
        var elem = void 0
        if (range) {
            elem = range.commonAncestorContainer
            return $(elem.nodeType === 1 ? elem : elem.parentNode)
        }
    },
    getSelectionStartElem: function getSelectionStartElem(range) {
        range = range || this._currentRange
        var elem = void 0
        if (range) {
            elem = range.startContainer
            return $(elem.nodeType === 1 ? elem : elem.parentNode)
        }
    },
    getSelectionEndElem: function getSelectionEndElem(range) {
        range = range || this._currentRange
        var elem = void 0
        if (range) {
            elem = range.endContainer
            return $(elem.nodeType === 1 ? elem : elem.parentNode)
        }
    },

    // 选区是否为空
    isSelectionEmpty: function isSelectionEmpty() {
        var range = this._currentRange
        if (range && range.startContainer) {
            if (range.startContainer === range.endContainer) {
                if (range.startOffset === range.endOffset) {
                    return true
                }
            }
        }
        return false
    },

    // 恢复选区
    restoreSelection: function restoreSelection() {
        var selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(this._currentRange)
    },

    // 创建一个空白（即 &#8203 字符）选区
    createEmptyRange: function createEmptyRange() {
        var editor = this.editor
        var range = this.getRange()
        var $elem = void 0

        if (!range) {
            // 当前无 range
            return
        }
        if (!this.isSelectionEmpty()) {
            // 当前选区必须没有内容才可以
            return
        }

        try {
            // 目前只支持 webkit 内核
            if (UA.isWebkit()) {
                // 插入 &#8203
                editor.cmd.do('insertHTML', '&#8203;')
                // 修改 offset 位置
                range.setEnd(range.endContainer, range.endOffset + 1)
                // 存储
                this.saveRange(range)
            } else {
                $elem = $('<strong>&#8203;</strong>')
                editor.cmd.do('insertElem', $elem)
                this.createRangeByElem($elem, true)
            }
        } catch (ex) {
            // 部分情况下会报错，兼容一下
        }
    },

    // 根据 $Elem 设置选区
    createRangeByElem: function createRangeByElem($elem, toStart, isContent) {
        // $elem - 经过封装的 elem
        // toStart - true 开始位置，false 结束位置
        // isContent - 是否选中Elem的内容
        if (!$elem.length) {
            return
        }

        var elem = $elem[0]
        var range = document.createRange()

        if (isContent) {
            range.selectNodeContents(elem)
        } else {
            range.selectNode(elem)
        }

        if (typeof toStart === 'boolean') {
            range.collapse(toStart)
        }

        // 存储 range
        this.saveRange(range)
    }
}

/*
    上传进度条
*/

function Progress(editor) {
    this.editor = editor
    this._time = 0
    this._isShow = false
    this._isRender = false
    this._timeoutId = 0
    this.$textContainer = editor.$textContainerElem
    this.$bar = $('<div class="w-e-progress"></div>')
}

Progress.prototype = {
    constructor: Progress,

    show: function show(progress) {
        var _this = this

        // 状态处理
        if (this._isShow) {
            return
        }
        this._isShow = true

        // 渲染
        var $bar = this.$bar
        if (!this._isRender) {
            var $textContainer = this.$textContainer
            $textContainer.append($bar)
        } else {
            this._isRender = true
        }

        // 改变进度（节流，100ms 渲染一次）
        if (Date.now() - this._time > 100) {
            if (progress <= 1) {
                $bar.css('width', progress * 100 + '%')
                this._time = Date.now()
            }
        }

        // 隐藏
        var timeoutId = this._timeoutId
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(function() {
            _this._hide()
        }, 500)
    },

    _hide: function _hide() {
        var $bar = this.$bar
        $bar.remove()

        // 修改状态
        this._time = 0
        this._isShow = false
        this._isRender = false
    }
}

var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function(obj) {
  return typeof obj
} : function(obj) {
  return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj
}

/*
    上传图片
*/

// 构造函数
function UploadImg(editor) {
    this.editor = editor
}

// 原型
UploadImg.prototype = {
    constructor: UploadImg,

    // 根据 debug 弹出不同的信息
    _alert: function _alert(alertInfo, debugInfo) {
        var editor = this.editor
        var debug = editor.config.debug
        var customAlert = editor.config.customAlert

        if (debug) {
            throw new Error('wangEditor: ' + (debugInfo || alertInfo))
        } else {
            if (customAlert && typeof customAlert === 'function') {
                customAlert(alertInfo)
            } else {
                alert(alertInfo)
            }
        }
    },

    // 根据链接插入图片
    insertLinkImg: function insertLinkImg(link) {
        var _this2 = this

        if (!link) {
            return
        }
        var editor = this.editor
        var config = editor.config

        // 校验格式
        var linkImgCheck = config.linkImgCheck
        var checkResult = void 0
        if (linkImgCheck && typeof linkImgCheck === 'function') {
            checkResult = linkImgCheck(link)
            if (typeof checkResult === 'string') {
                // 校验失败，提示信息
                alert(checkResult)
                return
            }
        }

        editor.cmd.do('insertHTML', '<img src="' + link + '" style="max-width:100%;"/>')

        // 验证图片 url 是否有效，无效的话给出提示
        var img = document.createElement('img')
        img.onload = function() {
            var callback = config.linkImgCallback
            if (callback && typeof callback === 'function') {
                callback(link)
            }

            img = null
        }
        img.onerror = function() {
            img = null
            // 无法成功下载图片
            _this2._alert('插入图片错误', 'wangEditor: \u63D2\u5165\u56FE\u7247\u51FA\u9519\uFF0C\u56FE\u7247\u94FE\u63A5\u662F "' + link + '"\uFF0C\u4E0B\u8F7D\u8BE5\u94FE\u63A5\u5931\u8D25')
            return
        }
        img.onabort = function() {
            img = null
        }
        img.src = link
    },

    // 上传图片
    uploadImg: function uploadImg(files) {
        var _this3 = this

        if (!files || !files.length) {
            return
        }

        // ------------------------------ 获取配置信息 ------------------------------
        var editor = this.editor
        var config = editor.config
        var uploadImgServer = config.uploadImgServer
        var uploadImgShowBase64 = config.uploadImgShowBase64

        var maxSize = config.uploadImgMaxSize
        var maxSizeM = maxSize / 1024 / 1024
        var maxLength = config.uploadImgMaxLength || 10000
        var uploadFileName = config.uploadFileName || ''
        var uploadImgParams = config.uploadImgParams || {}
        var uploadImgParamsWithUrl = config.uploadImgParamsWithUrl
        var uploadImgHeaders = config.uploadImgHeaders || {}
        var hooks = config.uploadImgHooks || {}
        var timeout = config.uploadImgTimeout || 3000
        var withCredentials = config.withCredentials
        if (withCredentials == null) {
            withCredentials = false
        }
        var customUploadImg = config.customUploadImg

        if (!customUploadImg) {
            // 没有 customUploadImg 的情况下，需要如下两个配置才能继续进行图片上传
            if (!uploadImgServer && !uploadImgShowBase64) {
                return
            }
        }

        // ------------------------------ 验证文件信息 ------------------------------
        var resultFiles = []
        var errInfo = []
        arrForEach(files, function(file) {
            var name = file.name
            var size = file.size

            // chrome 低版本 name === undefined
            if (!name || !size) {
                return
            }

            if (/\.(jpg|jpeg|png|bmp|gif|webp)$/i.test(name) === false) {
                // 后缀名不合法，不是图片
                errInfo.push('\u3010' + name + '\u3011\u4E0D\u662F\u56FE\u7247')
                return
            }
            if (maxSize < size) {
                // 上传图片过大
                errInfo.push('\u3010' + name + '\u3011\u5927\u4E8E ' + maxSizeM + 'M')
                return
            }

            // 验证通过的加入结果列表
            resultFiles.push(file)
        })
        // 抛出验证信息
        if (errInfo.length) {
            this._alert('图片验证未通过: \n' + errInfo.join('\n'))
            return
        }
        if (resultFiles.length > maxLength) {
            this._alert('一次最多上传' + maxLength + '张图片')
            return
        }

        // ------------------------------ 自定义上传 ------------------------------
        if (customUploadImg && typeof customUploadImg === 'function') {
            customUploadImg(resultFiles, this.insertLinkImg.bind(this))

            // 阻止以下代码执行
            return
        }

        // 添加图片数据
        var formdata = new FormData()
        arrForEach(resultFiles, function(file) {
            var name = uploadFileName || file.name
            formdata.append(name, file)
        })

        // ------------------------------ 上传图片 ------------------------------
        if (uploadImgServer && typeof uploadImgServer === 'string') {
            // 添加参数
            var uploadImgServerArr = uploadImgServer.split('#')
            uploadImgServer = uploadImgServerArr[0]
            var uploadImgServerHash = uploadImgServerArr[1] || ''
            objForEach(uploadImgParams, function(key, val) {
                // 因使用者反应，自定义参数不能默认 encode ，由 v3.1.1 版本开始注释掉
                // val = encodeURIComponent(val)

                // 第一，将参数拼接到 url 中
                if (uploadImgParamsWithUrl) {
                    if (uploadImgServer.indexOf('?') > 0) {
                        uploadImgServer += '&'
                    } else {
                        uploadImgServer += '?'
                    }
                    uploadImgServer = uploadImgServer + key + '=' + val
                }

                // 第二，将参数添加到 formdata 中
                formdata.append(key, val)
            })
            if (uploadImgServerHash) {
                uploadImgServer += '#' + uploadImgServerHash
            }

            // 定义 xhr
            var xhr = new XMLHttpRequest()
            xhr.open('POST', uploadImgServer)

            // 设置超时
            xhr.timeout = timeout
            xhr.ontimeout = function() {
                // hook - timeout
                if (hooks.timeout && typeof hooks.timeout === 'function') {
                    hooks.timeout(xhr, editor)
                }

                _this3._alert('上传图片超时')
            }

            // 监控 progress
            if (xhr.upload) {
                xhr.upload.onprogress = function(e) {
                    var percent = void 0
                    // 进度条
                    var progressBar = new Progress(editor)
                    if (e.lengthComputable) {
                        percent = e.loaded / e.total
                        progressBar.show(percent)
                    }
                }
            }

            // 返回数据
            xhr.onreadystatechange = function() {
                var result = void 0
                if (xhr.readyState === 4) {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        // hook - error
                        if (hooks.error && typeof hooks.error === 'function') {
                            hooks.error(xhr, editor)
                        }

                        // xhr 返回状态错误
                        _this3._alert('上传图片发生错误', '\u4E0A\u4F20\u56FE\u7247\u53D1\u751F\u9519\u8BEF\uFF0C\u670D\u52A1\u5668\u8FD4\u56DE\u72B6\u6001\u662F ' + xhr.status)
                        return
                    }

                    result = xhr.responseText
                    if ((typeof result === 'undefined' ? 'undefined' : _typeof(result)) !== 'object') {
                        try {
                            result = JSON.parse(result)
                        } catch (ex) {
                            // hook - fail
                            if (hooks.fail && typeof hooks.fail === 'function') {
                                hooks.fail(xhr, editor, result)
                            }

                            _this3._alert('上传图片失败', '上传图片返回结果错误，返回结果是: ' + result)
                            return
                        }
                    }
                    if (!hooks.customInsert && result.errno != '0') {
                        // hook - fail
                        if (hooks.fail && typeof hooks.fail === 'function') {
                            hooks.fail(xhr, editor, result)
                        }

                        // 数据错误
                        _this3._alert('上传图片失败', '上传图片返回结果错误，返回结果 errno=' + result.errno)
                    } else {
                        if (hooks.customInsert && typeof hooks.customInsert === 'function') {
                            // 使用者自定义插入方法
                            hooks.customInsert(_this3.insertLinkImg.bind(_this3), result, editor)
                        } else {
                            // 将图片插入编辑器
                            var data = result.data || []
                            data.forEach(function(link) {
                                _this3.insertLinkImg(link)
                            })
                        }

                        // hook - success
                        if (hooks.success && typeof hooks.success === 'function') {
                            hooks.success(xhr, editor, result)
                        }
                    }
                }
            }

            // hook - before
            if (hooks.before && typeof hooks.before === 'function') {
                var beforeResult = hooks.before(xhr, editor, resultFiles)
                if (beforeResult && (typeof beforeResult === 'undefined' ? 'undefined' : _typeof(beforeResult)) === 'object') {
                    if (beforeResult.prevent) {
                        // 如果返回的结果是 {prevent: true, msg: 'xxxx'} 则表示用户放弃上传
                        this._alert(beforeResult.msg)
                        return
                    }
                }
            }

            // 自定义 headers
            objForEach(uploadImgHeaders, function(key, val) {
                xhr.setRequestHeader(key, val)
            })

            // 跨域传 cookie
            xhr.withCredentials = withCredentials

            // 发送请求
            xhr.send(formdata)

            // 注意，要 return 。不去操作接下来的 base64 显示方式
            return
        }

        // ------------------------------ 显示 base64 格式 ------------------------------
        if (uploadImgShowBase64) {
            arrForEach(files, function(file) {
                var _this = _this3
                var reader = new FileReader()
                reader.readAsDataURL(file)
                reader.onload = function() {
                    _this.insertLinkImg(this.result)
                }
            })
        }
    }
}

/*
    编辑器构造函数
*/

// id，累加
var editorId = 1

// 构造函数
function Editor(toolbarSelector, textSelector) {
    if (toolbarSelector == null) {
        // 没有传入任何参数，报错
        throw new Error('错误：初始化编辑器时候未传入任何参数，请查阅文档')
    }
    // id，用以区分单个页面不同的编辑器对象
    this.id = 'wangEditor-' + editorId++

    this.toolbarSelector = toolbarSelector
    this.textSelector = textSelector

    // 自定义配置
    this.customConfig = {}
}

// 修改原型
Editor.prototype = {
    constructor: Editor,

    // 初始化配置
    _initConfig: function _initConfig() {
        // _config 是默认配置，this.customConfig 是用户自定义配置，将它们 merge 之后再赋值
        var target = {}
        this.config = Object.assign(target, config, this.customConfig)

        // 将语言配置，生成正则表达式
        var langConfig = this.config.lang || {}
        var langArgs = []
        objForEach(langConfig, function(key, val) {
            // key 即需要生成正则表达式的规则，如“插入链接”
            // val 即需要被替换成的语言，如“insert link”
            langArgs.push({
                reg: new RegExp(key, 'img'),
                val: val

            })
        })
        this.config.langArgs = langArgs
    },

    // 初始化 DOM
    _initDom: function _initDom() {
        var _this = this

        var toolbarSelector = this.toolbarSelector
        var $toolbarSelector = $(toolbarSelector)
        var textSelector = this.textSelector

        var config$$1 = this.config
        var zIndex = config$$1.zIndex

        // 定义变量
        var $toolbarElem = void 0
            var $textContainerElem = void 0
            var $textElem = void 0
            var $children = void 0

        if (textSelector == null) {
            // 只传入一个参数，即是容器的选择器或元素，toolbar 和 text 的元素自行创建
            $toolbarElem = $('<div></div>')
            $textContainerElem = $('<div></div>')

            // 将编辑器区域原有的内容，暂存起来
            $children = $toolbarSelector.children()

            // 添加到 DOM 结构中
            $toolbarSelector.append($toolbarElem).append($textContainerElem)

            // 自行创建的，需要配置默认的样式
            $toolbarElem.css('background-color', '#f1f1f1').css('border', '1px solid #ccc')
            $textContainerElem.css('border', '1px solid #ccc').css('border-top', 'none').css('height', '300px')
        } else {
            // toolbar 和 text 的选择器都有值，记录属性
            $toolbarElem = $toolbarSelector
            $textContainerElem = $(textSelector)
            // 将编辑器区域原有的内容，暂存起来
            $children = $textContainerElem.children()
        }

        // 编辑区域
        $textElem = $('<div></div>')
        $textElem.attr('contenteditable', 'true').css('width', '100%').css('height', '100%')

        // 初始化编辑区域内容
        if ($children && $children.length) {
            $textElem.append($children)
        } else {
            $textElem.append($('<p><br></p>'))
        }

        // 编辑区域加入DOM
        $textContainerElem.append($textElem)

        // 设置通用的 class
        $toolbarElem.addClass('w-e-toolbar')
        $textContainerElem.addClass('w-e-text-container')
        $textContainerElem.css('z-index', zIndex)
        $textElem.addClass('w-e-text')

        // 添加 ID
        var toolbarElemId = getRandom('toolbar-elem')
        $toolbarElem.attr('id', toolbarElemId)
        var textElemId = getRandom('text-elem')
        $textElem.attr('id', textElemId)

        // 记录属性
        this.$toolbarElem = $toolbarElem
        this.$textContainerElem = $textContainerElem
        this.$textElem = $textElem
        this.toolbarElemId = toolbarElemId
        this.textElemId = textElemId

        // 记录输入法的开始和结束
        var compositionEnd = true
        $textContainerElem.on('compositionstart', function() {
            // 输入法开始输入
            compositionEnd = false
        })
        $textContainerElem.on('compositionend', function() {
            // 输入法结束输入
            compositionEnd = true
        })

        // 绑定 onchange
        $textContainerElem.on('keyup', function() {
            // 输入法结束才出发 onchange
            compositionEnd && _this.change && _this.change()
        })
        // $toolbarElem.on('click', function() {
        //     this.change && this.change()
        // })

        // 绑定 onfocus 与 onblur 事件
        if (config$$1.onfocus || config$$1.onblur) {
            // 当前编辑器是否是焦点状态
            this.isFocus = false

            $(document).on('click', function(e) {
                // 判断当前点击元素是否在编辑器内
                var isChild = $textElem.isContain($(e.target))

                // 判断当前点击元素是否为工具栏
                var isToolbar = $toolbarElem.isContain($(e.target))
                var isMenu = $toolbarElem[0] == e.target

                if (!isChild) {
                    // 若为选择工具栏中的功能，则不视为成blur操作
                    if (isToolbar && !isMenu) {
                        return
                    }

                    if (_this.isFocus) {
                        _this.onblur && _this.onblur()
                    }
                    _this.isFocus = false
                } else {
                    if (!_this.isFocus) {
                        _this.onfocus && _this.onfocus()
                    }
                    _this.isFocus = true
                }
            })
        }
    },

    // 封装 command
    _initCommand: function _initCommand() {
        this.cmd = new Command(this)
    },

    // 封装 selection range API
    _initSelectionAPI: function _initSelectionAPI() {
        this.selection = new API(this)
    },

    // 添加 text 区域
    _initText: function _initText() {
        this.txt = new Text(this)
        this.txt.init()
    },

    // 初始化选区，将光标定位到内容尾部
    initSelection: function initSelection(newLine) {
        var $textElem = this.$textElem
        var $children = $textElem.children()
        if (!$children.length) {
            // 如果编辑器区域无内容，添加一个空行，重新设置选区
            $textElem.append($('<p><br></p>'))
            this.initSelection()
            return
        }

        var $last = $children.last()

        if (newLine) {
            // 新增一个空行
            var html = $last.html().toLowerCase()
            var nodeName = $last.getNodeName()
            if (html !== '<br>' && html !== '<br\/>' || nodeName !== 'P') {
                // 最后一个元素不是 <p><br></p>，添加一个空行，重新设置选区
                $textElem.append($('<p><br></p>'))
                this.initSelection()
                return
            }
        }

        this.selection.createRangeByElem($last, false, true)
        this.selection.restoreSelection()
    },

    // 绑定事件
    _bindEvent: function _bindEvent() {
        // -------- 绑定 onchange 事件 --------
        var onChangeTimeoutId = 0
        var beforeChangeHtml = this.txt.html()
        var config$$1 = this.config

        // onchange 触发延迟时间
        var onchangeTimeout = config$$1.onchangeTimeout
        onchangeTimeout = parseInt(onchangeTimeout, 10)
        if (!onchangeTimeout || onchangeTimeout <= 0) {
            onchangeTimeout = 200
        }

        var onchange = config$$1.onchange
        if (onchange && typeof onchange === 'function') {
            // 触发 change 的有三个场景：
            // 1. $textContainerElem.on('click keyup')
            // 2. $toolbarElem.on('click')
            // 3. editor.cmd.do()
            this.change = function() {
                // 判断是否有变化
                var currentHtml = this.txt.html()
                if (currentHtml.length === beforeChangeHtml.length) {
                    // 需要比较每一个字符
                    if (currentHtml === beforeChangeHtml) {
                        return
                    }
                }

                // 执行，使用节流
                if (onChangeTimeoutId) {
                    clearTimeout(onChangeTimeoutId)
                }
                onChangeTimeoutId = setTimeout(function() {
                    // 触发配置的 onchange 函数
                    onchange(currentHtml)
                    beforeChangeHtml = currentHtml
                }, onchangeTimeout)
            }
        }

        // -------- 绑定 onblur 事件 --------
        var onblur = config$$1.onblur
        if (onblur && typeof onblur === 'function') {
            this.onblur = function() {
                var currentHtml = this.txt.html()
                onblur(currentHtml)
            }
        }

        // -------- 绑定 onfocus 事件 --------
        var onfocus = config$$1.onfocus
        if (onfocus && typeof onfocus === 'function') {
            this.onfocus = function() {
                onfocus()
            }
        }
    },

    // 创建编辑器
    create: function create() {
        // 初始化配置信息
        this._initConfig()

        // 初始化 DOM
        this._initDom()

        // 封装 command API
        this._initCommand()

        // 封装 selection range API
        this._initSelectionAPI()

        // 添加 text
        this._initText()

        // 初始化选区，将光标定位到内容尾部
        this.initSelection(true)

        // 绑定事件
        this._bindEvent()
    },

    // 解绑所有事件（暂时不对外开放）
    _offAllEvent: function _offAllEvent() {
        $.offAll()
    }
}

// 检验是否浏览器环境
try {
    document
} catch (ex) {
    throw new Error('请在浏览器环境下运行')
}

// polyfill
polyfill()

// 这里的 `inlinecss` 将被替换成 css 代码的内容，详情可去 ./gulpfile.js 中搜索 `inlinecss` 关键字
var inlinecss = '.w-e-toolbar,.w-e-text-container,.w-e-menu-panel {  padding: 0;  margin: 0;  box-sizing: border-box;}.w-e-toolbar *,.w-e-text-container *,.w-e-menu-panel * {  padding: 0;  margin: 0;  box-sizing: border-box;}.w-e-clear-fix:after {  content: "";  display: table;  clear: both;}.w-e-toolbar .w-e-droplist {  position: absolute;  left: 0;  top: 0;  background-color: #fff;  border: 1px solid #f1f1f1;  border-right-color: #ccc;  border-bottom-color: #ccc;}.w-e-toolbar .w-e-droplist .w-e-dp-title {  text-align: center;  color: #999;  line-height: 2;  border-bottom: 1px solid #f1f1f1;  font-size: 13px;}.w-e-toolbar .w-e-droplist ul.w-e-list {  list-style: none;  line-height: 1;}.w-e-toolbar .w-e-droplist ul.w-e-list li.w-e-item {  color: #333;  padding: 5px 0;}.w-e-toolbar .w-e-droplist ul.w-e-list li.w-e-item:hover {  background-color: #f1f1f1;}.w-e-toolbar .w-e-droplist ul.w-e-block {  list-style: none;  text-align: left;  padding: 5px;}.w-e-toolbar .w-e-droplist ul.w-e-block li.w-e-item {  display: inline-block;  *display: inline;  *zoom: 1;  padding: 3px 5px;}.w-e-toolbar .w-e-droplist ul.w-e-block li.w-e-item:hover {  background-color: #f1f1f1;}@font-face {  font-family: \'w-e-icon\';  src: url(data:application/x-font-woff;charset=utf-8;base64,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) format(\'truetype\');  font-weight: normal;  font-style: normal;}[class^="w-e-icon-"],[class*=" w-e-icon-"] {  /* use !important to prevent issues with browser extensions that change fonts */  font-family: \'w-e-icon\' !important;  speak: none;  font-style: normal;  font-weight: normal;  font-variant: normal;  text-transform: none;  line-height: 1;  /* Better Font Rendering =========== */  -webkit-font-smoothing: antialiased;  -moz-osx-font-smoothing: grayscale;}.w-e-icon-close:before {  content: "\\f00d";}.w-e-icon-upload2:before {  content: "\\e9c6";}.w-e-icon-trash-o:before {  content: "\\f014";}.w-e-icon-header:before {  content: "\\f1dc";}.w-e-icon-pencil2:before {  content: "\\e906";}.w-e-icon-paint-brush:before {  content: "\\f1fc";}.w-e-icon-image:before {  content: "\\e90d";}.w-e-icon-play:before {  content: "\\e912";}.w-e-icon-location:before {  content: "\\e947";}.w-e-icon-undo:before {  content: "\\e965";}.w-e-icon-redo:before {  content: "\\e966";}.w-e-icon-quotes-left:before {  content: "\\e977";}.w-e-icon-list-numbered:before {  content: "\\e9b9";}.w-e-icon-list2:before {  content: "\\e9bb";}.w-e-icon-link:before {  content: "\\e9cb";}.w-e-icon-happy:before {  content: "\\e9df";}.w-e-icon-bold:before {  content: "\\ea62";}.w-e-icon-underline:before {  content: "\\ea63";}.w-e-icon-italic:before {  content: "\\ea64";}.w-e-icon-strikethrough:before {  content: "\\ea65";}.w-e-icon-table2:before {  content: "\\ea71";}.w-e-icon-paragraph-left:before {  content: "\\ea77";}.w-e-icon-paragraph-center:before {  content: "\\ea78";}.w-e-icon-paragraph-right:before {  content: "\\ea79";}.w-e-icon-terminal:before {  content: "\\f120";}.w-e-icon-page-break:before {  content: "\\ea68";}.w-e-icon-cancel-circle:before {  content: "\\ea0d";}.w-e-icon-font:before {  content: "\\ea5c";}.w-e-icon-text-heigh:before {  content: "\\ea5f";}.w-e-toolbar {  display: -webkit-box;  display: -ms-flexbox;  display: flex;  padding: 0 5px;  /* flex-wrap: wrap; */  /* 单个菜单 */}.w-e-toolbar .w-e-menu {  position: relative;  text-align: center;  padding: 5px 10px;  cursor: pointer;}.w-e-toolbar .w-e-menu i {  color: #999;}.w-e-toolbar .w-e-menu:hover i {  color: #333;}.w-e-toolbar .w-e-active i {  color: #1e88e5;}.w-e-toolbar .w-e-active:hover i {  color: #1e88e5;}.w-e-text-container .w-e-panel-container {  position: absolute;  top: 0;  left: 50%;  border: 1px solid #ccc;  border-top: 0;  box-shadow: 1px 1px 2px #ccc;  color: #333;  background-color: #fff;  /* 为 emotion panel 定制的样式 */  /* 上传图片的 panel 定制样式 */}.w-e-text-container .w-e-panel-container .w-e-panel-close {  position: absolute;  right: 0;  top: 0;  padding: 5px;  margin: 2px 5px 0 0;  cursor: pointer;  color: #999;}.w-e-text-container .w-e-panel-container .w-e-panel-close:hover {  color: #333;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-title {  list-style: none;  display: -webkit-box;  display: -ms-flexbox;  display: flex;  font-size: 14px;  margin: 2px 10px 0 10px;  border-bottom: 1px solid #f1f1f1;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-title .w-e-item {  padding: 3px 5px;  color: #999;  cursor: pointer;  margin: 0 3px;  position: relative;  top: 1px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-title .w-e-active {  color: #333;  border-bottom: 1px solid #333;  cursor: default;  font-weight: 700;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content {  padding: 10px 15px 10px 15px;  font-size: 16px;  /* 输入框的样式 */  /* 按钮的样式 */}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input:focus,.w-e-text-container .w-e-panel-container .w-e-panel-tab-content textarea:focus,.w-e-text-container .w-e-panel-container .w-e-panel-tab-content button:focus {  outline: none;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content textarea {  width: 100%;  border: 1px solid #ccc;  padding: 5px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content textarea:focus {  border-color: #1e88e5;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text] {  border: none;  border-bottom: 1px solid #ccc;  font-size: 14px;  height: 20px;  color: #333;  text-align: left;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text].small {  width: 30px;  text-align: center;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text].block {  display: block;  width: 100%;  margin: 10px 0;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text]:focus {  border-bottom: 2px solid #1e88e5;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button {  font-size: 14px;  color: #1e88e5;  border: none;  padding: 5px 10px;  background-color: #fff;  cursor: pointer;  border-radius: 3px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.left {  float: left;  margin-right: 10px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.right {  float: right;  margin-left: 10px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.gray {  color: #999;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.red {  color: #c24f4a;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button:hover {  background-color: #f1f1f1;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container:after {  content: "";  display: table;  clear: both;}.w-e-text-container .w-e-panel-container .w-e-emoticon-container .w-e-item {  cursor: pointer;  font-size: 18px;  padding: 0 3px;  display: inline-block;  *display: inline;  *zoom: 1;}.w-e-text-container .w-e-panel-container .w-e-up-img-container {  text-align: center;}.w-e-text-container .w-e-panel-container .w-e-up-img-container .w-e-up-btn {  display: inline-block;  *display: inline;  *zoom: 1;  color: #999;  cursor: pointer;  font-size: 60px;  line-height: 1;}.w-e-text-container .w-e-panel-container .w-e-up-img-container .w-e-up-btn:hover {  color: #333;}.w-e-text-container {  position: relative;}.w-e-text-container .w-e-progress {  position: absolute;  background-color: #1e88e5;  bottom: 0;  left: 0;  height: 1px;}.w-e-text {  padding: 0 10px;  overflow-y: scroll;}.w-e-text p,.w-e-text h1,.w-e-text h2,.w-e-text h3,.w-e-text h4,.w-e-text h5,.w-e-text table,.w-e-text pre {  margin: 10px 0;  line-height: 1.5;}.w-e-text ul,.w-e-text ol {  margin: 10px 0 10px 20px;}.w-e-text blockquote {  display: block;  border-left: 8px solid #d0e5f2;  padding: 5px 10px;  margin: 10px 0;  line-height: 1.4;  font-size: 100%;  background-color: #f1f1f1;}.w-e-text code {  display: inline-block;  *display: inline;  *zoom: 1;  background-color: #f1f1f1;  border-radius: 3px;  padding: 3px 5px;  margin: 0 3px;}.w-e-text pre code {  display: block;}.w-e-text table {  border-top: 1px solid #ccc;  border-left: 1px solid #ccc;}.w-e-text table td,.w-e-text table th {  border-bottom: 1px solid #ccc;  border-right: 1px solid #ccc;  padding: 3px 5px;}.w-e-text table th {  border-bottom: 2px solid #ccc;  text-align: center;}.w-e-text:focus {  outline: none;}.w-e-text img {  cursor: pointer;}.w-e-text img:hover {  box-shadow: 0 0 5px #333;}'

// 将 css 代码添加到 <style> 中
var style = document.createElement('style')
style.type = 'text/css'
style.innerHTML = inlinecss
document.getElementsByTagName('HEAD').item(0).appendChild(style)

// 返回
var index = window.wangEditor || Editor

return index
}))
