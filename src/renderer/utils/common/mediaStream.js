// 流媒体，目前用于实时音频、视频
export function getUserMedia(constraints, success, error) {
	if (navigator.mediaDevices.getUserMedia) {
		// 最新的标准API
		navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error)
	} else if (navigator.webkitGetUserMedia) {
		// webkit核心浏览器
		navigator.webkitGetUserMedia(constraints, success, error)
	} else if (navigator.mozGetUserMedia) {
		// firfox浏览器
		navigator.mozGetUserMedia(constraints, success, error)
	} else if (navigator.getUserMedia) {
		// 旧版API
		navigator.getUserMedia(constraints, success, error)
	}
}

export function getAudioStream(localStream, callback) {
	return new Promise((resolve, reject) => {
		const mediaRecorder = new MediaRecorder(localStream, {
			mimeType: 'audio/webm;codecs=pcm',
			audioBitsPerSecond: 16000
		})
		mediaRecorder.ondataavailable = async(blob) => {
			callback(blob)
		}
		mediaRecorder.start(1)
	})
}

export function base64toBlob(data) {
	console.log('base64toBlob:::', data)
	const bstr = atob(data)
	let n = bstr.length
	const u8arr = new Uint8Array(n)
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new Blob([u8arr], { type: 'audio/wav' })
}
export function audioURLtoBlob(data) {
	const bstr = atob(data)
	let n = bstr.length
	const u8arr = new Uint8Array(n)
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new Blob([u8arr], { type: 'audio/webm;codecs=pcm' })
}
export function base64ToInt16Array(base64) {
	const binary_string = window.atob(decodeURIComponent(base64))
	const len = binary_string.length
	const bytes = new Int16Array(len)
	for (let i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i)
	}
	return bytes.buffer
}
export function int16ArrayToBase64(int16Array) {
	let binary = ''
  const len = int16Array.byteLength
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(int16Array[i])
  }
  return window.btoa(encodeURIComponent(binary))
}
export function arrayBufferToBase64(buffer) {
	let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
export function base64ToArrayBuffer(base64) {
	const binary_string = window.atob(base64)
	const len = binary_string.length
	const bytes = new Uint8Array(len)
	for (let i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i)
	}
	return bytes.buffer
}
export function arrayBufferToBuffer(arrayBuffer) {
	const buf = new Buffer(arrayBuffer.byteLength)
	for (let i = 0; i < buf.length; ++i) {
		buf[i] = arrayBuffer[i]
	}
	return buf
}
export function addWavHeader(samples, sampleRate, sampleBits, channelCount) {
	const dataLength = samples.byteLength
	/* 新的buffer类，预留44bytes的heaer空间 */
	const buffer = new ArrayBuffer(44 + dataLength)
	/* 转为 Dataview, 利用 API 来填充字节 */
	const view = new DataView(buffer)
	/* 定义一个内部函数，以 big end 数据格式填充字符串至 DataView */
	function writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i))
		}
	}

	let offset = 0
	/* ChunkID, 4 bytes,  资源交换文件标识符 */
	writeString(view, offset, 'RIFF'); offset += 4
	/* ChunkSize, 4 bytes, 下个地址开始到文件尾总字节数,即文件大小-8 */
	view.setUint32(offset, /* 32 */ 36 + dataLength, true); offset += 4
	/* Format, 4 bytes, WAV文件标志 */
	writeString(view, offset, 'WAVE'); offset += 4
	/* Subchunk1 ID, 4 bytes, 波形格式标志 */
	writeString(view, offset, 'fmt '); offset += 4
	/* Subchunk1 Size, 4 bytes, 过滤字节,一般为 0x10 = 16 */
	view.setUint32(offset, 16, true); offset += 4
	/* Audio Format, 2 bytes, 格式类别 (PCM形式采样数据) */
	view.setUint16(offset, 1, true); offset += 2
	/* Num Channels, 2 bytes,  通道数 */
	view.setUint16(offset, channelCount, true); offset += 2
	/* SampleRate, 4 bytes, 采样率,每秒样本数,表示每个通道的播放速度 */
	view.setUint32(offset, sampleRate, true); offset += 4
	/* ByteRate, 4 bytes, 波形数据传输率 (每秒平均字节数) 通道数×每秒数据位数×每样本数据位/8 */
	view.setUint32(offset, sampleRate * channelCount * (sampleBits / 8), true); offset += 4
	/* BlockAlign, 2 bytes, 快数据调整数 采样一次占用字节数 通道数×每样本的数据位数/8 */
	view.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2
	/* BitsPerSample, 2 bytes, 每样本数据位数 */
	view.setUint16(offset, sampleBits, true); offset += 2
	/* Subchunk2 ID, 4 bytes, 数据标识符 */
	writeString(view, offset, 'data'); offset += 4
	/* Subchunk2 Size, 4 bytes, 采样数据总数,即数据总大小-44 */
	view.setUint32(offset, dataLength, true); offset += 4

	/* 数据流需要以大端的方式存储，定义不同采样比特的 API */
	function floatTo32BitPCM(output, offset, input) {
		input = new Int32Array(input)
		for (let i = 0; i < input.length; i++, offset += 4) {
			output.setInt32(offset, input[i], true)
		}
	}
	function floatTo16BitPCM(output, offset, input) {
		input = new Int16Array(input)
		for (let i = 0; i < input.length; i++, offset += 2) {
			output.setInt16(offset, input[i], true)
		}
	}
	function floatTo8BitPCM(output, offset, input) {
		input = new Int8Array(input)
		for (let i = 0; i < input.length; i++, offset++) {
			output.setInt8(offset, input[i], true)
		}
	}
	if (sampleBits == 16) {
		floatTo16BitPCM(view, 44, samples)
	} else if (sampleBits == 8) {
		floatTo8BitPCM(view, 44, samples)
	} else {
		floatTo32BitPCM(view, 44, samples)
	}
	return view.buffer
}
export function blobToDataURL(blob) {
	return new Promise((resolve, reject) => {
		const a = new FileReader()
		a.onload = function(e) { resolve(e.target.result) }
		a.readAsDataURL(blob)
	})
}
export function blobToArrayBuffer(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsArrayBuffer(blob)
		reader.onload = (e) => {
			const buf = new Uint8Array(reader.result)
			resolve(buf)
		}
	})
}
export function arrayBufferToBlob(data, type) {
	return new Blob([data], { type: type || 'audio/webm;codecs=pcm' })
}
export function blobToBuffer(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsText(blob, 'base64')
		reader.onload = (e) => {
			resolve(reader.result)
		}
	})
}
export function playAudioByBuffer(audioData) {
	const audioCtx = new AudioContext()
	const audioBufferSouceNode = audioCtx.createBufferSource()
	audioCtx.decodeAudioData(audioData, function(buffer) {
			audioBufferSouceNode.connect(audioCtx.destination)
			audioBufferSouceNode.buffer = buffer
			audioBufferSouceNode.start(0)
		},
		function(e) {
		console.error('Error with decoding audio data' + e.err)
	})
	return {
		audioBufferSouceNode,
		audioCtx
	}
}
export function writeString(data, offset, str) {
	for (let i = 0; i < str.length; i++) {
		data.setUint8(offset + i, str.charCodeAt(i))
	}
}
export function floatTo16BitPCM(output, offset, input) {
	for (let i = 0; i < input.length; i++, offset += 2) { // 因为是int16所以占2个字节,所以偏移量是+2
		const s = Math.max(-1, Math.min(1, input[i]))
		output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
	}
	console.log('floatTo16BitPCM::::output:::', output)
}

