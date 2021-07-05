// 图片操作
module.exports = {
	/**
	 * 图片等比缩放
	 */
	resizeImage(width, height, maxWidth, maxHeight) {
		let tempWidth
		let tempHeight
		let containerWidth
		let containerHeight
		if (width > 0 && height > 0) {
			// 原图片宽高比例 大于 指定的宽高比例，这就说明了原图片的宽度必然 > 高度
			if (width / height >= maxWidth / maxHeight) {
				if (width > maxWidth) {
					if (width / height > 5 && width > 450) {
						// tempHeight = maxHeight / 1.5
						tempHeight = 50
						tempWidth = width * tempHeight / height
						// containerWidth = tempHeight * 2
						containerWidth = maxWidth
					} else {
						tempWidth = maxWidth
						// 按原图片的比例进行缩放
						tempHeight = height * tempWidth / width
						containerWidth = tempWidth
					}
					containerHeight = tempHeight
				} else {
					// 按原图片的大小进行缩放
					tempWidth = width
					tempHeight = height
					containerWidth = tempWidth
					containerHeight = tempHeight
				}
			} else { // 原图片的高度必然 > 宽度
				if (height > maxHeight) {
					if (height / width > 5 && height > 300) {
						// tempWidth = maxWidth / 1.5
						tempWidth = 50
						tempHeight = height * tempWidth / width
						// containerHeight = tempWidth * 2
						containerHeight = maxHeight
					} else {
						tempHeight = maxHeight
						// 按原图片的比例进行缩放
						tempWidth = width * tempHeight / height
						containerHeight = tempHeight
					}
					containerWidth = tempWidth
				} else {
					// 按原图片的大小进行缩放
					tempWidth = width
					tempHeight = height
					containerWidth = tempWidth
					containerHeight = tempHeight
				}
			}
		}
		return {
			width: parseInt(tempWidth),
			height: parseInt(tempHeight),
			containerWidth: parseInt(containerWidth),
			containerHeight: parseInt(containerHeight)
		}
	},
	/*
	* 通过图片路径获取图片宽高
	* */
	getImageSize(imgUrl) {
		return new Promise((resolve, reject) => {
			const img = new Image()
			img.src = imgUrl
			let isFinished = false
			let i = 0
			const timer = setInterval(() => {
				if (isFinished) clearInterval(timer)
				if (i >= 5) {
					resolve({ width: 0, height: 0 }) // 加载超时
					clearInterval(timer)
				}
				i++
			}, 1000)
			img.onload = function() {
				isFinished = true
				clearInterval(timer)
				resolve({ width: img.width, height: img.height })
			}
			img.error = function() {
				clearInterval(timer)
				isFinished = true
				resolve({ width: 0, height: 0 })
			}
		})
	},
	/**
	 * 图片压缩（利用canvas）
	 * @param  filePath     图片路径
	 * @param  obj      压缩配置width,height,quality，不传则按比例压缩
	 */
	compressImage(filePath, obj) {
		return new Promise((resolve, reject) => {
			const img = new Image()
			img.src = filePath
			img.crossOrigin = 'Anonymous'// 解决Canvas.toDataURL 图片跨域问题
			img.onload = function() {
				obj = obj || {}
				// 默认按比例压缩
				let w = img.width
				let h = img.height
				const scale = w / h
				w = obj.width || w
				h = obj.height || (w / scale)

				// 生成canvas
				const canvas = document.createElement('canvas')
				const ctx = canvas.getContext('2d')
				canvas.width = w
				canvas.height = h
				ctx.drawImage(img, 0, 0, w, h)

				// 默认图片质量为0.9
				let quality = 0.9
				if (obj.quality && obj.quality <= 1 && obj.quality > 0) {
					quality = obj.quality
				}

				// 回调函数返回base64的值
				const base64 = canvas.toDataURL('image/jpeg', quality)
				resolve(base64)
			}
		})
	}
}
