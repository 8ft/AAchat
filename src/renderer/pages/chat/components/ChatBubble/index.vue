<template>
	<div
		v-if="message.id&&message.status!=3"
		:id="`${message.cForm===53?'tip':'msg'}${message.id}`"
		:origin-id="message.originID"
		:class="{chatBubble:true,'selectable': selectable&&message.cForm!=53, 'selected': isChecked,'twinkle':twinkle}"
		:form="message.cForm"
		:file-load-err="fileLoadErr"
	>
		<!--时间-->
		<div
			class="bubble-tip time"
			v-if="autoUpdate&&isKeyTime"
			@mousedown="mouseHandle"
			@mousemove="mouseHandle"
			@mouseup="mouseHandle"
			@mouseleave="mouseHandle"
			@contextmenu="e => e.preventDefault()"
		>
			{{$utils.time.formatForDetail($utils.time.formatTimestamp(message.timestamp,'Y/M/D h:m:s'))}}
		</div>

		<!--提示-->
		<div
			class="bubble-tip"
			v-if="message.cForm===53"
			@mousedown="mouseHandle"
			@mousemove="mouseHandle"
			@mouseup="mouseHandle"
			@mouseleave="mouseHandle"
			@contextmenu="e => e.preventDefault()"
		>
			{{message.text}}
			<span v-if="message.mType==='tip_notMyFriend'" @click="$emit('make-friend')">{{$t('common.confirmNow')}}</span>
			<span v-if="message.mType==='tip_withdraw'&&message.data&&message.data.editable" @click="reEdit">{{$t('chat.reEdit')}}</span>
		</div>
		<!--聊天泡泡-->
		<div
			v-if="visibleMsgType.includes(message.cForm)"
			:class="{'bubble':true,'send':message.isSend,'get':!message.isSend,'burn-after-read':message.burntAfterRead==1,triggered:message.triggered}"
		>
			<div class="checkbox" v-if="message.cForm !=53">
				<a-checkbox :checked="isChecked"></a-checkbox>
			</div>

			<div class="bubble-body">
				<div
					v-if="message.isAnoymous==1"
					class="avatar"
					:style="`background:${$utils.message.getAvatarBgColor(senderInfo.name)};`"
					@click="showUserInfo"
				>
					{{$utils.message.getAvatarText(senderInfo.name)}}
				</div>

				<!--头像-->
				<img
					ref="userAvatar"
					v-else
					:class="{avatar:true,notify:message.threadID=='notify','avatarLoadFinish': avatarLoadFinish}"
					@click="showUserInfo"
					@load="avatarLoadSucc"
					:src="message.threadType==10001&&message.threadID=='notify'?notifyIcon:senderInfo.avatar"
					@error="avatarLoadError"
				/>

				<!--消息-->
				<div class="message-body">
					<div
						:class="{unreadCount:true,allRead:message.unreadCount==0,clickable:message.threadType==1&&message.unreadCount>0,disabled:selectable}"
						v-if="!chatToMyself&&!isMsg_newFriend&&message.isSend==1"
						v-show="message.status==1&&message.unreadCount!==undefined"
						@click="_showReadStatus"
					>
						{{unreadText}}
					</div>

					<!--loading-->
					<div v-if="message.isSend&&message.status===0">
						<a-spin class="loading" size="small" />
						<!--<span v-show="showQueueText" style="display: none">
							发送排队中
						</span>-->
					</div>

					<!--状态 0:发送中 1:发送成功 2:发送失败 3:暂不显示-->
					<a-tooltip placement="top" :title="$t('common.resend')" v-if="message.isSend&&message.status===2">
						<i class="iconfont iconfasongshibai status" @click="_resend"></i>
					</a-tooltip>

					<!--昵称-->
					<div class="nickName" v-show="message.threadType!=0&&!message.isSend">
						{{senderInfo.name}}
					</div>

					<a-dropdown
						:id="message.id"
						@visibleChange="changeVisible"
						:getPopupContainer="()=>$parent.$vnode.elm"
						:trigger="!hasContextmenu?[]:['contextmenu']"
						overlayClassName="bubble-right-menu"
					>
						<!--回复信息-->
						<div
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_REPLY"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							@click.stop="_trigger"
							:class="{message:true, reply:!isUnreadBurntAfterReadMsg,text:isUnreadBurntAfterReadMsg}"
							@contextmenu.prevent="resetMouseRight"
						>
							<template v-if="isUnreadBurntAfterReadMsg">
								<span>{{$t('chat.burnAfterReading')}}</span><i class="iconfont iconyuehoujifenkaiqi"></i>
							</template>

							<template v-else>
								<div class="target-info" style="display: table" @click.stop="previewFile(message.replyInfo)">
									<div class="target-sender">
										{{replyTargetName}}
									</div>

									<div v-if="![$CHAT_MSG_TYPE.TYPE_IMAGE,$CHAT_MSG_TYPE.TYPE_EMOJI,$CHAT_MSG_TYPE.TYPE_VIDEO].includes(message.replyInfo.form)" class="target-content">
										<div v-if="message.replyInfo.mType === 'link'">
											[{{$t('common.link')}}] <a @click.stop="$utils.fun.openExternal(message.replyInfo.shareLink)">{{message.replyInfo.webTitle || message.replyInfo.shareLink}}</a>
										</div>
										<div v-else-if="message.replyInfo.form == $CHAT_MSG_TYPE.TYPE_FILE">
											[{{$t('common.file')}}] {{message.replyInfo.fileName}}
										</div>
										<div v-else ref="target_info"></div>
									</div>

									<div v-if="[$CHAT_MSG_TYPE.TYPE_IMAGE,$CHAT_MSG_TYPE.TYPE_EMOJI].includes(message.replyInfo.form)" class="target-content">
										<a-spin :spinning="!imageDownloadFinish && message.replyInfo.id.length > 16" class="loading-class">
											<div :style="`width: ${containerWidth}px; height:${containerHeight}px;max-width:320px;overflow:hidden;`">
												<file-load-error :hasRetryBtn="true" @retry="imageReload" v-if="fileLoadErr" :form="message.replyInfo.form" />
												<img
													v-else
													v-show="imageLoadFinish"
													@load="imageLoad"
													@click.stop="openImagePlayer"
													:style="`width: ${imageWidth}px; height:${imageHeight}px;`"
													:src="fileLocalPath"
													@error="fileLoadError"
												/>
											</div>
										</a-spin>
									</div>

									<div v-if="message.replyInfo.form==$CHAT_MSG_TYPE.TYPE_VIDEO" class="target-content">
										<div class="message videoFile">
											<span :style="`width: ${containerWidth}px; height:${containerHeight}px;`">
												<div class="video-mask" v-if="!fileLoadErr">
													<div class="video-info">
														<div class="progress" v-show="message.replyInfo.sendProgress !== undefined && message.replyInfo.sendProgress !== 100">
															<a-progress class="circle" type="circle" :strokeWidth="8" strokeColor="#7AE597" :percent="message.replyInfo.sendProgress" :width="28" status="exception" />
															<div class="cancel iconfont iconcuo" @click.stop="abortDownloadFile"></div>
														</div>
														<div class="video-info-name" :title="message.replyInfo.fileName">{{message.replyInfo.fileName}}</div>
														{{message.replyInfo.fileSize | formatBytes}}<p>{{message.replyInfo.downloadRate}}</p>
													</div>
													<div v-if="!message.replyInfo.localPath && (message.replyInfo.sendProgress === undefined || message.replyInfo.sendProgress === 100)" class="download" @click.stop="downloadVideo(true)">
														<div class="download-btn iconfont iconxiazai3" style="bottom: 14px;"></div>
													</div>
													<div v-if="message.replyInfo.localPath" class="play iconfont iconshipin-1" @click.stop="openVideoPlayer"></div>
												</div>
												<!--<div
													:style="`width: ${containerWidth}px; height:${containerHeight}px;overflow:hidden`"
												>
													<file-load-error v-if="fileLoadErr" :form="message.cForm" />
													<video
														:width="containerWidth"
														:height="containerHeight"
														:src="fileLocalPath"
														@error="fileLoadError"
														v-if="!fileLoadErr"
													>
													</video>
												</div>-->
												<div class="video-bg" :style="`width: ${containerWidth}px; height:${containerHeight}px;overflow:hidden`">
													<file-load-error style="position: absolute" v-if="fileLoadErr" :form="message.replyInfo.form" background-color="rgba(0,0,0,.7)" />
													<img
														v-show="imageLoadFinish"
														v-if="!fileLoadErr"
														@load="imageLoad"
														:style="`width: ${imageWidth}px; height:${imageHeight}px;`"
														@error="fileLoadError"
														:src="fileLocalPath"
													/>
												</div>
											</span>
										</div>
									</div>
								</div>

								<div class="reply-content" ref="reply_content"></div>

								<div v-if="isAtMe&& !(repliable == false || message.isAnoymous == 1 ||message.burntAfterRead == 1) " class="reply-btn" @click.stop="_reply">
									{{$t('common.reply')}}
								</div>

								<i class="iconfont iconyuehoujifenkaiqi"></i>
							</template>
						</div>

						<!-- 地理位置 -->
						<div
							v-if="message.cForm==$CHAT_MSG_TYPE.TYPE_LOCATION"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							class="message text"
							@contextmenu.prevent="resetMouseRight"
						>
							<div>{{/@/.test(message.threadID)?$t('location.name'):message.text}}</div>
						</div>

						<!--文字信息-->
						<div
							v-if="[$CHAT_MSG_TYPE.TYPE_TEXT,78].includes(message.cForm)&&(!message.mType || message.mType === 'link')"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							@click="_trigger"
							:class="{message:true,text: message.mType !== 'link', 'link-message': message.mType === 'link'}"
							@contextmenu.prevent="resetMouseRight"
						>
							<template v-if="message.mType === 'link'">
								<div>
									<div v-if="message.data.webTitle || message.data.webDescription" style="border-bottom: 1px solid #e6e6e6;padding-bottom: 8px;	margin-bottom: 7px;">
										<div v-if="message.data.webTitle" v-html="message.data.webTitle" @click="$utils.fun.openExternal(message.data.shareLink)" class="link-message-title" target="_blank" :title="message.data.webTitle">
										</div>
										<div v-if="message.data.webDescription" class="link-message-description" :title="message.data.webDescription" v-html="message.data.webDescription">
										</div>
									</div>
									<div>
										<div :title="$t('common.copy')" class="iconfont iconfuzhi" style="color: #666; margin-top: 1px; cursor: pointer; float: right" @click="copy"></div>
										<div class="link-message-link">
											<span style="cursor: pointer" @click="$utils.fun.openExternal(message.data.shareLink || message.text)" :title="message.data.shareLink || message.text">{{message.data.shareLink || message.text}}</span>
										</div>
									</div>
									<div class="get-web-loading" v-if="message.status === 5">
										{{$t('common.identifyLink')}}...
									</div>
									<i v-if="message.burntAfterRead==1" class="iconfont iconyuehoujifenkaiqi"></i>
								</div>
							</template>
							<template v-else>
								<div v-if="notifyTitle" class="notify-title">
									{{notifyTitle}}
								</div>
								<div ref="bubble_text"></div>
							</template>
						</div>
						<!--链接信息-->
						<!--<div
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_TEXT&&message.mType === 'link'"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							@click="_trigger"
							class="message link-message"
							@contextmenu.prevent="resetMouseRight"
						>
							<div v-if="message.data.webTitle" v-html="message.data.webTitle" @click="$utils.fun.openExternal(message.data.shareLink)" class="link-message-title" target="_blank" :title="message.data.webTitle">
							</div>
							<div v-if="message.data.webDescription" class="link-message-description" :title="message.data.webDescription" v-html="message.data.webDescription">
							</div>
							<div>
								<div class="iconfont iconfuzhi" style="margin-top: 1px; cursor: pointer; float: right"></div>
								<div class="link-message-link">
									<span style="cursor: pointer" @click="$utils.fun.openExternal(message.data.shareLink || message.text)" :title="message.data.shareLink || message.text">{{message.data.shareLink || message.text}}</span>
								</div>
							</div>
							<div class="get-web-loading" v-if="message.status === 5">
								链接识别中...
							</div>
							<i v-if="message.burntAfterRead==1" class="iconfont iconyuehoujifenkaiqi"></i>
						</div>-->

						<!-- 名片 -->
						<div
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_CARD"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							@click="_trigger"
							:class="{message:true,card:!isUnreadBurntAfterReadMsg,text:isUnreadBurntAfterReadMsg}"
							@contextmenu="(e)=>e.preventDefault()"
						>
							<template v-if="isUnreadBurntAfterReadMsg">
								<span>{{$t('chat.burnAfterReading')}}</span><i class="iconfont iconyuehoujifenkaiqi"></i>
							</template>
							<template v-else>
								<div class="info">
									<div class="pic">
										<img :src="message.data.userAvatar" @error="e => $utils.setDefaultAvatar(e, 0)" />
									</div>
									<div class="name">
										{{message.data.nickName}}
									</div>
								</div>
								<div class="line">
									{{$t('common.contactCard')}}
								</div>
								<i class="iconfont iconyuehoujifenkaiqi"></i>
							</template>
						</div>

						<!-- 笔记 -->
						<div
							v-if="message.cForm==$CHAT_MSG_TYPE.TYPE_NOTE"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							@click="_trigger"
							:class="{message:true,card:!isUnreadBurntAfterReadMsg,text:isUnreadBurntAfterReadMsg,note:true}"
							@contextmenu="(e)=>e.preventDefault()"
						>
							<template v-if="isUnreadBurntAfterReadMsg">
								<span>{{$t('chat.burnAfterReading')}}</span><i class="iconfont iconyuehoujifenkaiqi"></i>
							</template>
							<template v-else>
								<div class="info">
									<p class="note-txt" v-html="noteData.text"></p>
									<!-- <a-spin size="small" :spinning="noteData.hasImages && noteData.imgs.length === 0">
										<div class="note-imgs" v-if="noteData.hasImages">
											<template v-for="(img,index) in noteData.imgs">
												<img v-if="img" :src="img" :key="`noteImg_${index}`">
												<file-load-error
													v-if="!img"
													:key="`noteImg_${index}`"
													:form="$CHAT_MSG_TYPE.TYPE_IMAGE"
													width="45px"
													height="45px"
													:icon-size="24"
													:show-text="false"
													style="margin-right:12px;"
												/>
											</template>
										</div>
									</a-spin> -->
								</div>
								<div class="line">
									{{$t('common.note')}}
								</div>
								<i class="iconfont iconyuehoujifenkaiqi"></i>
							</template>
						</div>

						<!-- 聊天记录 -->
						<div
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_CHATRECORD"
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							@click="_trigger"
							:class="{message:true,'chat-records':!isUnreadBurntAfterReadMsg,text:isUnreadBurntAfterReadMsg}"
							@contextmenu="(e)=>e.preventDefault()"
							v-html="formatedMsg"
						></div>

						<!--语音信息-->
						<div
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_VOICE"
							:class="{message:true,voice:true,'no-play': message.triggered==0,burntAfterRead:message.isSend==0&&message.burntAfterRead==1}"
							:style="{width: fileLoadErr ? 'auto' : playerWidth, height: '43px'}"
							@click="_trigger"
						>
							<audio
								:src="fileLocalPath"
								:id="'play'+message.id"
								:ref="'play'+message.id"
								@error="fileLoadError"
								preload="load"
								@canplay="finishLoadVoice"
							></audio>
							<template v-if="!fileLoadErr">
								<span
									style="width: 20px;height: 23px; display: flex; align-items: center; margin-right: 5px; }"
									class="iconfont"
									:class="{'iconbofang--1': playTime === 1, 'iconbofang--': playTime === 2, 'iconbofang': playTime === 3}"
								></span>
								<span class="second" v-show="duration>0">{{duration}}''</span>
							</template>
							<template v-else>
								<span class="iconfont iconbofang"></span>
								{{$t('common.lostVoice')}}
							</template>

							<i v-if="message.burntAfterRead==1" class="iconfont iconyuehoujifenkaiqi"></i>
						</div>

						<!--语音通话-->
						<!--<div
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							class="realAudio"
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_REALAUDIO"
							:class="{message:true,'no-play': message.triggered==0}"
							@click="_trigger"
						>
							<span
								class="iconfont iconyuytonghua"
								style="margin-right: 5px;"
							></span>
							<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_END">通话结束<span style="padding-left: 10px">{{message.data.duration | timeMeter}}</span></span>
							&lt;!&ndash;发送方&ndash;&gt;
							<template v-if="message.isSend">
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_CANCEL">
									已取消<span class="btn">点击重拨</span>
								</span>
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_REJECT">
									对方已拒绝<span class="btn">点击重拨</span>
								</span>
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_BUSY">
									忙线无应答<span class="btn">点击重拨</span>
								</span>
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_TIMEOUT">
									对方无应答<span class="btn">点击重拨</span>
								</span>
							</template>
							<template v-else>
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_CANCEL">
									对方已取消
								</span>
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_REJECT">
									已拒绝<span class="btn">点击回拨</span>
								</span>
								<span v-if="message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_BUSY ||
									message.data.form === $CHAT_MSG_TYPE.TYPE_REALAUDIO_TIMEOUT"
								>
									未接通<span class="btn">点击回拨</span>
								</span>
							</template>
						</div>-->

						<!--图片信息-->
						<div
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							v-if="[$CHAT_MSG_TYPE.TYPE_IMAGE,$CHAT_MSG_TYPE.TYPE_EMOJI].includes(message.cForm)"
							:class="{
								message:true,
								pic:true,
								burntAfterRead:message.isSend==0&&message.burntAfterRead==1,
								triggered:message.triggered==1}"
						>
							<!--通过判断message.id的长度用于识别是发送中还是发送成功，用于优化界面显示效果，wuxl-->
							<a-spin :spinning="!imageDownloadFinish && message.id.length > 16" class="loading-class">
								<span :style="`width: ${containerWidth}px; height:${containerHeight}px;`">
									<div :style="`width: ${containerWidth}px; height:${containerHeight}px;overflow:hidden;`">
										<file-load-error :hasRetryBtn="true" @retry="imageReload" v-if="fileLoadErr" :form="message.cForm" />
										<img
											v-else-if="message.url || message.localPath"
											v-show="imageLoadFinish"
											@load="imageLoad"
											:style="`width: ${imageWidth}px; height:${imageHeight}px;cursor: pointer;`"
											:src="fileLocalPath"
											@click="openImagePlayer"
											@error="fileLoadError"
										/>
									</div>
								</span>

								<div
									class="watermark"
									v-if="!message.isSend&&message.burntAfterRead==1&&message.triggered==0&&!fileLoadErr"
									@click="_trigger"
								>
									<div class="iconfont icontupian"></div>
									<div class="tip">
										{{$t('chat.burnAfterReading')}}
									</div>
								</div>
							</a-spin>
							<i v-if="message.burntAfterRead==1" class="iconfont iconyuehoujifenkaiqi"></i>
						</div>

						<!--文件信息-->
						<div
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_FILE"
							:class="{message:true,file:true,burntAfterRead:message.isSend==0&&message.burntAfterRead==1,triggered:message.triggered==1}"
						>
							<div class="file-name-icon" @click="fileNameClick">
								<div class="icon" :class="message.ext"></div>
								<div class="file-name">
									<div class="name" :title="message.newFileName || message.fileName">
										{{message.newFileName || message.fileName}}
										<div ref="fileNameHack"></div>
									</div>
									<div class="size" :title="isFileNameTooLong ? message.ext.toUpperCase() : ''">
										{{message.fileSize | formatBytes}} {{isFileNameTooLong ? message.ext.toUpperCase() : ''}}
									</div>
								</div>
							</div>
							<div :class="{btns:true,disabled:selectable}" v-show="message.sendProgress === undefined || message.sendProgress === 100" v-if="message.burntAfterRead == 0">
								<!--<div class="readonlinebtn" v-if="hasServerFileExist && isSupportFileType && (message.sendProgress === undefined || message.sendProgress === 100)">
									<span style="cursor: pointer" @click="openFilePlayer">在线预览</span>
								</div>-->
								<div v-if="!fileLoadErr && message.localPath">
									<a-dropdown>
										<div style="display:table; margin:auto">
											{{$t('common.open')}}
											<a-icon type="down" />
										</div>
										<a-menu slot="overlay" @click="openFileMenu">
											<a-menu-item key="0">
												<a target="_blank" style="font-size:12px">{{$t('common.open')}}</a>
											</a-menu-item>
											<a-menu-item key="1">
												<a target="_blank" style="font-size:12px">{{$t('common.open')}} {{$t('common.folder')}}</a>
											</a-menu-item>
										</a-menu>
									</a-dropdown>
								</div>
								<div v-else-if="!fileLoadErr && isOnline">
									<span style="cursor: pointer" @click.stop="downloadFile">{{$t('common.download')}}</span>
								</div>
								<div v-else-if="fileLoadErr">
									<span style="cursor: pointer">{{$t('common.FileExpired')}}</span>
								</div>
							</div>
							<!-- <i v-if="message.burntAfterRead==1" class="iconfont iconyuehoujifenkaiqi"></i> -->
						</div>

						<!--视频文件信息-->
						<div
							@mousedown="mouseHandle"
							@mousemove="mouseHandle"
							@mouseup="mouseHandle"
							@mouseleave="mouseHandle"
							v-if="message.cForm===$CHAT_MSG_TYPE.TYPE_VIDEO"
							:class="{message:true,videoFile:true,burntAfterRead:message.isSend==0&&message.burntAfterRead==1,triggered:message.triggered==1}"
						>
							<span :style="`width: ${containerWidth}px; height:${containerHeight}px;`">
								<div class="video-mask" v-if="!fileLoadErr">
									<div class="video-info">
										<div class="progress" v-show="message.sendProgress !== undefined && message.sendProgress !== 100">
											<a-progress class="circle" type="circle" :strokeWidth="8" strokeColor="#7AE597" :percent="message.sendProgress" :width="28" status="exception" />
											<div class="cancel iconfont iconcuo" @click="abortDownloadFile"></div>
										</div>
										<div class="video-info-name" :title="message.fileName">{{message.fileName}}</div>
										{{message.fileSize | formatBytes}}<p>{{message.downloadRate}}</p>
									</div>
									<span v-if="message.isEncode === 0" style="color:#000;">{{$t('common.transcoding')}}，{{message.videoProgress || 0}}%</span>
									<div class="download" v-else-if="!message.localPath && (message.sendProgress === undefined || message.sendProgress === 100) && (message.burntAfterRead != 1 || message.isSend==1)" @click="downloadVideo(false)">
										<div class="download-btn iconfont iconxiazai3"></div>
									</div>
									<div v-else-if="message.localPath" class="play iconfont iconshipin-1" @click="mutePlay = false; openVideoPlayer()"></div>
								</div>
								<div class="video-bg" :style="`width: ${containerWidth}px; height:${containerHeight}px;overflow:hidden`">
									<file-load-error style="position: absolute" v-if="fileLoadErr" :form="message.cForm" background-color="rgba(0,0,0,.7)" />
									<img
										v-show="imageLoadFinish"
										v-else-if="message.url"
										@load="imageLoad"
										:style="`width: ${containerWidth}px; height:${containerHeight}px;`"
										@error="fileLoadError"
										:src="fileLocalPath"
									/>
								</div>
							</span>

							<div
								class="watermark"
								v-if="!message.isSend&&message.burntAfterRead==1&&message.triggered==0&&!fileLoadErr"
								@click="_trigger"
							>
								<div class="iconfont iconshipin-1"></div>
								<div class="tip">
									{{$t('chat.burnAfterReading')}}
								</div>
							</div>

							<i v-if="message.burntAfterRead==1" class="iconfont iconyuehoujifenkaiqi"></i>
						</div>
						<!--右键菜单-->
						<a-menu
							v-if="message.threadType!=10001&&!(message.burntAfterRead==1&&!message.isSend&&message.cForm!=$CHAT_MSG_TYPE.TYPE_VIDEO)&&hasContextmenu"
							v-show="!selectable"
							slot="overlay"
						>
							<a-menu-item v-if="contextmenuItems.mutePlay" @click="rightMenuMutePlayVideo">
								{{$t('common.mutePlay')}}
							</a-menu-item>
							<a-menu-item v-if="contextmenuItems.addEmoji" @click="addEmoji">
								{{$t('common.addStickers')}}
							</a-menu-item>

							<a-menu-item v-if="contextmenuItems.reply" @click="_reply">
								{{$t('common.reply')}}
							</a-menu-item>

							<a-menu-item v-if="contextmenuItems.copy" @click="copy">
								{{$t('common.copy')}}
							</a-menu-item>

							<a-menu-item v-if="contextmenuItems.share" @click="share">
								{{$t('common.relay')}}
							</a-menu-item>

							<a-menu-item v-if="isGroupManager&&contextmenuItems.withdraw&&message.isSend==0" @click="withdraw">
								{{$t('common.recall')}}
							</a-menu-item>

							<a-menu-item
								v-if="showContextmenuItem('del')"
								@click="delMsg"
							>
								{{$t('common.delete')}}
							</a-menu-item>

							<a-sub-menu v-if="showContextmenuItem('del_SubMenu')" :title="$t('common.delete')">
								<a-menu-item @click="delMsg">
									{{$t('chat.justDelMe')}}
								</a-menu-item>
								<a-menu-item @click="withdraw">
									{{message.threadType==0?$t('chat.delMeAo'):$t('chat.delMeAall')}}
								</a-menu-item>
							</a-sub-menu>

							<a-menu-item v-if="contextmenuItems.collect&&!isMsg_newFriend" @click="collectMsg">
								{{$t('nav.collect')}}
							</a-menu-item>

							<a-menu-item v-if="contextmenuItems.multiSelect" @click="multiSelect">
								{{$t('common.multipleSelection')}}
							</a-menu-item>
						</a-menu>
					</a-dropdown>

					<div
						class="Progress-bar"
						:class="{'file-bar': message.cForm === $CHAT_MSG_TYPE.TYPE_IMAGE || message.cForm === $CHAT_MSG_TYPE.TYPE_FILE}"
						v-show="message.sendProgress !== undefined && message.sendProgress !== 100 &&![$CHAT_MSG_TYPE.TYPE_VIDEO,$CHAT_MSG_TYPE.TYPE_REPLY].includes(message.cForm)"
					>
						<a-tooltip placement="bottom" :title="$t('common.exitBtn')">
							<div class="cancel iconfont iconguanbi1" @click="abortDownloadFile"></div>
						</a-tooltip>
						<div class="track">
							<span :style="'width:' + message.sendProgress + '%'"></span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import FileLoadError from '@/components/FileLoadError'

	export default {
		name: 'ChatBubble',
		components: {
			FileLoadError
		},
		props: {
			preMsgTime: {
				type: Number,
				default: 0
			},
			isGroupManager: {
				type: Boolean,
				default: false
			},
			banned: { // 是否禁言
				type: Boolean,
				default: false
			},
			hasContextmenu: { // 是否支持右键菜单
				type: Boolean,
				default: true
			},
			repliable: { // 是否支持回复
				type: Boolean,
				default: true
			},
			dragFlag: {
				type: Boolean,
				default: false
			},
			chatToMyself: {
				type: Boolean,
				default: false
			},
			selectable: {
				type: Boolean,
				default: false
			},
			selectArray: {
				type: Array,
				default: () => []
			},
			parentId: { // 父级id，用于回复详情
				type: String,
				default: ''
			},
			message: {
				type: Object,
				default: () => ({})
			},
			autoUpdate: { // 是否手动更新
				type: Boolean,
				default: true
			},
			scrollTarget: { // 是否手动更新
				type: Boolean,
				default: false
			},
			inview: { // 是否在视野范围内
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isDefaultAvatar: false,
				downloadWatch: '',
				mutePlay: false,
				isClickDownloadBtn: false,
				imageDownloadFinish: true,
				imageLoadFinish: false,
				isKeyTime: false,
				contextmenuItems: [],
				visibleMsgType: process.env.webConfig.VISIBLE_MSG_TYPE,
				rendered: false, // 渲染完毕
				rendering: false, // 渲染中
				renderingLinkText: '', // 待解析的链接文本
				targetMsg: null, // 回复的对象
				videoDataForReply: {},
				avatarLoadFinish: false,
				formatedMsg: '',
				hasSelection: false,
				supportFileType: this.$WEB_CONFIG.supportFileType,
				play: false,
				duration: 0,
				playerWidth: '0px',
				playTime: 3,
				timer: '',
				audioLoadErr: false,
				hasLocalFileExist: true, // 本地文件是否存在，默认存在
				hasServerFileExist:	true,
				isSupportFileType: true, // 是否支持文件类型
				fileLocalPath: '',
				imageWidth: 0,
				imageHeight: 0,
				containerWidth: 0,
				containerHeight: 0,
				isFileNameTooLong: false,
				notifyIcon: require('@/assets/img/system_msg.png'),
				noteData: {
					text: '',
					imgs: []
				},
				startDownloadTime: '', // 开始下载时间
				downloadRate: '', // 下载速率
				selectionTxt: '', // 选择的文本，用于禁用mac端// 右键选中文本,
				twinkle: false, // 闪烁
				openAfterDownLoad: false
			}
		},
		created() {
			// 2.3.0在dom渲染前初始化fileLocalPath的值，用于改善界面图片加载的问题wuxl
			if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.message.cForm)) {
				if (this.message.localPath) {
					this.fileLocalPath = 'file://' + this.message.localPath
					if (this.message.burntAfterRead == 0 && this.message.localPath.indexOf('error') === -1) {
						let userAvatar = this.senderInfo.avatar
						if (this.message.isAnoymous == 1) {
							userAvatar = {
								userName: this.$utils.message.getAvatarText(this.senderInfo.name),
								bgColor: this.$utils.message.getAvatarBgColor(this.senderInfo.name)
							}
						}
						if (!(this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI && /@/.test(this.message.threadID))) { // 合并转发的表情不支持预览
							this.$store.dispatch('Chat/setImagePlayerArray', {
								action: 'add',
								data: {
									filePath: this.message.localPath || '',
									userName: this.senderInfo.name,
									userAvatar,
									timestamp: this.message.timestamp,
									messageId: this.message.id,
									threadId: this.message.threadID,
									burntAfterRead: this.message.burntAfterRead,
									senderId: this.message.senderID,
									fileSize: this.message.fileSize || 0
								}
							})
						}
					}
				}
			} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
				if (this.message.localPath) {
					this.fileLocalPath = 'file://' + this.message.localPath
				}
			} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
				if (this.message.thumbnail) {
					this.fileLocalPath = 'file://' + this.message.thumbnail
				}
			} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_REPLY) {
				if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.message.replyInfo.form)) {
					if (this.message.replyInfo.localPath) {
						this.fileLocalPath = 'file://' + this.message.replyInfo.localPath
						if (this.message.replyInfo.localPath.indexOf('error') === -1) {
							const { nickname, headImgUrl, groupId, userId, fileSize } = this.message.replyInfo
							this.$store.dispatch('Chat/setImagePlayerArray', {
								action: 'add',
								data: {
									filePath: this.message.replyInfo.localPath,
									userName: nickname,
									userAvatar: headImgUrl,
									timestamp: this.message.timestamp,
									messageId: this.message.id,
									threadId: groupId,
									burntAfterRead: 0,
									senderId: userId,
									fileSize: fileSize
								}
							})
						}
					}
				} else if (this.message.replyInfo.form === this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					if (this.message.replyInfo.thumbnail) {
						this.fileLocalPath = 'file://' + this.message.replyInfo.thumbnail
					}
				}
			}
		},
		mounted() {
			if (this.visibleMsgType.includes(this.message.cForm)) {
				this.initContextmenuItems()
				this.initMsg()
				if (!this.autoUpdate) {
					this.loadMsgData()
				}
			}

			if (this.visibleMsgType.includes(this.message.cForm) || this.message.cForm == 53) {
				this.isKeyTime = this.setKeyTime()
			}

			/* if (this.$store.state.Setting.fileDownloadings[downloadFileId.replace(/-/g, '')]) {
				this.addDownloadFileWatcher(downloadFileId)
			}*/
			if ([this.$CHAT_MSG_TYPE.TYPE_VIDEO, this.$CHAT_MSG_TYPE.TYPE_FILE, this.$CHAT_MSG_TYPE.TYPE_VOICE, this.$CHAT_MSG_TYPE.TYPE_REPLY].includes(this.message.cForm)) {
				const	downloadFileId = this.parentId || this.message.id
				this.addDownloadFileWatcher(downloadFileId)
			}
		},
		watch: {
			'preMsgTime'(val) {
				if (this.visibleMsgType.includes(this.message.cForm) || this.message.cForm == 53) {
					this.isKeyTime = this.setKeyTime()
				}
			},
			'message.cForm'(val) {
				if (val == 53 && this.message.mType == 'tip_withdraw') {
					this.$emit('update', {
						id: this.message.id,
						mType: 'tip_withdraw'
					})
				}
			},
			'message.id'(val) { // 用于修复转发的情况下id变化的问题
				if (this.downloadWatch) {
					this.downloadWatch()
					this.downloadWatch = ''
				}
				this.addDownloadFileWatcher(val)
			},
			'message.status'(val) {
				if (val && [
					this.$CHAT_MSG_TYPE.TYPE_TEXT,
					this.$CHAT_MSG_TYPE.TYPE_REPLY
				].includes(this.message.cForm)) {
					this.$nextTick(() => {
						this.initMsg(true)
						this.loadMsgData()
					})
				}
			},
			inview: {
				handler: function(val) {
					if (val && !this.rendering && !this.rendered) {
						this.loadMsgData()
					}
				},
				immediate: true
			},
			scrollTarget(val) {
				if (val && !this.twinkle) {
					this.twinkle = true
					setTimeout(() => {
						this.twinkle = false
					}, 3000)
					this.$store.commit('Chat/updateScrollTo')
				}
			},
			// 'targetMsgInVueX.data': {
			// 	handler: function() {
			// 		if (this.targetMsg) {
			// 			this.initMsg(true)
			// 		}
			// 	},
			// 	deep: true
			// },
			isUnreadBurntAfterReadMsg(val) {
				if (!val) {
					this.$nextTick(() => {
						this.initMsg(true)
					})
				}
			},
			'$store.state.Setting.lang'() {
				if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_CHATRECORD) {
					this.initMsg(true)
				}
			},
			'message.replyInfo.thumbnail'(val) {
				// console.log('message.replyInfo.thumbnail:::', val)
				this.fileLocalPath = val === 'error' ? 'error' : `file://${val}`
			},
			'message.replyInfo.localPath'(val) {
				// console.log('message.replyInfo.localPath:::', val)
				if (this.message.replyInfo.form !== this.$CHAT_MSG_TYPE.TYPE_VIDEO) this.fileLocalPath = val === 'error' ? 'error' : `file://${val}`
			},
			'message.thumbnail'(val) {
				// console.log('message.thumbnail:::', val)
				this.fileLocalPath = val === 'error' ? 'error' : `file://${val}`
			},
			'message.localPath'(val) {
				// console.log('message.localPath:::', val)
				if (this.message.cForm !== this.$CHAT_MSG_TYPE.TYPE_VIDEO) this.fileLocalPath = val === 'error' ? 'error' : `file://${val}`
			},
			async 'isOnline'(nVal) {
				if (!nVal) return
				switch (this.message.cForm) {
				case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
				case this.$CHAT_MSG_TYPE.TYPE_VOICE:
				case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
				case this.$CHAT_MSG_TYPE.TYPE_FILE:
					// this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.url)
				}
			}/*
			async 'message.localPath'(val) {
				this.hasLocalFileExist = await this.$utils.fun.fileExist(val)

				if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI, this.$CHAT_MSG_TYPE.TYPE_VOICE].includes(this.message.cForm)) {
					if (!this.hasLocalFileExist) {
						this.fileLocalPath = 'error'
						this.fileLoadError()
					} else {
						this.fileLocalPath = `file://${val}`
					}

					// 矫正图片尺寸
					if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE && this.message.width != this.imageWidth) {
						const newImgSize = this.$utils.imageOp.resizeImage(this.message.width, this.message.height, 300, 300)
						this.imageWidth = newImgSize.width
						this.imageHeight = newImgSize.height
						this.containerWidth = newImgSize.containerWidth
						this.containerHeight = newImgSize.containerHeight
					}
				} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					if (this.hasLocalFileExist) {
						this.fileLocalPath = `file://${val}`
					}
				}
			}*/
		},

		computed: {
			notifyTitle() {
				if (this.message.threadID === 'notify' && this.message.data && [2, 3].includes(this.message.data.systemNoticeType)) {
					return this.message.data.noticeTitle || ''
				}
			},
			replyTargetName() {
				const userId = this.message.replyInfo ? this.message.replyInfo.userId : ''
				if (userId) {
					return this.$store.getters.latestUsername(userId, this.message.threadType, this.message.threadID) || this.message.replyInfo.nickname
				} else {
					return ''
				}
			},
			senderInfo() {
				let name = ''
				let avatar = ''
				if (this.message.isAnoymous == 1) {
					name = this.message.name
				} else {
					const userInfo = this.$store.getters['User/userInfo'](this.message.senderID)
					name = userInfo.nickName || this.message.name
					avatar = userInfo.userAvatar || this.message.avatar

					if (this.message.isSend != 1) {
						const friendInfo = this.$store.getters['MyFriend/friendInfo'](this.message.senderID)
						if (friendInfo && friendInfo.label) {
							name = friendInfo.label
							return { name, avatar }
						}
					}

					if (this.message.threadType == 1) {
						const groupUserInfo = this.$store.getters['MyGrounp/groupUserInfo'](
							this.message.threadID,
							this.message.senderID
						)
						if (groupUserInfo && groupUserInfo.userLabel) {
							name = groupUserInfo.userLabel
							return { name, avatar }
						}
					}
				}

				// if (this.message.name != name || this.message.avatar != avatar) {
				// 	this.$store.dispatch('Chat/updateMsg', {
				// 		id: this.message.id,
				// 		updatingData: {
				// 			name,
				// 			avatar
				// 		},
				// 		updateDatabaseOnly: true
				// 	})
				// }

				return { name, avatar }
			},

			fileLoadErr() {
				// console.log('this.fileLocalPath::::', this.message.cForm, this.fileLocalPath.indexOf('error') > -1, this.fileLocalPath)
				const hasError = this.fileLocalPath.indexOf('error') > -1
				this.imageDownloadFinish = true
				// 加载失败，对于小图片，为了能显示图片不存在和重试按钮，所以重设高宽
				if (hasError) {
					if (this.imageWidth < 140) {
						this.imageWidth = 140
						this.containerWidth = 140
					}
					if (this.imageHeight < 90) {
						this.imageHeight = 90
						this.containerHeight = 90
					}
				}
				return hasError
			},
			// targetMsgInVueX() {
			// 	if (this.message.replyInfo && [this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_VIDEO].indexOf(this.message.replyInfo.form) >= 0) {
			// 		const targetInVueX = this.$store.getters['Chat/someMessage'](this.message.replyInfo.id)
			// 		if (targetInVueX) {
			// 			return targetInVueX
			// 		} else {
			// 			return null
			// 		}
			// 	}
			// },
			isAtMe() {
				if (this.message.atUsers !== undefined &&
					(this.message.atUsers == '0' || this.message.atUsers.split('|').some(userID => {
						return userID == this.$store.state.User.accountInfo.userId
					}))) {
					return true
				} else {
					return false
				}
			},
			showQueueText() { // 是否显示发送队列中文字
				let t
				switch (this.message.cForm) {
				case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
				case this.$CHAT_MSG_TYPE.TYPE_FILE:
				case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
					t = false
					const index = this.$store.state.Chat.sendFileQueue.findIndex(item => {
						return item.msgID == this.message.id
					})
					if (this.$store.state.Chat.sendFileQueue[index] && this.$store.state.Chat.sendFileQueue[index].status === undefined) {
						t = true
					}
					break
				default:
					t = false
				}
				return t
			},
			isMsg_newFriend() {
				return /apply|agree/.test(this.message.id)
			},
			unreadText() {
				if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO) return ''
				const unreadCount = this.message.unreadCount
				const threadType = this.message.threadType
				let text1 = this.$t('chat.allRead')
				let text2 = this.$t('chat.qunread')
				let text3 = this.$t('chat.read')
				let text4 = this.$t('chat.unread')
				if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
					text1 = this.$t('chat.allChecked')
					text2 = this.$t('chat.qunchecked')
					text3 = this.$t('chat.checked')
					text4 = this.$t('chat.unchecked')
				}
				if (threadType == 1) {
					return this.message.status == 1 ? (unreadCount == 0 ? text1 : unreadCount + text2) : ''
				} else if (
					threadType == 0 && this.message.isSend
				) {
					return unreadCount === 0 ? text3 : text4
				}
			},
			player() {
				return this.$refs['play' + this.message.id]
			},
			bubbleRightMenuVisible() {
				return this.$store.getters['OPcomponent/getBubbleRightMenuVisible']
			},
			isChecked() {
				return this.selectArray.indexOf(`msg${this.message.id}`) > -1 || this.selectArray.indexOf(`msg${this.message.originID}`) > -1
			},
			isDrag() {
				return this.dragFlag
			},
			isUnreadBurntAfterReadMsg() {
				return (
					this.message.isSend == 0 &&
					this.message.burntAfterRead == 1 &&
					this.message.triggered != 1
				)
			},
			isOnline() {
				return this.$store.state.Setting.online
			}
		},
		methods: {
			reloadAvatar() {
				if (this.isDefaultAvatar && this.senderInfo.avatar) {
					const avatar = new Image()
					avatar.src = this.message.threadType == 10001 && this.message.threadID == 'notify' ? this.notifyIcon : this.senderInfo.avatar
					avatar.onload = () => {
						this.$refs.userAvatar.src = avatar.src
						this.isDefaultAvatar = false
					}
				}
			},
			avatarLoadError(e) {
				this.$utils.setDefaultAvatar(e, this.message.threadType)
				this.isDefaultAvatar = true
			},

			rightMenuMutePlayVideo() {
				this.mutePlay = true
				if (this.message.burntAfterRead !== 1 || this.message.isSend === 1) {
					if (this.message.localPath) {
						this.openVideoPlayer()
					} else {
						this.openAfterDownLoad = true
						this.downloadVideo(false)
					}
				} else {
					if (this.message.localPath) {
						this.openVideoPlayer()
					} else {
						this._trigger()
					}
				}
			},

			addDownloadFileWatcher(id) {
				// const	inReply = this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_REPLY
				this.downloadWatch = this.$watch(`$store.state.Setting.fileDownloadings.${id.replace(/-/g, '')}`,	async(nVal) => {
					const	{ state, progress, receivedBytes, localPath, fromType } = nVal || {}
					// console.log('泡泡文件下载中：',	nVal)
					if (fromType && fromType.indexOf('chat-') === -1 || !nVal) {
						return
					}
					if (state === 'save-error') {
						this.$store.commit('Chat/updateDownloadingMsgs', {
							action: 'del',
							id: id
						})
						this.$store.dispatch('Setting/del_fileDownloadings', id)
						this.$store.dispatch('Chat/downloadFileProgress', { msgID: id, progress: '' })
						this.$message.error(this.$t('common.saveStatus[1]'))
						return
					}
					const downloadUsedTime = (new Date().getTime() - this.startDownloadTime) / 1000
					this.downloadRate = this.$root.$options.filters.formatBytes(receivedBytes / downloadUsedTime) + '/S'
					if (!this.autoUpdate) {
						this._updateMessage({
							sendProgress: progress,
							localPath
						})
					} else {
						this.$store.dispatch('Chat/downloadFileProgress', {
							msgID: id,
							progress,
							downloadRate: this.downloadRate
						})
					}
					if (state === 'finished') {
						this.downloadRate = ''
						const updatingData = {
							localPath: localPath
						}
						if (!this.autoUpdate) {
							this._updateMessage(updatingData)
						}
						this.hasLocalFileExist = true
						if (this.openAfterDownLoad) {
							this.openAfterDownLoad = false
							// 延时用于修复下载完后马上打开视频播放失败的问题，localPath的值为空，导致播放失败
							setTimeout(() => {
								this.openVideoPlayer()
							}, 400)
						}
					} else if (state === 'abort') {
						this.downloadRate = ''
						if (!this.autoUpdate) {
							this._updateMessage({	sendProgress: '' })
						} else {
							this.$store.dispatch('Chat/downloadFileProgress', { msgID: id, progress: '' })
						}
						// 从下载队列删除
						this.$store.dispatch('Setting/del_fileDownloadings', id)
					}
				})
			},

			setKeyTime() {
				if (!this.preMsgTime || this.message.threadID === 'notify') {
					return true
				} else if (this.preMsgTime && Math.floor((this.message.timestamp - this.preMsgTime) / 60000) >= 3) {
					return true
				} else {
					return false
				}
			},

			// 是否显示某个右键菜单项
			showContextmenuItem(item) {
				let toShow = false
				switch (item) {
				case 'del':// 删除
					toShow = (this.message.isSend != 1 && this.isGroupManager) ||// 当前用户为群主或管理员,且非自己发送的消息
						(!(this.message.burntAfterRead == 1 && this.message.isSend != 1) && !this.contextmenuItems.del_subMenu) ||// 非接收的阅后即焚消息，且不存在删除子菜单
						(this.isMsg_newFriend || this.$store.state.Setting.organParamsConfig.showDeleteBoth == 0)// 为添加好友默认消息，或配置showDeleteBoth为0
					break
				case 'del_SubMenu':// 删除子菜单
					toShow = this.contextmenuItems.del_subMenu &&
						!this.isMsg_newFriend &&
						this.$store.state.Setting.organParamsConfig.showDeleteBoth == 1
					break
				}
				return toShow
			},

			// 初始化右键菜单
			initContextmenuItems() {
				if (this.message.threadType == 10001) return []
				let items
				if (this.message.cForm == 78) {
					items = { del: true }
				} else {
					const obj = {
						0: { // 普通消息
							0: { // 接收的消息
								[this.$CHAT_MSG_TYPE.TYPE_LOCATION]: {
									del: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_TEXT]: {
									reply: true,
									copy: true,
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REPLY]: {
									reply: true,
									copy: true,
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_IMAGE]: {
									reply: true,
									copy: true,
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_EMOJI]: {
									addEmoji: true,
									reply: true,
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_FILE]: {
									reply: true,
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REALAUDIO]: {
									del: true,
									withdraw: this.isGroupManager
								},
								[this.$CHAT_MSG_TYPE.TYPE_VOICE]: {
									del: true,
									withdraw: this.isGroupManager,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_VIDEO]: {
									mutePlay: true,
									reply: true,
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_CHATRECORD]: {
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_CARD]: {
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_NOTE]: {
									share: true,
									del: true,
									withdraw: this.isGroupManager,
									collect: true,
									multiSelect: true
								}
							},
							1: { // 发送的消息
								[this.$CHAT_MSG_TYPE.TYPE_LOCATION]: {
									del: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_TEXT]: {
									reply: true,
									copy: true,
									share: true,
									del: true,
									withdraw: true,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REPLY]: {
									reply: true,
									copy: true,
									share: true,
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_IMAGE]: {
									reply: true,
									copy: true,
									share: true,
									del: true,
									withdraw: true,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_EMOJI]: {
									addEmoji: true,
									reply: true,
									share: true,
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_FILE]: {
									reply: true,
									share: true,
									del: true,
									withdraw: true,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REALAUDIO]: {
									del: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_VOICE]: {
									del: true,
									withdraw: true,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_VIDEO]: {
									mutePlay: true,
									reply: true,
									share: true,
									del: true,
									withdraw: true,
									collect: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_CHATRECORD]: {
									share: true,
									withdraw: true,
									del: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_CARD]: {
									share: true,
									withdraw: true,
									del: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_NOTE]: {
									share: true,
									del: true,
									withdraw: true,
									collect: true,
									multiSelect: true
								}
							}
						},
						1: { // 阅后即焚消息
							0: { // 接收的消息
								[this.$CHAT_MSG_TYPE.TYPE_LOCATION]: {},
								[this.$CHAT_MSG_TYPE.TYPE_TEXT]: {},
								[this.$CHAT_MSG_TYPE.TYPE_IMAGE]: {},
								[this.$CHAT_MSG_TYPE.TYPE_EMOJI]: {},
								[this.$CHAT_MSG_TYPE.TYPE_FILE]: {},
								[this.$CHAT_MSG_TYPE.TYPE_VOICE]: {},
								[this.$CHAT_MSG_TYPE.TYPE_VIDEO]: {
									mutePlay: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REALAUDIO]: {},
								[this.$CHAT_MSG_TYPE.TYPE_CHATRECORD]: {},
								[this.$CHAT_MSG_TYPE.TYPE_CARD]: {},
								[this.$CHAT_MSG_TYPE.TYPE_NOTE]: {},
								[this.$CHAT_MSG_TYPE.TYPE_REPLY]: {}
							},
							1: { // 发送的消息
								[this.$CHAT_MSG_TYPE.TYPE_LOCATION]: {
									del: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_TEXT]: {
									copy: true,
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REPLY]: {
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_IMAGE]: {
									copy: true,
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_EMOJI]: {
									copy: true,
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_FILE]: {
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_REALAUDIO]: {
									del: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_VOICE]: {
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_VIDEO]: {
									mutePlay: true,
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_CHATRECORD]: {
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_CARD]: {
									del: true,
									withdraw: true,
									multiSelect: true
								},
								[this.$CHAT_MSG_TYPE.TYPE_NOTE]: {
									del: true,
									withdraw: true,
									multiSelect: true
								}
							}
						}
					}

					items = obj[this.message.burntAfterRead || 0][this.message.isSend || 0][this.message.cForm]

					// 已经触发的阅后即焚消息，去掉撤回
					if (this.message.burntAfterRead == 1 && this.message.triggered) {
						items.withdraw = false
					}

					// 未发送成功的消息
					if (this.message.status != 1) {
						items.withdraw = false
						items.reply = false
						if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.message.cForm)) {
							items.copy = false
						}
					}

					// gif，或者还未下载的的图片/表情不允许复制
					if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.message.cForm) && (this.message.ext == 'gif' || !this.message.localPath || this.message.localPath == 'error')) {
						items.copy = false
					}

					if (this.repliable == false || this.message.isAnoymous == 1 || this.message.burntAfterRead == 1) {
						items.reply = false
					}

					// 表情若已存在，则不显示【添加表情】
					if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI) {
						const emojis = Object.values(this.$store.state.Chat.emojis)
						const arr = this.message.url.split('/')
						const hash = arr[arr.length - 1].split('.')[0]

						const existEmoji = emojis.some(emoji => {
							return emoji && emoji.hash == hash
						})

						if (existEmoji) {
							items.addEmoji = false
						}
					}

					if (this.message.isSend && items.withdraw && items.del) {
						items.del_subMenu = true
					}
				}

				this.contextmenuItems = items
			},

			addEmoji() {
				this.$utils.chatSdk.cAddEmoticonAsync(this.message.url, JSON.stringify({
					width: this.message.width,
					height: this.message.height
				})).then(res => {
					if (res.code == 0 || res.code == 2044) {
						this.contextmenuItems.addEmoji = false
						this.$message.success(this.$t('common.added'))
					}
				})
			},

			reEdit(e) {
				if (this.banned) {
					this.$message.error(this.$t('chat.mutteringTip1[0]'))
					return
				}
				let html = this.message.html.split('<i class="iconfont iconyuehoujifenkaiqi">')[0]
				if (html) html = html.replace(/<\s*a[^>]*>((.|[\r\n])*?)<\s*\/a[^>]*>/gi, '$1')
				this.$emit('edit', {
					id: this.message.id,
					html,
					atUsers: this.message.atUsers || ''
				})
			},
			imageReload() {
				const data = {}
				if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_REPLY) {
					data.replyInfo = Object.assign({}, this.message.replyInfo, {
						localPath: ''
					})
				} else {
					data.localPath = ''
				}
				if (this.autoUpdate) {
					this.$store.dispatch('Chat/updateMsg', {
						id: this.message.id,
						updatingData: data
					})
				} else {
					this._updateMessage(data)
				}
			},
			fileNameClick() { // 文件名点击事件
				/* if (!this.autoUpdate) { // 如果泡泡不再聊天列表内，则无法进行预览
					this.openFileMenu({ key: '0' })
					return
				}*/
				if (this.selectable) return
				if (this.isOnline) { // 网络可用，使用在线预览
					this.openFilePlayer()
				} else { // 网络不可用，调用本地打开，本地打开方法会判断本地文件存不存在
					this.openFileMenu({ key: '0' })
				}
			},

			_updateMessage(data) {
				// 如果不在消息列表里，无法被更新，需要在此手动更新
				if (!this.autoUpdate) {
					this.$emit('update', data)
				}
			},

			// 初始化消息，图片视频类消息先预设宽高，当滚动停止时，若处于视野范围内才进行下载/渲染。其他文本类消息直接渲染。
			async initMsg(resetHtml) {
				const curHtml = this.message.html
				// 文本类消息直接标记为已渲染
				if ([
					this.$CHAT_MSG_TYPE.TYPE_TEXT,
					this.$CHAT_MSG_TYPE.TYPE_NOTE,
					this.$CHAT_MSG_TYPE.TYPE_CHATRECORD,
					this.$CHAT_MSG_TYPE.TYPE_LOCATION,
					78
				].includes(this.message.cForm)) {
					this.rendered = true
					if (!resetHtml && curHtml && this.$refs.bubble_text) {
						this.$refs.bubble_text.innerHTML = curHtml
						return
					}
				}

				let newHtml
				if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_TEXT || this.message.cForm == 78) {
					let text = this.message.text || ''
					if (this.isUnreadBurntAfterReadMsg) {
						text = this.$t('chat.burnAfterReading')
					} else {
						text = text.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
						text = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(text)
					}
					if (this.$refs.bubble_text) {
						this.$refs.bubble_text.innerHTML = ''
						this.$refs.bubble_text.appendChild(this.$utils.message.buildDom(text, true))
						newHtml = this.$refs.bubble_text.innerHTML
					}
					// 是链接
					if (this.$utils.fun.validUrl(text)) {
						this.rendered = false
						// 判断id长度是为了区分临时id和服务器返回的id，避免重复抓取, status===5抓取中
						if ((!this.message.data || !this.message.data.shareLink) && this.message.status == 1) { // 没抓取过
							this.renderingLinkText = text
							if (this.$refs.bubble_text) { // 抓取中
								const getWebLoading = document.createElement('div')
								getWebLoading.className = 'get-web-loading'
								getWebLoading.innerHTML = this.$t('common.identifyLink') + '...'
								this.$refs.bubble_text.appendChild(getWebLoading)
							} else {
								await this.$store.dispatch('Chat/updateMsg', {
									id: this.message.id,
									updatingData: {
										status: 5
									}
								})
							}

							if (this.inview && !this.rendering) {
								this.loadMsgData()
							}
						}
					}
				} else if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_NOTE) {
					const msgData = this.message.data
					let text = msgData.content || msgData
					text = text
						.replace(/<style((.|\n|\r|\r\n)+?)<\/style>/g, '')
						.replace(/<br[^>]*?\/?>/g, '\r\n').replace(/<\/?[a-z]+?\s?[^>]*?\/?>/g, '')
					if (/^[\s|\r|\n]*$/.test(text)) {
						this.noteData.text = this.$t('note.untitledNote')
					} else {
						this.noteData.text = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(text)
					}
				} else if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_CHATRECORD) {
					if (this.isUnreadBurntAfterReadMsg) {
						this.formatedMsg = `<span>${this.$t('chat.burnAfterReading')}</span><i class="iconfont iconyuehoujifenkaiqi"></i>`
					} else {
						const data = this.message.data
						let recordsPreview = ''
						for (let i = 0; i < data.items.length; i++) {
							if (i < 4) {
								const record = data.items[i]
								if (!record.content) continue
								let content = this.$utils.message.getSpecialMsgTag(record.type)
								if (content === '') {
									content = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(record.content)
									recordsPreview += `<div>${record.nickName}：${content.replace(/【##HTML##】/g, '')}</div>`
								} else {
									recordsPreview += `<div>${record.nickName}：${content}</div>`
								}
							} else {
								break
							}
						}
						this.formatedMsg = `<div class="chat-records-title">${data.title}</div><div class="chat-records-preview">${recordsPreview}</div><i class="iconfont iconyuehoujifenkaiqi"></i>`
					}
				} else if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY) {
					if (this.isUnreadBurntAfterReadMsg) {
						return
					}

					this.$refs.reply_content.innerHTML = ''
					let reply_content = this.message.text || ''
					reply_content = reply_content.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
					reply_content = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(reply_content)
					this.$refs.reply_content.appendChild(this.$utils.message.buildDom(reply_content))
					newHtml = this.$refs.reply_content.innerHTML

					if (![this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI, this.$CHAT_MSG_TYPE.TYPE_VIDEO].includes(this.message.replyInfo.form)) {
						// 如果回复的消息非图片或视频
						if (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_FILE) {
							this.isSupportFileType = this.supportFileType.indexOf(this.message.replyInfo.fileType ? this.message.replyInfo.fileType.toLowerCase() : '') > -1
							this.isFileNameTooLong = this.message.replyInfo.fileName.length > 45
						} else {
							if (this.message.replyInfo.mType !== 'link') {
								this.$refs.target_info.innerHTML = ''
								let target_info = this.message.replyInfo.content || ''
								target_info = target_info.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
								target_info = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(target_info)
								this.$refs.target_info.appendChild(this.$utils.message.buildDom(target_info))
							}
						}
						/* if (this.message.replyInfo.mType !== 'link') {
							this.$refs.target_info.innerHTML = ''
							let target_info = this.message.replyInfo.content || ''
							if (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_FILE) {
								this.isSupportFileType = this.supportFileType.indexOf(this.message.replyInfo.fileType ? this.message.replyInfo.fileType.toLowerCase() : '') > -1
								this.isFileNameTooLong = this.message.replyInfo.fileName.length > 45
								target_info = `[文件]${this.message.replyInfo.fileName}`
							}
							target_info = target_info.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
							target_info = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(target_info)
							this.$refs.target_info.appendChild(this.$utils.message.buildDom(target_info))
						}*/
					} else {
						// 回复的消息为图片或视频
						/* if (this.message.replyInfo.form === this.$CHAT_MSG_TYPE.TYPE_IMAGE) {
							if (this.message.replyInfo.localPath) this.fileLocalPath = 'file://' + this.message.replyInfo.localPath
						} else if (this.message.replyInfo.form === this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
							if (this.message.replyInfo.thumbnail) this.fileLocalPath = 'file://' + this.message.replyInfo.thumbnail
						}*/
						this._presetImgSize(this.message.replyInfo.width, this.message.replyInfo.height)
					}
					// else if (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					// 	this._presetImgSize(this.message.replyInfo.width, this.message.replyInfo.height)
					// 	this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.replyInfo.path)
					// 	this.fileLocalPath = this.$store.state.Setting.fileDomainURL + this.message.replyInfo.path
					// 	if (this.hasServerFileExist) {
					// 		this.fileLocalPath = this.$store.state.Setting.fileDomainURL + this.message.replyInfo.path
					// 	} else {
					// 		this.fileLocalPath = 'error'
					// 		this.fileLoadError()
					// 	}
					// }
				} else if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.message.cForm) && (this.message.localPath || this.message.url)) {
					this._presetImgSize(this.message.width, this.message.height)
					/* if ((this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI) && this.message.burntAfterRead == 0) {
						let userAvatar = this.senderInfo.avatar
						if (this.message.isAnoymous == 1) {
							userAvatar = {
								userName: this.$utils.message.getAvatarText(this.senderInfo.name),
								bgColor: this.$utils.message.getAvatarBgColor(this.senderInfo.name)
							}
						}
						if (this.message.localPath) this.fileLocalPath = 'file://' + this.message.localPath
						if (!(this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI && /@/.test(this.message.threadID))) { // 合并转发的表情不支持预览
							this.$store.dispatch('Chat/setImagePlayerArray', {
								action: 'add',
								data: {
									filePath: this.message.localPath || '',
									userName: this.senderInfo.name,
									userAvatar,
									timestamp: this.message.timestamp,
									messageId: this.message.id,
									threadId: this.message.threadID,
									burntAfterRead: this.message.burntAfterRead,
									senderId: this.message.senderID,
									fileSize: this.message.fileSize || 0
								}
							})
						}
					}*/
				} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
					this.isSupportFileType = this.supportFileType.indexOf(this.message.ext ? this.message.ext.toLowerCase() : '') > -1
					this.isFileNameTooLong = this.$refs.fileNameHack.offsetTop > 45
					// if (this.message.localPath) this.fileLocalPath = 'file://' + this.message.localPath
				} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					// if (this.message.thumbnail) this.fileLocalPath = 'file://' + this.message.thumbnail
					this._presetImgSize(this.message.width, this.message.height)
				}

				if (newHtml && (!curHtml || curHtml != newHtml)) {
					const updatingData = {
						html: newHtml
					}
					this.$store.dispatch('Chat/updateMsg', {
						id: this.message.id,
						updatingData
					})
				}
			},

			_presetImgSize(width, height) {
				let size = {
					width: width || 300,
					height: height || 300
				}
				if (width && height) {
					if (
						this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI ||
						(this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY &&
							this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_EMOJI)
					) {
						let newWidth
						let newHeight
						if (width > 110) {
							newWidth = 110
							newHeight = 110 / width * height
						} else if (height > 110) {
							newHeight = 110
							newWidth = 110 / height * width
						} else {
							newWidth = width
							newHeight = height
						}
						size = {
							height: newHeight,
							width: newWidth,
							containerWidth: newWidth,
							containerHeight: newHeight
						}
					} else {
						size = this.$utils.imageOp.resizeImage(width, height, 300, 300)
						// console.log(size)
					}
				}

				this.imageWidth = size.width
				this.imageHeight = size.height
				this.containerWidth = size.containerWidth
				this.containerHeight = size.containerHeight
			},

			// 当滚动结束，泡泡处于视野范围内，才开始加载图片，视频，链接等需要网络请求的内容，以优化性能
			async loadMsgData() {
				if (this.renderingLinkText) { // 如果是链接且待解析
					this.rendering = true
					const text = this.renderingLinkText
					this.renderingLinkText = ''
					console.log('getHtml:::::::')
					this.$utils.fun.getWebInfoByURL(text).then(webInfo => {
						const data = {
							shareLink: text,
							webTitle: webInfo.webTitle,
							webDescription: webInfo.webDescription
						}
						this.$store.dispatch('Chat/updateMsg', {
							id: this.message.id,
							updatingData: {
								data,
								mType: 'link',
								status: 1
							}
						})
						this._updateMessage({
							mType: 'link',
							data
						})
						this.rendering = false
						this.rendered = true
					})
				} else if (![
					this.$CHAT_MSG_TYPE.TYPE_TEXT,
					this.$CHAT_MSG_TYPE.TYPE_NOTE,
					this.$CHAT_MSG_TYPE.TYPE_CHATRECORD
				].includes(this.message.cForm)) {
					this.rendering = true
					// 消息为回复消息，且回复的对象为图片,表情，或视频
					if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY && [this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI, this.$CHAT_MSG_TYPE.TYPE_VIDEO].includes(this.message.replyInfo.form)) {
						/*
						if (this.targetMsgInVueX) {
							this.targetMsg = this.targetMsgInVueX
						}

						const chatData = await this.$utils.sqlite.getChatData({
							where: `id='${this.message.replyInfo.id}'`
						})

						const targetInDatabase = chatData[0]
						if (targetInDatabase) {
							this.targetMsg = targetInDatabase
						}

						const targetMsg = this.targetMsg
						if (targetMsg && this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
							// 显示视频预览图
							this.videoDataForReply.thumbnail = targetMsg.thumbnail
						}*/
						if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.message.replyInfo.form)) {
							this.fileLocalPath = `file://${this.message.replyInfo.localPath}`
							// 图片加入预览队列
							if (this.message.burntAfterRead == 0 && (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_EMOJI)) {
								const { nickname, headImgUrl, groupId, userId, fileSize } = this.message.replyInfo
								/* if (targetMsg && targetMsg.isAnoymous == 1) {
									userAvatar = {
										userName: this.$utils.message.getAvatarText(nickname),
										bgColor: this.$utils.message.getAvatarBgColor(nickname)
									}
								}*/
								this.$store.dispatch('Chat/setImagePlayerArray', {
									action: 'add',
									data: {
										filePath: this.message.replyInfo.localPath,
										userName: nickname,
										userAvatar: headImgUrl,
										timestamp: this.message.timestamp,
										messageId: this.message.id,
										threadId: groupId,
										burntAfterRead: 0,
										senderId: userId,
										fileSize: fileSize
									}
								})
							}
						} else if (this.$CHAT_MSG_TYPE.TYPE_VIDEO === this.message.replyInfo.form) {
							this.fileLocalPath = 'file://' + this.message.replyInfo.thumbnail
						}
						/*
						if (targetMsg) {
							if (targetMsg.localPath !== 'error') {
								this.fileLocalPath = `file://${targetMsg.localPath}`
								// 图片加入预览队列
								if (this.message.burntAfterRead == 0 && (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_EMOJI)) {
									const { nickname, headImgUrl, groupId, userId, fileSize } = this.message.replyInfo
									let userAvatar = headImgUrl
									if (targetMsg && targetMsg.isAnoymous == 1) {
										userAvatar = {
											userName: this.$utils.message.getAvatarText(nickname),
											bgColor: this.$utils.message.getAvatarBgColor(nickname)
										}
									}
									this.$store.dispatch('Chat/setImagePlayerArray', {
										action: 'add',
										data: {
											filePath: targetMsg ? (targetMsg.localPath || (this.$store.state.Setting.fileDomainURL + targetMsg.url)) : (this.fileLocalPath || ''),
											userName: nickname,
											userAvatar,
											timestamp: this.message.timestamp,
											messageId: this.message.id,
											threadId: groupId,
											burntAfterRead: 0,
											senderId: userId,
											fileSize: fileSize
										}
									})
								}
							}
						} else {
							// await this.initDownLoadImageVoiceVideo()
						}*/
						/* if (targetMsg && targetMsg.localPath) {
							this.hasLocalFileExist = await this.$utils.fun.fileExist(targetMsg.localPath)
							if (this.hasLocalFileExist) {
								// this.fileLoadErr = false
								this.fileLocalPath = `file://${targetMsg.localPath}`
							}
						} else {
							this.hasLocalFileExist = false
						}

						if (!this.hasLocalFileExist) {
							this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.replyInfo.path)
							if (this.hasServerFileExist) {
								// this.fileLoadErr = false
								this.fileLocalPath = this.$store.state.Setting.fileDomainURL + this.message.replyInfo.path
							} else {
								this.fileLocalPath = 'error'
								this.fileLoadError()
							}
						}*/
					} else if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI, this.$CHAT_MSG_TYPE.TYPE_VOICE, this.$CHAT_MSG_TYPE.TYPE_VIDEO].includes(this.message.cForm)) {
						const localPath = this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VIDEO ? this.message.thumbnail : this.message.localPath
						this.fileLocalPath = `file://${localPath}`
						if ((this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI) && this.message.burntAfterRead == 0) {
							let userAvatar = this.senderInfo.avatar
							if (this.message.isAnoymous == 1) {
								userAvatar = {
									userName: this.$utils.message.getAvatarText(this.senderInfo.name),
									bgColor: this.$utils.message.getAvatarBgColor(this.senderInfo.name)
								}
							}
							if (!(this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI && /@/.test(this.message.threadID))) { // 合并转发的表情不支持预览
								this.$store.dispatch('Chat/setImagePlayerArray', {
									action: 'add',
									data: {
										filePath: this.message.localPath || '',
										userName: this.senderInfo.name,
										userAvatar,
										timestamp: this.message.timestamp,
										messageId: this.message.id,
										threadId: this.message.threadID,
										burntAfterRead: this.message.burntAfterRead,
										senderId: this.message.senderID,
										fileSize: this.message.fileSize || 0
									}
								})
							}
						}
						this.rendering = false
						this.rendered = true
					}
				} else {
					return
				}
			},
			async initDownLoadImageVoiceVideo() {
				if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_EMOJI, this.$CHAT_MSG_TYPE.TYPE_VOICE].includes(this.message.cForm)) {
					this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.url)
					if (this.hasServerFileExist) { // 服务器图片、语音可用，自动下载
						this.$store.dispatch('Chat/downloadImageVoice', { msgID: this.message.id, fileInfo: {
							cForm: this.message.cForm,
							url: this.message.url || '',
							ext: this.message.ext || '',
							duration: this.message.duration || 0
						}}).then(async res => {
							// console.log('res::::', res)
							if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI) {
								this.$store.dispatch('Chat/setImagePlayerArray', {
									action: 'modify',
									targetId: this.message.id,
									data: {
										filePath: res.localPath,
										fileSize: res.fileSize
									}
								})
							}
							if (this.autoUpdate) {
								await this.$store.dispatch('Chat/updateMsg', {
									id: this.message.id,
									updatingData: res
								})
							} else {
								this._updateMessage({ data: res })
							}
							this.rendering = false
							this.rendered = true
						})
					} else { // 服务器图片、语音不可用
						if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI) {
							this.$store.dispatch('Chat/setImagePlayerArray', {
								action: 'del',
								targetId: this.message.id
							})
						}
						if (this.autoUpdate) {
							this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									localPath: 'error'
								}
							})
						} else {
							this._updateMessage({
								data: {
									localPath: 'error'
								}
							})
						}
						this.rendering = false
						this.rendered = true
					}
				} else if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.url)
					this.hasLocalFileExist = await this.$utils.fun.fileExist(this.message.localPath)
					if (this.hasLocalFileExist || this.hasServerFileExist) {
						const res = await this.$store.dispatch('Chat/makeVideoThumbnail', {
							msgID: this.message.id,
							localPath: this.message.localPath,
							url: this.message.url,
							from: this.hasLocalFileExist ? 'local' : 'web'
						})
						if (res) {
							if (this.autoUpdate) {
								await this.$store.dispatch('Chat/updateMsg', {
									id: this.message.id,
									updatingData: {
										thumbnail: res.thumbnail
									}
								})
							} else {
								this._updateMessage({ data: res })
							}
						}
						this.rendering = false
						this.rendered = true
					} else {
						if (this.autoUpdate) {
							await this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									localPath: 'error',
									thumbnail: 'error'
								}
							})
						} else {
							this._updateMessage({
								data: {
									localPath: 'error',
									thumbnail: 'error'
								}
							})
						}
						this.rendering = false
						this.rendered = true
					}
				} else if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY) {
					const replyInfo = window._.cloneDeep(this.message.replyInfo)
					if (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_IMAGE || this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_EMOJI) {
						if (await this.$utils.fun.urlExist(replyInfo.path)) {
							const fileInfo = await this.$store.dispatch('Chat/downloadImageVoice', {
								msgID: this.message.id,
								fileInfo: {
									url: replyInfo.path || '',
									cForm: replyInfo.form,
									ext: replyInfo.fileType
								}
							})
							replyInfo.localPath = fileInfo.localPath
							replyInfo.fileSize = fileInfo.fileSize
							this.$store.dispatch('Chat/setImagePlayerArray', {
								action: 'modify',
								targetId: this.message.id,
								data: {
									filePath: fileInfo.localPath,
									fileSize: fileInfo.fileSize
								}
							})
						} else {
							replyInfo.localPath = 'error'
							this.$store.dispatch('Chat/setImagePlayerArray', {
								action: 'del',
								targetId: this.message.id
							})
						}
						if (this.autoUpdate) {
							await this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									replyInfo
								}
							})
						} else {
							this._updateMessage({
								localPath: replyInfo.localPath,
								fileSize: replyInfo.fileSize || ''
							})
						}
					} else if (this.message.replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
						this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.replyInfo.path)
						this.hasLocalFileExist = await this.$utils.fun.fileExist(this.message.replyInfo.localPath)
						if (this.hasLocalFileExist || this.hasServerFileExist) {
							const res = await this.$store.dispatch('Chat/makeVideoThumbnail', {
								msgID: this.message.id,
								localPath: this.message.replyInfo.localPath,
								url: this.message.replyInfo.path,
								from: this.hasLocalFileExist ? 'local' : 'web'
							})
							replyInfo.thumbnail = res.thumbnail
							if (!this.hasLocalFileExist) replyInfo.localPath = ''
						} else {
							replyInfo.localPath = 'error'
							replyInfo.thumbnail = 'error'
						}
						if (this.autoUpdate) {
							await this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									replyInfo
								}
							})
						} else {
							this._updateMessage({
								localPath: replyInfo.localPath || '',
								thumbnail: replyInfo.thumbnail
							})
						}
						this.rendering = false
						this.rendered = true
						/* if (!this.message.replyInfo.thumbnail) {
							// 先查找本地是否有记录
							this.targetMsg = this.targetMsgInVueX
							if (!this.targetMsg) {
								const chatData = await this.$utils.sqlite.getChatData({
									where: `id='${this.message.replyInfo.id}'`
								})

								const targetInDatabase = chatData[0]
								if (targetInDatabase) {
									this.targetMsg = targetInDatabase
								}
							}
							const targetMsg = this.targetMsg
							// 本地有记录
							if (targetMsg) {
								replyInfo.thumbnail = targetMsg.thumbnail
								replyInfo.localPath = targetMsg.localPath || ''
							} else { // 本地无记录
								this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.replyInfo.path)
								this.hasLocalFileExist = await this.$utils.fun.fileExist(this.message.replyInfo.localPath)
								if (this.hasLocalFileExist || this.hasServerFileExist) {
									const res = await this.$store.dispatch('Chat/makeVideoThumbnail', {
										msgID: this.message.id,
										localPath: this.message.replyInfo.localPath,
										url: this.message.replyInfo.path,
										from: this.hasLocalFileExist ? 'local' : 'web'
									})
									replyInfo.thumbnail = res.thumbnail
								} else {
									replyInfo.localPath = 'error'
									replyInfo.thumbnail = 'error'
								}
							}
							await this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									replyInfo
								}
							})
							this._updateMessage({ data: replyInfo })
							this.rendering = false
							this.rendered = true
						} else if (!this.message.replyInfo.thumbnail && this.message.replyInfo.thumbnail !== 'error') {
							this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.replyInfo.path)
							this.hasLocalFileExist = await this.$utils.fun.fileExist(this.message.replyInfo.localPath)
							if (this.hasLocalFileExist || this.hasServerFileExist) {
								this.$store.dispatch('Chat/makeVideoThumbnail', {
									msgID: this.message.id,
									localPath: this.message.replyInfo.localPath,
									url: this.message.replyInfo.path,
									from: this.hasLocalFileExist ? 'local' : 'web'
								}).then(async res => {
									replyInfo.thumbnail = res.thumbnail
									await this.$store.dispatch('Chat/updateMsg', {
										id: this.message.id,
										updatingData: {
											replyInfo
										}
									})
									this._updateMessage({ data: res })
									this.rendering = false
									this.rendered = true
								})
							} else {
								replyInfo.localPath = 'error'
								replyInfo.thumbnail = 'error'
								await this.$store.dispatch('Chat/updateMsg', {
									id: this.message.id,
									updatingData: {
										replyInfo
									}
								})
								this.rendering = false
								this.rendered = true
							}
						} else {
							this.rendering = false
							this.rendered = true
						}*/
					}
				}
			},
			previewFile(replyInfo) {
				if (replyInfo.form == this.$CHAT_MSG_TYPE.TYPE_FILE && replyInfo.path) {
					if (!this.isSupportFileType) {
						this.$message.error(this.$t('common.filePreNoSupp'))
						return
					}
					this.openFilePlayer()
				} else {
					this._trigger()
				}
			},

			async openFilePlayer() {
				if (!this.onlineCheck()) return
				const { path, nickname, headImgUrl, groupId, fileName, userId, fileSize, id: replyMsgID, msgTime } = this.message.replyInfo || {}
				const { senderID, threadID, id, burntAfterRead, timestamp, threadType, ext } = this.message
				let relayMsgID = ''
				if (threadID && threadID.indexOf('@') > -1) { // 合并转发的消息,文件预览需要id
					relayMsgID = threadID.substring(0, threadID.indexOf('@'))
				}
				let userAvatar = headImgUrl || this.senderInfo.avatar
				let userName = nickname || this.senderInfo.name
				if (this.message.isAnoymous == 1) {
					userAvatar = {
						userName: this.$utils.message.getAvatarText(this.senderInfo.name),
						bgColor: this.$utils.message.getAvatarBgColor(this.senderInfo.name)
					}
					userName = this.senderInfo.name
				}
				this.$utils.fun.createWin({
					action: 'openFilePlayer',
					params: {
						ext,
						url: (path || this.message.url),
						filePath: path ? `${this.$store.state.Setting.fileDomainURL}${path}` : this.message.localPath,
						fileName: fileName || this.message.newFileName || this.message.fileName,
						userName,
						userAvatar,
						timestamp: msgTime || timestamp,
						messageId: relayMsgID || replyMsgID || id, // 顺序不能改，wuxl
						threadId: groupId || threadID,
						burntAfterRead,
						senderId: userId || senderID,
						fileSize: fileSize || this.message.fileSize,
						isUnreadBurntAfterReadMsg: path ? 0 : this.isUnreadBurntAfterReadMsg,
						threadType,
						// fromType: threadType === 10001 ? 3 : '', 2.3.0注释了，wxl
						fromType: 3,
						subMessageId: threadType === 10001 ? id : '' // 合并转发，子消息id
					}
				})
				if (!replyMsgID && !this.message.isSend) {
					await this.$store.dispatch('Chat/updateMsg', {
						id: this.message.id,
						updatingData: {
							triggered: 1
						}
					})
					this.$utils.chatSdk.cReadAsync(this.message.id) // 同步已读
				// if (this.isUnreadBurntAfterReadMsg) this.$utils.chatSdk.cDeleteAsync(`${this.message.id}`, '', 'true') // 删除服务器数据
				}
			},
			async openVideoPlayer(payload = {}) {
				if (this.fileLoadErr || this.selectable) return
				const inReply = this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_REPLY
				const { path, localPath: replyLocalPath, nickname, headImgUrl, groupId, userId, fileSize, id: replyMsgID, msgTime } = this.message.replyInfo || {}
				let url = this.message.url
				let localPath = this.message.localPath
				if (inReply) {
					url = path
					localPath = replyLocalPath
				}
				if (!await this.$utils.fun.fileExist(localPath)) { // 本地不存在
					let updatingData = {}
					if (!await this.$utils.fun.urlExist(url)) { // 网络上也不存在
						this.$message.error(this.$t('common.fileNotExist[0]'))
						updatingData = inReply ? {
							replyInfo: Object.assign({}, this.message.replyInfo, {
								localPath: 'error',
								thumbnail: 'error'
							})
						} : {
							localPath: 'error',
							thumbnail: 'error'
						}
					} else { // 网络上存在
						updatingData = inReply ? {
							replyInfo: Object.assign({}, this.message.replyInfo, {
								localPath: ''
							})
						} : {
							localPath: ''
						}
						this.downloadVideo(inReply)
					}
					this.$store.dispatch('Chat/updateMsg', {
						id: this.message.id,
						updatingData
					})
					return
				}
				const { senderID, threadID, id, burntAfterRead, timestamp, threadType } = this.message
				let userAvatar = headImgUrl || this.senderInfo.avatar
				let userName = nickname || this.senderInfo.name
				if (this.message.isAnoymous == 1) {
					userAvatar = {
						userName: this.$utils.message.getAvatarText(this.senderInfo.name),
						bgColor: this.$utils.message.getAvatarBgColor(this.senderInfo.name)
					}
					userName = this.senderInfo.name
				}
				this.$utils.fun.createWin({
					action: 'openVideoPlayer',
					params: {
						mute: this.mutePlay,
						filePath: localPath,
						userName,
						userAvatar,
						timestamp: msgTime || timestamp,
						messageId: replyMsgID || id,
						threadId: groupId || threadID,
						burntAfterRead,
						senderId: userId || senderID,
						fileSize: fileSize || this.message.fileSize,
						threadType
					}
				})
				if (!this.message.isSend) {
					await this.$store.dispatch('Chat/updateMsg', {
						id: this.message.id,
						updatingData: {
							triggered: 1
						}
					})
					this.$utils.chatSdk.cReadAsync(this.message.id) // 同步已读
				}
				// if (this.isUnreadBurntAfterReadMsg) this.$utils.chatSdk.cDeleteAsync(`${this.message.id}`, '', 'true') // 删除服务器数据
			},
			// 下载文件方法，通用文件和视频文件
			downloadFun(type, inReply) {
				this.$eventBus.$emit('downloadFile', {
					type,
					fromType:	'chat-1',
					id: this.parentId || this.message.id,
					filePath: inReply ? this.message.replyInfo.path : this.message.url,
					fileName: inReply ? this.message.replyInfo.fileName : (this.message.newFileName || this.message.fileName),
					other: {
						inReply,
						threadID: this.message.threadID,
						messageId: this.parentId || this.message.id,
						replyInfo: this.message.replyInfo
					}
				})
				// this.addDownloadFileWatcher(inReply ? this.message.replyInfo.id : this.message.id)
			},
			/* downloadFun123(type, inReply) {
				return new Promise((resolve, reject) => {
					// 如果在下载队列，不重复下载
					const msgId = this.message.id
					const downloadMsgID = `${msgId}|${this.message.threadID}|${this.message.senderID}` // 下载id，用于销号、撤回、群锁定等操作终止下载用
					if (this.$store.state.Chat.downloadingMsgs.indexOf(downloadMsgID) >= 0) return

					// 加入下载队列
					this.$store.commit('Chat/updateDownloadingMsgs', {
						action: 'add',
						id: downloadMsgID
					})
					this.$utils.fun
						.downloadFile({
							type,
							filePath: inReply ? this.message.replyInfo.path : this.message.url,
							fileName: inReply ? this.message.replyInfo.fileName : (this.message.newFileName || this.message.fileName),
							id: msgId
						}, async({ state, totalBytes, receivedBytes, saveFilePath }) => {
							if (state === 'canceled') {
								this.$store.commit('Chat/updateDownloadingMsgs', {
									action: 'del',
									id: downloadMsgID
								})
								this.$store.dispatch('Setting/del_fileDownloadings', msgId)
								return
							}
							if (state === 'save-error') {
								this.$store.commit('Chat/updateDownloadingMsgs', {
									action: 'del',
									id: downloadMsgID
								})
								this.$store.dispatch('Setting/del_fileDownloadings', msgId)
								this.$store.dispatch('Chat/downloadFileProgress', { msgID: msgId, progress: '' })
								this.$message.error(this.$t('common.saveStatus[1]'))
								return
							}
							const downloadUsedTime = (new Date().getTime() - this.startDownloadTime) / 1000
							this.downloadRate = this.$root.$options.filters.formatBytes(receivedBytes / downloadUsedTime) + '/S'
							const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
							if (!this.autoUpdate) {
								this._updateMessage({
									sendProgress: progress,
									downloadRate: this.downloadRate,
									data: {
										localPath: saveFilePath
									}
								})
							} else {
								this.$store.dispatch('Chat/downloadFileProgress', { msgID: msgId, progress, downloadRate: this.downloadRate })
							}

							this.$store.dispatch('Setting/update_fileDownloadings', { id: msgId, state, progress, localPath: saveFilePath })

							if (state === 'finished') {
								if (inReply) {
									// this.fileLocalPath = /^(http|https)/i.test(saveFilePath) ? saveFilePath : ('file://' + saveFilePath)
								}
								this.downloadRate = ''
								let updatingData = {
									localPath: saveFilePath
								}
								if (inReply) {
									updatingData = {
										replyInfo: Object.assign({}, this.message.replyInfo, { localPath: saveFilePath })
									}
								}
								if (this.message.triggered != 1 && this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
									updatingData.triggered = 1
									this.$utils.chatSdk.cReadAsync(this.message.id) // 同步已读
								}
								// 通知fileplayer窗口更改文件状态
								if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
									this.$utils.fun.setPlayerWin({
										messageId: this.message.id,
										filePath: saveFilePath,
										playerType: this.$CHAT_MSG_TYPE.TYPE_FILE
									})
								}
								// 更新数据库
								await this.$store.dispatch('Chat/updateMsg', {
									id: msgId,
									updatingData
								})

								this._updateMessage(updatingData)

								// 从下载队列删除
								this.$store.commit('Chat/updateDownloadingMsgs', {
									action: 'del',
									id: downloadMsgID
								})
								this.$store.dispatch('Setting/del_fileDownloadings', msgId)
								resolve()
							} else if (state === 'abort') {
								this.downloadRate = ''
								if (!this.autoUpdate) {
									this._updateMessage({
										sendProgress: ''
									})
								} else {
									this.$store.dispatch('Chat/downloadFileProgress', { msgID: msgId, progress: '' })
								}

								// 从下载队列删除
								this.$store.commit('Chat/updateDownloadingMsgs', {
									action: 'del',
									id: downloadMsgID
								})
								this.$store.dispatch('Setting/del_fileDownloadings', msgId)
								resolve()
							}
						})
				})
			},*/
			// 下载视频文件
			async downloadVideo(inReply) {
				if (!this.onlineCheck()) return
				const id = this.parentId || this.message.id
				if (!await this.$utils.fun.urlExist(inReply ? this.message.replyInfo.path : this.message.url)) {
					this.$message.error(this.$t('common.fileNotExist[0]'))
					if (inReply) {
						this.$store.dispatch('Chat/updateMsg', {
							id,
							updatingData: {
								replyInfo: Object.assign({}, this.message.replyInfo, {
									localPath: 'error',
									thumbnail: 'error'
								})
							}
						})
					} else {
						this.$store.dispatch('Chat/updateMsg', {
							id,
							updatingData: {
								localPath: 'error',
								thumbnail: 'error'
							}
						})
					}
					return
				}
				const progress = inReply === true ? this.message.replyInfo.sendProgress : this.message.sendProgress
				if (progress === undefined || progress === 100) {
					this.startDownloadTime = new Date().getTime()
					// await this.downloadFun(this.$CHAT_MSG_TYPE.TYPE_VIDEO, inReply === true)
					this.downloadFun(this.$CHAT_MSG_TYPE.TYPE_VIDEO, inReply === true)
					return Promise.resolve()
				}
			},
			// 终止发送或下载文件
			async abortDownloadFile() {
				this.openAfterDownLoad = false
				const id = this.parentId || this.message.id
				if (await this.$utils.fun.fileExist(this.message.localPath) && this.message.isSend === 1) { // 文件存在，且是发送方取消,则是发送
					// this.$utils.chatSdk.cUploadCancel(this.message.uploadKey)
					this.$store.dispatch('Chat/delMsg', {
						ids: [id],
						threadID: this.message.threadID
					})
				} else { // 文件不存在，则是下载
					this.$utils.fun.abortDownloadFile(id)
					// this.$store.dispatch('Chat/abortDownloadFileBySDK', { msgId: this.message.id })
				}

				// 从下载队列删除
				this.$store.commit('Chat/updateDownloadingMsgs', {
					action: 'del',
					id: `${id}|${this.message.threadID}|${this.message.senderID}`
				})
			},
			// 下载文件
			async downloadFile() {
				if (this.isClickDownloadBtn) return
				this.isClickDownloadBtn = true
				if (!this.onlineCheck()) return
				this.hasServerFileExist = await this.$utils.fun.urlExist(this.message.url)
				if (!this.hasServerFileExist) {
					this.$message.error(this.$t('common.FileExpired'))
					this.$store.dispatch('Chat/updateMsg', {
						id: this.parentId || this.message.id,
						updatingData: {
							localPath: 'error'
						}
					})
					this.isClickDownloadBtn = false
					return
				}
				this.downloadFun(this.$CHAT_MSG_TYPE.TYPE_FILE)
				this.isClickDownloadBtn = false
			},
			async openFileMenu({ key }) {
				const inReply = this.message.inReply
				const localPath = this.message.localPath
				const url = this.message.url
				if (!await this.$utils.fun.fileExist(localPath)) {
					if (!this.onlineCheck()) return
					if (await this.$utils.fun.urlExist(url)) {
						this.$message.error(this.$t('common.fileNotExist[2]'))
						if (inReply || !this.autoUpdate) {
							this._updateMessage({
								id: this.message.id,
								localPath: ''
							})
						} else {
							this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									localPath: ''
								}
							})
						}
					} else {
						this.$message.error(this.$t('common.FileExpired'))
						if (inReply) {
							this._updateMessage({
								localPath: 'error'
							})
						} else {
							this.$store.dispatch('Chat/updateMsg', {
								id: this.message.id,
								updatingData: {
									localPath: 'error'
								}
							})
						}
					}
					return
				}
				switch (key) {
				case '0':
					this.$utils.fun.openFile(this.message.localPath)
					break
				case '1':
					this.$utils.fun.openFolder(this.message.localPath)
					break
				}
			},
			audioLoadError(e) {
				// if (!this.fileLocalPath) return
				this.audioLoadErr = true
				this.playerWidth = 'auto'
			},
			_showReadStatus(e) {
				if (
					this.selectable ||
					this.message.threadType != 1 ||
					this.message.unreadCount == 0
				) {
					return
				}

				this.$emit('showReadStatus', {
					id: this.message.id,
					threadID: this.message.threadID,
					cForm: this.message.cForm,
					unreadCount: this.message.unreadCount,
					x: e.x,
					y: e.y
				})
			},

			// 点击泡泡触发对应事件
			async _trigger(e) {
				if (this.selectable) return
				if (this.isUnreadBurntAfterReadMsg) {
					if (!this.onlineCheck()) return
					if (this.message.cForm !== this.$CHAT_MSG_TYPE.TYPE_VIDEO) { // 视频文件在用户点击前没有下载，所以不能点击就删除服务器的数据。
						await this.$store.dispatch('Chat/updateMsg', {
							id: this.message.id,
							updatingData: {
								triggered: 1
							}
						})
						if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VOICE) this.playVoice()
					} else if (this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VIDEO) { // 视频文件单独处理
						if (this.message.sendProgress === undefined || this.message.sendProgress === 100) { // 在下载中不能再次点击下载
							// await this.downloadVideo()
							// this.openVideoPlayer()
							this.openAfterDownLoad = true
							this.downloadVideo(false)
						}
					}
					this.$utils.chatSdk.cReadAsync(this.message.id) // 同步已读
					this.$utils.chatSdk.cDeleteAsync(this.message.id, JSON.stringify({ burntAfterRead: 1 }), 'true')// 删除服务端数据
					return
				}
				// console.log('this.message.cForm:::', this.message.cForm)
				switch (this.message.cForm) {
				case this.$CHAT_MSG_TYPE.TYPE_TEXT: // 文字，聊天记录
					if (e.target.tagName.toLowerCase() === 'a') {
						e.preventDefault()
						this.$utils.fun.openExternal(e.target.textContent)
					}
					break
				case this.$CHAT_MSG_TYPE.TYPE_IMAGE: // 图片
					break
				case this.$CHAT_MSG_TYPE.TYPE_FILE: // 文件
					break
				case this.$CHAT_MSG_TYPE.TYPE_VOICE: // 语音
					this.playVoice()
					break
				case this.$CHAT_MSG_TYPE.TYPE_VIDEO: // 视频
					this.$emit('trigger', { form: this.message.cForm })
					break
				case this.$CHAT_MSG_TYPE.TYPE_CHATRECORD: // 聊天记录
					const data = this.message.data
					this.$emit('readChatRecords', {
						id: this.message.id,
						threadID: this.message.threadID,
						title: data.title,
						from: window.$moment(data.items[0].msgTime).format('YYYY-MM-DD'),
						to: window.$moment(data.items[data.items.length - 1].msgTime).format('YYYY-MM-DD')
					})
					break
				case this.$CHAT_MSG_TYPE.TYPE_CARD: // 名片
					this.$emit('show-user-card', this.message.data.userId)
					break
				case this.$CHAT_MSG_TYPE.TYPE_NOTE: // 笔记
					this.$emit('trigger', { form: this.message.cForm, content: this.message.data.content || this.message.data, noteId: this.message.data.noteId || '' })
					break
				case this.$CHAT_MSG_TYPE.TYPE_REPLY: // 回复
					if (this.message.status != 1) return
					if (e && e.target.tagName.toLowerCase() === 'a') {
						e.preventDefault()
						this.$utils.fun.openExternal(e.target.href || e.target.textContent)
					}
					this.$emit('trigger', { form: this.message.cForm, data: Object.assign({}, this.message, {
						senderName: this.senderInfo.name,
						senderAvater: this.senderInfo.avatar,
						imgWidth: this.imageWidth,
						imgHeight: this.imageHeight
					})
					})
					break
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO: // 语音通话
					if (!this.message.isSend && this.message.triggered == 0) {
						await this.$store.dispatch('Chat/updateMsg', {
							id: this.message.id,
							updatingData: {
								triggered: 1
							}
						})
					}
					let isNeedCall = false // 是否需要回拨/重拨
					switch (this.message.data.form) {
					case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_CANCEL:
						if (!this.message.isSend) {
							break
						}
					// falls through
					case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REJECT:
					case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_BUSY:
					case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_TIMEOUT:
						isNeedCall = true
					}
					if (isNeedCall) {
						if (!this.onlineCheck()) return
						this.$emit('realAudio')
					}
				}
			},

			delMsg() {
				this.changeVisible(false)
				this.$emit('delMsg', {
					id: `msg${this.message.id}`
				})
			},
			collectMsg() {
				if (this.fileLoadErr && this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					this.$message.error(this.$t('common.fileNotExist[0]'))
					return
				} else if (this.fileLoadErr && this.message.cForm === this.$CHAT_MSG_TYPE.TYPE_IMAGE) {
					this.$message.error(this.$t('common.fileNotExist[1]'))
					return
				}
				this.$store.dispatch('Chat/addCollect', {
					collectID: this.message
				}).then(res => {
					if (res.code === 0 || res.code === 2026) this.$message.success(this.$t('favorite.collectionSuccess'))
					if (res.code === 2028) this.$message.error(this.$t('common.FileExpired'))
				})
			},
			withdraw() {
				this.changeVisible(false)
				this.$emit('withdraw')
			},
			avatarLoadSucc() {
				this.avatarLoadFinish = true
			},
			async copy() {
				this.changeVisible(false)
				if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_IMAGE) {
					const localPath = this.message.localPath
					if (!localPath) return
					this.$utils.fun.writeToClipboard({ imgPath: localPath })
				} else {
					const selectionContent = this.$utils.selection.getSelectionContent()
					if (selectionContent) {
						this.$utils.fun.writeToClipboard(selectionContent)
					} else {
						const dom = this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY ? this.$refs.reply_content : this.$refs.bubble_text
						this.$utils.fun.writeToClipboard({
							html: this.message.mType === 'link' ? '' : dom.innerHTML.split('<i ')[0],
							// html: '',
							text: this.message.text
						})
						if (this.message.mType === 'link') this.$message.success(this.$t('common.copyStatus[0]', [this.$t('common.link')]))
					}
				}
			},
			multiSelect() {
				this.changeVisible(false)
				this.$emit('multiSelect', `msg${this.message.id}`)
			},
			share() {
				this.changeVisible(false)
				this.$emit('share', this.message)
			},
			changeVisible(visible) {
				// 如果打开右键菜单，若有选中内容，则右键菜单只保留复制按钮
				if (visible) {
					this.initContextmenuItems()
					// const sel = window.getSelection()// 光标数据
					// if (sel && sel.rangeCount > 0) {
					// 	const range = sel.getRangeAt(0)
					// 	// 判断光标是否在当前泡泡内，且有选中内容
					// 	if (!range.collapsed) {
					// 		if (range.endContainer.parentNode.id == this.message.id) {
					// 			this.hasSelection = true
					// 		} else {
					// 			this.hasSelection = false
					// 			// range.collapse()
					// 		}
					// 	} else {
					// 		this.hasSelection = false
					// 	}
					// }
				}
				this.$store.dispatch('OPcomponent/set_bubbleRightMenuVisible', visible)
			},
			resetMouseRight(e) {
				if (this.$utils.os.isMac) {
					if (!this.selectionTxt || this.selectionTxt !== window.getSelection().toString()) {
						window.getSelection().removeAllRanges()
					}
				}
			},
			mouseHandle(e) {
				// 用于修复mac里右键默认选中文本
				if (this.$utils.os.isMac) {
					this.selectionTxt = ''
					if (e.type === 'mousedown' && e.which === 3) {
						this.selectionTxt = window.getSelection().toString()
					}
				}
				// 没有多选，没有拖动，没有打开右键菜单时候，阻止冒泡，修复文本不可选的问题
				if (
					!this.selectable &&
					!this.isDrag &&
					!this.bubbleRightMenuVisible
				) {
					e.stopPropagation() // 阻止事件冒泡
				}

				if (this.selectable) e.preventDefault()
			},
			imageLoad() {
				// console.log('imageLoad')
				// this._presetImgSize(this.message.width, this.message.height)
				this.imageLoadFinish = true
				this.imageDownloadFinish = true
				this.rendered = true
			},
			async fileLoadError(e) {
				// console.log('fileLoadError', this.message.cForm, this.fileLocalPath)
				// 下载过一次，报错显示重试按钮
				if (this.fileLocalPath.indexOf('error') > -1) {
					// this.errorImg = noimg
					// this.fileLoadErr = true
					this.imageLoadFinish = true
					this.imageDownloadFinish = true
				} else if (this.fileLocalPath !== '') { // 本地路径有，但加载失败，尝试从服务器重新下载
					this.imageDownloadFinish = false
					await this.initDownLoadImageVoiceVideo()
				}
			},
			showUserInfo() {
				this.reloadAvatar()

				if (
					this.selectable ||
					this.message.threadType == 10001 ||
					this.message.isAnoymous == 1
				) {
					return
				}

				this.$emit('show-user-card', this.message.senderID)
			},
			async openImagePlayer() {
				if (this.fileLoadErr || this.selectable) return
				if (this.message.cForm == this.$CHAT_MSG_TYPE.TYPE_EMOJI && /@/.test(this.message.threadID)) return// 合并转发的表情不支持预览
				const { nickname, headImgUrl, groupId, userId, fileSize } = this.message.replyInfo || {}
				const { senderID, threadID, id, burntAfterRead, timestamp, threadType } = this.message
				let fileLocalPath = this.fileLocalPath ? (this.$utils.os.isMac ? this.fileLocalPath.replace('file://', '') : this.fileLocalPath.replace('file:///', '').replace('file://', '')) : ''
				if (!/^(http|https)/i.test(fileLocalPath) && fileLocalPath && !await this.$utils.fun.fileExist(fileLocalPath)) {
					fileLocalPath = ''
				}
				// console.log('fileLocalPath :::', this.$store.state.Chat.imagePlayerArray)
				this.$utils.fun.createWin({
					action: 'openImagePlayer',
					params: {
						filePath: fileLocalPath,
						userName: nickname || this.senderInfo.name,
						userAvatar: headImgUrl || this.senderInfo.avatar,
						timestamp: timestamp,
						messageId: id,
						threadId: groupId || threadID,
						burntAfterRead,
						senderId: userId || senderID,
						fileSize: fileSize || this.message.fileSize,
						imageArray: this.$store.state.Chat.imagePlayerArray,
						threadType
					}
				})
			},
			finishLoadVoice() {
				this.duration = this.message.duration || parseInt(this.player.duration)
				this.playerWidth = 5 * this.duration + 75 + 'px'
			},
			async playVoice() {
				if (this.selectable || this.audioLoadErr) return
				const oldPlay = this.$store.state.Setting.currentPlayVoice
				if (oldPlay && oldPlay.id !== this.player.id) {
					oldPlay.pause()
					oldPlay.currentTime = 0
					this.$store.dispatch('Setting/set_currentPlayVoice', '')
				}
				this.player.currentTime = 0
				if (!this.player.paused) {
					this.player.pause()
				} else {
					if (!this.message.isSend && this.message.triggered != 1) {
						await this.$store.dispatch('Chat/updateMsg', {
							id: this.message.id,
							updatingData: {
								triggered: 1
							}
						})
						this.$utils.chatSdk.cReadAsync(this.message.id) // 同步已读
					}

					this.player.play()
					if (this.timer) clearInterval(this.timer)
					this.timer = setInterval(() => {
						if (this.player.paused || this.player.currentTime === 0) {
							this.playTime = 3
							clearInterval(this.timer)
						} else {
							this.playTime = this.playTime === 3 ? 1 : ++this.playTime
						}
					}, 280)
					this.$store.dispatch('Setting/set_currentPlayVoice', this.player)
				}
			},

			_resend() {
				this.changeVisible(false)
				if (this.banned) {
					this.$message.error(this.$t('chat.mutteringTip1[1]'))
					return
				}
				this.$emit('resend', this.message)
			},

			_reply() {
				this.changeVisible(false)
				if (this.banned) {
					this.$message.error(this.$t('chat.mutteringTip1[0]'))
					return
				}
				this.$emit('reply', Object.assign({}, this.message, {
					isSend: 0,
					senderName: this.senderInfo.name,
					senderAvater: this.senderInfo.avatar,
					imgWidth: this.imageWidth,
					imgHeight: this.imageHeight
				}))
			}
		}
	}
