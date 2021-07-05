var qun = require('@/assets/img/qun_default@2x.png')
var geren = require('@/assets/img/geren_default@2x.png')

module.exports = function(e, type) {
	e.target.src = type === 0 || type === 2 ? geren : qun
}
