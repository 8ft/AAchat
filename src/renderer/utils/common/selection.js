// 获取选中内容
export function getSelectionContent() {
	let html = ''
	let text = ''
	if (typeof window.getSelection != 'undefined') {
		const sel = window.getSelection()
		if (sel.rangeCount) {
			const container = document.createElement('div')
			for (let i = 0, len = sel.rangeCount; i < len; ++i) {
				container.appendChild(sel.getRangeAt(i).cloneContents())
			}
			html = container.innerHTML
			text = container.innerText
		}
	}

	if (html || text) {
		return { html, text }
	} else {
		return null
	}
}
