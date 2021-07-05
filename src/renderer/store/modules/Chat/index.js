import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

const state = {
	emojis: {},
	emojiSort: [],
	downloadingEmojis: [], // 待下载的表情
	avatarBgColors: {},
	imagePlayerArray: [], // 用于图片浏览器数组
	makeVideoThumbnailArray: [], // 生成视频缩略图队列
	currentThreadID: null, // 当前会话ID
	sendFileQueue: {}, // 发送文件队列
	threads: null, // 所有会话
	messages: [], // 当前会话消息列表
	unSortedMsgs: [], // 还未回到正确位置的消息，如历史记录重的撤回消息
	preloading: false,
	downloadingMsgs: [],
	collectChat: [], // 收藏的消息
	chatRecordMessage: [], // 合并转发列表页数据
	reFileNameQueue: [], // 文件重命名队列
	pageSize: 15,
	banned_time_dict: null,
	scrollTo: {
		id: '',
		threadID: '',
		timestamp: ''
	}// 页面需要滚动到的消息，用在搜索结果跳转到聊天详情
}

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
}
