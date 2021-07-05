import telephoneCode from '../telephoneCode'

export const sysConfigTable = {
	lastLogin: 'text DEFAULT ""',
	lastUserId: 'text DEFAULT ""',
	autoLogin: 'text DEFAULT "false"',
	isECodeMust: `text DEFAULT "${process.env.webConfig.isECodeMust}"`,
	lastLoginTime: 'text DEFAULT ""',
	loginQrcode: 'text DEFAULT ""',
	loginQrcodeTime: 'text DEFAULT ""',
	loginType: 'text DEFAULT "1"',
	loginName: 'text DEFAULT ""',
	areaCode: 'text DEFAULT "+86"',
	organId: 'text DEFAULT ""',
	hisorganNameList: 'text DEFAULT ""',
	organName: 'text DEFAULT ""',
	organCode: 'text DEFAULT ""',
	lastLoginByQr: 'integer DEFAULT 0',
	lang: 'text DEFAULT "0"',
	apiUrlConfig: 'text DEFAULT "【obj】{}"',
	appVersion: 'text DEFAULT ""', // 当前app版本
	appEnv: 'text DEFAULT ""',
	lastGetVersionTime: 'integer DEFAULT 0', // 最后一次版本检测时间，包括自动检测和手动检测
	lastGetVersionNo: 'text DEFAULT ""', // 最后一次版本检测获取的版本号
	telephoneCode: `text DEFAULT '【obj】${JSON.stringify(telephoneCode)}'`
}

export const userInfoTable = {
	token: 'text DEFAULT ""',
	nickName: 'text DEFAULT ""',
	userMobile: 'text DEFAULT ""',
	areaCode: 'text DEFAULT ""',
	country: 'text DEFAULT ""',
	userEmail: 'text DEFAULT ""',
	userAvatarBatchNo: 'text DEFAULT ""',
	userId: 'text DEFAULT ""',
	accountCode: 'text DEFAULT ""',
	organId: 'text DEFAULT ""',
	organName: 'text DEFAULT ""',
	qrCode: 'text DEFAULT ""',
	userAvatar: 'text DEFAULT ""',
	secretKey: 'text DEFAULT ""',
	userNoticeConfig: 'text DEFAULT "【obj】{}"',
	userSecurityConfig: 'text DEFAULT "【obj】{}"',
	timestamp: 'text DEFAULT ""',
	newUser: 'integer DEFAULT 0',
	p: 'text DEFAULT ""',
	mainWinWidth: 'integer DEFAULT ' + process.env.webConfig.DEFAULT_MAINWIN_WIDTH, // 记住用户调整主窗口宽
	mainWinHeight: 'integer DEFAULT ' + process.env.webConfig.DEFAULT_MAINWIN_HEIGHT, // 记住用户调整主窗口高
	hasInitHistory: 'integer DEFAULT 0', // 是否已经初始化历史记录
	empAdminFlag:	'text DEFAULT ""',
	dbVersion: 'integer DEFAULT 0', // 数据库版本以年月日记录，如：20200630
	lastMessageTime: 'text DEFAULT ""'
}

export const userConfigTable = {
	messageId: 'text DEFAULT ""',
	timestamp: 'text DEFAULT ""'
}

export const configTable = {
	showThreadCreateOrganBanner: 'integer DEFAULT 1' // 会话列表是否显示创建企业banner，0不显示，1显示
}
export const emojisTable = {
	id: 'text UNIQUE',
	localPath: 'text DEFAULT ""',
	uri: 'text DEFAULT ""',
	hash: 'text DEFAULT ""',
	meta: 'text DEFAULT "【obj】{}"',
	updateTime: 'integer DEFAULT 0'
}

