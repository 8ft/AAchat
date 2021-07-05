<template>
	<div id="App_body" :class="{web:$utils.currentWindow===undefined?true:false, offOnline: !$store.state.Setting.isNetworkOnline}" ref="appBody">
		<!--系统声音-->
		<audio :src="bongo" preload ref="msgSound" />

		<div class="mac-btns" v-if="$utils.currentWindow && $utils.os.isMac">
			<div class="iconfont iconguanbi" @click="macHide" />
			<div class="iconfont" :class="{'disable': isMax, 'iconsuoxiao': !isMax}" @click="macMin" />
			<div
				class="iconfont"
				:class="{'iconfangda': !isMax, 'iconsuoxiaochuangkou': isMax}"
				@click="macScreen"
			/>
		</div>

		<div class="user-control-panel" v-clickoutside="hideUserPannel" v-show="userContralPanel">
			<a-spin :spinning="usersSetSpinning">
				<div class="user-info">
					<div class="user-img" @click="imgCutPanel = true; hideUserPannel()">
						<i class="iconfont iconzhaopian"></i>
						<img :src="userHeaderImage" @error="userHeaderError">
					</div>
					<div class="user-txt" @click="showUserCard();hideUserPannel()">
						<div class="name">
							<div :title="accountInfo.nickName">
								{{accountInfo.nickName}}
							</div>
						</div>
						<div class="id" :title="accountInfo.accountCode">
							ID: {{accountInfo.accountCode}}
						</div>
						<div class="organName" :title="getOrganName(accountInfo)">
							{{getOrganName(accountInfo)}}
						</div>
					</div>
					<div class="set-work-status" @click="activeWorkStatusModal='select';hideUserPannel()">
						<template v-if="!$store.state.User.accountInfo.workingStatusId">
							<i class="iconfont icontianjia1"></i>
							<span>{{$t('workStatus.entranceTxt')}}</span>
						</template>
						<template v-else>
							<img v-if="$store.state.User.accountInfo.workingStatusExpression" :src="$utils.message.getEmojiSrc($store.state.User.accountInfo.workingStatusExpression)">
							<span>{{$store.state.User.accountInfo.workingStatusValue}}</span>
						</template>
					</div>
				</div>
			</a-spin>
			<div class="menu" @click="opensystemset();hideUserPannel()">
				{{$t('common.systemSetting')}}
			</div>
			<div class="menu" @click="showchangepass = true;hideUserPannel()">
				{{$t('common.modifyPwd')}}
			</div>
			<div class="menu" @click="goManageWebsite();hideUserPannel()"	v-if="accountInfo.empAdminFlag">
				{{$t('common.loginManagement')}}
			</div>
			<div class="line"></div>
			<div class="menu" @click="$utils.fun.openExternal(`${$WEB_CONFIG.APIURLCONFIG.portal_site_url}/${$store.state.Setting.lang}/download`);hideUserPannel()">
				{{$t('common.downloadApp')}}
			</div>
			<div class="menu" @click="openAboutWin();hideUserPannel()">
				{{$t('common.aboutIM')}}
			</div>
			<div class="line"></div>
			<div class="menu" @click="exitLoginModal = true;hideUserPannel()">
				{{$t('common.switchAccount')}}
			</div>
			<div class="menu" @click="exitModal = true;hideUserPannel()">
				{{$t('common.exitIM')}}
			</div>
		</div>

		<!-- 左侧导航 -->
		<aside id="app_nav" :un-process-count="unProcessCount">
			<div :class="{navs:true,'scroll-out':showAllOrgans}">
				<img id="userAvatar_nav" class="userAvatar" :src="userHeaderImage" @error="userHeaderError">

				<router-link
					to="/chat"
					@click.native="navClick"
				>
					<!-- <div class="tab-icon message"> -->
					<div class="iconfont iconxiaoxi">
						<span
							class="count"
							v-show="unreadMsgCount>0"
						>{{unreadMsgCount > 99 ? '99+' : unreadMsgCount}}</span>
					</div>
					<p>{{$t('nav.messages')}}</p>
				</router-link>

				<router-link to="/addressBook" @click.native="navClick">
					<!-- <div class="tab-icon contact"> -->
					<div class="iconfont icontongxunlu">
						<span
							class="count"
							v-if="statistics.todoNum"
						>{{statistics.todoNum > 99 ? '99+' : statistics.todoNum}}</span>
					</div>
					<p>{{$t('nav.contacts')}}</p>
				</router-link>

				<router-link to="/files?id=byType" @click.native="navClick">
					<!-- <div class="tab-icon document"></div> -->
					<div class="iconfont iconwendang"></div>
					<p>{{$t('nav.docs')}}</p>
				</router-link>

				<router-link to="/collection" @click.native="navClick">
					<!-- <div class="tab-icon favorite"></div> -->
					<div class="iconfont iconshoucang"></div>
					<p>{{$t('nav.collect')}}</p>
				</router-link>
			</div>

			<!-- <router-link tag="div" class="iconfont icondianhua2" to="/call">
				<span	class="count"	v-if="callRecords.count">
					{{callRecords.count > 99 ? '99+' : callRecords.count}}
				</span>
			</router-link> -->

			<div :class="{organs:true,'scroll-out':!showAllOrgans}" v-if="organizations.list&&organizations.list.length">
				<div class="organ arrow-up" @click="showAllOrgans=!showAllOrgans">
					<span class="iconfont" :class="{'iconxiangxia': showAllOrgans, 'iconxiangshang': !showAllOrgans}"></span>
				</div>
				<a-tooltip class="organ" placement="right" v-for="organ in organizations.list" :key="`organ_${organ.organId}`" @click="switchingOrgan = organ">
					<template slot="title">
						<span>{{getOrganName(organ)}}</span>
					</template>
					<template v-if="organ.organId=='0'">
						<span class="iconfont iconwodehaoyou"></span>
					</template>
					<template v-if="organ.firstLaterIsUnknow">
						<span class="iconfont iconluanma"></span>
					</template>
					<template v-if="organ.organId!='0'&&!organ.firstLaterIsUnknow">
						{{organ.firstLater}}
					</template>
				</a-tooltip>
			</div>

			<div class="others">
				<a-tooltip v-if="organizations.preOrgan" class="organ" placement="right" @click="switchingOrgan = organizations.preOrgan">
					<template slot="title">
						<span>{{getOrganName(organizations.preOrgan)}}</span>
					</template>
					<template v-if="organizations.preOrgan.organId=='0'">
						<span class="iconfont iconwodehaoyou"></span>
					</template>
					<template v-if="organizations.preOrgan.firstLaterIsUnknow">
						<span class="iconfont iconluanma"></span>
					</template>
					<template v-if="organizations.preOrgan.organId!='0'&&!organizations.preOrgan.firstLaterIsUnknow">
						{{organizations.preOrgan.firstLater}}
					</template>
				</a-tooltip>
				<a-tooltip v-if="organizations.curOrgan" class="organ current" placement="right">
					<template slot="title">
						<span>{{getOrganName(organizations.curOrgan)}}</span>
					</template>
					<template v-if="organizations.curOrgan.organId=='0'">
						<span class="iconfont iconwodehaoyou"></span>
					</template>
					<template v-if="organizations.curOrgan.firstLaterIsUnknow">
						<span class="iconfont iconluanma"></span>
					</template>
					<template v-if="organizations.curOrgan.organId!='0'&&!organizations.curOrgan.firstLaterIsUnknow">
						{{organizations.curOrgan.firstLater}}
					</template>
				</a-tooltip>

				<a-tooltip placement="right">
					<template slot="title">
						<span>{{$t('common.more')}}</span>
					</template>
					<a-popover overlayClassName="moreOperation" :placement="accountInfo.empAdminFlag?'rightBottom':'right'" trigger="click">
						<template slot="content">
							<div class="opration-item" @click="uploadLogs">
								<i class="iconfont" :class="{iconshangchuanrizhi: !uploadingLogs, iconshuaxin1: uploadingLogs}"></i>{{$t('common.uploadLogs')}}
							</div>
							<div class="opration-item" @click="getSettingConfigs">
								<i class="iconfont" :class="{iconliaotianshezhi: !gettingApiUrlConfig, iconshuaxin1: gettingApiUrlConfig}"></i>{{$t('common.getLatestConfig')}}
							</div>
						</template>
						<i class="iconfont iconcebiangengduo"></i>
					</a-popover>
				</a-tooltip>
			</div>
		</aside>

		<!--编辑头像-->
		<ImgCut :url="accountInfo.userAvatar" centered :getCutImg="getCutImg" :cancel="closeImgCut" :spinning="imgCutSpinning" v-if="imgCutPanel"></ImgCut>

		<main id="app_main">
			<div class="windows-top-tool" v-if="$utils.os.isWindows">
				<window-top-right-btns style="border-left: 0" from="layout" />
			</div>
			<!--<header id="app_header">
				<div class="headerDbClick-area" @dblclick="headerDbClick"></div>
				&lt;!&ndash; 搜索 &ndash;&gt;
				<div class="search-area">
					<global-search />
				</div>
				&lt;!&ndash; 头像及其下拉列表 &ndash;&gt;
				<span class="isOnline" v-show="!isOnline">正在重连...</span>
				&lt;!&ndash;<div @click="openRealVideo" style="-webkit-app-region: no-drag">发送</div>&ndash;&gt;
				<a-tooltip placement="bottom" :title="$t('common.startNewGroupChat')">
					<span
						class="iconfont iconqunliao"
						style="margin-right: 25px;font-size: 27px; cursor: pointer;-webkit-app-region: no-drag;"
						@click="creatgroups"
					/>
				</a-tooltip>
				<a-dropdown
					:trigger="['click']"
					:placement="$utils.currentWindow && $utils.os.isWindows ?'bottomCenter':'bottomRight'"
					style="margin-right:30px;cursor:pointer;"
				>
					<div class="ant-dropdown-link">
						&lt;!&ndash;<a-avatar icon="user" :src="accountInfo.userAvatar || allmyuserinfo.userAvatar" />&ndash;&gt;
						<AAlistItem :src="accountInfo.userAvatar || '@/assets/img/geren_default@2x.png'" />
						<a class="more-triangle" />
					</div>
					<a-menu class="setting-list" slot="overlay">
						<a-menu-item @click="showUserCard">
							<div class="username">
								{{accountInfo.nickName}}
							</div>
							&lt;!&ndash;<a-avatar icon="user" :src="accountInfo.userAvatar || allmyuserinfo.userAvatar" />&ndash;&gt;
							<AAlistItem :src="accountInfo.userAvatar || allmyuserinfo.userAvatar || '@/assets/img/geren_default@2x.png'" />
						</a-menu-item>
						<a-menu-item @click="opensystemset()">
							{{$t('common.systemSetting')}}
						</a-menu-item>
						<a-menu-item @click="showchangepass = true">
							{{$t('common.modifyPwd')}}
						</a-menu-item>
						<a-menu-item @click="openAboutWin">
							{{$t('common.aboutIM')}}
						</a-menu-item>
						<a-menu-item @click="exitLoginModal = true">
							{{$t('common.switchAccount')}}
						</a-menu-item>
						<a-menu-item @click="exitModal = true">
							{{$t('common.exitIM')}}
						</a-menu-item>
					</a-menu>
				</a-dropdown>
				&lt;!&ndash; 窗体控制按钮 &ndash;&gt;
				<window-top-right-btns from="layout" />
			</header>-->
			<div id="app_content">
				<Organization @switchOrgan="switchOrgan" @createdOrgan="reloadPage"></Organization>
				<keep-alive>
					<!-- 需要缓存的视图组件 -->
					<router-view v-if="$route.meta.keepAlive"></router-view>
				</keep-alive>
				<!-- 不需要缓存的视图组件 -->
				<router-view v-if="!$route.meta.keepAlive"></router-view>
			</div>
		</main>

		<work-status v-model="activeWorkStatusModal"></work-status>

		<login-devices v-model="activeLoginDecivesModal"></login-devices>

		<!--退出登录确认框-->
		<a-modal
			class="notification-IM"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('common.switchAccount')"
			:visible="exitLoginModal"
			@cancel="exitLoginModal = false"
			:getContainer="()=>$refs.appBody"
		>
			<p>{{$t('common.switchConfirm')}}</p>
			<template #footer>
				<a-button type="primary" @click="_logout">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="exitLoginModal = false">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--退出确认框-->
		<a-modal
			class="notification-IM"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('common.quitApp', { projectName: $PROJECT_NAME })"
			:visible="exitModal"
			@cancel="exitModal = false"
			:getContainer="()=>$refs.appBody"
		>
			<p>{{$t('common.logoutSure')}}</p>
			<template #footer>
				<a-button type="primary" @click="_exitChat">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="exitModal = false">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--系统设置弹窗框-->
		<a-modal
			v-model="showsystemset"
			:maskClosable="false"
			:closable="false"
			:footer="null"
			wrapClassName="all_setmodals"
			width="420px"
			centered
			:getContainer="()=>$refs.appBody"
		>
			<div class="title">
				<h2>{{$t('setting.setting')}}</h2>
				<span class="iconfont icontongyongguanbi" @click="showsystemset = false" />
			</div>
			<div class="content">
				<div class="the_notice">
					<h2>{{$t('setting.notification')}}</h2>
					<div class="the_item">
						{{$t('setting.messageNotifySound')}}
						<a-switch
							:defaultChecked="allsetting.openSounds == 1 ? true : false"
							@change="noticesound"
							class="item2"
							style="width: 44px;"
							:disabled="!isOnline"
						/>
					</div>
					<div class="the_item">
						{{$t('setting.messageDesktopNotify')}}
						<a-switch
							:defaultChecked="allsetting.allowNotice == 1 ? true : false"
							@change="noticedesk"
							class="item2"
							style="width: 44px;"
							:disabled="!isOnline"
						/>
					</div>
					<h2>{{$t('setting.security')}}</h2>
					<div class="the_item">
						{{$t('common.mobileNumber')}}
						<div class="item2">
							{{allmyuserinfo.userMobile ? _RSAdencrypt(allmyuserinfo.userMobile) : $t('setting.notSet')}}
							<span
								@click="changetie(1,1)"
								v-if="allmyuserinfo.userMobile != ''"
							>{{$t('setting.changeLink')}}</span>
							<span @click="changetie(2,1)" v-else>{{$t('setting.link')}}</span>
						</div>
					</div>
					<div class="the_item">
						{{$t('common.emailAddress')}}
						<div class="item2">
							{{allmyuserinfo.userEmail ? _RSAdencrypt(allmyuserinfo.userEmail, 2) : $t('setting.notSet')}}
							<span
								@click="changetie(1,2)"
								v-if="allmyuserinfo.userEmail != ''"
							>{{$t('setting.changeLink')}}</span>
							<span @click="changetie(2,2)" v-else>{{$t('setting.link')}}</span>
						</div>
					</div>
					<!-- 登录保护开关 -->
					<div class="the_item" style="margin-bottom:8px;">
						{{$t('setting.loginProtection')}}
						<a-switch
							:checked="accountInfo.userSecurityConfig?accountInfo.userSecurityConfig.secondValidSwitch == 1:false"
							@change="secondValidSwitch"
							class="item2"
							style="width: 44px;"
							:loading="systemset_processing.secondValidSwitch"
							:disabled="!isOnline"
						/>
					</div>
					<div style="font-size:12px;color:#999;margin-bottom:18px;">
						{{$t('setting.loginProtectionDesc')}}
					</div>
					<!-- 登录设备管理 -->
					<div class="the_item">
						{{$t('setting.loginDevices')}}
						<div class="item2">
							<span @click="activeLoginDecivesModal='main'">{{$t('common.Manage')}}</span>
						</div>
					</div>

					<!--<div class="the_item">-->
					<!--{{$t('setting.privateKeyManagement')}}-->
					<!--<div class="item2">-->
					<!--{{accountInfo.secretKey[0]+'*****'+accountInfo.secretKey.slice(30,34)+'*****'+accountInfo.secretKey[63]}}-->
					<!--<span-->
					<!--@click="showprivate"-->
					<!--&gt;{{$t('common.view')}}</span>-->
					<!--</div>-->
					<!--</div>-->
					<h2>{{$t('setting.privacy')}}</h2>
					<div class="the_item">
						{{$t('setting.addMeMethod')}}
						<div class="item2">
							<span @click="showhowaddtome">{{$t('setting.setting')}}</span>
						</div>
					</div>
					<h2>{{$t('setting.langAndChar')}}</h2>
					<div class="the_item">
						{{$t('setting.changeLang')}}
						<div class="item2">
							<a-select style="width: 230px;" :defaultValue="lang" @change="handleChangeLang">
								<a-select-option value="0">
									{{$t('setting.useSysLang')}}
								</a-select-option>
								<a-select-option value="zh_CN">
									简体中文
								</a-select-option>
								<a-select-option value="zh_TW">
									繁體中文
								</a-select-option>
								<a-select-option value="en_US">
									English
								</a-select-option>
							</a-select>
						</div>
					</div>
				</div>
			</div>
		</a-modal>

		<!--换绑 手机/邮箱-->
		<a-modal
			v-model="changeties"
			:maskClosable="false"
			:closable="false"
			:footer="null"
			wrapClassName="all_setmodals"
			width="420px"
			centered
			:getContainer="()=>$refs.appBody"
		>
			<div class="title">
				<h2>
					<span class="iconfont iconfanhui" @click="go_back(1)" />
					{{phoneoremail ? $t('setting.linkMobileNumber') : $t('setting.linkEmailAddress')}}
				</h2>
				<span class="iconfont icontongyongguanbi" @click="changeties = false" />
			</div>
			<div class="content phoneandemail">
				<div class="images">
					<img src="@/assets/img/shouji.png" alt v-if="phoneoremail">
					<img src="@/assets/img/youxiang.png" alt v-else>
				</div>
				<p>{{phoneoremail ? $t('setting.currentMobileNumber') + ': '+ allmyuserinfo.areaCode + ' ' + _RSAdencrypt(allmyuserinfo.userMobile) : $t('setting.currentEmailAddress') + ': ' + _RSAdencrypt(allmyuserinfo.userEmail, 2)}}</p>
				<div class="phonebtn">
					<button
						@click="surechange"
					>
						{{phoneoremail ? $t('setting.changeMobileNumber') : $t('setting.changeEmailAddress')}}
					</button>
				</div>
			</div>
		</a-modal>

		<!--绑定手机/邮箱-->
		<a-modal
			v-model="surechangeties"
			:maskClosable="false"
			:closable="false"
			:footer="null"
			wrapClassName="all_setmodals"
			width="420px"
			centered
			:afterClose="cleardata"
			:destroyOnClose="true"
			:getContainer="()=>$refs.appBody"
		>
			<div class="title">
				<h2>{{phoneoremail ? $t('setting.linkMobileNumber') : $t('setting.linkEmailAddress')}}</h2>
				<span class="iconfont icontongyongguanbi" @click="surechangeties = false" />
			</div>
			<div class="surechangetie">
				<!--手机绑定-->
				<div v-show="phoneoremail" class="form">
					<h2>{{$t('common.mobileNumber')}}</h2>
					<div class="form-item">
						<custom-select
							:defaultAreaCode="allmyuserinfo.areaCode"
							@selectResault="_selectResault"
						/>
						<input
							ref="telAccount"
							v-model.trim="yanzparams.account"
							style="flex: 1;"
							type="text"
							:placeholder="$t('common.tipMobileEnter')"
							class="shuru"
							@blur.prevent="_validateAccount"
							maxlength="11"
							oninput="value=value.replace(/[^\d]/g,'')"
						>
					</div>
					<h2>{{$t('common.verificationCode')}}</h2>
					<div class="form-item">
						<input
							ref="telCode"
							v-model.trim="yanzparams.validateCode"
							type="text"
							:placeholder="$t('common.tipCodeEnter')"
							class="shuru"
							style="margin-right: 17px;"
							oninput="value=value.replace(/[^\d]/g,'')"
							maxlength="6"
						>
						<a-button
							class="verification-code-btn"
							type="primary"
							@click="_getCode()"
							:disabled="isDisabledGetCode || btnLoading"
							:loading="isGetting"
						>
							<template v-if="getCodeBtnTextType == 1">
								{{$t('common.getCode')}}
							</template>
							<template v-else-if="getCodeBtnTextType == 2">
								{{$t('common.requesting')}}
							</template>
							<template v-else-if="getCodeBtnTextType == 3">
								{{$t('common.reGetCode')}}
							</template>
							<template v-else>
								{{getCodeBtnText}}
							</template>
						</a-button>
					</div>
					<a-button
						type="primary"
						@click="_submitInfo"
						:loading="btnLoading"
						class="sure sure1"
						:disabled="issureclick"
					>
						{{$t('common.okBtn')}}
					</a-button>
					<a-button
						class="sure"
						@click="cancal"
						:disabled="btnLoading"
						style="color:#999999;"
					>
						{{$t('common.exitBtn')}}
					</a-button>
				</div>
				<div v-show="!phoneoremail" class="form">
					<h2>{{$t('common.emailAddress')}}</h2>
					<div class="form-item">
						<input
							ref="emailAccount"
							v-model.trim="yanzparams.account"
							type="text"
							:placeholder="$t('common.tipEmailEnter')"
							class="shuru"
							@blur.prevent="_validateAccount"
							maxlength="32"
						>
					</div>
					<h2>{{$t('common.verificationCode')}}</h2>
					<div class="form-item">
						<input
							ref="emailCode"
							v-model.trim="yanzparams.validateCode"
							type="text"
							:placeholder="$t('common.tipCodeEnter')"
							class="shuru"
							style="margin-right: 17px;"
							oninput="value=value.replace(/[^\d]/g,'')"
							maxlength="6"
						>
						<a-button
							class="verification-code-btn"
							type="primary"
							@click="_getCode()"
							:disabled="isDisabledGetCode || btnLoading"
							:loading="isGetting"
						>
							<template v-if="getCodeBtnTextType == 1">
								{{$t('common.getCode')}}
							</template>
							<template v-else-if="getCodeBtnTextType == 2">
								{{$t('common.requesting')}}
							</template>
							<template v-else-if="getCodeBtnTextType == 3">
								{{$t('common.reGetCode')}}
							</template>
							<template v-else>
								{{getCodeBtnText}}
							</template>
						</a-button>
					</div>
					<a-button
						type="primary"
						:loading="btnLoading"
						@click="_submitInfo"
						class="sure sure1"
						:disabled="issureclick"
					>
						{{$t('common.okBtn')}}
					</a-button>
					<a-button
						class="sure"
						@click="cancal"
						:disabled="btnLoading"
						style="color:#999999;"
					>
						{{$t('common.exitBtn')}}
					</a-button>
				</div>
			</div>
		</a-modal>

		<!--私钥管理-->
		<a-modal
			v-model="privatemanage"
			:maskClosable="false"
			:closable="false"
			:footer="null"
			wrapClassName="all_setmodals"
			width="420px"
			centered
			:getContainer="()=>$refs.appBody"
		>
			<div class="title">
				<h2>
					<span class="iconfont iconfanhui" @click="go_back(1)" />
					{{$t('setting.privateKeyManagement')}}
				</h2>
				<span class="iconfont icontongyongguanbi" @click="privatemanage = false" />
			</div>
			<div class="content private">
				<div class="images">
					<img src="@/assets/img/dangqian.png" alt v-if="shownowprivate">
					<img src="@/assets/img/ehsy.png" alt v-else>
				</div>
				<p>{{shownowprivate ? $t('setting.currentPrivateKey') + ' ' : $t('setting.newPrivateKey') + ' '}}</p>
				<p v-if="accountInfo.secretKey">
					{{accountInfo.secretKey[0]+'*****'+accountInfo.secretKey.slice(30,34)+'*****'+accountInfo.secretKey[63]}}
				</p>
				<p>{{$t('setting.pkTip')}}</p>
				<a-button
					type="primary"
					:loading="changeKeyLoading"
					@click="sureprivate"
					style="width: 94px;height: 34px;cursor: pointer"
				>
					{{$t('setting.changePrivateKey')}}
				</a-button>
				<p>{{$t('setting.pkTip2')}}</p>
			</div>
		</a-modal>

		<!--修改密码弹窗-->
		<a-modal
			v-model="showchangepass"
			:maskClosable="false"
			:closable="false"
			:footer="null"
			wrapClassName="all_setmodals"
			width="420px"
			centered
			:afterClose="cleardata"
			:getContainer="()=>$refs.appBody"
		>
			<div class="title">
				<h2>{{$t('changePwd.modifyPwd')}}</h2>
				<span class="iconfont icontongyongguanbi" @click="showchangepass = false" />
			</div>
			<div class="changemima">
				<h2>{{$t('changePwd.previousPwd')}}</h2>
				<input
					type="password"
					:placeholder="$t('changePwd.enterPrevPwd')"
					v-model.trim="params.oldPassword"
					oncopy="return false"
					onpaste="return false"
					oncontextmenu="return false"
					maxlength="16"
					oninput="value=value.replace(/\s+/g,'')"
				>
				<h2>{{$t('changePwd.newPwd')}}</h2>
				<input
					type="password"
					:placeholder="$t('changePwd.pwdTip')"
					v-model.trim="params.newPassword"
					oncopy="return false"
					onpaste="return false"
					oncontextmenu="return false"
					maxlength="16"
					oninput="value=value.replace(/\s+/g,'')"
				>
				<h2>{{$t('changePwd.confirmPwd')}}</h2>
				<input
					type="password"
					v-model.trim="params.newPasswordConfirm"
					oncopy="return false"
					onpaste="return false"
					oncontextmenu="return false"
					maxlength="16"
					oninput="value=value.replace(/\s+/g,'')"
				>
				<div class="footers">
					<a-button
						type="primary"
						@click="surechangepwass"
						:disabled="isableclick"
						:loading="changepswLoading"
					>
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="showchangepass = false" style="color: #999999;">
						{{$t('common.exitBtn')}}
					</a-button>
				</div>
			</div>
		</a-modal>

		<!--添加我的方式弹窗-->
		<a-modal
			v-model="showaddtome"
			:maskClosable="false"
			:closable="false"
			:footer="null"
			wrapClassName="all_setmodals"
			width="420px"
			centered
			:destroyOnClose="true"
			:getContainer="()=>$refs.appBody"
		>
			<div class="title">
				<h2>
					<span class="iconfont iconfanhui" @click="go_back(1)" />
					{{$t('setting.addMeMethod')}}
				</h2>
				<span class="iconfont icontongyongguanbi" @click="showaddtome = false" />
			</div>
			<div class="content">
				<div class="the_notice" style="margin-top: 20px;">
					<div class="the_item">
						{{'ID'}}
						<a-switch
							:defaultChecked="addparams.addMeTypeByAaChatId == 1 ? true : false"
							@change="addmymethod(1)"
							class="item2"
							style="width: 44px;"
							:disabled="!isOnline"
						/>
					</div>
					<div class="the_item">
						{{$t('common.mobileNumber')}}
						<a-switch
							:defaultChecked="addparams.addMeTypeByMoblie == 1 ? true : false"
							@change="addmymethod(2)"
							class="item2"
							style="width: 44px;"
							:disabled="!isOnline"
						/>
					</div>
					<div class="the_item">
						{{$t('common.emailAddress')}}
						<a-switch
							:defaultChecked="addparams.addMeTypeByEmail == 1 ? true : false"
							@change="addmymethod(3)"
							class="item2"
							style="width: 44px;"
							:disabled="!isOnline"
						/>
					</div>
					<div class="the_item">
						{{$t('common.myQRcode')}}
						<a-switch
							:defaultChecked="addparams.addMeTypeByQrCode == 1 ? true : false"
							@change="addmymethod(4)"
							class="item2"
							style="width: 44px;"
							:disabled="!isOnline"
						/>
					</div>
				</div>
			</div>
		</a-modal>

		<!--用户信息卡片-->
		<user-card
			:firstModal="$store.state.OPcomponent.userCard.firstModal||''"
			:privacyProtection="$store.state.OPcomponent.userCard.privacyProtection||false"
			:userId="$store.state.OPcomponent.userCard.userId"
			:cancel="doClose"
			:afterClose="doAfterClose"
		/>

		<!--被移出企业提醒-->
		<a-modal :title="$t('common.offlineNotification')" centered class="notification-IM" :z-index="10000" :visible="showModal == 'kickOut'" :width="438" :closable="false">
			<p>{{$t('common.kickOutNotification')}}</p>
			<template #footer>
				<a-button type="primary" @click="logoutHandle">
					{{$t('common.okBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--企业解散提醒-->
		<a-modal :title="$t('common.offlineNotification')" centered class="notification-IM" :z-index="10000" :visible="showModal == 'organDied'" :width="438" :closable="false">
			<p>{{$t('common.organDiedNotification')}}</p>
			<template #footer>
				<a-button type="primary" @click="logoutHandle">
					{{$t('common.okBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--手机退出AA-->
		<PhoneOut :visible="showModal == 'phoneOut'" />

		<!--下线通知-->
		<OffNotification :visible="showModal == 'offNotification'" />

		<!--密码变更通知-->
		<PwchangeNotification :visible="showModal == 'pwchangeNotification'" />

		<!--做退出登录类的通知-->
		<AAmodal :title="noticeData.title" :messages="noticeData.messages" :visible="showModal == 'AAmodal'" />

		<!--展示AAid-->
		<ShowAAid :aaId="accountInfo.accountCode" :visible="showModal == 'showAAid'" />

		<!-- 更新系统配置 -->
		<RefreshSysConfig :visible="showModal == 'refreshSysConfig'" />

		<!--切换企业确认框-->
		<a-modal
			class="notification-IM"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('organization.switch')"
			:visible="switchingOrgan&&!!switchingOrgan.organId"
			@cancel="switchingOrgan=null"
		>
			<p v-if="switchingOrgan&&switchingOrgan.organId!=='0'">
				{{$t('organization.switchTip', { name: switchingOrgan?switchingOrgan.organName:''})}}
			</p>
			<p v-if="switchingOrgan&&switchingOrgan.organId==='0'">
				{{$t('organization.switchingPersonalAccount')}}
			</p>
			<template #footer>
				<a-button type="primary" @click="switchOrgan">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="switchingOrgan=null">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--清除聊天记录确认框-->
		<a-modal
			v-if="isReflushDeleteChatConfirm"
			class="notification-IM"
			:getContainer="modalDeleteContainer"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('chat.clearHistory')"
			:destroyOnClose="true"
			:visible="!!$store.state.OPcomponent.deleteChatConfirm.deleteId"
			@cancel="exitDeleteChatConfirm"
			:afterClose="reflushDeleteChatConfirm"
		>
			<p>{{$t('chat.clearHistory')}}？</p>
			<template #footer>
				<a-button type="primary" @click="handleDeleteChat">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="exitDeleteChatConfirm">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--转发选择框-->
		<MultiplePanel
			v-if="selectingFriends"
			:visible="selectingFriends"
			:confirm="onSelectedFriends"
			:cancel="()=>{selectingFriends=false;selectedList=[];msg_for_share='';serverFileExistList=[]}"
			limit="50"
			:modeltitle="$t('common.relay')"
		>
			<div id="msg_for_share">
				<div>{{$t('common.leaveMessage')}}</div>
				<a-textarea v-model="msg_for_share" type="textarea" :autosize="{ minRows: 4, maxRows: 4 }" />
			</div>
		</MultiplePanel>

		<a-modal :title="$t('chat.sendFileTip[0]') + ' - ' + $t('chat.sendFileTip[1]', { size: clientFileMaxSize })" :closable="false" centered class="notification-IM" :z-index="10000" :visible="sizeTipVisible" :width="438">
			<p v-for="(item, index) in sizeTipMessage" :key="index">
				{{item.name}} - <span style="color: #8098F8">{{item.size}}</span>
			</p>
			<template #footer>
				<a-button type="primary" @click="sizeTipVisible = false">
					{{$t('common.okBtn')}}
				</a-button>
			</template>
		</a-modal>
		<add-friends :visible.sync="showAddFriendsWin"></add-friends>
	</div>
</template>

<script>
	// import $ from 'jquery'
	// import GlobalSearch from '@/components/GlobalSearch'
	import AModal from 'ant-design-vue/es/modal/Modal'
	import CustomSelect from '@/components/common/CustomSelect'
	import { isPhone, isCnPhone, isEmail, isPassword } from '@/utils/web'
	import bongo from '@/assets/sound/bongo.mp3'
	import UserCard from '@/components/UserCard/index.vue'
	// import CreatGroup from '@/components/creatgroup/index'
	import OffNotification from '@/components/AAmodal/offNotification.vue'
	import PhoneOut from '@/components/AAmodal/phoneOut.vue'
	import PwchangeNotification from '@/components/AAmodal/pwchangeNotification.vue'
	import RefreshSysConfig from '@/components/AAmodal/refreshSysConfig.vue'
	import AAmodal from '@/components/AAmodal/index.vue'
	import ShowAAid from '@/components/AAmodal/showAAid.vue'
	import AddFriends from '@/components/addFriends.vue'
	import { setLang } from '@/assets/lang'
	// import AAlistItem from '@/components/AAlist/item'
	import windowTopRightBtns from '@/components/windowTopRightBtns'
	import Message from '@/mixins/message.vue'
	import geren from '@/assets/img/geren_default@2x.png'
	import ImgCut from '@/components/ImgCut/index.vue'
	import MultiplePanel from '@/components/MultiplePanel'
	import WorkStatus from '@/components/WorkStatus.vue'
	import Organization from '@/components/Organization/index.vue'
	import LoginDevices from '@/components/loginDevices.vue'

	var timer = [] // 定义计算器全局变量
	var onlineStateTimer = null

	const { ipcRenderer, remote } = require('electron')

	export default {
		name: 'Layout',
		mixins: [Message],
		components: {
			LoginDevices,
			AddFriends,
			Organization,
			WorkStatus,
			ImgCut,
			AModal,
			// GlobalSearch,
			CustomSelect,
			UserCard,
			PhoneOut,
			OffNotification,
			PwchangeNotification,
			RefreshSysConfig,
			ShowAAid,
			// AAlistItem,
			windowTopRightBtns,
			AAmodal,
			MultiplePanel
		},
		data() {
			return {
				systemset_processing: {},
				activeLoginDecivesModal: '',

				switchingOrgan: null, // null,目标企业：{organId,...},切换企业中：'switching'
				organizations: {},

				showAddFriendsWin: '',
				showAllOrgans: false, // 展示所有企业

				activeWorkStatusModal: '', // 工作状态弹窗

				// player窗口转发相关
				playerFromType: '',
				selectingFriends: false,
				selectedList: [],
				msg_for_share: '',
				serverFileExistList: [],
				mergeSharingMessages: false,
				sharingSpecialMsgs: false,
				sizeTipMessage: [],
				sizeTipVisible: false,

				userContralPanel: false,
				imgCutPanel: false,
				imgCutSpinning: false,
				usersSetSpinning: false,
				newNickName: '',
				userHeaderImage: '', // 用户头像
				btnLoading: false,
				isReflushDeleteChatConfirm: true,
				exitLoginModal: false,
				exitModal: false,
				bongo: bongo,
				isMax: false,
				visible: false,
				showsystemset: false, // 设置弹窗
				changeties: false, // 换绑弹窗
				phoneoremail: '', // 手机/邮箱换绑
				surechangeties: false, // 确认换绑弹窗
				isDisabledGetCode: true, // 按钮是否可按
				issureclick: true,
				getCodeBtnTextType: 1, // 1获取验证码，2请求中，3重新获取验证码, 4倒计时
				getCodeBtnText: '',
				isGetting: false, // loading
				privatemanage: false, // 私钥管理弹窗
				privateval: '', // 私钥值
				shownowprivate: true, // 显示当前私钥
				changeKeyLoading: false,
				showchangepass: false, // 修改密码弹窗
				changepswLoading: false,
				isableclick: true,
				showabout: false, // 关于aa弹窗
				showmyname: false, // 我的昵称弹窗
				changename: true, // 修改昵称
				allmyuserinfo: {},
				allsetting: {}, // 所有系统设置
				loadings: false,
				isupdata: false,
				creatgroup: false,
				showaddtome: false, // 添加我的方式弹窗
				updatasetting: {
					addMeTypeByAaChatId: '',
					addMeTypeByMoblie: '',
					addMeTypeByEmail: '',
					addMeTypeByQrCode: '',
					allowNotice: '',
					openSounds: ''
				},
				yanzparams: {
					opType: '',
					account: '',
					validateCode: '',
					areaCode: '+86',
					validateType: ''
				}, // 换绑参数
				checkParams: {
					type: '6', // 6: 手机换绑; 7: 邮箱换绑
					areaCode: '+86', // 手机区号, 需要带上'+'号
					account: '',
					validateCode: ''
				}, // 校验验证码
				codeParams: {
					type: '6', // 6: 手机换绑; 7: 邮箱换绑
					areaCode: '+86',
					account: ''
				}, // 发送验证码
				params: {
					oldPassword: '',
					newPassword: '',
					newPasswordConfirm: ''
				}, // 修改密码
				changeparams: {
					nickName: '',
					userAvatar: '',
					opNo: '',
					resetQrCode: ''
				}, // 修改信息
				addparams: {},
				noticeData:	{
					title: '',
					messages: ''
				},
				isWinMax: false,
				offOnlineTime: null,
				gettingApiUrlConfig: false,
				uploadingLogs: false,
				avatorParams: {
					category: 'user_avatar',
					batchNo: '',
					opNo: +new Date(),
					base64: ''
				}
			}
		},
		asyncComputed: {
			async lang() {
				const sysConfig = await this.$utils.fun.getSysConfig()
				return sysConfig.lang
			}
		},
		computed: {
			clientFileMaxSize() {
				return parseInt(this.$store.state.Setting.paramsConfig && this.$store.state.Setting.paramsConfig.clientFileMaxSize) || 20
			},
			isOnline() {
				return this.$store.state.Setting.online
			},
			unProcessCount() {
				const count = this.$store.getters['unProcessCount']
				this.$utils.fun.commitUnreadCount(count)
				return count.unProcessCount
			},
			unreadMsgCount() {
				return this.$store.getters['unreadCount']
			},
			accountInfo() {
				return window._.cloneDeep(this.$store.state.User.accountInfo)
			},
			showModal() {
				return this.$store.state.Setting.showModal
			},
			statistics() {
				return this.$store.state.NewFriend.statistics
			},
			callRecords() {
				return this.$store.state.OPcomponent.callRecords
			}
		},
		watch: {
			/* "$store.getters.unProcessCount"(nVal){
		    this.$utils.fun.commitUnreadCount(nVal)
      },*/
			async $route(to, from) {
				// 轮询指定用户在线状态
				this.loopUserOnlineState(to)
				// 路由变化，关闭清空记录确认框
				this.$store.dispatch('OPcomponent/set_deleteChatConfirm', {
					deleteId: ''
				})
			},
			async '$store.state.Chat.currentThreadID'(nVal) {
				// 处理聊天页面切换由动态路由改为Vuex变更实现
				this.loopUserOnlineState(this.$route)
			},
			async 'isOnline'(nVal) {
				if (!nVal) {
					this.clearOnlineStateInt()
					this.offOnlineTime = window.$moment() // 记录下线时间
				} else if (!onlineStateTimer) {
					this.loopUserOnlineState(this.$route)
				}
				/* 业务需求，token下线不会删除token，先注释了
				if (nVal) { // 重新上线，刷新token
					const onlineTime = window.$moment()
					const seconds = onlineTime.diff(this.offOnlineTime, 'seconds') // 计算上线和下线的时间差，小于15秒不刷新token
					if (seconds < 15) return
					try {
						await this.$utils.chatSdk.cTokenOff()
						const sysConfig = this.$store.state.Setting.sysConfig
						const oldToken = this.$store.state.User.accountInfo.token || ''
						// 非扫码登录，获取新token前，先清除旧token
						if (sysConfig.lastLoginByQr !== 0) await this.$store.dispatch('User/set_accountInfo', { token: '' })
						const userInfo = await this.$utils.api.user.login({
							data: { account: sysConfig.loginName, loginType: 0, areaCode: sysConfig.areaCode, autoLogin: sysConfig.lastLoginByQr === 0 },
							custError: true
						}).get() // 刷新token变更在线状态
						await this.$store.dispatch('User/set_accountInfo', { token: userInfo.data.token, timestamp: parseInt(userInfo.data.timestamp) })
						await this.$utils.api.user.directEnterOrQuit({ type: '0' }).get() // 通知APP
						console.log('::::::断线15秒以上，重新请求:::::', userInfo.data.timestamp)
						console.log('new::::', userInfo.data.token)
						console.log('old::::', oldToken)
						console.log('deviceId::::', this.$utils.fun.getGlobalByName('deviceId'))
						this.$utils.chatSdk.cToken(this.$store.state.User.accountInfo.userId, this.$utils.fun.getGlobalByName('deviceId'), userInfo.data.token, oldToken)
					} catch (e) { // 如果刷新token失败，就到登录页
						console.error('renderer@getNewToken:', e)
						this.tokenTimeout()
					}
				}*/
			},
			async '$store.state.Chat.reFileNameQueue'(reFileNameQueue) {
				console.log('文件重命名队列', reFileNameQueue)
				if (reFileNameQueue.length) {
					if (!reFileNameQueue[0].status) {
						const tempData = window._.assign({}, reFileNameQueue[0])
						tempData.status = 1
						this.$store.commit('Chat/setReFilaNameQueue', {
							action: 'modify',
							data: tempData
						})
						const { newFileName, fileName, fileNameIndex } = await this.$store.dispatch('Chat/reFileName', { fileName: reFileNameQueue[0].fileName, threadID: reFileNameQueue[0].threadID, ext: reFileNameQueue[0].ext })
						const updatingData = {
							fileNameIndex,
							newFileName,
							text: `[${this.$t('common.file')}] ` + (newFileName || fileName)
						}
						await this.$store.dispatch('Chat/updateMsg', {
							id: reFileNameQueue[0].id,
							updatingData
						})
						this.$store.commit('Chat/setReFilaNameQueue', {
							action: 'del',
							data: reFileNameQueue[0]
						})
					}
				}
			},
			async '$store.state.Chat.sendFileQueue'(sendFileQueue) {
				console.log('发送文件队列', sendFileQueue)
				for (const key in sendFileQueue) {
					for (let i = 0; i < sendFileQueue[key].length && i < 3; i++) { // 每个队列可以同时上传1个文件
						const temp = sendFileQueue[key][i]
						if (temp) {
							if (temp.status === undefined) { // undefined是队列未处理，0处理中
								temp.status = 0
								this.$store.dispatch('Chat/setSendFileQueue', { action: 'modify', data: temp })
								// 重发id，如果id为整型或者id长度小于14，则不是正确的重发id
								const reid = typeof temp.msgID === 'string' ? (temp.msgID.length > 14 ? temp.msgID : '') : ''
								switch (temp.form) {
								case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
									this.$utils.chatSdk.cSendImageAsync(true, false, reid, temp.threadID, temp.meta, temp.localPath).then(res => {
										this.$store.dispatch('Chat/sendFileProgress', { key: res.data, msgID: temp.msgID }).then(async data => {
											await this.$store.dispatch('Chat/setSendFileQueue', { action: 'del', data: temp })
											this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: data, resendTime: temp.resendTime })
										})
									})
									break
								case this.$CHAT_MSG_TYPE.TYPE_EMOJI:
									this.$utils.chatSdk.cSendEmoticonAsync(false, reid, temp.threadID, temp.meta, temp.url).then(async res => {
										this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: res })
									})
									break
								case this.$CHAT_MSG_TYPE.TYPE_FILE:
									this.$utils.chatSdk.cSendFileAsync(false, reid, temp.threadID, temp.meta, temp.localPath).then(res => {
										this.$store.dispatch('Chat/sendFileProgress', { key: res.data, msgID: temp.msgID }).then(async data => {
											await this.$store.dispatch('Chat/setSendFileQueue', { action: 'del', data: temp })
											this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: data, resendTime: temp.resendTime })
										})
									})
									break
								case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
									this.$utils.chatSdk.cSendVideoAsync(false, reid, temp.threadID, temp.meta, temp.localPath).then(res => {
										this.$store.dispatch('Chat/sendFileProgress', { key: res.data, msgID: temp.msgID }).then(async data => {
											await this.$store.dispatch('Chat/setSendFileQueue', { action: 'del', data: temp })
											this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: data, resendTime: temp.resendTime })
										})
									})
								}
							}
						}
					}
				}
				/* if (nVal[0]) { // 从队列第一个开始处理
					const temp = window._.assign({}, nVal[0])
					if (temp.status === undefined) { // undefined是队列未处理，0处理中，1处理结束
						temp.status = 0
						this.$store.dispatch('Chat/setSendFileQueue', { action: 'modify', data: temp })
						switch (temp.form) {
						case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
							this.$utils.chatSdk.cSendImageAsync(true, false, '', temp.threadID, temp.meta, temp.localPath).then(async res => {
								this.$store.dispatch('Chat/sendFileProgress', { key: res.data, msgID: temp.msgID }).then(data => {
									this.$store.dispatch('Chat/setSendFileQueue', { action: 'del', data: { msgID: temp.msgID }})
									this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: data })
								})
							})
							break
						case this.$CHAT_MSG_TYPE.TYPE_FILE:
							this.$utils.chatSdk.cSendFileAsync(false, '', temp.threadID, temp.meta, temp.localPath).then(async res => {
								this.$store.dispatch('Chat/sendFileProgress', { key: res.data, msgID: temp.msgID }).then(data => {
									this.$store.dispatch('Chat/setSendFileQueue', { action: 'del', data: { msgID: temp.msgID }})
									this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: data })
								})
							})
							break
						case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
							this.$utils.chatSdk.cSendVideoAsync(false, '', temp.threadID, temp.meta, temp.localPath).then(async res => {
								this.$store.dispatch('Chat/sendFileProgress', { key: res.data, msgID: temp.msgID }).then(data => {
									this.$store.dispatch('Chat/setSendFileQueue', { action: 'del', data: { msgID: temp.msgID }})
									this.$store.dispatch('Chat/sendMsgCallback', { msgID: temp.msgID, result: data })
								})
							})
						}
					}
				}*/
			},
			'$store.state.Setting.onlineStatePollForModel'(nVal) {
				this.loopUserOnlineState(this.$route, nVal)
			},
			'$store.state.OPcomponent.deleteChatConfirm.deleteId'() {
				this.userId = this.$store.state.OPcomponent.userCard.userId
			},
			'yanzparams.account'(nVal, oval) {
				if (this.yanzparams.account) {
					if (this.phoneoremail) {
						if (this.codeParams.areaCode === '+86') {
							isCnPhone(this.yanzparams.account) && !timer['getCode']
								? (this.isDisabledGetCode = false)
								: (this.isDisabledGetCode = true)
							isCnPhone(this.yanzparams.account) && this.yanzparams.validateCode ? this.issureclick = false : this.issureclick = true
						} else {
							isPhone(this.yanzparams.account) && !timer['getCode']
								? (this.isDisabledGetCode = false)
								: (this.isDisabledGetCode = true)
							isPhone(this.yanzparams.account) && this.yanzparams.validateCode ? this.issureclick = false : this.issureclick = true
						}
					} else {
						//          if (isEmail(this.yanzparams.account) && !timer["getCode"]) this.isDisabledGetCode = false;
						isEmail(this.yanzparams.account) && !timer['getCode']
							? (this.isDisabledGetCode = false)
							: (this.isDisabledGetCode = true)
						isEmail(this.yanzparams.account) && this.yanzparams.validateCode ? this.issureclick = false : this.issureclick = true
					}
				} else {
					this.isDisabledGetCode = true
					this.issureclick = true
				}
			},
			'params.newPasswordConfirm'() {
				this.params.newPasswordConfirm
					? (this.isableclick = false)
					: (this.isableclick = true)
			},
			'yanzparams.validateCode'(val) {
				if (this.yanzparams.account && this.yanzparams.validateCode) {
					if (this.phoneoremail) {
						if (this.codeParams.areaCode === '+86') {
							isCnPhone(this.yanzparams.account) ? this.issureclick = false : this.issureclick = true
						} else {
							this.issureclick = false
						}
					} else {
						isEmail(this.yanzparams.account) ? (this.issureclick = false) : (this.issureclick = true)
					}
				} else {
					this.issureclick = true
				}
			},
			'$store.state.User.accountInfo.userAvatar'(val) {
				this.userHeaderImage = val
			}
		},
		async created() {
			// 如果是第一次在此设备上登录，则初始化历史记录
			const accountInfo = this.$store.state.User.accountInfo
			console.log('账号信息：', accountInfo)
			this.userHeaderImage = accountInfo.userAvatar
			const isNewUser = accountInfo.newUser
			if (isNewUser === 1) {
				this.$store.dispatch('Setting/set_pageLoading', '')
				// 新注册用户显示aaid窗口
				this.$store.dispatch('Setting/set_showModal', 'showAAid')
				this.cGet(true)
			}

			if (isNewUser !== 1) {
				this.syncHistory()
			}
			/* this.$utils.fun.getSysConfig().then(res => {
				this.$store.dispatch('Setting/set_autoLogin', res.autoLogin === 'true')
			})*/
			const set_secretKey = this.$utils.jsencrypt.RSAdencrypt(accountInfo.secretKey)
			this.$store.dispatch('User/set_secretKey', set_secretKey)
			this.$eventBus.$on('openAddFriendsWin', () => {
				this.showAddFriendsWin = 'findUser'
			})

			this.getAllOrgans()

			window.addEventListener('online', this.updateOnlineStatus)
			window.addEventListener('offline', this.updateOnlineStatus)
		},
		mounted() {
			this.allmyuserinfo = this.$store.state.User.accountInfo
			// 延迟执行，避免timestamp相同
			setTimeout(() => {
				this.$utils.api.user
					.detail()
					.get()
					.then(res => {
						this.allsetting = res.data
					})
			}, 100)

			if (!process.env.IS_WEB) {
				ipcRenderer.on('screenShot', () => {
					this.$utils.screenShot()
				})
				ipcRenderer.on('open-chat-window', async(e, arg) => {
					if (arg.threadID != this.$store.state.Chat.currentThreadID) {
						// 切换聊天界面，清空图片浏览器数组
						this.$store.dispatch('Chat/setImagePlayerArray', { action: 'clear' })
						await this.$store.dispatch('Chat/openThread', {
							id: arg.threadID,
							type: arg.threadType
						})
					}
					this.$nextTick(() => {
						ipcRenderer.send('showMainWin')
					})
				})
				ipcRenderer.on('open-contact-window', (e, arg) => {
					this.$router.push({ path: '/addressBook/newFriends' })
				})
				ipcRenderer.on('playerWin', (e, arg) => {
					if (arg.opType === 'share') {
						this.share(arg.data)
						return
					}
					if (arg.playerType === this.$WEB_CONFIG.CHAT_MSG_TYPE.TYPE_FILE) {
						// arg.fromType, 1、收藏夹 2、文档 3、聊天记录（合并转发），空、普通
						const	fromTypeInDownload = { // 空、普通-不做处理
							1: 'collect-1', // 收藏
							2: 'chat-3', // fileModule-文件模块
							3: 'chat-1' // chatBubble-聊天泡泡
						}
						this.$eventBus.$emit('downloadFile', {
							type:	this.$CHAT_MSG_TYPE.TYPE_FILE,
							fromType:	fromTypeInDownload[arg.fromType],
							id: arg.fromType === 3 ? arg.subMessageId : arg.messageId,
							filePath: arg.url,
							fileName: arg.fileName
						})
						// let messageId = arg.messageId
						// let downloadId = arg.melossageId
						// if (arg.opType === 'burntAfterRead') {
						// 	// 交给窗口切换删除
						// 	// this.$utils.chatSdk.cDeleteAsync(`${arg.messageId}`, '', 'true') // 删除服务器数据
						// } else if (arg.opType === 'download') {
						// 	if (arg.fromType === 3) { // 聊天记录的消息id得在chatRecordMessage查找，以subMessageId为键值
						// 		messageId = arg.subMessageId
						// 		downloadId = `${arg.subMessageId}|${arg.threadId}|${arg.senderId}`
						// 	} else if (!arg.fromType) {
						// 		downloadId = `${arg.messageId}|${arg.threadId}|${arg.senderId}`
						// 	}

						// 	// 如果在下载队列，不重复下载
						// 	if (this.$store.state.Chat.downloadingMsgs.indexOf(downloadId) >= 0) return
						// 	// 加入下载队列
						// 	this.$store.commit('Chat/updateDownloadingMsgs', {
						// 		action: 'add',
						// 		id: downloadId
						// 	})
						// 	// this.$store.commit('Chat/downloadFavFileProgress', { id: messageId })
						// 	// arg.iscollection 此参数来区别是聊天里面的文件还是收藏里面的文件
						// 	this.$utils.fun
						// 		.downloadFile({
						// 			type: this.$CHAT_MSG_TYPE.TYPE_FILE,
						// 			filePath: arg.url,
						// 			fileName: arg.fileName,
						// 			id: messageId
						// 		}, async({ state, totalBytes, receivedBytes, saveFilePath }) => {
						// 			if (state === 'canceled') {
						// 				this.$store.commit('Chat/updateDownloadingMsgs', {
						// 					action: 'del',
						// 					id: downloadId
						// 				})
						// 				this.$store.dispatch('Setting/del_fileDownloadings', downloadId)
						// 				return
						// 			}
						// 			if (state === 'save-error') {
						// 				this.$store.commit('Chat/updateDownloadingMsgs', {
						// 					action: 'del',
						// 					id: downloadId
						// 				})
						// 				this.$store.dispatch('Chat/downloadFileProgress', { msgID: messageId, progress: '' })
						// 				this.$message.error(this.$t('common.saveStatus[1]'))
						// 				return
						// 			}
						// 			const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
						// 			// arg.iscollection ? this.$store.commit('Chat/downloadFavFileProgress', { id: messageId, progress }) : this.$store.dispatch('Chat/downloadFileProgress', { msgID: messageId, progress })
						// 			if (arg.fromType == 1) {
						// 				this.$store.commit('Chat/downloadFavFileProgress', { id: messageId, progress })
						// 			}	else if (arg.fromType == 2) {
						// 				this.$store.dispatch('Setting/update_fileDownloadings', { id: messageId, state, progress, localPath: saveFilePath })
						// 			}	else if (arg.fromType == 3) {
						// 				this.$store.commit('Chat/downloadChatRecordFileProgress', { id: messageId, progress })
						// 			} else {
						// 				this.$store.dispatch('Chat/downloadFileProgress', { msgID: messageId, progress })
						// 				this.$store.dispatch('Setting/update_fileDownloadings', { id: messageId, state, progress, localPath: saveFilePath })
						// 			}
						// 			if (state === 'finished') {
						// 				const updatingData = {
						// 					localPath: saveFilePath
						// 				}
						// 				this.$utils.chatSdk.cReadAsync(messageId) // 同步已读
						// 				// 更新数据库
						// 				if (arg.fromType == 1) {
						// 					await this.$store.dispatch('Chat/updateFav', { id: messageId, data: { localPath: saveFilePath }})
						// 				} else if (arg.fromType == 2) {
						// 					await this.$store.dispatch('Chat/updateMsg', {
						// 						id: messageId,
						// 						updatingData
						// 					})
						// 					this.$message.success(this.$t('common.fileDownload[0]', { fileName: arg.newFileName || arg.fileName }))
						// 				} else {
						// 					await this.$store.dispatch('Chat/updateMsg', {
						// 						id: messageId,
						// 						updatingData
						// 					})
						// 					if (arg.fromType == 3) {
						// 						this.$store.commit('Chat/setChatRecordMessage', {
						// 							type: 'modify',
						// 							id: messageId,
						// 							updatingData
						// 						})
						// 					}
						// 				}

						// 				// 通知filePlayer窗口更改文件状态
						// 				this.$utils.fun.setPlayerWin({
						// 					messageId: arg.fromType == 3 ? arg.messageId : messageId,
						// 					filePath: saveFilePath,
						// 					playerType: this.$CHAT_MSG_TYPE.TYPE_FILE
						// 				})
						// 				// 从下载队列删除
						// 				this.$store.commit('Chat/updateDownloadingMsgs', {
						// 					action: 'del',
						// 					id: downloadId
						// 				})
						// 				this.$store.dispatch('Setting/del_fileDownloadings', downloadId)
						// 			} else if (state === 'abort') {
						// 				if (arg.fromType == 1 || arg.iscollection) {
						// 					this.$store.commit('Chat/downloadFavFileProgress', { id: messageId, progress: '' })
						// 				} else if (arg.fromType == 2) {
						// 					this.$store.dispatch('Setting/del_fileDownloadings', downloadId)
						// 				} else if (arg.fromType == 3) {
						// 					this.$store.commit('Chat/downloadChatRecordFileProgress', { id: messageId, progress: '' })
						// 				} else {
						// 					this.$store.dispatch('Setting/del_fileDownloadings', downloadId)
						// 					this.$store.dispatch('Chat/downloadFileProgress', { msgID: messageId, progress: '' })
						// 				}

						// 				// 从下载队列删除
						// 				this.$store.commit('Chat/updateDownloadingMsgs', {
						// 					action: 'del',
						// 					id: downloadId
						// 				})
						// 			}
						// 		})
						// }
					}
				})
				ipcRenderer.on('downloadFileProgress', (e, arg) => {
					// state: cancelled
					const { id, type, fromType, other, state, totalBytes, receivedBytes, saveFilePath } = arg
					console.log(arg)
					if (state === 'cancelled') {
						this.$store.dispatch('Setting/del_fileDownloadings', id)
						return
					}
					const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
					this.$store.dispatch('Setting/update_fileDownloadings', { id, type,	state, progress, totalBytes, receivedBytes, localPath: saveFilePath, fromType, other })
				})
				this.$eventBus.$on('downloadFile', ({ type,	id, fileName, filePath,	fromType, other = {}}) => {
					// 达到同时下载阈值，二次清理未处理的数据
					const	fileDownloadingInfo	=	this.$store.state.Setting.fileDownloadings[id.replace(/-/g, '')]
					console.log('this.$store.state.Setting.fileDownloadings:::', JSON.parse(JSON.stringify(this.$store.state.Setting.fileDownloadings)))
					console.log('id:::', id.replace(/-/g, ''))
					if (fileDownloadingInfo) {
						const	isSameType = fileDownloadingInfo.fromType.split('-')[0]	===	fromType.split('-')[0]
						if (isSameType) {
							return console.log('已在下载队列')
						}
					} else if (Object.keys(this.$store.state.Setting.fileDownloadings).length >= 20) {
						const	shouldClears = Object.values(this.$store.state.Setting.fileDownloadings).filter(loadingInfo => loadingInfo.state != 'progress')
						if (shouldClears.length) {
							shouldClears.forEach(loadingInfo => {
								if (loadingInfo.state == 'finished') {
									// 更新本地对应数据库
									if (loadingInfo.fromType.indexOf('chat-') >= 0) {
										let	updatingData = { id: loadingInfo.id, updatingData: { localPath: loadingInfo.localPath }}
										// this.$store.dispatch('Chat/updateMsg', updatingData)
										if (other.inReply) {
											updatingData = {
												id:	other.messageId,
												updatingData: { replyInfo: Object.assign({}, other.replyInfo, { localPath: loadingInfo.localPath })	}
											}
										}
										this.$store.dispatch('Chat/updateMsg', updatingData)
									}	else if (loadingInfo.fromType.indexOf('collect-') >= 0) {
										this.$store.dispatch('Chat/updateFav', { id: loadingInfo.id, data: { localPath: loadingInfo.localPath }})
									}
								}
								this.$store.dispatch('Setting/del_fileDownloadings', loadingInfo.id)
							})
						} else {
							this.$message.warning(this.$t('common.fileDownloadLimit'))
							return
						}
					}
					/* this.$store.dispatch('Chat/downloadFileBySDK', {
						type, fileName, msgId: id, fromType, other, uri: filePath
					})*/
					this.$utils.fun.downloadFile({
						fromType,
						other,
						type,
						id,
						filePath,
						fileName
					}, async({ state, totalBytes, receivedBytes, saveFilePath }) => {
						// state：canceled/abort/error/save-error/finished/progress
						console.log('下载id:::', state, id, id.replace(/-/g, ''))
						if (state === 'canceled') {
							this.$store.dispatch('Setting/del_fileDownloadings', id)
							return
						}
						const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
						this.$store.dispatch('Setting/update_fileDownloadings', { id, type,	state, progress, totalBytes, receivedBytes, localPath: saveFilePath, fromType, other })
						// 聊天泡泡里的下载，用于修复泡泡不在当前页面，泡泡监听器不起作用，下载完成后改变不了数据状态的问题
						if (fromType && fromType.indexOf('chat-') > -1 && state === 'finished') {
							const updatingData = {
								localPath: saveFilePath
							}
							if (other.triggered !== 1 && type === this.$CHAT_MSG_TYPE.TYPE_FILE) {
								updatingData.triggered = 1
								this.$utils.chatSdk.cReadAsync(id) // 同步已读
							}
							// 通知fileplayer窗口更改文件状态
							if (type === this.$CHAT_MSG_TYPE.TYPE_FILE) {
								let messageId = id
								if (other.threadID && other.threadID.indexOf('@') > -1) { // 合并转发里的文件得用主消息id
									messageId = other.threadID.substring(0, other.threadID.indexOf('@'))
								}
								this.$utils.fun.setPlayerWin({
									messageId,
									filePath: saveFilePath,
									playerType: this.$CHAT_MSG_TYPE.TYPE_FILE
								})
							}
							// 更新数据库
							if (other.inReply) {
								await	this.$store.dispatch('Chat/updateMsg', {
									id,
									updatingData:	{
										replyInfo: Object.assign({}, other.replyInfo, { localPath: saveFilePath,	sendProgress: progress })
									}
								})
							}	else {
								await	this.$store.dispatch('Chat/updateMsg', { id, updatingData })
							}
							// 从下载队列删除
							setTimeout(() => {
								this.$store.dispatch('Setting/del_fileDownloadings', id)
							}, 2000)
						}
					})
				})
			}
			document.addEventListener('visibilitychange', this.windowsVisibility)
		},
		beforeDestroy() {
			if (!process.env.IS_WEB) {
				ipcRenderer.removeAllListeners('screenShot')
				ipcRenderer.removeAllListeners('open-chat-window')
				ipcRenderer.removeAllListeners('open-contact-window')
				ipcRenderer.removeAllListeners('playerWin')
				ipcRenderer.removeAllListeners('downloadFileProgress')
			}
			this.$eventBus.$off('downloadFile')
			this.$eventBus.$off('openAddFriendsWin')
			document.removeEventListener('visibilitychange', this.windowsVisibility)
			document.removeEventListener('online', this.updateOnlineStatus)
			document.removeEventListener('offline', this.updateOnlineStatus)
			if (this.getMessageTimer) clearTimeout(this.getMessageTimer)
			this.clearOnlineStateInt()
		},
		methods: {
			secondValidSwitch() {
				if (!this.accountInfo.userMobile && !this.accountInfo.userEmail) {
					this.$info({
						title: this.$t('setting.loginProtection_bindTip'),
						centered: true,
						okText: this.$t('common.gotIt')
					})
					return
				}
				this.systemset_processing.secondValidSwitch = true
				const newState = this.accountInfo.userSecurityConfig.secondValidSwitch ? 0 : 1
				this.$utils.api.user
					.onOrOffSecondValid({ state: newState })
					.get()
					.then(res => {
						this.systemset_processing.secondValidSwitch = false
						if (res.code == 0) {
							this.$store.dispatch('User/set_accountInfo', {
								userSecurityConfig: Object.assign({}, this.accountInfo.userSecurityConfig, { secondValidSwitch: res.data.switchState })
							})
						}
					}).catch(e => {
						this.systemset_processing.secondValidSwitch = false
					})
			},

			navClick() {
				// 关闭企业页面
				if (this.$store.state.organizationPage) {
					this.$store.commit('setOrganizationPage', '')
				}
			},
			getOrganName(organ) {
				if (organ.organId == '0') {
					return this.$t('organization.personalEdition')
				} else {
					return organ.organName
				}
			},
			getAllOrgans() {
				this.$utils.api.user.getAllOrgans().get().then(res => {
					if (res.code == 0) {
						let allOrgans = res.data
						console.log('加入的所有企业：', allOrgans)
						let firstLater
						allOrgans = allOrgans.map(organ => {
							firstLater = Array.from(organ.organName)[0]
							organ.firstLater = firstLater
							return organ
						})

						const curOrgan = allOrgans.find(item => {
							return item.organId == this.$store.state.User.accountInfo.organId
						})

						const list = allOrgans.filter(item => {
							return item.organId != curOrgan.organId
						})

						let preOrgan = null
						if (list.length) {
							list.reverse()
							preOrgan = list[list.length - 1]
							list.splice(list.length - 1, 1)
						}

						if (list.length < 3 && this.showAllOrgans) {
							this.showAllOrgans = false
						}

						this.organizations = {
							list,
							preOrgan,
							curOrgan
						}
					}
				}).catch(e => {
					console.log(e)
				})
			},
			async switchOrgan(switchingOrgan) {
				this.$store.dispatch('Setting/set_pageLoading', { content: this.$t('common.loading') + '...', translucent: true })

				try {
					let organId
					let switchType = 1
					if (switchingOrgan.organId) {
						organId = `${switchingOrgan.organId}`
						if (!switchingOrgan.exits) {
							switchType = 0
						}
					} else {
						organId = `${this.switchingOrgan.organId}`
						this.switchingOrgan = 'switching'
					}
					const res = await this.$utils.api.user.joinOrgan({ organId, switchType, custError: true }).get()
					if (res.code == 0) {
						console.log('即将切换到的账号信息', res)
						this.reloadPage(res.data)
						// 关闭企业页面
						if (this.$store.state.organizationPage) {
							this.$store.commit('setOrganizationPage', '')
						}
					} else {
						this.$store.dispatch('Setting/set_pageLoading', '')
					}
				} catch (e) {
					console.log('切换企业异常：', e)
					this.switchingOrgan = null
					this.$store.dispatch('Setting/set_pageLoading', '')

					if (e.code && (e.code == 601017 || e.code == 601019)) { // 审核中
						const that = this
						this.$info({
							title: e.code == 601017 ? this.$t('organization.error[0]', { organName: switchingOrgan.organName || '' }) : this.$t('organization.error[1]'),
							centered: true,
							okText: this.$t('common.gotIt'),
							onOk() {
								that.$store.commit('setOrganizationPage', 'index')
							}
						})
					} else if (e.code == 601018) { // 解散
						this.getAllOrgans()
						this.$info({
							title: this.$t('organization.killed'),
							centered: true,
							okText: this.$t('common.gotIt')
						})
					} else if (e.code === 506001 || e.code === 506) {
						this.$message.error(this.$t('common.loginInfoExpired'))
						this.$store.dispatch('Setting/set_pageLoading', { content: this.$t('common.exiting') + '...', translucent: true })
						const timer = setTimeout(async() => {
							clearTimeout(timer)
							await this.$utils.fun.logout()
							this.$store.commit('initState')
							this.$router.push({ path: '/login', replace: true, query: { resize: true }})
							this.$store.dispatch('Setting/set_pageLoading', '')
						}, 3000)
					} else if (e.message) {
						this.$message.error(e.message)
					}
				}
			},

			async reloadPage(accountInfo) {
				try {
					this.clearOnlineStateInt()
					this.switchingOrgan = 'switching'

					// 设置token下线，且改变主线程isLogout的值
					await this.$utils.fun.sdkTokenOff()

					// 设置用户文件路径等
					const res_userResources = await this.$utils.fun.userResources({ userId: accountInfo.userId, userInfo: accountInfo })
					if (!res_userResources.isInit) {
						// 清空用户本地数据
						await this.$utils.fun.clearLocalData(accountInfo.organRemoveTime, accountInfo.organId)
						this.$store.commit('updateClearLocalDataTime', accountInfo.timestamp)
						await this.$utils.fun.userResources({ userId: accountInfo.userId, userInfo: accountInfo })
					}

					// 重置vueX
					this.$store.commit('initState', ['organizationPage', 'codeValidated'])

					// 更新token
					await this.$store.dispatch('User/set_accountInfo', { token: `${accountInfo.token}` })

					// 更新当前企业信息
					this.$store.dispatch('Setting/set_organInfo', {
						organName: accountInfo.organName,
						organCode: accountInfo.organCode,
						organId: accountInfo.organId
					})

					// 更新用户信息
					let newUserInfo = await this.$utils.api.user.getUserInfo().get()
					newUserInfo = Object.assign({}, accountInfo, newUserInfo.data)
					console.log('newUserInfo:::', newUserInfo)
					await this.$store.dispatch('User/set_accountInfo', newUserInfo)
					const set_secretKey = this.$utils.jsencrypt.RSAdencrypt(newUserInfo.secretKey)
					this.$store.dispatch('User/set_secretKey', set_secretKey)
					await this.$store.dispatch('Setting/set_sysConfig', {
						data: {
							organId: accountInfo.organId
						}
					})

					// 重新赋值用户信息
					this.allmyuserinfo = newUserInfo
					this.userHeaderImage = newUserInfo.userAvatar
					this.$utils.api.user.detail().get().then(res => {
						this.allsetting = res.data
					})

					// 重新注册SDK的token
					await this.$utils.chatSdk.initChat()

					// 重定向到聊天页面
					this.$router.push({ path: '/chat', replace: true })

					remote.crashReporter.addExtraParameter('token', accountInfo.token)
					await this.$store.dispatch('Setting/get_organParamsConfig')

					// 重新获取群组，好友等信息
					await this.initData()
					// 获取所有会话
					await this.$store.dispatch('Chat/getAllThreads')
					// ���取系统公告
					await this.$store.dispatch('Chat/getNotify')
					// 获取积分助手信息
					await this.$store.dispatch('Chat/getPointNotify')
					// 获取禁言时间字典
					const banned_time_dict = (await this.$utils.api.public.getOneDicts({ dictType: 'banned_time' }).get()).data
					if (banned_time_dict) {
						this.$store.commit('Chat/updateBannedTimeDict', banned_time_dict)
					}
					// 获取最新表情数据
					await this.$store.dispatch('Chat/getAllEmojis')
					// 收起企业列表
					this.showAllOrgans = false
					// 获取企业列表
					this.getAllOrgans()
				} catch (e) {
					console.log(e)
					if (this.switchOrgan == 'error') return
					this.switchOrgan = 'error'
					console.log('切换企业异常,准备前往登录界面：', e)
					this.clearOnlineStateInt()
					this.$store.dispatch('Setting/set_autoLogin', false)
					await this.$utils.fun.logout()
					this.$store.commit('initState')
					this.switchingOrgan = null
					this.$store.dispatch('Setting/set_pageLoading', '')
					setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
					return
				}

				// 同步消息
				this.syncHistory()
				this.switchingOrgan = null
			},

			initData() { // 加载我的群组, 群组关系列表，我的好友，我的好友群组列表，	用户信息，新的好友统计数据，通话记录
				return new Promise((resolve, reject) => {
					this.$utils.api.user.myGroupsAndUsers().get().then(res => {
						console.log('从服务端获取的群组，好友等数据：', res)
						const { groups, groupUsers, friends, friendGroups, users } = res.data
						Promise.all([
							this.$store.dispatch('MyGrounp/set_list', groups || []),
							this.$store.dispatch('MyGrounp/set_userRelationList', groupUsers || []),
							this.$store.dispatch('MyFriend/set_list', friends || []),
							this.$store.dispatch('MyFriend/set_friendGroups', friendGroups || []),
							this.$store.dispatch('User/set_list', users || []),
							this.$store.dispatch('NewFriend/set_list')
							// store.dispatch('OPcomponent/set_callRecords')
						]).then(res => {
							resolve()
						}).catch(e => reject(e))
					}).catch(e => {
						reject(e)
					})
				})
			},
			logoutHandle() {
				this.$store.dispatch('Setting/set_showModal', '')
				setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
			},
			updateOnlineStatus({ type }) {
				this.$store.commit('Setting/SET_ISNETWORKONLINE', type === 'online')
			},
			// 转发
			async share(message) {
				if (!this.onlineCheck()) return
				this.playerFromType = message.fromType
				if (this.playerFromType != 1) {
					let fileExist = true
					let fileUrlExist = false
					if (message.url && message.mType !== 'link') { // 排除链接
						fileUrlExist = await this.$utils.chatSdk.cExistsUploadAsync(message.url)
						fileUrlExist = fileUrlExist.code === 0 && fileUrlExist.data[0].exists
						const fileLocalExist = await this.$utils.fun.fileExist(message.localPath || '')
						fileExist = fileUrlExist || fileLocalExist
					}
					if (message.status != 1 || !fileExist) {
						this.sharingSpecialMsgs = true
						return
					}
					if (message.url && fileUrlExist) this.serverFileExistList = [message.url]
				}
				this.selectingFriends = true
				this.sharingMessages = [message]
			},
			async onSelectedFriends(groups) {
				if (!this.onlineCheck()) return
				this.selectingFriends = false
				this.selectedList = []
				if (this.playerFromType == 1) {
					let friend
					let liuyan
					await this.$store.dispatch('Chat/relayCollect', { messages: this.sharingMessages, groups })
					for (let i = 0; i < groups.length; i++) {
						friend = groups[i]
						liuyan = this.$store.getters['Chat/someThraed'](friend.groupId)
						await this.$store.dispatch('Chat/sendMessage', {
							msg: {
								text: this.msg_for_share
							},
							thread: liuyan
						})
					}
					this.msg_for_share = ''
				} else {
					let merge = null
					if (this.mergeSharingMessages) {
						this.mergeSharingMessages = false
						merge = {
							type: this.thread.type,
							name: this.thread.name || '',
							userId: this.thread.userId || ''
						}
					}
					if (this.msg_for_share) {
						this.sharingMessages.push({
							cForm: this.$CHAT_MSG_TYPE.TYPE_TEXT,
							text: this.msg_for_share,
							msg_for_share: true, // 转发留言
							data: {}
						})
						this.msg_for_share = ''
					}
					const tempSharingMessage = window._.assign([], this.sharingMessages)
					this.sizeTipMessage = []
					this.sharingMessages = tempSharingMessage.filter(item => {
						if (item.data) {
							if (item.fileSize && item.fileSize / (1024 * 1024) > this.clientFileMaxSize) {
								this.sizeTipMessage.push({
									name: item.fileName,
									size: this.$root.$options.filters.formatBytes(item.fileSize)
								})
								return false
							} else {
								return true
							}
						} else {
							return true
						}
					})
					if (this.sizeTipMessage.length) {
						this.sizeTipVisible = true
					}
					this.$store.dispatch('Chat/relayMessage', { messages: this.sharingMessages, groups, merge, serverFileExistList: this.serverFileExistList }).then(res => {
						// this.$message.success('转发成功')
						this.serverFileExistList = []
					}).catch(e => {
						this.serverFileExistList = []
						// this.$message.error(e.message)
					})
				}
			},
			hideUserPannel(e) {
				if (e && e.target.id == 'userAvatar_nav') {
					this.userContralPanel = !this.userContralPanel
					if (this.userContralPanel && this.$store.state.organizationPage) {
						this.$store.commit('setOrganizationPage', '')
					}
				} else if (this.userContralPanel) {
					this.userContralPanel = false
				}
			},
			closeImgCut() {
				this.imgCutPanel = false
			},
			getCutImg(file) { // 接收截图
				this.imgCutSpinning = true
				this.$utils.api.user.getUserInfo({ userId: this.accountInfo.userId }).get().then(res => {
					this.avatorParams.batchNo = res.data.userAvatarBatchNo
					this.avatorParams.base64 = file
					this.uploadAvator()
				}).catch((e) => {
					this.imgCutSpinning = false
				})
			},
			uploadAvator() { // 上传截图
				this.$utils.api.public.upload(this.avatorParams).get().then(res => {
					this.handleEditAvator(res.data.list[0])
				}).catch((e) => {
					this.imgCutSpinning = false
				})
			},
			handleEditAvator(data) { // 修改头像信息
				this.$utils.api.user.updateUserExtInfo({
					userAvatar: data.batchNo,
					opNo: this.avatorParams.opNo
				}).get().then(res => {
					this.imgCutSpinning = false
					this.accountInfo.userAvatar = data.url
					this.userHeaderImage = data.url
					Promise.all([
						this.$store.dispatch('User/set_accountInfo', this.accountInfo),
						this.$store.dispatch('User/update_info', { userId: this.accountInfo.userId, userAvatar: data.url })
					]).then(res => {
						this.imgCutPanel = false
						this.$store.dispatch('Chat/preUpdateThread', { userId: this.accountInfo.userId })
					})
				}).catch((e) => {
					this.imgCutSpinning = false
				})
			},
			userHeaderError() {
				this.userHeaderImage = geren
			},
			// 解密
			_RSAdencrypt(value, type) {
				if (!this.$store.state.User.secretKey) return ''
				if (value !== '' && value !== undefined) {
					if (type === 2) {
						if (!isEmail(value)) return this.$utils.jsencrypt.Aesdencrypt(value, this.$store.state.User.secretKey)
					} else {
						if (!isPhone(value) && !isCnPhone(value)) return this.$utils.jsencrypt.Aesdencrypt(value, this.$store.state.User.secretKey)
					}
				}
			},
			// 加密
			_RSAencrypt(value) {
				if (!this.$store.state.User.secretKey) return ''
				if (value) return this.$utils.jsencrypt.Aesencrypt(value, this.$store.state.User.secretKey)
			},
			async	getSettingConfigs() { // 校验代理配置+企管参数配置
				if (this.gettingApiUrlConfig) {
					return
				}	else if (!this.onlineCheck()) {
					return
				}
				this.gettingApiUrlConfig = true
				const	apiUrlConfig = await this.$utils.fun.getApiUrlConfig(true)
				console.log('代理配置：', apiUrlConfig)
				if (JSON.stringify(apiUrlConfig.currentConfig) != JSON.stringify(apiUrlConfig.newConfig)) {
					this.gettingApiUrlConfig = false
					this.$store.dispatch('Setting/set_showModal', 'refreshSysConfig')
					return
				}
				const	paramsConfig = JSON.stringify(this.$store.state.Setting.paramsConfig)
				const	organParamsConfig = JSON.stringify(this.$store.state.Setting.organParamsConfig)
				try {
					const res = await this.$store.dispatch('Setting/get_paramsConfig')
					const	noChangeParamsConfig = paramsConfig === JSON.stringify(Object.assign({}, this.$store.state.Setting.paramsConfig, res.data))
					const res1 = await this.$store.dispatch('Setting/get_organParamsConfig')
					const	noChangeOrganParamsConfig = organParamsConfig === JSON.stringify(Object.assign({}, this.$store.state.Setting.organParamsConfig, res1.data))
					if (noChangeParamsConfig || noChangeOrganParamsConfig) {
						this.$message.success(this.$t('common.getLatestConfigCompleted'))
					} else {
						this.$store.dispatch('Setting/set_showModal', 'refreshSysConfig')
					}
				} catch (e) {}
				this.gettingApiUrlConfig = false
			},
			goManageWebsite() {
				this.$utils.api.user.getEmpAccountInfo().get().then(async res => {
					console.log(1123, res)
					const	apiUrlConfig	=	await this.$utils.fun.getApiUrlConfig()
					const url = apiUrlConfig.currentConfig.emp_domain_url.indexOf('http') > -1 ? apiUrlConfig.currentConfig.emp_domain_url : 'https://' + apiUrlConfig.currentConfig.emp_domain_url
					const params = this.$utils.jsencrypt.RSAencrypt(`${res.data.account}||${res.data.organName}||${res.data.organCode}`, process.env.webConfig.publicWebKey)
					this.$utils.fun.openExternal(`${url}/login?code=${encodeURIComponent(params)}`)
				})
			},
			async	uploadLogs()	{
				if (this.uploadingLogs) {
					return
				}	else if (!this.onlineCheck()) {
					return
				}
				this.uploadingLogs = true
				// SDK日志上传---正常情况都会有日志---当前Promise的结果都以Resolve返回
				let	mainLogUploadRes = {}
				const	sdkLogUploadRes = await this.$utils.chatSdk.cUploadLog(this.$utils.fun.getGlobalByName('logsPath'))
				console.log('SDK日志上传结果:',	sdkLogUploadRes)
				if (sdkLogUploadRes.code == 0) mainLogUploadRes = await this.$utils.fun.uploadMainLog()
				console.log('JAVA日志上传结果:',	mainLogUploadRes)
				if (sdkLogUploadRes.code != 0)	{
					this.$message.error(sdkLogUploadRes.message)
				}	else if (mainLogUploadRes.code != 0)	{
					this.$message.error(mainLogUploadRes.message)
				}	else {
					this.$message.success(this.$t('common.uploadCompleted'))
				}
				this.uploadingLogs = false
			},
			uploadLogs1() {
				if (this.uploadingLogs) {
					return
				}	else if (!this.onlineCheck()) {
					return
				}
				this.uploadingLogs = true
				// 获取日志文件
				const	fs = require('fs')
				const path = require('path')
				const	today = this.$utils.time.formatTimestamp(+new Date(), 'Y-M-D')
				const	mainLogPath = path.join(this.$utils.fun.getGlobalByName('logsPath'), `${today}.main.log`)
				console.log('主线程日志地址:', mainLogPath)
				fs.readFile(mainLogPath, async(err, data) => {
					var	mainLogUploadRes, sdkLogUploadRes
					// 主线程日志上传
					if (data) {
						const file = new File([data], `${today}.main.log`)
						try {
							mainLogUploadRes = await this.uploadLogToJava(file)
							if (mainLogUploadRes && mainLogUploadRes.code != 0) {
								this.uploadingLogs = false
								return
							}
						} catch (e) {
							this.uploadingLogs = false
							return
						}
					}	else if (err) {
						console.log('没有主线程日志')
					}
					// SDK日志上传---正常情况都会有日志
					sdkLogUploadRes = await this.$utils.chatSdk.cUploadLog(this.$utils.fun.getGlobalByName('logsPath'))
					console.log('JAVA/SDK日志上传结果：', mainLogUploadRes, sdkLogUploadRes)
					if (sdkLogUploadRes.code == 0) {
						this.$message.success(this.$t('common.uploadCompleted'))
					}	else {
						this.$message.error(sdkLogUploadRes.message)
					}
					this.uploadingLogs = false
				})
			},
			async	uploadLogToJava(file) {
				const	{ api_url, ...headers }	=	await	this.$utils.fun.getHeaders()
				const	axios = require('axios')
				const	fetch = axios.create({
					headers,
					timeout: 30000,
					validateStatus: function(status) {
						return true
					}
				})
				fetch.interceptors.request.use(config => {
					if (Object.prototype.toString.call(config.data) != '[object FormData]') {
						const	querystring = require('querystring')
						config.data = querystring.stringify(config.data)
					}
					return config
				})
				fetch.interceptors.response.use(response => {
					return response.data
				})

				const	uploadFileParams = {
					category: 'log_upload',
					batchNo: '',
					opNo: +new Date(),
					file,
					userId:	this.accountInfo.userId
				}
				const uploadFileFormdata = new FormData()
				for (const key in uploadFileParams) {
					uploadFileFormdata.append(key, uploadFileParams[key])
				}
				// 日志文件上传
				const	uploadFileRes = await	fetch.post(`${api_url}/public/file/upload`, uploadFileFormdata)
				if (uploadFileRes.code != 0) {
					this.$message.error(uploadFileRes.message)
					return uploadFileRes
				}
				// 日志记录上传
				const	config = {
					deviceType: this.$WEB_CONFIG.client_type == 21 ? '4' : '3', // 设备类型 1-Android 2-IOS 3-Windows 4-MacOS 5-Web
					logType: '4', // log类型 1-崩溃 2-网络错误 3-SDK请求错误 4-客户端异常
					netType: '3', // 网络状态 0-未知 1-无网络 2-WWAN 3-WIFI
					runState: '0', // 前后台状态 0-前台 1-后台
					appVersion: this.$WEB_CONFIG.VERSION, // 应用版本
					deviceBrand: '无', // 设备厂商
					deviceModel: navigator.userAgent, // 设备机型
					deviceSystem: '无', // 设备系统版本
					occurTime: this.$utils.time.formatTimestamp(+new Date(), 'Y-M-D h:m:s'),
					content: uploadFileRes.data && uploadFileRes.data.list[0].url
				}
				return (await this.$utils.api.public.pcLogUpload(config).get())
			},
			headerDbClick() {
				if (this.isWinMax) {
					this.$utils.currentWindow.unMax()
					this.isWinMax = false
				} else {
					this.$utils.currentWindow.max()
					this.isWinMax = true
				}
			},
			clearOnlineStateInt() {
				if (onlineStateTimer) {
					clearInterval(onlineStateTimer)
					onlineStateTimer = null
				}
			},
			loopUserOnlineState(router, fromModal = false) { // 特定用户在线状态轮询---fromModal：来自弹框
				this.clearOnlineStateInt()
				let userIds = []
				if (fromModal || router.path.indexOf('/addressBook/myFriends') > -1) {
					// 弹框/我的好友页面
					userIds = this.$store.getters['MyFriend/list']
				// } else if (router.params.id && router.path.indexOf('/chat') > -1) {
				// 	// 聊天页面--群聊、单聊
				// 	const chatId = router.params.id
				} else if (router.path.indexOf('/chat') > -1) {
					const chatId = this.$store.state.Chat.currentThreadID
					const chatInfo = this.$store.getters['Chat/someThread'](chatId)
					if (chatInfo && chatInfo.type != 10001) {
						userIds =
							chatInfo.type != 0
								? this.$store.getters['MyGrounp/groupUsers'](chatId)
								: this.$store.getters['MyFriend/getFriend']({ groupId: chatId })
					}
				}
				if (!userIds.length) return	false
				userIds = userIds.map(item => item.userId)
				onlineStateTimer = setInterval(() => {
					if (this.switchingOrgan === 'switching') return
					if (!this.isOnline) return
					if (!this.$store.state.User.accountInfo.token) return
					this.$utils.api.user
						.loopUserOnlineState({ userIds: userIds.join('|'), custError: true })
						.get().then(res => {
							userIds.forEach(userId => { // userId/onlineTime/onlineState---不返回或onlineState等于0表示离线-2020.5.26接口调整
								const onlineInfo = res.data.find(item => item.userId == userId) || { userId, onlineState: '0' }
								const userInfo = this.$store.getters['User/userInfo'](userId)
								if (userInfo.onlineState != onlineInfo.onlineState) {
									this.$store.dispatch('User/update_info', onlineInfo)
								}
							})
						}).catch(e => {
							if (e.code === 604) {
								this.clearOnlineStateInt()
								this.$utils.fun.openUpdateWin(e)
							}
						})
				}, 10000)
			},
			sleep(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			},

			// 创建更新窗口
			openAboutWin() {
				if (this.onlineCheck()) {
					this.$utils.fun.createWin({ action: 'openAboutWin' })
				}
			},

			_exitChat() {
				this.$store.dispatch('Setting/set_pageLoading', this.$t('common.exiting') + '...')
				this.exitModal = false
				if (this.$store.state.Setting.sysConfig.autoLogin) {
					// 如果是自动登录，则直接退出应用
					this.$utils.fun.exitChat()
				} else {
					// 如果不是自动登录，则先调用注销接口再退出应用
					this.$utils.api.user
						.logout()
						.get()
						.then(async res => {
							await this.$utils.fun.logout()
							this.$store.commit('initState')
							await this.$utils.fun.exitChat({ sendNotice: false })
							this.$store.dispatch('Setting/set_pageLoading', '')
						})
						.catch(e => {
							this.$store.dispatch('Setting/set_pageLoading', '')
							if (e.code == 899999) { this.$utils.fun.exitChat({ sendNotice: false }) }
						})
				}
			},

			_logout() {
				this.$store.dispatch('Setting/set_pageLoading', this.$t('common.switchAccount') + '...')
				this.exitLoginModal = false
				this.$utils.api.user
					.logout()
					.get()
					.then(async res => {
						this.$store.dispatch('Setting/set_autoLogin', false)
						this.$store.dispatch('Setting/set_pageLoading', '')
						await this.$utils.fun.logout()
						this.$store.commit('initState')
						setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
					})
					.catch(e => {
						this.$store.dispatch('Setting/set_pageLoading', '')
						if (e.code == 899999) { this.$utils.fun.exitChat({ sendNotice: false }) }
						if (e.code == 800506) { this.clearOnlineStateInt() }
					})
			},

			openRealVideo() {
				this.$utils.fun.createWin({ action: 'openRealVideoWin', params: {}})
			},

			max() {
				if (this.$utils.currentWindow.isMax()) {
					this.$utils.currentWindow.unMax()
					this.isMax = false
				} else {
					this.$utils.currentWindow.max()
					this.isMax = true
				}
			},

			// 是否消息通知音
			noticesound() {
				this.allsetting.openSounds = !this.allsetting.openSounds
				this.updatasetting.openSounds = this.allsetting.openSounds ? '1' : '0'
				this.$utils.api.user
					.update(this.updatasetting)
					.get()
					.then(res => {})
			},

			// 是否开启桌面通知
			noticedesk() {
				this.allsetting.allowNotice = !this.allsetting.allowNotice
				this.updatasetting.allowNotice = this.allsetting.allowNotice ? '1' : '0'
				this.$utils.api.user
					.update(this.updatasetting)
					.get()
					.then(res => {})
			},

			// 修改添加我的方式
			addmymethod(value) {
				if (value == 1) {
					this.addparams.addMeTypeByAaChatId == 0
						? (this.addparams.addMeTypeByAaChatId = true)
						: (this.addparams.addMeTypeByAaChatId = false)
				} else if (value == 2) {
					this.addparams.addMeTypeByMoblie = !this.addparams.addMeTypeByMoblie
				} else if (value == 3) {
					this.addparams.addMeTypeByEmail = !this.addparams.addMeTypeByEmail
				} else {
					this.addparams.addMeTypeByQrCode = !this.addparams.addMeTypeByQrCode
				}
				const addmeparams = {
					addMeTypeByAaChatId: Number(this.addparams.addMeTypeByAaChatId) ? 1 : 0,
					addMeTypeByMoblie: this.addparams.addMeTypeByMoblie ? 1 : 0,
					addMeTypeByEmail: this.addparams.addMeTypeByEmail ? 1 : 0,
					addMeTypeByQrCode: this.addparams.addMeTypeByQrCode ? 1 : 0
				}
				this.$utils.api.user
					.update(addmeparams)
					.get()
					.then(res => {})
			},

			async handleChangeLang(lang) {
				setLang(lang)
				// 获取禁言时间字典
				const banned_time_dict = (await this.$utils.api.public.getOneDicts({ dictType: 'banned_time' }).get()).data
				if (banned_time_dict) {
					this.$store.commit('Chat/updateBannedTimeDict', banned_time_dict)
				}
				// 更新用户信息（工作状态等）
				const newUserInfo = (await this.$utils.api.user.getUserInfo().get()).data
				await this.$store.dispatch('User/update_info', newUserInfo)
				await this.$store.dispatch('User/set_accountInfo', newUserInfo)
				await this.$store.dispatch('Chat/preUpdateThread', { userId: `${this.$store.state.User.accountInfo.userId}` })
			},

			reflushDeleteChatConfirm() {
				this.isReflushDeleteChatConfirm = false
				this.$nextTick(() => {
					this.isReflushDeleteChatConfirm = true
				})
			},

			opensystemset() {
				this.showsystemset = true
				this.$utils.api.user
					.getUserInfo()
					.get()
					.then(res => {
						this.allmyuserinfo = res.data
						this.yanzparams.areaCode = this.allmyuserinfo.areaCode || '+86'
					})
			},

			modalDeleteContainer() {
				const container = this.$store.state.OPcomponent.deleteChatConfirm
					.container
				return container ? document.getElementById(container) : document.body
			},

			async handleDeleteChat() {
				try {
					const deleteId = this.$store.state.OPcomponent.deleteChatConfirm
						.deleteId
					if (deleteId) {
						await this.$store.dispatch('Chat/clearMsg', { threadID: deleteId })
						this.exitDeleteChatConfirm()
					}
				} catch (e) {}
			},

			exitDeleteChatConfirm() {
				this.$store.dispatch('OPcomponent/set_deleteChatConfirm', {})
			},

			showUserCard() {
				this.$store.dispatch('OPcomponent/set_userCard', {
					userId: this.allmyuserinfo.userId
				})
			},

			macMin() {
				if (this.isMax) return
				this.$utils.currentWindow.min()
			},

			macScreen() {
				this.isMax = this.$utils.currentWindow.isFullScreen()
				this.$utils.currentWindow.setFullScreen(!this.isMax)
				this.isMax = this.$utils.currentWindow.isFullScreen()
			},

			macHide() {
				let time = 100
				if (this.isMax) {
					this.macScreen()
					time = 500
				}
				setTimeout(() => {
					this.$utils.currentWindow.hide()
				}, time)
			},

			windowsVisibility() {
				const isVisible = !document.hidden
				console.log('isVisible::::', isVisible)
				this.$store.dispatch('Setting/set_windowsVisibility', isVisible)
				this.$utils.fun.windowsVisibility(isVisible)
			},

			// 换绑弹窗
			changetie(value, value2) {
				this.showsystemset = false
				value == 1 ? (this.changeties = true) : (this.surechangeties = true)
				value2 == 1 ? (this.phoneoremail = true) : (this.phoneoremail = false)
			},

			surechange() {
				this.changeties = false
				this.surechangeties = true
			},

			showhowaddtome() {
				this.$utils.api.user
					.detail()
					.get()
					.then(res => {
						//          this.allsetting = Object.assign({}, res.data);
						this.addparams = Object.assign({}, res.data)
						this.showaddtome = true
						this.showsystemset = false
					})
			},

			// 返回
			go_back(value) {
				this.changeties = false
				this.privatemanage = false
				this.showaddtome = false
				this.showsystemset = true
			},

			// 区号
			_selectResault(value) {
				this.yanzparams.areaCode = value
				this.checkParams.areaCode = value
				this.codeParams.areaCode = value
				if (value === '+86') {
					if (isCnPhone(this.yanzparams.account)) {
						timer['getCode'] ? this.isDisabledGetCode = true : this.isDisabledGetCode = false
						this.yanzparams.validateCode ? this.issureclick = false : this.issureclick = true
					} else {
						this.isDisabledGetCode = true
						this.issureclick = true
					}
				} else {
					timer['getCode'] ? this.isDisabledGetCode = true : this.isDisabledGetCode = false
				}
			},

			_validateAccount() {
				// 手机注册
				if (this.phoneoremail) {
					if (!this.yanzparams.account) {
						this.$message.error(this.$t('common.tipMobileEnter'))
						return
					} else {
						if (
							this.codeParams.areaCode === '+86' &&
							!isCnPhone(this.yanzparams.account)
						) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							return
						} else if (!isPhone(this.yanzparams.account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							return
						}
					}
				} else {
					//  邮箱注册
					if (!this.yanzparams.account) {
						this.$message.error(this.$t('common.tipEmailEnter'))
						this.isDisabledGetCode = true
						return
					} else {
						if (!isEmail(this.yanzparams.account)) {
							this.$message.error(this.$t('common.tipEmailFormatError'), 1)
							this.isDisabledGetCode = true
							return
						}
					}
				}
			},

			// 获取验证码
			_getCode() {
				this.getCodeBtnTextType = 2
				this.isGetting = true
				this.codeParams = {
					type: this.phoneoremail ? '6' : '7', // 6: 手机换绑; 7: 邮箱换绑
					areaCode: this.phoneoremail ? this.codeParams.areaCode : '',
					account: this.yanzparams.account
				}
				this.$utils.fun.waiting(1000).then(() => {
					this.$utils.api.public
						.getCode(this.codeParams)
						.get()
						.then(() => {
							this.isGetting = false
							this._countDown()
						})
						.catch(e => {
							this.isGetting = false
							this.getCodeBtnTextType = 1
						})
				})
			},

			_countDown() {
				this.isDisabledGetCode = true
				let time = 60
				this.getCodeBtnText = '60s'
				this.getCodeBtnTextType = 4
				timer['getCode'] = setInterval(() => {
					time--
					this.getCodeBtnText = time + 's'
					if (time === 0) {
						time = 0
						clearInterval(timer['getCode'])
						this.getCodeBtnTextType = 3
						this.isDisabledGetCode = false
					}
				}, 1000)
			},

			cancal() {
				this.surechangeties = false
				clearInterval(timer['getCode'])
				timer = []
				this.getCodeBtnTextType = 1
			},

			// 确认换绑
			async _submitInfo() {
				try {
					this.btnLoading = true
					const sysConfig = await this.$utils.fun.getSysConfig()
					this.yanzparams = {
						opType: this.phoneoremail ? '6' : '7', // 6: 手机换绑; 7: 邮箱换绑
						validateType: this.phoneoremail ? '6' : '7', // 6: 手机换绑; 7: 邮箱换绑
						areaCode: this.yanzparams.areaCode,
						account: this.yanzparams.account,
						validateCode: this.yanzparams.validateCode
					}
					this.checkParams = {
						type: this.phoneoremail ? '6' : '7', // 6: 手机换绑; 7: 邮箱换绑
						areaCode: this.yanzparams.areaCode,
						account: this.yanzparams.account,
						validateCode: this.yanzparams.validateCode
					}
					await this.$utils.api.public.checkCode(this.checkParams).get()
					await this.$utils.api.user
						.updateSecurityInfo(this.yanzparams)
						.get()
					if (this.phoneoremail) {
						this.$store.dispatch('User/update_info', {
							userId: this.accountInfo.userId,
							userMobile: this.yanzparams.account,
							areaCode: this.yanzparams.areaCode
						})
					} else {
						this.$store.dispatch('User/update_info', {
							userId: this.accountInfo.userId,
							userEmail: this.yanzparams.account
						})
					}
					this.btnLoading = false
					this.surechangeties = false
					clearInterval(timer['getCode'])
					this.getCodeBtnTextType = 1
					if (
						(sysConfig.loginType === '1' && this.phoneoremail) ||
						(!this.phoneoremail && sysConfig.loginType === '2')
					) {
						await this.$store.dispatch('Setting/set_sysConfig', {
							data: {
								areaCode: this.yanzparams.areaCode,
								loginName: this.yanzparams.account
							}
						})
					}
					await this.getuserinfo()
				} catch (e) {
					this.btnLoading = false
				}
			},

			showprivate() {
				this.showsystemset = false
				this.privatemanage = true
			},

			// 更换私钥
			async sureprivate() {
				try {
					this.changeKeyLoading = true
					const newKey = await this.$utils.api.user.updateSecretKey().get()
					//        this.privateval = newKey.data.secretKey;
					this.$store.dispatch(
						'User/set_accountInfo',
						Object.assign({}, this.accountInfo, {
							secretKey: newKey.data.secretKey
						})
					)
					const serverKey = await this.$utils.api.thirdpart.queryAddress().get()
					await this.$utils.chatSdk.initChat(
						//          this.privateval,
						this.accountInfo.secretKey,
						serverKey.data.address,
						serverKey.data.public
					)
					this.shownowprivate = false
					this.changeKeyLoading = false
				} catch (e) {
					this.changeKeyLoading = false
				}
			},

			// 修改密码
			surechangepwass() {
				if (!isPassword(this.params.newPassword)) {
					this.$message.error(this.$t('changePwd.pwdTip'))
				} else {
					if (this.params.newPassword == this.params.newPasswordConfirm) {
						this.changepswLoading = true
						this.$utils.api.user
							.changePwd(this.params)
							.get()
							.then(res => {
								this.showchangepass = false
								this.changepswLoading = false
							}).catch(res => {
								this.changepswLoading = false
							})
					} else {
						this.$message.error(this.$t('changePwd.pwdErr1'))
						this.changepswLoading = false
					}
				}
			},

			cleardata() {
				this.btnLoading = false
				this.params.newPasswordConfirm = ''
				this.params.oldPassword = ''
				this.params.newPassword = ''
				this.yanzparams.account = ''
				this.yanzparams.validateCode = ''
				this.codeParams.areaCode = this.allmyuserinfo.areaCode
				clearInterval(timer['getCode'])
				timer = []
				this.getCodeBtnTextType = 1
			},

			showchangename(val) {
				val ? (this.changename = false) : (this.changename = true)
			},

			sendMSN() {
				// 发送消息
				this.showmyname = false
				this.$router.push(`/chat/${this.allmyuserinfo.userId}`)
			},

			doClose(next) {
				const data = window._.cloneDeep(this.$store.state.OPcomponent.userCard)
				data.userId = ''
				data.next = next || ''
				this.$store.dispatch('OPcomponent/set_userCard', data)
			},

			doAfterClose() {
				this.$store.dispatch('OPcomponent/set_userCard', {})
			},

			creatgroups() {
				this.$refs.son.addnewgroup = true
			},

			getuserinfo() {
				this.$utils.api.user
					.getUserInfo()
					.get()
					.then(res => {
						// console.log('res:',res.data)
						this.allmyuserinfo = res.data
					})
				//      this.$utils.sqlite.getAccountInfo().then(res => {
				//         console.log(res,111111111)
				//        this.allmyuserinfo = res.data;
				//      });
			},
			updatauserinfo() {}
		}
	}
