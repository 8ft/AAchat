const { isMainThread, Worker, parentPort } = require('worker_threads')
const path = require('path')

if (isMainThread) {
	module.exports = function(callback, error) {
		console.log('__filename::')
		return new Promise((resolve, reject) => {
			const worker = new Worker(path.resolve(__filename))
			worker.on('exit', code => {
				console.log(`main: worker stopped with exit code ${code}`)
				resolve({ code: 0 })
			})
			worker.on('message', msg => {
				console.log(`main: receive ${msg}`)
				worker.terminate()
			})
			worker.on('error', msg => {
				console.log('main:error@', msg)
				resolve({ code: 0 })
				worker.terminate()
			})
			worker.postMessage(323)
		})
		/* const chatSdk = require('~/c-shared/hermes/').default
		let time = parseInt(chatSdk.cTime() / 10000000)
		worker.postMessage({
			baseTime: time
		})
		worker.on('message', newTime => {
			// console.log(123243, newTime - time)
			if (newTime - time > 5000) {
				time = parseInt(chatSdk.cTime() / 1000000)
				worker.postMessage({
					baseTime: time
				})
			}
			callback(newTime)
		})
		worker.on('error', error => {
			error(error)
			worker.terminate()
		})
		worker.on('exit', code => {
			console.log('timeClockWorkerExit:::', code)
		})*/
		// return worker
	}
} else {
	// let interval = null
	parentPort.on('message', ({ baseTime }) => {
		/* if (interval) clearInterval(interval)
		interval = setInterval(() => {
			baseTime++
			parentPort.postMessage(baseTime)
			// console.log(123, baseTime)
		}, 1)*/
	})
}