export const threadsTable = {
	id: 'text UNIQUE',
	userId: 'text DEFAULT ""', // 单聊时，对方的ID
	type: 'integer DEFAULT 0',
	avatar: 'text DEFAULT ""',
	name: 'text DEFAULT ""',
	firstAtMeID: 'text DEFAULT ""', // 第一条@我的ID
	firstAtMeTime: 'text DEFAULT ""', // 第一条@我的时间，拉到同步@的历史记录时用来判断是否要去掉【有人@我】
	lastReadMessageTime: 'text DEFAULT ""', // 最后一条已读消息的时间
	firstUnreadID: 'text DEFAULT ""', // 第一条未读消息ID
	firstUnreadTime: 'text DEFAULT ""', // 第一条未读消息的时间
	unreadCount: 'integer DEFAULT 0',
	lastMessageID: 'text DEFAULT ""',
	lastMessageTimestamp: 'text DEFAULT ""',
	activeTime: 'integer DEFAULT 0',
	topTime: 'integer DEFAULT 0',
	hidden: 'integer DEFAULT 0',
	notDisturb: 'integer DEFAULT 0',
	clearTime: 'integer DEFAULT 0', // 清空记录时间
	memberNum: 'integer DEFAULT 0',
	draft: 'text DEFAULT "【obj】{}"'// 草稿
}

export const messagesTable = {
	id: 'text UNIQUE',
	originID: 'text UNIQUE', // 消息的原始ID，不会被改变。
	replyInfo: 'text DEFAULT "【obj】{}"', // 回复的消息信息
	threadID: 'text', // 会话ID,包含特殊ID：'notify'（公告）|'point'(积分)。另外，合并转发包含的消息以其父级消息的id@threadID作为会话ID
	threadType: 'integer DEFAULT 0', // 会话类型,0（单聊），1（群聊），10001（特殊）
	senderID: 'text',
	name: 'text DEFAULT ""',
	avatar: 'text DEFAULT ""',
	text: 'text DEFAULT ""',
	html: 'text DEFAULT ""',
	data: 'text DEFAULT "【obj】{}"',
	cForm: 'integer DEFAULT 0',
	timestamp: 'integer DEFAULT 0', // 消息发送时间
	timeStr: 'text DEFAULT ""', // 经确到纳秒的时间字符串
	resendTime: 'integer DEFAULT 0',
	burntAfterRead: 'integer DEFAULT 0',
	triggered: 'integer DEFAULT 0',
	read: 'integer DEFAULT 0',
	unreadCount: 'integer DEFAULT 0',
	atUsers: 'text DEFAULT ""',
	isSend: 'integer DEFAULT 0',
	isAnoymous: 'integer DEFAULT 0',
	status: 'integer DEFAULT 0',
	mType: 'text DEFAULT ""',
	relayFrom: 'text DEFAULT ""', // 转发来源，空为非转发消息，chat从聊天记录里转发，favorite从收藏夹转发
	favoriteId: 'text DEFAULT ""', // 收藏id，用于转发收藏失败的重发
	syncBatch: 'text DEFAULT ""', // 消息同步批次，用于同步消息补漏

	fileName: 'text DEFAULT ""', // 文件原始名称
	fileNameIndex: 'integer DEFAULT -1', // 文件名索引
	newFileName: 'text DEFAULT ""', // 新文件名
	ext: 'text DEFAULT ""', // 文件后缀
	fileSize: 'integer DEFAULT 0', // 文件大小
	width: 'integer DEFAULT 0', // 图片或视频 宽
	height: 'integer DEFAULT 0', // 图片或视频 高
	url: 'text DEFAULT ""', // 文件地址
	localPath: 'text DEFAULT ""', // 文件本地路径
	thumbnail: 'text DEFAULT ""', // 视频封面路径
	isEncode: 'integer DEFAULT 1', // 是否编码
	duration: 'integer DEFAULT 0'// 语音时长
}

export const collectsTable = {
	id: 'text UNIQUE',
	content: 'text DEFAULT ""',
	form: 'integer DEFAULT 0',
	meta: 'text DEFAULT ""',
	tag: 'text DEFAULT ""',
	upload: 'text DEFAULT ""',
	sender: 'text DEFAULT ""',
	time: 'integer DEFAULT 0',
	localPath: 'text DEFAULT ""'
}