</script>

<style lang="scss">
	$border-radius-width: 6px;
	#content {
		.bubble-right-menu {
			min-width: 50px !important;
		}
	}
	.realAudio{
		.btn{
			display: inline-block;
			margin-left: 10px;
			color: #2E87FF;
			cursor: pointer;
		}
		&.no-play:after{
			top: 17px;
		}
	}
	.chatBubble {
		width: 100%;
		position: relative;
		padding-bottom: 20px;
		.video-bg{
			background: {
				image: url('~@/assets/img/video-bg.png');
				color: #e6e6e6;
				position: center center;
				repeat: no-repeat;
				size: 60px;
			}
		}
		&.twinkle{
			animation:fadeout 3s 1;
		}

		@keyframes fadeout
		{
			0% {background:#E9F3FC;}
			70%{background:#E9F3FC;}
			100% {background:#F6F7F8;}
		}

		.disabled{
			pointer-events: none;
		}

		&.selected {
			background: #f0f0f0;
		}

		&.selectable .bubble {
			cursor: pointer;
			width: auto;
			padding-left: 30px;

			.message {
				user-select: none !important;
			}

			.checkbox {
				display: block;
			}

			&:after {
				content: "";
				display: block;
				clear: both;
			}
		}

		.bubble-tip {
			font-size: 12px;
			line-height: 16px;
			margin-bottom: 15px;
			color: rgba(153, 153, 153, 1);
			text-align: center;
			user-select: text;
			word-break: break-word;
			word-wrap: break-word;
			padding-left: 20px;
			padding-right: 25px;
			span {
				color: $darkBlue;
				font-weight: 500;
				text-indent: 10px;
				cursor: pointer;
			}
		}

		.bubble {
			position: relative;
			width: 100%;
			transition: padding .1s ease-out;
			&:after {
				content: "";
				display: block;
				clear: both;
			}

			.checkbox {
				position: absolute;
				left:0;
        		top:0;
				display: none;
				text-align: center;
				width: 40px;
				line-height: 40px;
				.ant-checkbox-inner {
					border-radius: 50%;
				}
			}

			.bubble-body {
				display: flex;
				max-width: 60%;
				float: left;
				.get-web-loading{
					padding-top: 5px;
					border-top: 1px solid #ccc;
					margin-top: 5px;
				}
				.message-body {
					position: relative;
				}
				.avatar {
					flex-shrink: 0;
					margin-right: 10px;
					margin-left: 30px;
					width: 40px;
					height: 40px;
					border-radius: 50%;
					text-align: center;
					line-height: 40px;
					color: #fff;
					cursor: pointer;
					background: {
						size: 100%!important;
						image: url($defaultAvatargeren);
					}
					&.notify {
						border-radius: 50%;
						cursor: default;
					}
					&.avatarLoadFinish{
						background: #fff!important;
					}
				}
			}
			.link-message{
				background: #fff!important;
				user-select: none!important;
				.link-message-title, .link-message-link{
					cursor: pointer;
					color: #2e87ff;
					font-size: 14px;
					word-wrap: break-word;
					word-break: break-all;
					display: -webkit-box;
					-webkit-line-clamp: 3;
					-webkit-box-orient: vertical;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				.link-message-link{
					margin-right: 20px;
					cursor: default;
				}
				.link-message-description{
					display: -webkit-box;
					color: #999;
					font-size: 14px;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 180%;
					padding: 5px 0 0 0;
					word-wrap: break-word;
					word-break: break-all;
				}
			}
			.loading {
				position: absolute;
				top: 0;
				left: -18px;
			}

			.status {
				position: absolute;
				left: -30px;
				top: 50%;
				margin-top: -13px;
				color: red;
				font-size: 26px;
				cursor: pointer;
			}

			.unreadCount {
				position: absolute;
				min-width: 100px;
				text-align: right;
				right: 0;
				bottom: -20px;
				line-height: 12px;
				font-size: 12px;
				color: $darkBlue;
				&.allRead {
					color: #999;
				}
				&.clickable {
					cursor: pointer;
				}
			}

			.nickName {
				color: #666;
				margin-bottom: 2px;
				font-size: 12px;
			}
			.Progress-bar {
				width: 100%;
				overflow:auto;
				&.file-bar{
					.track{
						margin-right: 20px;
						margin-top: 7px;
					}
					.cancel{
						display:block
					}
				}
				.cancel{
					display:none;
					float: right;
					cursor: pointer;
					height: 16px;
					overflow: hidden;
					line-height: 16px;
				}
				.track {
					margin-top: 2px;
					border-radius: 2px;
					transition: opacity 0.2s;
					background: #ebeaea;
					overflow: hidden;
					height: 2px;
				}
				span {
					display: block;
					background: #2e87ff;
					height: 100%;
					width: 0%;
					transition: width 0.2s;
				}
			}
			.message {
				display: inline-block;
				word-break: break-word;
				background: #fff;
				padding: 11px 11px;
				box-sizing: border-box;
				border: 1px solid rgba(230, 230, 230, 1);
				border-radius: $border-radius-width 0px $border-radius-width $border-radius-width;
				color: rgba(51, 51, 51, 1);
				cursor: default;

				a, a:active, a:visited, a:focus{
					color: #2e87ff!important;
				}

				.emoji {
					width: 20px;
					height: 20px;
				}

				.iconyuehoujifenkaiqi {
					z-index: 2;
					vertical-align: middle;
					display: none;
				}

				&.no-play:after {
					content: "";
					display: block;
					width: 8px;
					height: 8px;
					background: #f00;
					border-radius: 50%;
					position: absolute;
					right: -20px;
				}

				&.text {
					user-select: text;
					cursor: text;
					font-size: 14px;
					padding:10px;
					line-height: 22px;
					white-space: pre-line;

					.notify-title{
						font-size: 14px;
						color:#333;
						line-height: 18px;
						padding-bottom:10px;
						white-space: normal;
						border-bottom:1px solid #e5e5e5;
						margin-bottom:6px;
					}
				}

				&.reply{
					padding-bottom: 0;
					cursor: pointer;
					width:350px;
					&.text{
						width:auto;
					}

					.target-info{
						border-left:1px solid #E6E6E6;
						color:#999;
						font-size: 12px;
						line-height: 15px;
						padding-left: 8px;
						.emoji{
							width: 14px!important;
							height: 14px!important;
						}
						.target-sender{
							margin-bottom: 5px;
							line-height: 12px;
						}
						.target-content{
							display: -webkit-box;
							max-width: 100%;
							overflow: hidden;
							-webkit-line-clamp: 3;
							-webkit-box-orient: vertical;
						}
					}

					.reply-content{
						margin-top: 8px;
						padding-top: 11px;
						padding-bottom: 8px;
						line-height: 20px;
						font-size: 14px;
						border-top: 1px solid #E6E6E6;
						user-select: text;
						cursor: text;
					}

					.reply-btn{
						font-size: 12px;
						color:#666;
						text-align: center;
						border-top:1px solid #E6E6E6;
						padding:11px 0;
						margin-top:9px;
					}

				}

				&.file {
					width: 300px;
					background: #fff !important;
					padding: 0 !important;
					border-color: #E6E6E6;
					.Progress-bar{
						.track{
							margin-right: 20px;
							margin-top: 7px;
						}
						.cancel{
							float: right
						}
					}
					.file-name-icon {
						height: 80px;
						width: 95%;
						margin: 0 auto 0;
						overflow: auto;
						cursor: pointer;
						.icon {
							width: 40px;
							height: 50px;
							@include retinize('file-icon/other');
							margin: 14px 0 0 10px;
							float: left;

							&.txt {
								@include retinize('file-icon/txt');
							}

							&.xls, &.xlsx {
								@include retinize('file-icon/excel');
							}

							&.html {
								@include retinize('file-icon/html');
							}

							&.key {
								@include retinize('file-icon/key');
							}

							&.pdf {
								@include retinize('file-icon/pdf');
							}

							&.ppt, &.pptx {
								@include retinize('file-icon/ppt');
							}

							&.docx, &.doc {
								@include retinize('file-icon/word');
							}

							&.zip, &.rar {
								@include retinize('file-icon/zip');
							}
						}

						.file-name {
							margin: 14px 0 0 65px;

							.name {
								cursor: pointer;
								color: #333;
								line-height: 130%!important;
								display: -webkit-box;
								-webkit-line-clamp: 2;
								-webkit-box-orient: vertical;
								overflow: hidden;
							}

							.size {
								color: #999;
								font-size: 12px;
								overflow:hidden;
								text-overflow:ellipsis;
								white-space:nowrap
							}
						}
					}

					.btns {
						height: 30px;
						display: flex;
						width: 95%;
						align-items: center;
						border-top: 1px solid #E6E6E6;
						margin: auto;

						& > div {
							flex-grow: 1;
							color: #2E87FF;
							text-align: center;

							&.readonlinebtn {
								border-right: 1px solid #E6E6E6
							}
						}
					}
				}

				// 名片
				&.card {
					padding: 0;
					width: 250px;
					background: #fff !important;
					border: 1px solid rgba(230, 230, 230, 1) !important;
					cursor: pointer;
					.info {
						height: 60px;
						width: 100%;
						display: flex;
						align-items: center;
						.pic {
							width: 40px;
							height: 40px;
							border-radius: 50%;
							overflow: hidden;
							margin-right: 15px;
							margin-left: 10px;
							img {
								width: 40px;
								height: 40px;
							}
						}
						.name {
							font-size: 14px;
							color: #333;
							width: 190px;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
					}

					&.note .info{
						height: auto;
						display: block;
						padding:8px 10px;

						.note-txt{
							font-size: 14px;
							line-height: 18px;
							margin-bottom: 0;
							display: -webkit-box;
							-webkit-line-clamp: 2;
							-webkit-box-orient: vertical;
							overflow: hidden;
						}
						.note-imgs{
							margin-top: 11px;
							display: flex;
							align-items: center;
							height: 45px;
							img{
								width: 45px;
								height: 45px;
								margin-right: 12px;
							}
						}
					}
					.line {
						border-top: 1px solid #e6e6e6;
						font-size: 12px;
						color: #999;
						padding: 6px 0 6px 12px;
					}
				}

				// 聊天记录
				&.chat-records {
					width: 290px;
					padding: 0;
					background: #fff !important;
					border: 1px solid #e6e6e6 !important;
					cursor: pointer !important;

					.chat-records-title,
					.chat-records-preview div {
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.chat-records-title {
						padding: 0 13px;
						font-size: 16px;
						color: #333;
						line-height: 39px;
						border-bottom: 1px solid rgba(230, 230, 230, 1);
					}

					.chat-records-preview {
						padding: 9px 13px;
						font-size: 14px;
						color: #999;

						div {
							margin-bottom: 4px;
						}
					}
				}

				//语音
				&.voice {
					max-width: 350px;
					min-width: 85px;
					display: flex;
					align-items: center;
					position: relative;
					cursor: pointer;
					user-select: none;
					padding-left: 14px;
					.iconbofang {
						width: 20px;
						height: 21px;
						font-size: 20px;
						margin-right: 5px;
					}

					audio {
						display: none;
					}
				}
				&.videoFile {
					line-height: normal;
					.video-info{
						position: absolute;
						bottom: 0px;
						width: 100%;
						color: #fff;
						padding: 10px 0 11px 11px;
						background-image: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.5));
						.video-info-name{
							height: 15px;
							margin-right: 50px;
							overflow: hidden;
							text-overflow:ellipsis;
							white-space: nowrap;
						}
						p{
							display: inline-block;
							margin: 0 0 0 10px;
						}
					}
					.video-mask {
						position: absolute;
						z-index: 2;
						height: 100%;
						width: 100%;
						// background: rgba(0, 0, 0, .4);
						color: #fff;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 12px;
						.download, .play, .progress{
							color:#fff;
							cursor: pointer;
							font-size: 50px!important;
							display: flex;
							height: 100%;
							width: 100%;
							align-items: center;
							justify-content: center;
							.download-btn{
								font-size: 25px;
								position: absolute;
								right: 11px;
								bottom: 11px;
							}
						}
						.progress{
							.circle{
								position: absolute;
								right: 11px;
								bottom: 11px;
							}
							.cancel{
								position: absolute;
								right: 18px;
								bottom: 17px;
								font-size: 14px;
							}
						}
					}
				}
				//图片,视频文件
				&.pic, &.videoFile {
					position: relative;
					padding: 0;
					width: 100%;
					border: none !important;
					background: none !important;
					user-select: none;

					span {
						display: block;
						overflow: hidden;
						background: {
							repeat: no-repeat;
							size: cover;
							position: center center;
						}
						position: relative;
					}

					.watermark {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						display: none;
						align-items: center;
						justify-content: center;
						flex-direction: column;
						z-index: 2;
						color: #fff;
						background: rgba(0, 0, 0, 0.2);
						border-radius: 0px $border-radius-width $border-radius-width $border-radius-width;
						cursor: pointer;

						.iconfont {
							font-size: 50px;
						}

						.tip {
							color: #fff;
							font-size: 14px;
							font-weight: 400;
							text-align: center;
						}
					}
				}

				&.burntAfterRead {
					.watermark {
						display: flex;
					}
				}
			}

			.loading-class {
				display: block !important;

				.ant-spin-container {
					display: block !important;
				}
			}

			.loading-class .ant-spin {
				border: 1px solid #ccc;
				border-radius: 0 $border-radius-width $border-radius-width $border-radius-width;
			}

			&.send {
				padding-bottom: 20px;
				.bubble-body {
					float: right;
					flex-direction: row-reverse;
					.avatar{
						margin-right: 30px;
						margin-left: 10px;
					}
				}
				.loading-class .ant-spin {
					border-radius: $border-radius-width 0 $border-radius-width $border-radius-width;
				}
				.nickName {
					text-align: right;
				}
				.message {
					position: relative;
					background: #d9f0ff;
					border-radius: $border-radius-width 0px $border-radius-width $border-radius-width;

					&.text,&.reply,&.voice{border-color:#C0DAE8!important;}

					&.no-play:after {
						right: auto;
						left: -20px;
						display: none;
					}
					&.voice {
						flex-direction: row-reverse;
						.iconbofang, .iconbofang--, .iconbofang--1 {
							transform: rotateY(180deg);
							margin-right: 0;
							margin-left: 5px;
						}
					}

					&.pic span, &.videoFile span {
						border-radius: $border-radius-width 0px $border-radius-width $border-radius-width;
					}
				}
				.target-info{
					border-left-color: #c0dae8!important
				}
				.reply-content{
					border-top-color: #c0dae8!important;
				}
				&.burn-after-read .iconyuehoujifenkaiqi {
					position: absolute;
					display: block;
					left: -4px;
					top: -8px;
					width: 18px;
					height: 18px;
					font-size: 16px;
					text-align: center;
					line-height: 18px;
					color: #fff;
					background: #ff5a39;
					border-radius: 50%;
				}
			}

			&.get {
				.message {
					border-radius: 0px $border-radius-width $border-radius-width $border-radius-width;
				}

				.status {
					left: auto;
					right: -30px;
				}

				.pic span,.videoFile span {
					border-radius: 0px $border-radius-width $border-radius-width $border-radius-width!important;
				}
			}

			&.get.burn-after-read {
				.iconyuehoujifenkaiqi {
					position: absolute;
					display: block;
					width: 18px;
					height: 18px;
					font-size: 16px;
					text-align: center;
					line-height: 18px;
					right: -4px;
					top: -8px;
					color: #fff;
					background: #ff5a39;
					border-radius: 50%;
					z-index: 3;
				}

				.pic span img, .videoFile span video, .videoFile span img {
					filter: blur(15px);
				}

				.text {
					cursor: pointer;
				}

				&.triggered {
					.iconyuehoujifenkaiqi {
						background: #c6c6c6;
					}

					.pic span img, .videoFile span video, .videoFile span img {
						filter: none;
					}
				}
			}
		}
	}
</style>

