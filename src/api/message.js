module.exports = {
	getList: '/message/notifyMsg/getList', // 好友/进群申请列表
	setAllRead: '/message/notifyMsg/setAllRead', // 设置所有好友/进群申请通知为已读
	processApply: '/message/notifyMsg/processApply', // 好友申请或进群处理

	getNotify: '/message/noticePushRecord/getAllLangList', // 公告列表
	readAllNotify: '/message/noticePushRecord/setAllRead', // 系统消息设为全部已读
	clearNotify: '/message/noticePushRecord/delete', // 清空系统公告

	getPointNotify: '/message/noticeBonusRecord/bonusNoticeList', // 获取积分助手信息
	readAllPointNotify: '/message/noticeBonusRecord/updateReadFlag', // 积分助手消息设为全部已读
	delPointNotify: '/message/noticeBonusRecord/deleteBonusNotice', // 删除积分助手消息

	getReadUsers: '/message/messageRead/getReadUsers'// 读取消息阅读人员列表
}