</script>

<style lang="scss">
	#App_body {
		padding-left: 64px;
		background: #fff;
		width: 100%;
		height: 100%;
		position: fixed;
		left: 0;
		top: 0;
		box-sizing: border-box;
		&.web {
			max-width: 1000px;
			min-width: 800px;
			height: 100%;
			box-sizing: border-box;
			overflow: hidden;
			position: relative;
		}
		.windows-top-tool{
			height:30px;
			border-bottom: 1px solid #e6e6e6;
			-webkit-app-region: drag;
		}
		.user-menu{
			width: 245px;
			.menu{
				margin: 13px 20px 0 20px;
				height: 30px;
				display: flex;
				align-items: center;
			}
		}
		.user-control-panel{
			position: absolute;
			width: 244px;
			border-radius: 5px;
			box-shadow: 0 0 8px #ccc;
			top: 56px;
			left: 70px;
			background: #fff;
			z-index: 2;
			padding-bottom: 15px;
			.menu{
				margin: 15px 20px 0 20px;
				cursor: pointer;
				&:hover{
					color: #2E87FF;
				}
			}
			.line{
				height: 1px;
				margin: 15px 20px 0 20px;
				background: #e5e5e5;
			}
			.user-info{
				height: 136px;
				display: flex;
				position: relative;
				padding-top: 27px;
				@include retinize('userInfoBg');
				.user-img{
					width: 60px;
					height: 60px;
					border-radius: 50%;
					border: solid 2px #ccc;
					overflow:hidden;
					cursor: pointer;
					margin-left: 15px;
					position: relative;
					background: #fff;
					i{
						position: absolute;
						top:0;
						left:0;
						font-size: 28px;
						width:100%;
						height:100%;
						line-height: 60px;
						text-align: center;
						background:rgba(0,0,0,.5);
						color:#fff;
						visibility: hidden;
					}
					img{
						width: 56px;
						height: 56px;
					}
					&:hover i{
						visibility: visible;
					}
				}
				.user-txt{
					cursor: pointer;
					margin: 3px 15px 0 15px;
					color: #fff;
					font-size: 12px;
					font-weight: lighter;
					line-height: 160%;
					.name{
						font-size: 16px;
						display: flex;
						.iconfont{
							cursor: pointer;
							margin-left:5px;
						}
						div{
							margin: 0;
							max-width: 125px;
							white-space: nowrap;
							text-overflow: ellipsis;
							overflow: hidden;
							word-break: break-all;
							display: inline-block;
						}
					}
					.id, .organName{
						max-width: 120px;
						white-space: nowrap;
						text-overflow: ellipsis;
						overflow: hidden;
						word-break: break-all;
					}
				}
				.set-work-status{
					position: absolute;
					width:210px;
					left:17px;
					bottom:11px;
					color:#fff;
					font-size: 12px;
					line-height: 14px;
					display: flex;
					align-items: center;
					cursor: pointer;
					img{
						width:14px;
						height: 14px;
						margin-right: 8px;
					}
					span{
						flex:1;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					.icontianjia1{
						font-size:10px;
						width:14px;
						height:14px;
						background: #fff;
						color:#3395f9;
						border-radius: 50%;
						text-align: center;
						margin-right:8px;
					}
				}

			}
		}
	}
	.mac-btns {
		position: absolute;
		left: 0px;
		top: 0;
		width: 64px;
		height:45px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-around;
		background-color: $darkBlue;
		div {
			width: 12px;
			height: 12px;
			border-radius: 50%;
			font-size: 18px;
			display: flex;
			align-items: center;
			justify-content: center;
			&:nth-child(1) {
				background: #fc615d;
				color: #fc615d;
				font-size: 17px;
				padding-left: 1px;
			}
			&:nth-child(2) {
				background: #fdbc40;
				color: #fdbc40;
			}
			&:nth-child(3) {
				background: #34c749;
				color: #34c749;
			}
			&.disable {
				background: #cfcfcf;
			}
		}
		&:hover {
			div {
				color: #333;
			}
		}
	}

	#app_nav {
		position: absolute;
		left: 0;
		top: 0;
		width: 64px;
		height: 100%;
		background-color: $darkBlue;
		-webkit-app-region: drag;
		border-radius: 4px 0px 0px 4px;
		padding-bottom:124px;
		overflow: hidden;

		.navs {
			padding-top: 60px;
			display: flex;
			flex-direction: column;
			align-items: center;
			transition: transform .3s ease-out;
			&.scroll-out{
				transform: translateY(-100%);
			}
			.userAvatar{
				display: block;
				width: 36px;
				height: 36px;
				margin-bottom: 18px;
				border: 2px solid #fff;
				border-radius: 50%;
				cursor: pointer;
				background:#fff;
				-webkit-app-region: no-drag;
			}
			&>a {
				-webkit-app-region: no-drag;
				cursor: pointer;
				margin-bottom: 20px;
				color: rgba(255, 255, 255, 0.6);
				text-align: center;

				.tab-icon{
					position: relative;
					margin:0 auto;
					width:26px;
					height: 26px;
					background-position: center;
					background-size: contain;
					&.message{
						background-image: url('~@/assets/img/tab-icon/message.png');
					}
					&.contact{
						background-image: url('~@/assets/img/tab-icon/contact.png');
					}
					&.document{
						background-image: url('~@/assets/img/tab-icon/document.png');
					}
					&.favorite{
						background-image: url('~@/assets/img/tab-icon/favorite.png');
					}
				}

				&.active {
					color: #fff;
					.message{
						background-image: url('~@/assets/img/tab-icon/message_active.png');
					}
					.contact{
						background-image: url('~@/assets/img/tab-icon/contact_active.png');
					}
					.document{
						background-image: url('~@/assets/img/tab-icon/document_active.png');
					}
					.favorite{
						background-image: url('~@/assets/img/tab-icon/favorite_active.png');
					}
				}
				p {
					font-size: 12px;
					margin-bottom: 0px;
				}
				&>.iconfont {
					font-size: 26px;
					position: relative;
					display: table;
					margin: 0 auto 2px;
					&.icondianhua2{
						position: absolute;
						bottom:	40px;
					}
				}
			}
			.count {
				font-family: $fontFamily;
				position: absolute;
				right: -6px;
				color: #fff;
				font-size: 10px;
				padding: 0 4px;
				background-color: #ff3b30;
				display: inline-block;
				height: 15px;
				line-height: 15px;
				min-width: 15px;
				text-align: center;
				border-radius: 10px;
			}
		}

		.organ{
			width: 26px;
			height: 26px;
			line-height: 26px;
			background-color: rgba(51, 51, 51, 0.5);
			border-radius: 3px;
			color:#c1c1c1;
			text-align: center;
			margin-top: 13px;
			-webkit-app-region: no-drag!important;
			cursor: pointer;
			&.current{
				color:#fff;
				background-color: #0063e8;
			}
		}

		.arrow-up{
			position:absolute;
			top:-39px;
			left:50%;
			margin-left:-13px;
			.iconfont{
				font-size: 12px;
			}
		}

		.organs{
			position: absolute;
			width: 100%;
			bottom: 124px;
			display: flex;
			flex-direction: column;
			align-items: center;
			transition: transform .3s ease-out;
			&.scroll-out{
				transform: translateY(100%);
			}
		}

		.others{
			position: absolute;
			bottom: 0;
			width: 100%;
			max-height: 124px;
    		min-height: 83px;
			padding-bottom: 17px;
			background-color: $darkBlue;
			display: flex;
			flex-direction: column;
			align-items: center;

			.iconcebiangengduo{
				-webkit-app-region: no-drag;
				color: rgba(255, 255, 255, 0.6);
				font-size: 20px;
				margin-top: 8px;
				cursor: pointer;
			}
		}

	}

	#app_main {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid #E5E5E5;
		border-radius: 0px 4px 4px 0px;
		#app_content {
			flex: 1;
			overflow: hidden;
			position: relative;
		}
	}
	.all_setmodals {
		-webkit-app-region: no-drag;
		/deep/ .ant-modal-body {
			padding: 0;
		}
		input {
			&:focus {
				border: 1px solid #2e87ff !important;
				outline: none;
			}
		}
		.footers {
			padding-top: 20px;
			text-align: right;
			button {
				margin-left: 10px;
			}
		}
		.title {
			clear: both;
			height: 39px;
			background: #f1f2f5;
			padding: 0px 29px;
			border-radius: 4px 4px 0 0;
			-webkit-app-region: drag;
			span {
				cursor: pointer;
			}
			h2 {
				font-size: 16px;
				font-weight: 400;
				float: left;
				line-height: 39px;
				span {
					margin-right: 5px;
					margin-left: -5px;
				}
			}
			.icontongyongguanbi {
				-webkit-app-region: no-drag;
				float: right;
				color: #999999;
				font-size: 12px;
				line-height: 39px;
			}
		}
		.content {
			clear: both;
			padding: 10px 30px;
			color: #333333;
			.the_notice {
				h2 {
					font-size: 18px;
					font-weight: bold;
					margin-bottom: 10px;
					margin-top: 30px;
					&:first-child{
						margin-top: 0;
					}
				}
				.the_item {
					clear: both;
					font-size: 14px;
					margin-bottom: 15px;
					display: flex;
					width: 100%;
					align-items: center;
					justify-content: space-between;
					.item2 {
						float: right;
						cursor: pointer;
						color: #999999;
						& > span {
							color: #2e87ff;
							text-align: right;
							display: inline-block;
							margin-left: 10px;
						}
					}
				}
			}
		}
		.phoneandemail {
			text-align: center;
			.images {
				img {
					width: 253px;
					height: 194px;
				}
			}
			p {
				font-size: 16px;
			}
			.phonebtn {
				margin-top: 28px;
				margin-bottom: 43px;
				button {
					padding: 10px 12px;
					font-size: 14px;
					border: 1px solid #e6e6e6;
					border-radius: 4px;
					cursor: pointer;
					color: #999999;
					&:focus {
						outline: none;
						border: 1px solid #2e87ff;
					}
				}
			}
		}
		.private {
			text-align: center;
			img {
				width: 157px;
				height: 153px;
			}
			p {
				margin: 23px 0px;
				font-size: 18px;
				&:nth-of-type(1) {
					font-weight: bold;
					margin-top: 10px;
				}
				&:nth-of-type(2) {
					padding: 12px 60px;
					border: 1px solid #e5e5e5;
					border-radius: 4px;
				}
				&:nth-of-type(3) {
					font-size: 14px;
				}
				&:nth-of-type(4) {
					font-size: 12px;
					color: #999999;
					margin-top: 38px;
				}
			}
		}
		.surechangetie {
			.search-box {
				input {
					&:focus {
						border: none !important;
					}
				}
			}
			.form {
				.select-wrapper::after {
					width: 0px;
				}
				.select-wrapper {
					width: 60px;
				}
				.select-tmp {
					width: 60px;
				}
				h2 {
					font-size: 14px;
					margin-top: 20px;
				}
				margin-top: 60px;
				width: 380px;
				padding-left: 30px;
				/deep/ .ant-btn {
					width: 94px;
					height: 34px;
					padding: 0 5px;
					span {
						font-size: 12px;
						line-height: 24px;
					}
				}
				.form-item {
					position: relative;
					display: flex;
					align-items: center;
					height: 42px;
					&.special {
						display: flex;
						justify-content: space-between;
						align-items: center;
						border: 0;
					}
					input::-webkit-input-placeholder {
						color: #999;
						font-size: 12px;
					}
					input {
						overflow: hidden;
						display: block;
						width: 100%;
						height: 40px;
						margin-top: 1px;
						font-size: 14px;
						color: #333;
						border: 0;
						&:focus {
							outline: none !important;
						}
					}
					.shuru {
						height: 34px;
						border: 1px solid #e6e6e6;
						border-radius: 4px;
						padding-left: 13px;
					}
				}
				.sure {
					margin-top: 45px;
					margin-bottom: 58px;
					width: 70px;
					height: 34px;
				}
				.sure1 {
					margin-left: 194px;
					margin-right: 12px;
				}
			}
		}
		.changemima {
			clear: both;
			padding: 30px;
			input::-webkit-input-placeholder {
				font-size: 12px;
			}
			input {
				width: 100%;
				border: 1px solid #e6e6e6;
				border-radius: 4px;
				padding: 10px;
			}
			h2 {
				margin: 20px 0px 10px 0px;
				&:first-of-type {
					margin-top: 0px;
				}
			}
			.sure {
				width: 70px;
				height: 34px;
				margin-top: 30px;
			}
			.sure1 {
				margin-left: 194px;
				/*color: #FFFFFF;*/
				margin-right: 12px;
			}
		}
	}
	.aboutaa {
		/deep/ .ant-modal-body {
			padding: 0px 0px 24px 0px;
			text-align: center;
		}
		.icontongyongguanbi {
			float: right;
			margin: 10px 10px 0px 0px;
			cursor: pointer;
		}
		p {
			font-size: 12px;
		}
		.updatabanner {
			clear: both;
			width: 420px;
			height: 148px;
			position: relative;
			margin-bottom: 24px;
			/*background-image: url("~@/assets/img/beijing.png") no-repeat center center;*/
			.bannimg {
				width: 420px;
				height: 148px;
				/*float: left;*/
			}
			.about-content {
				position: absolute;
				top: 15px;
				left: 152px;
				text-align: center;
				img {
					height: 64px;
					width: 64px;
				}
				p {
					margin: 0px;
					&:nth-of-type(1) {
						font-size: 34px;
						font-weight: bold;
					}
				}
			}
		}
		.checkup {
			color: #000000;
			margin: 28px 0px 12px 0px;
		}
		.checkup1 {
			cursor: pointer;
			color: #3395f9;
			margin: 0px;
		}
	}
	.myname {
		/deep/ .ant-modal-body {
			padding: 28px 39px;
		}
		.firsttop {
			.leftname {
				float: left;
				font-size: 20px;
				font-weight: bold;
				margin-top: 18px;
				span {
					font-size: 15px;
					color: #999999;
					cursor: pointer;
				}
				input {
					font-size: 18px;
					font-weight: 400;
					width: 180px;
				}
			}
			.rightimg {
				float: right;
				margin-bottom: 24px;
				img {
					width: 64px;
					height: 64px;
					border-radius: 50%;
				}
			}
		}
		.secondcontent {
			clear: both;
			border-top: 1px solid #e6e6e6;
			h2 {
				font-size: 16px;
				font-weight: bold;
				margin: 20px 0px 37px 0px;
			}
			p {
				font-size: 14px;
				color: #999999;
				span {
					color: #333333;
					margin-left: 59px;
				}
				&:last-of-type {
					margin-bottom: 50px;
				}
			}
		}
	}
	.ant-dropdown{
		z-index: 1000 !important;
	}
	.moreOperation{
		&.ant-popover{
			.ant-popover-inner-content{
				padding: 5px 15px;
				.opration-item{
					cursor: pointer;
					height: 40px;
					line-height: 40px;
					border-bottom: $border;
					.iconfont{
						display: inline-block;
						margin-right: 4px;
						position: relative;
						top: 1px;
						@keyframes spin {
							from {
								transform: rotate(0deg);
							}
							to {
								transform: rotate(360deg);
							}
						}
						&.iconshuaxin1{
							animation: spin 0.6s linear infinite;
						}
					}
					&:hover{
						color:$darkBlue;
					}
					&:last-child{border: none;}
				}
			}
		}
	}
</style>
