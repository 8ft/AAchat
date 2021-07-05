module.exports = function(file) {
	return new Promise((resolve, reject) => {
		var reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onloadend = function(e) {
			// console.log(e.target.result)
			resolve(e.target.result)
		}
	})
}