export function floatTo8BitPCM(output, offset, input) {
	for (let i = 0; i < input.length; i++, offset++) { // 这里只能加1了
		const s = Math.max(-1, Math.min(1, input[i]))
		let val = s < 0 ? s * 0x8000 : s * 0x7FFF
		val = parseInt(255 / (65535 / (val + 32768))) // 这里有一个转换的代码,这个是我个人猜测的,就是按比例转换
		output.setInt8(offset, val, true)
	}
	console.log('floatTo8BitPCM::::output:::', output)
}
export function pcmToWav(bytes) {
	var sampleRate = 44100
	var sampleBits = 16
	var dataLength = bytes.length * (sampleBits / 8)
	var buffer = new ArrayBuffer(44 + dataLength)
	var data = new DataView(buffer)

	var channelCount = 1// 单声道
	var offset = 0

	var writeString = function(str) {
		for (var i = 0; i < str.length; i++) {
			data.setUint8(offset + i, str.charCodeAt(i))
		}
	}

	// 资源交换文件标识符
	writeString('RIFF'); offset += 4
	// 下个地址开始到文件尾总字节数,即文件大小-8
	data.setUint32(offset, 36 + dataLength, true); offset += 4
	// WAV文件标志
	writeString('WAVE'); offset += 4
	// 波形格式标志
	writeString('fmt '); offset += 4
	// 过滤字节,一般为 0x10 = 16
	data.setUint32(offset, 16, true); offset += 4
	// 格式类别 (PCM形式采样数据)
	data.setUint16(offset, 1, true); offset += 2
	// 通道数
	data.setUint16(offset, channelCount, true); offset += 2
	// 采样率,每秒样本数,表示每个通道的播放速度
	data.setUint32(offset, sampleRate, true); offset += 4
	// 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
	data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true); offset += 4
	// 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
	data.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2
	// 每样本数据位数
	data.setUint16(offset, sampleBits, true); offset += 2
	// 数据标识符
	writeString('data'); offset += 4
	// 采样数据总数,即数据总大小-44
	data.setUint32(offset, dataLength, true); offset += 4
	// 写入采样数据
	if (sampleBits === 8) {
		for (let i = 0; i < bytes.length; i++, offset++) {
			const s = Math.max(-1, Math.min(1, bytes[i]))
			let val = s < 0 ? s * 0x8000 : s * 0x7FFF
			val = parseInt(255 / (65535 / (val + 32768)))
			data.setInt8(offset, val, true)
		}
	} else {
		for (let i = 0; i < bytes.length; i++, offset += 2) {
			const s = Math.max(-1, Math.min(1, bytes[i]))
			data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
		}
	}
	return new Blob([data], { type: 'audio/wav' })
}
export function getWAVBlob(wav) {
	return new Blob([wav], { type: 'audio/wav' })
}
export function compress(buffer, size) {
	const data = new Float32Array(size)
	let offset = 0
	for (let i = 0; i < buffer.length; i++) {
		data.set(buffer[i], offset)
		offset += buffer[i].length
	}
	// 压缩
	const compression = 1 // parseInt(this.inputSampleRate / this.outputSampleRate)
	const length = data.length / compression
	const result = new Float32Array(length)
	let index = 0; let j = 0
	while (index < length) {
		result[index] = data[j]
		j += compression
		index++
	}
	return result.buffer
}
export function getAudioStreamByAudioContext(stream, callback) {
	const audioCtx = new AudioContext({
		sampleRate: 44100 // 输入音频采样率(HZ)
	})
	const audioInput = audioCtx.createMediaStreamSource(stream)
	// 构造参数依次为缓冲区大小，输入通道数，输出通道数
	const scriptNode = audioCtx.createScriptProcessor(2048, 1, 1)
	// let buffer = []
	// let size = 0
	scriptNode.onaudioprocess = function(e) {
		// getChannelData返回Float32Array类型的pcm数据
		const bytes = e.inputBuffer.getChannelData(0)
		callback(bytes)
		/* buffer.push(new Float32Array(bytes))
		size += bytes.length
		if (size > 2000) {
			callback(compress(buffer, size))
			buffer = []
			size = 0
		}*/
		// callback(bytes.buffer)
		// 转成16位pcm
		/* const dataLength = bytes.length
		const pcm = new Int16Array(dataLength)
		for (let j = 0; j < dataLength; j++) { // floatTo16BitPCM
			let s = Math.max(-1, Math.min(1, bytes[j]))
			s = s < 0 ? s * 0x8000 : s * 0x7FFF
			pcm[j] = s
		}
		callback(pcm)*/
		// callback(addWavHeader(bytes, 44100, 16, 1))
		/* // 写入采样数据
		let offset = 0
		if (oututSampleBits === 8) {
			for (let i = 0; i < bytes.length; i++, offset++) {
				// 范围[-1, 1]
				const s = Math.max(-1, Math.min(1, bytes[i]))
				// 8位采样位划分成2^8=256份，它的范围是0-255; 16位的划分的是2^16=65536份，范围是-32768到32767
				// 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
				// 对于8位的话，负数*128，正数*127，然后整体向上平移128(+128)，即可得到[0,255]范围的数据。
				let val = s < 0 ? s * 128 : s * 127
				val = parseInt(val + 128)
				data.setInt8(offset, val, true)
			}
		} else {
			for (let i = 0; i < bytes.length; i++, offset += 2) {
				const s = Math.max(-1, Math.min(1, bytes[i]))
				// 16位直接乘就行了
				data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
			}
		}*/
	}
	audioInput.connect(scriptNode)
	scriptNode.connect(audioCtx.destination)
	return audioCtx
	/* // 创建音频处理的输出节点
	const dest = ac.createMediaStreamDestination()

	// 串联连接
	source.connect(scriptNode)
	scriptNode.connect(dest)
	// 添加事件处理
	scriptNode.onaudioprocess = function(audioProcessingEvent) {
		// 输入流位置
		const inputBuffer = audioProcessingEvent.inputBuffer
		// 输出流位置
		const outputBuffer = audioProcessingEvent.outputBuffer
		// 遍历通道处理数据，当前只有1个输入1个输出
		for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
			const inputData = inputBuffer.getChannelData(channel)
			const buffer = new ArrayBuffer(inputData.length * 2)
			const view = new DataView(buffer)
			// 转换成 16bitPCM
			for (let i = 0; i < inputData.length; i = i + 1) {
				const s = Math.max(-1, Math.min(1, inputData[i]))
				view.setInt16(0, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
			}
			callback(view)
		}
	}*/
}
