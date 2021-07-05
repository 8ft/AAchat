import axios from 'axios'
import { remote } from 'electron'

const instance = axios.create({
	headers: {
		'Content-Type': 'application/json;charset=utf-8'
	},
	timeout: 600000,
	baseURL: `http://localhost:${remote.getGlobal('serverPort')}`,
	validateStatus: function(status) {
		return true
	}
})
instance.interceptors.request.use(config => {
	return config
})
instance.interceptors.response.use(response => {
	return response.data
})
module.exports = instance
