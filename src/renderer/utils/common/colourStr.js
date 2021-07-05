import formatReg from './formatReg'

module.exports = function colourStr(string, target) {
		const matchs = string.match(new RegExp(formatReg(target), 'gi'))
		if (matchs) {
			const arr = []
			let index
			for (let i = 0; i < matchs.length; i++) {
				index = string.indexOf(matchs[i])
				if (i === 0 && index >= 15) {
					arr.push(`${string.substr(0, 12)}...<i style=\"color: #2D7BFF;\">${matchs[i]}</i>`)
				} else {
					arr.push(`${string.substr(0, index)}<i style=\"color: #2D7BFF;\">${matchs[i]}</i>`)
				}

				string = string.substr(index + matchs[i].length)
			}
			arr.push(string)
			return arr.join('')
		} else {
			return string
		}
}
