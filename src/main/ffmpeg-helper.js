import utils from '~/utils/'
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

export const getVideoMetaData = (App) => (videoPath) => {
	return new Promise(function(resolve, reject) {
		try {
			ffmpeg()
			.input(videoPath)
			.ffprobe(function(err, data) {
				if (err) {
					reject({ code: 999999, message: App.i18n.__('common.videoFileTip') })
					return
				}
				if (data.format.duration === 'N/A') {
					reject({ code: 999999, message: App.i18n.__('common.videoFileTip') })
					return
				}
				const streams = data.streams
				const videoMetaData = {
					hasVideo: false,
					hasAudio: false,
					videoCodecSupport: false,
					audioCodecSupport: false,
					duration: parseInt(data.format.duration),
					size: data.format.size
				}
				// console.log(222, data)
				if (streams) {
					// console.log(streams)
					streams.map((value) => {
						if (value.codec_type === 'video') {
							const { width, height } = rotationVideo(value.width, value.height, value.rotation || '0')
							videoMetaData.width = width
							videoMetaData.height = height
							videoMetaData.rotation = value.rotation || '0'
							videoMetaData.duration = parseInt(value.duration)
							videoMetaData.video_bit_rate = value.bit_rate * 1024 // kb转换成b
							videoMetaData.hasVideo = true
							if ((value.codec_name == 'h264' || value.codec_name == 'vp8' || value.codec_name == 'theora')) videoMetaData.videoCodecSupport = true
						}
						if (value.codec_type == 'audio') {
							videoMetaData.hasAudio = true
							if (value.codec_name == 'aac' || value.codec_name == 'vorbis') videoMetaData.audioCodecSupport = true
						}
					})
				}
				// console.log(444444, videoMetaData)
				resolve({ code: 0, data: videoMetaData })
			})
		} catch (e) {
			reject(e)
		}
	})
}
export const rotationVideo = (oldWidth, oldHeight, rotation) => {
	rotation = Math.abs(rotation * 1)
	rotation = rotation / 90 % 2
	return {
		width: rotation === 1 ? oldHeight : oldWidth,
		height: rotation === 1 ? oldWidth : oldHeight
	}
}
export const videoTransCode = (App) => async(videoPath, savePath, callback) => {
	try {
		const videoMetaData = (await getVideoMetaData(App)(videoPath)).data
		let tempProgress
		// changeVideoRate = false
		// changeVideoSize = false
		const _ffmpegCommand = ffmpeg().input(videoPath)
		if (videoMetaData.hasVideo) {
			if (videoMetaData.videoCodecSupport) {
				_ffmpegCommand
				.videoCodec('copy')
			} else {
				let video_bit_rate = videoMetaData.video_bit_rate
				let video_size = videoMetaData.width + 'x' + videoMetaData.height
				if (video_bit_rate > 1000000) video_bit_rate = 1000000
				if (videoMetaData.width > 960) video_size = '960x?'
				_ffmpegCommand
				.videoCodec('libx264')
				.size(video_size)
				.videoBitrate(parseInt(video_bit_rate / 1000))
			}
		}
		if (videoMetaData.hasAudio) {
			_ffmpegCommand.audioCodec(videoMetaData.audioCodecSupport ? 'copy' : 'aac')
		}
		_ffmpegCommand
		.format('mp4')
		.on('progress', function(progress) {
			/* progress = {
        frames: 529,
        currentFps: 347,
        currentKbps: 699.7,
        targetSize: 1536,
        timemark: '00:00:17.98',
        percent: 7.795158157602663
      }*/
			tempProgress = progress
			callback({ state: 'progress', savePath, percent: parseInt(progress.percent) })
		})
		.on('error', function(err) {
			console.error('videoTransCode@An error occurred: ' + err.message)
			callback({ state: 'error' })
		})
		.on('end', function(t) {
			// console.log('tempProgress::::', tempProgress)
			tempProgress.targetSize = tempProgress.targetSize * 1024
			callback({ state: 'finished', savePath, percent: 100, videoInfo: tempProgress })
		})
		.save(savePath)
	} catch (e) {
		console.error('videoTransCode@', e.toString())
	}
}

export const videoThumbnail = (App) => (videoPath, saveThumbnailPath, videoThumbnailName) => {
	return new Promise(async(resolve, reject) => {
		getVideoMetaData(App)(videoPath).then(Data => {
			try {
				const videoMetaData = Data.data
				const imageInfo = utils.resizeImage(videoMetaData.rotation !== '0' ? videoMetaData.height : videoMetaData.width, videoMetaData.rotation !== '0' ? videoMetaData.width : videoMetaData.height, 300, 300)
				ffmpeg()
				.input(videoPath)
				.on('filenames', function(filenames) {
					// console.log('Will generate ' + filenames.join(', '))
				})
				.on('end', function() {
					videoMetaData.videoThumbnail = path.join(saveThumbnailPath, videoThumbnailName)
					resolve({ code: 0, data: videoMetaData })
				})
				.screenshots({
					count: 1,
					timemarks: ['1%'],
					filename: videoThumbnailName,
					size: `${imageInfo.width}x${imageInfo.height}`,
					folder: saveThumbnailPath
				})
			} catch (e) {
				// console.log(22222, e)
				reject(e)
			}
		}).catch(e => {
			// console.log(3333, e)
			reject(e)
		})
	})
}
