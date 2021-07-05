/* const ref = require('ref-napi')
const refArray = require('ref-array')
const intArray = ref.refType(refArray(ref.types.int, 1))

console.log('cName:::：:', intArray)*/

export default {
	cState: ['bool', []],
	cHosts: ['void', ['string']],
	// Token 设置Token。
	// token为当前Token。
	// cid当前客户端唯一ID，可以是macid、imei等，也可以是客户端自行生成的唯一值，能唯一标识客户端即可。
	// uid当前用户UserID
	// otoken为上一个token，如果有提供则调用get时将返回上一个token最后一条消息之后的消息；
	// 即可以不调用NewHis填充离线消息，NewHis仅在新设备时需要调用。
	// func Token(uid, cid, token, otoken string) string {
	//	return message.Token(uid, cid, token, otoken)
	// }
	cToken: ['string', ['string', 'string', 'string', 'string']],
	// TokenOff 设置Token离线。
	/* func TokenOff() string {
			return message.TokenOff()
	}*/
	cTokenOff: ['string', []],
	cSendText: ['string', ['bool', 'string', 'string', 'string']],
	cSendImage: ['string', ['bool', 'string', 'string', 'string']],
	cSendFile: ['string', ['bool', 'string', 'string', 'string']],
	cSendAudio: ['string', ['bool', 'string', 'string', 'string']],
	cSendVideo: ['string', ['bool', 'string', 'string', 'string']],
	cUploadInfo: ['string', ['string']],
	cGet: ['string', ['int64']],
	cRead: ['string', ['string']],
	cDownload: ['string', ['string', 'string']],
	cDelete: ['string', ['string']],
	cClean: ['string', ['string', 'bool']],
	cHistory: ['string', ['int', 'int']],
	cRealAudioCall: ['string', ['string', 'string']],
	// RealAudioReject 实时音频拒绝。
	// func RealAudioReject(group, meta string) string {
	//   return message.RealAudioReject(group, meta)
	// }
	cRealAudioReject: ['string', ['string', 'string']],
	// RealAudioCancel 实时音频取消。
	// func RealAudioCancel(group, meta string) string {
	//   return message.RealAudioCancel(group, meta)
	// }
	cRealAudioCancel: ['string', ['string', 'string']],
	// RealAudioPass 实时音频同意。
	// content为get到的form=201消息的content。
	// func RealAudioPass(group, meta, content string) string {
	//   return message.RealAudioPass(group, meta, content)
	// }
	cRealAudioPass: ['string', ['string', 'string', 'string']],
	// RealAudioDone 实时音频结束。
	// func RealAudioDone(group, meta string) string {
	//    return message.RealAudioDone(group, meta)
	// }
	cRealAudioDone: ['string', ['string', 'string']],
	// SendReal 发送实时音频/视频数据。msg最大为1mb。
	// func SendReal(msg []byte) string {
	//   return message.SendReal(msg)
	// }
	cSendReal: ['string', ['string']],
	// SendRealBase64 发送Base64编码的实时音频/视频数据。msg最大为1mb。
	// func SendRealBase64(msg string) string {
	//     return message.SendRealBase64(msg)
	// }
	cSendRealBase64: ['string', ['string']],
	cReadRealBase64: ['string', []],
	cReadRealBase64Async: ['string', []],
	cUploadCancel: ['void', ['string']],
	// cClose: ['string', []],
	// RelayAsync 转发消息，转发到多个组group以逗号分隔。返回数据格式：
	// [{
	// 	"group": "目标group",
	// 	"code": "转发结果码",
	// 	"message": "转发结果信息，如果成功则为转发后的消息体"
	// }]
	/* func RelayAsync(form int, group, meta, content string) string {
		return message.RelayAsync(form, group, meta, content)
	}*/
	cRelayAsync: ['string', ['int', 'string', 'string', 'string']],
	cHostsAsync: ['string', ['string']],
	// cCloseAsync: ['string', []],
	cMergeRelayAsync: ['string', ['string', 'string', 'string']],
	cStateAsync: ['string', []],
	cSecretStateAsync: ['string', []],
	cSetSecretAsync: ['string', ['string']],
	cSecretOnAsync: ['string', ['string']],
	cSecretOffAsync: ['string', ['string']],
	cChangeSecretAsync: ['string', ['string', 'string']],
	cResetSecretAsync: ['string', ['string']],
	cSendAsync: ['string', ['int', 'bool', 'string', 'string', 'string', 'string']],
	cSendEmoticonAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	cSendTextAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	cSendImageAsync: ['string', ['bool', 'bool', 'string', 'string', 'string', 'string']],
	cSendFileAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	cSendAudioAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	cSendVideoAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	cGetAsync: ['string', []],
	cGetDoneAsync: ['string', []],
	cDeleteAsync: ['string', ['string', 'string', 'string']],
	cDelSessionAsync: ['string', ['string', 'string']],
	cMsgToSelfAsync: ['string', ['string', 'string']],
	cReadAsync: ['string', ['string']],
	// DownloadAsync 下载文件，文件内容保存到file文件中。
	// 如果uri为png/jpeg格式的图片，可在后缀前添加缩放比例，如：/paht/name.25.jpg表示获取/path/name.jpg缩放25%的图片。
	// 返回异步引用key，可以使用此key通过DownloadInfo获取到下载进度，或者通过DownloadCancel取消下载。
	// params: uri, file
	cDownloadAsync: ['string', ['string', 'string']],
	// DownloadInfo 获取下载进度。
	// 返回格式：n,result
	// n - 下载进度，0-100；
	// result - 下载结果。
	// params: key
	cDownloadInfo: ['string', ['string']],
	// DownloadCancel 取消下载。
	// params: key
	cDownloadCancel: ['void', ['string']],
	cCleanAsync: ['string', ['string', 'string']],
	cCleanAllAsync: ['string', ['string', 'bool']],
	cHistoryAsync: ['string', ['string', 'int', 'string', 'int']],

	cAddEmoticonAsync: ['string', ['string', 'string']],
	cSortEmoticonAsync: ['string', ['string']],
	cGetEmoticonAsync: ['string', []],
	cDeleteEmoticonAsync: ['string', ['string']],

	// Async 获取异步执行结果。
	// ts为true时，返回的数据中所有time值将替换为数值字符串。
	cAsync: ['string', ['string', 'bool']],
	cCopyUploadAsync: ['string', ['string']],
	cUploadAsync: ['string', ['string']],
	// GetFavoriteAsync 获取收藏消息集，，size为每夜最大数据量，page为当前页数。
	cNoteFavoriteAsync: ['string', ['string', 'int', 'string', 'string']],
	cGetFavoriteAsync: ['string', ['string', 'string', 'int', 'int']],
	cPutFavoriteAsync: ['string', ['string', 'string', 'string', 'string', 'string', 'int']],
	cDeleteFavoriteAsync: ['string', ['string']],
	cRelayFavoriteAsync: ['string', ['string', 'string', 'string']],

	cNewerAsync: ['string', ['string', 'string']],
	cNewHisAsync: ['string', ['string', 'string', 'int', 'string', 'string']],

	//  ExistsUploadAsync 上传文件是否存在，以逗号分隔，返回：
	// [{
	// 	"uri": "文件uri",
	// 	"exists": true/false
	// }]
	//	func ExistsUploadAsync(uri string) string {
	//	  return message.ExistsUploadAsync(uri)
	//  }
	cExistsUploadAsync: ['string', ['string']],
	// SendLinkAsync 发送链接消息。
	// func SendLinkAsync(secret bool, reid, group, meta, content string) string {
	// 	return message.SendLinkAsync(secret, reid, group, meta, content)
	// }
	cSendLinkAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	// OfficeReadOnlyAsync 只读文档，返回URL，只需通过webview即可打开预览。
	// id为消息ID，name为文件名。uri为合并转发中文件的uri
	// 返回的URL地址需要将`\u0026`替换为`&`。
	// 支持的文档类型参考：https://open.wps.cn/docs/wwo/access/introduce。
	// func OfficeReadOnlyAsync(id, name string, uri string) string {
	//  	return message.OfficeReadOnlyAsync(id, name)
	// }
	cOfficeReadOnlyAsync: ['string', ['string', 'string', 'string']],
	// SendReplyAsync 发送回复消息。
	// func SendReplyAsync(secret bool, reid, group, meta, content string) string {
	//  return message.SendReplyAsync(secret, reid, group, meta, content)
	// }
	cSendReplyAsync: ['string', ['bool', 'string', 'string', 'string', 'string']],
	// UserFormAsync 获取指定时间（单位：纳秒）内指定form集的发给当前个人的消息。
	// 最多返回100条数据。
	// form为要检索的form集，以逗号分隔，为空则不搜索。
	// maxTime==0表示当前时间。
	// func UserFormAsync(form string, minTime, maxTime int64) string {
	// return message.UserFormAsync(form, minTime, maxTime)
	// }
	cUserFormAsync: ['string', ['string', 'string', 'string']],
	// Log 设置日志保存目录，日志文件会被保存到此目录下的YYYY-MM-DD文件中，保存最近7天日志
	// 客户端上传日志时，需要把当天的日志文件也上传，方便排查问题。
	// func Log(path string) {
	//    message.Log(path)
  // }
	cLog: ['void', ['string']],
	// UploadLog 上传日志，path为日志目录。
	// func UploadLog(path string) string {
	//   return message.UploadLog(path)
	// }
	cUploadLog: ['string', ['string']],
	// Time 获取当前时间，单位：纳秒。
	// 自动同步服务器时间。
	// func Time() int64 {
	// 	return message.GetTime()
	// }
	cTime: ['string', []]
}
