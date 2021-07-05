export function isPhone(phone) {
	const reg = /^[\d]+$/g
	if (phone !== '') return reg.test(phone)
	else return false
}

export function isCnPhone(phone) {
	const reg = /^0?1[0|1|2|3|4|5|6|7|8|9][0-9]\d{8}$/
	if (phone !== '') return reg.test(phone)
	else return false
}

export function isEmail(email) {
	// const reg = /^[.a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
	const reg = /^[A-Za-z0-9]+([_\-\.]+[A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/
	if (email !== '') return reg.test(email)
	else return false
}

export function isPassword(pwss) {
	// const reg = /^(?!([a-zA-Z]+|\d+)$)[!@#$%^&*()a-zA-Z\d]{8,64}$/
	const reg = /^(?![\d]+$)(?![a-zA-Z]+$)(?![!@#$%^&*()_-]+$)[\da-zA-Z!@#$%^&*()_-]{8,16}$/
	// const reg = /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z!@#$%^&*()]{8,64}$/
	if (pwss !== '') return reg.test(pwss)
	else return false
}

export function isNickNameAllow(name) {
	// const reg = /^[A-Za-z0-9\u4e00-\u9fa5]{1,16}$/g // 中文、数字、字母
	const reg = /^[A-Za-z0-9\u4e00-\u9fa5!@#$%^&*()_-]{1,20}$/g // 1-20个中文 字母 数字组合，支持特殊符号（!@#$%^&*()_-）；不支持空格
	if (name !== '') return reg.test(name)
	else return false
}

export function isquickAllow(name) {
	const reg = /^[A-Za-z0-9\u4e00-\u9fa5!@#$%^&*()_-]{1,20}$/g // 1-20个中文 字母 数字组合，支持特殊符号（!@#$%^&*()_-）；不支持空格
	// const reg = /^[a-zA-Z]([-_a-zA-Z0-9]{5,20})$/g // 字母、数字、下划线和减号，必须以字母开头
	if (name !== '') return reg.test(name)
	else return false
}
