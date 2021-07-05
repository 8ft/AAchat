module.exports = {
	shortEmail(email) {
		const emailParts = email.split('@')
		if (emailParts[0].length > 7) {
			return `${email.substr(0, 3)}****${emailParts[0].substring(emailParts[0].length - 2)}@${emailParts[1]}`
		} else {
			return email
		}
	}
}
