module.exports = {
	login: '/user/userAuth/login', // 登录
	register: '/user/userAuth/register', // 注册
	forgetPwd: '/user/userAuth/forgetPwd', // 忘记密码
	changePwd: '/user/userAuth/changePwd', // 密码修改
	updateSecurityInfo: '/user/userBaseInfo/updateSecurityInfo', // 绑定/换绑手机邮箱
	updateSecretKey: '/user/securityInfo/updateSecretKey', // 更换私钥
	updateGroupOwner: '/user/groupInfo/updateGroupOwner', // 转移群主
	addGroupUsers: '/user/groupInfo/addGroupUsers', // 添加群成员
	updateGroupManager: '/user/groupInfo/updateGroupManager', // 添加群管理员
	deleteGroupUsers: '/user/groupInfo/deleteGroupUsers',
	getUserInfo: '/user/userAuth/getUserInfo', // 获取用户信息接口
	logout: '/user/userAuth/logout',
	myAllFriendList: '/user/friendRelationInfo/myAllFriendList',
	findUsers: '/user/userBaseInfo/findUsers', // 查找用户
	getUserRelationInfo: '/user/friendRelationInfo/getUserInfo', // 获取用户和关系信息
	myFriendRelationList: '/user/friendRelationInfo/myFriendRelationList', // 获取好友关系列表
	updateFriendState: '/user/friendRelationInfo/updateFriendState',
	pullUserInfo: '/user/userBaseInfo/pullUserInfo', // 批量拉取用户信息
	getGroupList: '/user/groupInfo/getGroupList', // 查询已加入的群组列表
	getGroupSettings: '/user/groupInfo/getGroupSettings', // 读取群配置
	updateGroupSettings: '/user/groupInfo/updateGroupSettings', // 更新群配置
	getGroupDetail: '/user/groupInfo/detail', // 读取群信息
	leaveGroup: '/user/groupInfo/leaveGroup', // 关闭退出群聊
	updateUserExtInfo: '/user/userAuth/updateUserExtInfo', // 用户基本信息修改接口
	updateFriendLabel: '/user/friendRelationInfo/updateFriendLabel', // 设置好友标签备注
	applyAddFriend: '/user/friendRelationInfo/applyAddFriend', // 申请加为好友
	deleteFriend: '/user/friendRelationInfo/deleteFriend', // 删除好友关系
	myGroupsAndUsers: '/user/groupInfo/myGroupsAndUsers', // vuex存储我的群组和我的好友，提供给全局搜索使用
	findFriendAndGroups: '/user/friendRelationInfo/findFriendAndGroups', // 网络查找查找用户和群组， 搜索结果面板里面的网络查找功能使用
	getGroupUserList: '/user/groupInfo/getGroupUserList', // 查询群成员列表
	myAllGroupUserList: '/user/groupInfo/myAllGroupUserList', // 查询所有群成员列表
	createGroup: '/user/groupInfo/createGroup', // 创建群聊
	detail: '/user/userPrivacyInfo/detail', // 用户获取隐私设置详情
	update: '/user/userPrivacyInfo/update', // 用户修改隐私设置
	getLoginQrCode: '/user/userAuth/getLoginQrCode', // 获取登录二维码
	pollingQrCodeLogin: '/user/userAuth/pollingQrCodeLogin', // 二维码登录状态轮询
	getGroupQrCode: '/user/groupInfo/getQrCode', // 获取群二维码
	directEnterOrQuit: '/user/userAuth/directEnterOrQuit', // 用户进入或退出PC应用
	withdraw: '/user/groupInfo/withdrawMessage', // 双向撤回
	getFriendGroups: '/user/friendGroupInfo/getList', // 好友分组列表
	getFriendGroupInfo: '/user/friendGroupInfo/detail', // 好友分组详情
	save: '/user/friendGroupInfo/save', // 保存好友分组信息
	deleteFriendGroup: '/user/friendGroupInfo/delete', // 删除好友分组信息
	updateFriendGroup: '/user/friendRelationInfo/updateFriendGroup', // 设置好友分组
	trembleMessage: '/user/groupInfo/trembleMessage', // 抖一抖
	loopUserOnlineState: '/user/userAuth/loopUserOnlineState', // 用户在线状态轮询
	getOrganInfo: '/user/organizationInfo/getOrganInfo', // 根据企业代码获取企业信息接口
	updateOrgNeedAudit: '/user/organizationInfo/updateOrgNeedAudit', // 修改企业是否开启用户审核
	getEmpAccountInfo: '/user/organizationInfo/getEmpAccountInfo', // 获取企管账号信息
	onOrOffSecondValid: '/user/securityInfo/onOrOffSecondValid', // 二次验证开关
	loginDevices: '/user/userAuth/queryLoginDeviceList', // 登录设备列表
	kickoutDevice: '/user/userAuth/kickoutDevice', // 下线设备登录信息

	stickyTop: '/user/userSessionTop/stickyTop', // 会话置顶
	getTopList: '/user/userSessionTop/getTopList', // 置顶列表

	getBannedSpeechConfig: '/user/groupInfo/getBannedSpeechConfig', // 禁言配置
	updateSpeechMembers: '/user/groupInfo/updateSpeechMembers', // 禁言人员设置
	checkAccountCode: '/user/userBaseInfo/checkAccountCode', // WhatChatId校验接口
	updateAccountCode: '/user/userBaseInfo/updateAccountCode', // 更新WhatChatId接口
	deleteBlackUser: '/user/userBlacklistInfo/delete', // 移出黑名单
	checkMemberSpeechState: '/user/groupInfo/checkMemberSpeechState', // 检查成员发言状态

	getWorkStatus: '/user/userWorkingStatus/getList', // 工作状态列表
	updateWorkStatus: '/user/userWorkingStatus/save', // 添加/编辑工作状态
	delWorkStatus: '/user/userWorkingStatus/delete', // 删除工作状态
	setWorkStatus: '/user/userWorkingStatus/cutover', // 改变工作状态

	getAllOrgans: '/user/organizationInfo/userOrgansLoginSort', // 获取所有加入的企业
	createOrgan: '/user/organizationInfo/createOrgan', // 创建企业
	joinOrgan: '/user/organizationInfo/joinOrgan', // 加入企业
	getOrganQrCode: '/user/organizationInfo/getOrganQrCode', // 企业二维码
	checkOrgan: '/user/organizationInfo/checkJoinOrgan', // 判断企业是否存在
	getOrganQrCodeLink: '/user/organizationInfo/getOrganQrCodeLink', // 获取企业二维码链接
	loopAuditStatus: '/user/organizationInfo/loopAuditStatus', // 新注册用户审核状态轮询接口
	verifyFriendRelation: '/user/friendRelationInfo/verifyFriendRelation'// 检测好友状态,“1”—-好友销号，“2”—好友被移除当前企业，“3”—不是好友，“4”—是好友，好友关系正常 ，“5”—当前用户单向解除好友

}
