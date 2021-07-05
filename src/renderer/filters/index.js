export function formatBytes(bytes, decimal = 1) {
	if (bytes == 0) {
		return '0MB'
	} else if (bytes != null) {
        const result = Number(bytes)
        if (result <= 0) {
            return `${result}KB`
        } else {
            const s = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
            const e = Math.floor(Math.log(bytes) / Math.log(1024))
            return `${(bytes / Math.pow(1024, Math.floor(e))).toFixed(decimal)}${
                s[e]
            }`
        }
    } else {
    	return '-'
    }
}
export function timeMeter(time) {
	const minuteSecond = 60
	const hourSecond = 60 * minuteSecond
	let getHours = parseInt(time / hourSecond)
	getHours = getHours > 9 ? getHours : ('0' + getHours)
	time = time % hourSecond
	let getMinutes = parseInt(time / minuteSecond)
	getMinutes = getMinutes > 9 ? getMinutes : ('0' + getMinutes)
	let getSeconds = time % minuteSecond
	getSeconds = getSeconds > 9 ? getSeconds : ('0' + getSeconds)
	// console.log(`${getHours}:${getMinutes}:${getSeconds}`)
	return `${getHours}:${getMinutes}:${getSeconds}`
}
