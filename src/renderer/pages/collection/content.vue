<template>
	<div id="collection_content" ref="collection_content">
		<template>
			<h3	class="title">
				{{headertext}}
				<template v-if="selectingType === 'note'">
					<a-tooltip placement="left" :title="$t('common.addNote')">
						<i class="iconfont iconxinjianbiji" style="float: right;font-size:20px;margin-right:20px;-webkit-app-region: no-drag" @click="$emit('write')"></i>
					</a-tooltip>
				</template>
			</h3>
			<div class="collect_alllist" ref="collection">
				<a-spin :spinning="collectloading">
					<a-dropdown
						overlayClassName="right-menu"
						:getPopupContainer="() => $refs.collection"
						:trigger="['contextmenu']"
						v-for="(item, index) in allCollectList"
						:key="'collection-item'+ index"
					>
						<div class="collect_list" :key="'collection-item'+ index">
							<!--收藏表情、文本、链接-->
							<div class="collect_txt" v-if="item.form === $CHAT_MSG_TYPE.TYPE_TEXT && selectingType === 'all'" @click.stop="opendetail(item)">
								<!--头部名称和时间-->
								<AAlist-item class="tittle" :title="item.meta.nickName" :key="'myFriends-tittle'">
									<template v-slot:right>
										<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
									</template>
								</AAlist-item>

								<!--内容-->
								<div class="collect_text" style="cursor: pointer" v-if="!$utils.fun.validUrl(item.content)">
									<p class="noimage" style="margin:0" v-if="item.form === $CHAT_MSG_TYPE.TYPE_TEXT" v-html="formatedMsg(item.content)">
									</p>
								</div>
								<div v-else class="collect_link">
									<div class="canread">
										<div class="left">
											<img src="~@/assets/img/lianjie@2x.png" alt="">
										</div>
										<div class="right" v-if="item.meta.data && item.meta.data.webTitle !== ''">
											<h2>{{item.meta.data.webTitle}}</h2>
											<div v-html="item.meta.data.webDescription"></div>
										</div>
										<div class="right" v-else>
											<h2 v-if="item.meta.state !== 5">
												{{$t('common.aboutShare[3]')}}
											</h2>
											<div v-if="item.meta.state !== 5">
												{{item.content}}
											</div>
											<p v-if="item.meta.state === 5">
												{{$t('common.identifyLink')}}...
											</p>
										</div>
									</div>
								</div>

								<!-- <template v-if="message.mType === 'link'">
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
								<div ref="bubble_text"></div>
							</template> -->

								<a-dropdown :trigger="['click']" class="right_btn">
									<a class="iconfont icongengduo1 ant-dropdown-link" @click="e => e.stopPropagation()">
									</a>
									<a-menu slot="overlay">
										<a-menu-item key="1" @click="share(item)">
											{{$t('common.relay')}}
										</a-menu-item>
										<a-menu-item key="2" @click="delcollect(item)">
											{{$t('common.delete')}}
										</a-menu-item>
									</a-menu>
								</a-dropdown>
							</div>

							<div class="collect_txt" v-if="item.form === $CHAT_MSG_TYPE.TYPE_LOCATION && selectingType === 'all'">
								<!--头部名称和时间-->
								<AAlist-item class="tittle" :title="item.meta.nickName" :key="'myFriends-tittle'">
									<template v-slot:right>
										<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
									</template>
								</AAlist-item>
								<div class="collect_text">
									{{$t('location.notSupport')}}
								</div>
							</div>

							<!--收藏笔记-->
							<div class="collect_note" v-if="item.form === $CHAT_MSG_TYPE.TYPE_NOTE && (selectingType === 'note' || selectingType === 'all')" @click="opendetail(item)">
								<!--头部名称和时间-->
								<AAlist-item class="tittle" :title="$t('common.note') + ' <i>|</i> ' + item.meta.nickName" :key="'myFriends-tittle'">
									<template v-slot:right>
										<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
									</template>
								</AAlist-item>
								<!--笔记内容-->
								<div class="collect_text" style="cursor: pointer">
									<div class="left" v-if="item.form === $CHAT_MSG_TYPE.TYPE_NOTE && getsrc(replaceimg(item.content)) !== ''">
										<!--<img :src="$store.state.Setting.fileDomainURL + item.content.match(/<img.*?(?:>|\/>)/gi)[0]" alt="" @error="e => fileLoadError(e, item)" v-if="!imgageerrors[item.id]">-->
										<!--<p v-html="getsrc(replaceimg(item.content))"></p>
											<img :src="replaceimg(item.content) | getsrc" alt="">-->
										<img :src="getsrc(replaceimg(item.content))" alt="" @error="e => fileLoadError(e, item)" v-if="!imgageerrors[item.id]">
										<file-load-error :form="$CHAT_MSG_TYPE.TYPE_IMAGE" v-else></file-load-error>
									</div>
									<div class="right" v-if="item.form === $CHAT_MSG_TYPE.TYPE_NOTE && getsrc(replaceimg(item.content)) !== ''" v-html="moveImg(item.content)">
									</div>
									<p class="noimage" style="margin:0" v-html="item.content" v-if="item.form === $CHAT_MSG_TYPE.TYPE_NOTE && getsrc(replaceimg(item.content)) === ''">
									</p>
								</div>
								<a-dropdown :trigger="['click']" class="right_btn">
									<a class="iconfont icongengduo1 ant-dropdown-link" @click="e => e.stopPropagation()">
									</a>
									<a-menu slot="overlay">
										<a-menu-item key="1" @click="share(item)">
											{{$t('common.relay')}}
										</a-menu-item>
										<a-menu-item key="2" @click="delcollect(item)">
											{{$t('common.delete')}}
										</a-menu-item>
									</a-menu>
								</a-dropdown>
							</div>

							<!--收藏图片-->
							<div class="collect_image" v-if="item.form === $CHAT_MSG_TYPE.TYPE_IMAGE && (selectingType === 'image' || selectingType === 'all')" @click.stop="_handleClick(item, index)">
								<!--头部名称和时间-->
								<AAlist-item class="tittle" :title="item.meta.nickName" :key="'myFriends-tittle'">
									<template v-slot:right>
										<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
									</template>
								</AAlist-item>
								<!--图片-->
								<div class="collect_text">
									<div style="width: 80px; height: 80px; overflow: hidden">
										<a-spin size="small" :spinning="item.downloadProgress === 1" style="background:#fff;" :tip="$t('common.downloading')" v-if="!imgageerrors[item.id]">
											<img
												style="opacity: 0; cursor: pointer"
												:src="item.localPath && isinloacl(item) ? 'file://' + item.localPath : ($store.state.Setting.fileDomainURL + item.content)"
												@load="e => fileLoad(e, item)"
												@error="e => fileLoadError(e, item)"
											>
										</a-spin>
										<file-load-error :form="$CHAT_MSG_TYPE.TYPE_IMAGE" v-else></file-load-error>
									</div>
								</div>
								<a-dropdown :trigger="['click']" class="right_btn">
									<a class="iconfont icongengduo1 ant-dropdown-link" @click="e => e.stopPropagation()">
									</a>
									<a-menu slot="overlay">
										<a-menu-item key="1" @click="_handleClick(item, index)">
											{{$t('common.open')}}
										</a-menu-item>
										<!--	<a-menu-item key="2" @click.stop="_handleClick(item, index)">
												{{$t('common.download')}}
											</a-menu-item>-->
										<a-menu-item key="3" @click="share(item)">
											{{$t('common.relay')}}
										</a-menu-item>
										<a-menu-item key="4" @click="delcollect(item)">
											{{$t('common.delete')}}
										</a-menu-item>
									</a-menu>
								</a-dropdown>
							</div>

							<!--收藏语音-->
							<div class="collect_voice" v-if="item.form === $CHAT_MSG_TYPE.TYPE_VOICE && (selectingType === 'voice' || selectingType === 'all')" @click.stop="_handleClick(item, index)">
								<!--头部名称和时间-->
								<a-spin size="small" :spinning="item.downloadProgress === 1" style="background:#fff;" :tip="$t('common.downloading')">
									<AAlist-item class="tittle" :title="item.meta.nickName" :key="'myFriends-tittle'">
										<template v-slot:right>
											<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
										</template>
									</AAlist-item>
									<!--语音-->
									<div class="collect_text">
										<!--语音信息-->
										<div
											class="voice"
											:style="{width: !audioLoadErr ? 5 * parseInt(item.meta.duration) + 75 + 'px' : playerWidth, height: '43px'}"
										>
											<audio
												:src="'file://' + item.localPath"
												:id="'play'+item.id"
												:ref="'play'+item.id"
												preload="load"
												@error="audioLoadError"
											></audio>
											<template v-if="!audioLoadErr">
												<span
													style="width: 20px;height: 23px; display: flex; align-items: center; margin-right: 5px; }"
													class="iconfont"
													:class="{'iconbofang--1': item.playTime === 1, 'iconbofang--': item.playTime === 2, 'iconbofang': item.playTime === 3 || !item.playTime}"
												></span>
												<span class="second" v-show="item.meta.duration>0">{{parseInt(item.meta.duration)}}''</span>
											</template>
											<template v-else>
												<span class="iconfont iconbofang"></span>
												{{$t('common.lostVoice')}}
											</template>
										</div>
									</div>
									<a-dropdown :trigger="['click']" class="right_btn">
										<a class="iconfont icongengduo1 ant-dropdown-link" @click="e => e.stopPropagation()">
										</a>
										<a-menu slot="overlay">
											<a-menu-item key="2" @click="delcollect(item)">
												{{$t('common.delete')}}
											</a-menu-item>
										</a-menu>
									</a-dropdown>
								</a-spin>
							</div>

							<!--收藏文件-->
							<div class="collect_file" v-if="item.form === $CHAT_MSG_TYPE.TYPE_FILE && (selectingType === 'file' || selectingType === 'all')" @click.stop="previewFile(item, index)">
								<!--头部名称和时间-->
								<div class="download-file" v-show="item.downloadProgress !== undefined && item.downloadProgress !== 100">
									<div>
										<div class="text">
											{{$t('common.downloading')}}
										</div>
										<div class="progress">
											<p><span :style="'width:' + item.downloadProgress + '%'"></span></p>
										</div>
										<div class="cancel-btn">
											<a-tooltip placement="bottom" :title="$t('common.exitBtn')">
												<div class="iconfont iconguanbi1" @click.stop="abortDownloadFile(item)"></div>
											</a-tooltip>
										</div>
									</div>
								</div>
								<AAlist-item class="tittle" :title="item.meta.nickName" :key="'myFriends-tittle'">
									<template v-slot:right>
										<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
									</template>
								</AAlist-item>
								<!--文件-->
								<div class="collect_text">
									<!--文件显示-->
									<div class="file-name-icon">
										<div class="icon" :class="item.meta.fileType"></div>
										<!--<div class="file-name" @click.stop="previewFile(item, index)">-->
										<div class="file-name">
											<div class="name" :title="item.meta.fileName">
												{{item.meta.fileName}}
												<div ref="fileNameHack"></div>
											</div>
											<div class="size" :title="isFileNameTooLong ? item.meta.fileType.toUpperCase() : ''">
												{{item.meta.fileSize | formatBytes}} {{isFileNameTooLong ? item.meta.fileType.toUpperCase() : ''}}
											</div>
										</div>
									</div>
								</div>
								<a-dropdown :trigger="['click']" class="right_btn">
									<a class="iconfont icongengduo1 ant-dropdown-link" @click="e => e.stopPropagation()">
									</a>
									<a-menu slot="overlay">
										<a-menu-item key="1" v-if="item.localPath && isinloacl(item).then" @click="_handleClick(item, index)">
											{{$t('common.open')}}
										</a-menu-item>
										<a-menu-item key="2" v-else @click="_handleClick(item, index)">
											{{$t('common.download')}}
										</a-menu-item>
										<a-menu-item key="3" v-if="item.localPath && isinloacl(item)" @click="_openFolder(item)">
											{{$t('common.open')}} {{$t('common.folder')}}
										</a-menu-item>
										<a-menu-item key="4" @click="share(item)">
											{{$t('common.relay')}}
										</a-menu-item>
										<a-menu-item key="5" @click="delcollect(item)">
											{{$t('common.delete')}}
										</a-menu-item>
									</a-menu>
								</a-dropdown>
							</div>

							<!--收藏视频-->
							<div class="collect_video" v-if="item.form === $CHAT_MSG_TYPE.TYPE_VIDEO && (selectingType === 'video' || selectingType === 'all')" @click.stop="_handleClick(item, index)">
								<!--头部名称和时间-->
								<AAlist-item class="tittle" :title="item.meta.nickName">
									<template v-slot:right>
										<i>{{$utils.time.formatForList($utils.time.formatTimestamp(item.time+ '000','Y/M/D h:m:s'))}}</i>
									</template>
								</AAlist-item>
								<!--视频-->
								<div class="collect_text">
									<div class="collect_main">
										<a-spin size="small" :spinning="item.downloadProgress !== undefined && item.downloadProgress !== 100" style="background:#fff;" :tip="$t('common.downloading')" v-if="!loadErrors[item.id]">
											<video
												class="content"
												:src="item.localPath && isinloacl(item) ? 'file://' + item.localPath : ($store.state.Setting.fileDomainURL + item.content)"
												@canplaythrough="e => fileLoad(e, item)"
												@error="e => fileLoadError(e, item)"
											></video>
											<div class="tip">
												<i class="iconfont	iconshipin-1" v-if="item.localPath && isinloacl(item)"></i>
												<i class="iconfont	iconxiazai2" v-else></i>
											</div>
										</a-spin>
										<file-load-error :form="$CHAT_MSG_TYPE.TYPE_VIDEO" :width="'80px'" :height="'80px'" v-else></file-load-error>
									<!--<img :src="loadErrors[item.id]" width="100" height="100" v-else>-->
									</div>
								</div>
								<a-dropdown :trigger="['click']" class="right_btn">
									<a class="iconfont icongengduo1 ant-dropdown-link" @click="e => e.stopPropagation()">
									</a>
									<a-menu slot="overlay">
										<a-menu-item key="1" v-if="item.localPath && isinloacl(item)" @click="_handleClick(item, index)">
											{{$t('common.play')}}
										</a-menu-item>
										<a-menu-item key="2" v-else @click="_handleClick(item, index)">
											{{$t('common.download')}}
										</a-menu-item>
										<!--<a-menu-item key="3" v-if="item.localPath && isinloacl(item)" @click="_openFolder(item)">
											{{$t('common.open')}} {{$t('common.folder')}}
										</a-menu-item>-->
										<a-menu-item key="4" @click="share(item)">
											{{$t('common.relay')}}
										</a-menu-item>
										<a-menu-item key="5" @click="delcollect(item)">
											{{$t('common.delete')}}
										</a-menu-item>
									</a-menu>
								</a-dropdown>
							</div>
						</div>
						<!--<collectcommet :collectdata="item"></collectcommet>-->

						<!--1.9版本产品要求去掉右键菜单功能, 2.4版本重新加上右键菜单-->
						<!--右键菜单-->
						<a-menu slot="overlay">
							<template v-if="item.form === $CHAT_MSG_TYPE.TYPE_TEXT">
								<a-menu-item key="1" @click="share(item)">
									{{$t('common.relay')}}
								</a-menu-item>
								<a-menu-item key="2" @click="delcollect(item)">
									{{$t('common.delete')}}
								</a-menu-item>
							</template>
							<template v-else-if="item.form === $CHAT_MSG_TYPE.TYPE_NOTE">
								<a-menu-item key="1" @click="share(item)">
									{{$t('common.relay')}}
								</a-menu-item>
								<a-menu-item key="2" @click="delcollect(item)">
									{{$t('common.delete')}}
								</a-menu-item>
							</template>
							<template v-else-if="item.form === $CHAT_MSG_TYPE.TYPE_IMAGE">
								<a-menu-item key="1" @click="_handleClick(item, index)">
									{{$t('common.open')}}
								</a-menu-item>
								<!--	<a-menu-item key="2" @click.stop="_handleClick(item, index)">
										{{$t('common.download')}}
									</a-menu-item>-->
								<a-menu-item key="3" @click="share(item)">
									{{$t('common.relay')}}
								</a-menu-item>
								<a-menu-item key="4" @click="delcollect(item)">
									{{$t('common.delete')}}
								</a-menu-item>
							</template>
							<template v-else-if="item.form === $CHAT_MSG_TYPE.TYPE_VOICE">
								<a-menu-item key="2" @click="delcollect(item)">
									{{$t('common.delete')}}
								</a-menu-item>
							</template>
							<template v-else-if="item.form === $CHAT_MSG_TYPE.TYPE_FILE">
								<a-menu-item key="1" v-if="item.localPath && isinloacl(item).then" @click="_handleClick(item, index)">
									{{$t('common.open')}}
								</a-menu-item>
								<a-menu-item key="2" v-else @click="_handleClick(item, index)">
									{{$t('common.download')}}
								</a-menu-item>
								<a-menu-item key="3" v-if="item.localPath && isinloacl(item)" @click="_openFolder(item)">
									{{$t('common.open')}} {{$t('common.folder')}}
								</a-menu-item>
								<a-menu-item key="4" @click="share(item)">
									{{$t('common.relay')}}
								</a-menu-item>
								<a-menu-item key="5" @click="delcollect(item)">
									{{$t('common.delete')}}
								</a-menu-item>
							</template>
							<template v-else-if="item.form === $CHAT_MSG_TYPE.TYPE_VIDEO">
								<a-menu-item key="1" v-if="item.localPath && isinloacl(item)" @click="_handleClick(item, index)">
									{{$t('common.play')}}
								</a-menu-item>
								<a-menu-item key="2" v-else @click="_handleClick(item, index)">
									{{$t('common.download')}}
								</a-menu-item>
								<!--<a-menu-item key="3" v-if="item.localPath && isinloacl(item)" @click="_openFolder(item)">
									{{$t('common.open')}} {{$t('common.folder')}}
								</a-menu-item>-->
								<a-menu-item key="4" @click="share(item)">
									{{$t('common.relay')}}
								</a-menu-item>
								<a-menu-item key="5" @click="delcollect(item)">
									{{$t('common.delete')}}
								</a-menu-item>
							</template>
						</a-menu>
					</a-dropdown>
				</a-spin>
				<div class="default" v-if="(allCollectList.length === 0 || isdefault) && !collectloading">
					<div class="main">
						<img src="~@/assets/img/sck@2x.png" width="240" height="200" :alt="$t('common.noData')">
						<p v-if="selectingType === 'note'">
							{{$t('note.noNotes')}}
						</p>
						<p v-else>
							{{$t('favorite.noFavorites[0]')}}<br>
							<span>
								{{$t('favorite.noFavorites[1]')}}
							</span>
						</p>
					</div>
				</div>
			</div>

			<MultiplePanel
				v-if="selectingFriends"
				:visible="selectingFriends"
				:confirm="onSelectedFriends"
				:cancel="()=>{selectingFriends=false;selectedList=[];msg_for_share='';}"
				limit="50"
				:modeltitle="$t('common.relay')"
			>
				<div id="msg_for_share">
					<div>{{$t('common.leaveMessage')}}</div>
					<a-textarea v-model="msg_for_share" type="textarea" :autosize="{ minRows: 4, maxRows: 4 }" />
				</div>
			</MultiplePanel>
		</template>

		<DetailModel :modelhead="modelhead" :detaildata="detaildata" ref="son" :cancel="closemodel"></DetailModel>
	</div>
</template>

<script>
	import AAlistItem from '@/components/AAlist/item.vue'
	import MultiplePanel from '@/components/MultiplePanel'
	import noimg from '@/assets/img/bucunzai.png'
	import shibai from '@/assets/img/shibai.png'
	import DetailModel from './detailmodel'
	import FileLoadError from '@/components/FileLoadError.vue'
	// import collectcommet from './collectcommet'

	export default {
		name: 'Colletcs',
		components: { AAlistItem, MultiplePanel, DetailModel, FileLoadError },
		props: {
			selectingType: {
				type: String,
				default: 'all'
			}
		},
		data() {
			return {
				spinning: false,
				isdefault: false,
				list: [1, 2, 3, 4],
				message: {
					data: {}
				},
				/* 语音相关*/
				playerWidth: '0px',
				playTime: 3,
				audioLoadErr: false,
				duration: 10,
				/* 文件相关*/
				isFileNameTooLong: false,
				/* 转发相关*/
				selectingFriends: false, // 显示转发弹窗
				sharingMessages: null,
				selectedList: [],
				msg_for_share: '',
				searchlimit: ``,
				showdetail: false,
				modelhead: '',
				detaildata: {},
				loadErrors: {},
				imgageerrors: {},
				collectloading: false,
				headertext: this.$t('favorite.allFavorites'),
				sort: 0,
				supportFileType: this.$WEB_CONFIG.supportFileType
			}
		},
		computed: {
			allCollectList() {
				console.log(this.$store.state.Chat.collectChat)
				return this.$store.state.Chat.collectChat
			},
			isScroll() {
				return this.$store.state.OPcomponent.isSearch
			}
		},
		watch: {
			'$store.state.Setting.fileDownloadings': {
				async	handler(nVal)	{
					if (this.selectingType === 'file' || this.selectingType === 'video' || this.selectingType === 'all')	{
						const	fileDownloadings = Object.values(nVal).filter(loadingInfo => loadingInfo.fromType.indexOf('collect-') >= 0)
						if (fileDownloadings.length) {
							const collectFiles = this.allCollectList.filter(item => item.form === this.$CHAT_MSG_TYPE.TYPE_FILE || item.form === this.$CHAT_MSG_TYPE.TYPE_VIDEO)
							fileDownloadings.forEach(loadingInfo => {
								const	collectInfo = collectFiles.find(collectInfo	=> collectInfo.id === loadingInfo.id)
								console.log('收藏文件下载', loadingInfo,	collectInfo)
								if (collectInfo) {
									this.$store.commit('Chat/downloadFavFileProgress', { id: loadingInfo.id, progress: loadingInfo.progress })
									if (loadingInfo.state === 'finished') {
										this.$store.dispatch('Chat/updateFav', { id: loadingInfo.id, data: { localPath: loadingInfo.localPath }})
										this.$store.dispatch('Setting/del_fileDownloadings', loadingInfo.id)
									} else if (loadingInfo.state != 'progress')	{
										if (loadingInfo.state === 'abort') {
											this.$store.commit('Chat/downloadFavFileProgress', { id: loadingInfo.id, progress: '' })
										}
										this.$store.dispatch('Setting/del_fileDownloadings', loadingInfo.id)
									}
								}
							})
						}
					}
				},
				deep:	true
			},
			selectingType(val) {
				console.log(val)
				this.getList()
			},
			isScroll() {
				if (this.isScroll) {
					window.removeEventListener('scroll', this.handleScroll, true)
				} else {
					window.addEventListener('scroll', this.handleScroll, true)
				}
			},
			allCollectList() {
				if (this.sort === '' && this.allCollectList.length > 0) {
					this.isdefault = false
				}
				const index = this.allCollectList.findIndex(message => {
					return message.form == this.sort
				})
				index === -1 && this.sort !== 0 && this.sort !== '' ? this.isdefault = true : this.isdefault = false
			}
		},
		mounted() {
			this.$refs.collection.addEventListener('scroll', this.handleScroll, true)
			this.searchlastcollect()
			this.getList()
		},
		methods: {
			getList() {
				this.$utils.sqlite.getCollectData({
					size: 1, order: 'time desc' }).then(async res => {
					if (res.length) {
						await this.getCollectMsg(String(res[0].time), res[0])
					} else {
						await this.getCollectMsg('0')
					}
				})
				// 根据左侧导航栏筛选本地数据库中的内容，并存到vuex
				document.querySelector('.collect_alllist').scrollTop = 0
				switch (this.selectingType) {
				case 'note':
					this.sort = this.$CHAT_MSG_TYPE.TYPE_NOTE
					this.searchlimit = `form=${this.$CHAT_MSG_TYPE.TYPE_NOTE}`
					this.nextpage()
					this.headertext = this.$t('common.note')
					break
				case 'image':
					this.sort = this.$CHAT_MSG_TYPE.TYPE_IMAGE
					this.searchlimit = `form=${this.$CHAT_MSG_TYPE.TYPE_IMAGE}`
					this.nextpage()
					this.headertext = this.$t('common.image')
					break
				case 'voice':
					this.sort = this.$CHAT_MSG_TYPE.TYPE_VOICE
					this.searchlimit = `form=${this.$CHAT_MSG_TYPE.TYPE_VOICE}`
					this.nextpage()
					this.headertext = this.$t('common.voice')
					break
				case 'file':
					this.sort = this.$CHAT_MSG_TYPE.TYPE_FILE
					this.searchlimit = `form=${this.$CHAT_MSG_TYPE.TYPE_FILE}`
					this.nextpage()
					this.headertext = this.$t('common.file')
					break
				case 'video':
					this.sort = this.$CHAT_MSG_TYPE.TYPE_VIDEO
					this.searchlimit = `form=${this.$CHAT_MSG_TYPE.TYPE_VIDEO}`
					this.nextpage()
					this.headertext = this.$t('common.video')
					break
				case 'all':
					this.sort = ''
					this.searchlimit = ``
					this.nextpage()
					this.headertext = this.$t('favorite.allFavorites')
					break
				}
			},
			async isinloacl(arg) {
				const ishave = await this.$utils.fun.fileExist(arg.localPath)
				if (!ishave) {
					await this.$store.dispatch('Chat/updateFav', { id: arg.id, data: { localPath: '' }})
				} else {
					return ishave
				}
				// ishave.then(res => {
				// 	return res
				// })
			},
			closemodel() {
				this.$nextTick(() => {
					this.detaildata = {}
				})
			},
			nextpage() {
				this.collectloading = true
				this.$utils.sqlite.getCollectData({ size: 30, where: this.searchlimit, order: 'time desc' }).then(res => {
					this.$store.commit('Chat/getcollectList', res)
					res.length > 0 ? this.isdefault = false : this.isdefault = true
					this.collectloading = false
				})
			},
			searchlastcollect() {
				this.collectloading = true
				this.$utils.sqlite.getCollectData({
					size: 30, order: 'time desc' }).then(async res => {
					if (res.length) {
						// 先将数据库中的收藏数据存到vuex
						this.$store.commit('Chat/getcollectList', res)
						this.collectloading = false
						this.getCollectMsg(String(res[0].time), res[0])
					} else {
						this.getCollectMsg('0')
						this.collectloading = false
					}
				})
			},
			getCollectMsg(time, sqlitedata) {
				this.$utils.chatSdk.cGetFavoriteAsync(time, '0', 20, 1).then(async res => {
					if (res.code !== 0) {
						return
					}
					if (res.code == 0 && res.data.length > 0) {
						const collectMsgs = await this.$store.dispatch('Chat/getFavorite', {
							minTime: time
						})
						// this.$store.commit('Chat/getcollectList', collectMsgs)
						if (sqlitedata) {
							collectMsgs.forEach(item => {
								// 获取到新的内容存然数据库与更新vuex
								this.$store.commit('Chat/updatefavoriate', { data: item })
								this.$store.dispatch('Chat/saveCollect', item).then(res => {
									/* 插入数据库失败时，去更新数据库*/
									if (res.code !== 0) {
										this.$store.dispatch('Chat/updateCollect', { updatemsg: item })
									}
								})
							})
						} else {
							this.$store.commit('Chat/getcollectList', collectMsgs)
							this.$store.dispatch('Chat/saveCollect', collectMsgs)
						}
						// await this.$store.dispatch('Chat/saveCollect', collectMsgs)
					}
					this._denlink()
				})
			},
			async opendetail(msg) {
				msg = JSON.parse(JSON.stringify(msg))
				this.detaildata = msg
				if (this.$utils.fun.validUrl(msg.content)) {
					this.$utils.fun.openExternal(msg.meta.data.shareLink || msg.content)
					return
				}

				let isMyNote = false
				if (msg.form === this.$CHAT_MSG_TYPE.TYPE_NOTE) {
					isMyNote = msg.sender == this.$store.state.User.accountInfo.userId
					if (this.$store.state.Setting.online) {
						const res = await this.$utils.sqlite.getCollectData({
							size: 1, order: 'time desc' })
						if (res.length) {
							const collectMsgs = await this.$store.dispatch('Chat/getFavorite', {
								minTime: String(res[0].time)
							})
							if (collectMsgs.length > 0) {
								collectMsgs.forEach(col => {
									if (col.id === msg.id) { this.detaildata = col }
								})
							}
						}
						this.modelhead = this.$t('common.note')
					} else {
						this.modelhead = this.$t('common.note')
					}
				} else {
					this.modelhead = msg.meta.nickName
				}

				if (isMyNote) {
					this.$emit('write', { noteContent: this.detaildata })
				} else {
					this.$refs.son.visible = true
				}
			},
			moveImg: function(value) {
				if (!value) return ''
				value = value.replace(/<img(?:.|\s)*?>/g, '')
				value = value.replace(/\s*/g, '')
				value = value.replace(/<style.*?>.*?<\/style>/ig, '')
				value = value.replace(/<[^>]+>/g, '')
				return value
			},
			formatedMsg(text) {
				if (!text) return ''
				text = text.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
				text = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(text)
				const domContainer = document.createElement('div')
				domContainer.appendChild(this.$utils.message.buildDom(text, false, true))
				return domContainer.innerHTML
			},
			replaceimg(text) {
				text = text.replace(/<img src="/gi, '<img src="' + this.$store.state.Setting.fileDomainURL)
				return text
			},
			getsrc(text) {
				var arr = []
				const imgReg = /<img.*?(?:>|\/>)/gi
				const srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/i
				arr = text.match(imgReg)
				if (arr) {
					const arr2 = arr[0].match(srcReg)
					return arr2[1]
				} else {
					return ''
				}
			},
			handleScroll() {
				if (this.isScroll) return
				if (document.querySelector('.collect_alllist') && !this.isScroll) {
					var scrollTop = document.querySelector('.collect_alllist').scrollTop
					var windowHeight = document.querySelector('.collect_alllist').clientHeight
					var scrollHeight = document.querySelector('.collect_alllist').scrollHeight
					var n = 1
					if (scrollTop + windowHeight >= scrollHeight - 5) {
						this.$utils.sqlite.getCollectData({
							size: 30, order: 'time desc', index: n, where: this.searchlimit }).then(async res => {
							n++
							if (res.length === 0) {
								return
							} else {
								res.forEach(data => {
									this.$store.commit('Chat/updatefavoriate', { data: data, type: 1 })
								})
							}
						})
					}
				}
			},
			async _handleClick(item, index) {
				let isaudioload = true
				if (this.$store.state.Setting.online) {
					isaudioload = await this.$utils.fun.urlExist(item.content)
				}
				if (item.form === this.$CHAT_MSG_TYPE.TYPE_IMAGE || item.form === this.$CHAT_MSG_TYPE.TYPE_VOICE) { // 102图片和104语音
					if (!isaudioload && item.form === this.$CHAT_MSG_TYPE.TYPE_VOICE && this.$store.state.Setting.online) {
						this.$message.error(this.$t('common.lostVoice'))
						return
					}
					if (!this.$store.state.Setting.online && !await this.$utils.fun.fileExist(item.localPath)) {
						this.$message.error(this.$t('common.netErrorTip[0]'))
						return
					}
					if (item.localPath !== 'error' && !await this.$utils.fun.fileExist(item.localPath)) {
						const type = item.form === this.$CHAT_MSG_TYPE.TYPE_VOICE ? item.meta.fileType || 'aac' : item.meta.fileType
						const localData = this.$store.dispatch('Chat/downloadFavImageAudio', {
							id: item.id,
							form: item.form,
							fileInfo: {
								ext: type,
								url: item.content
							}
						})
						item.localPath = localData.localPath
					}
					item.form === this.$CHAT_MSG_TYPE.TYPE_IMAGE ? this.openImagePlayer(index) : this.playVoice(index)
				} else if (item.form === this.$CHAT_MSG_TYPE.TYPE_VIDEO || item.form === this.$CHAT_MSG_TYPE.TYPE_FILE) { // 105短视频和103文件
					if (!isaudioload && item.form === this.$CHAT_MSG_TYPE.TYPE_FILE) {
						this.$message.error(this.$t('common.FileExpired'))
						return
					}
					if (item.localPath && !await this.$utils.fun.fileExist(item.localPath)) {
						this.$message.error(this.$t('common.fileNotExist[2]'))
						this.$store.dispatch('Chat/updateFav', { id: item.id, data: { localPath: '' }})
						return
					}
					if (item.localPath !== 'error' && !await this.$utils.fun.fileExist(item.localPath)) {
						if (!this.onlineCheck()) {
							return
						}
						this.$eventBus.$emit('downloadFile', {
							type: item.form,
							fromType:	'collect-1',
							id: item.id,
							filePath: item.content,
							fileName: item.meta.fileName
						})
						// this.$utils.fun.downloadFile({
						// 	type: item.form,
						// 	filePath: item.content,
						// 	fileName: item.meta.fileName,
						// 	id: item.id
						// }, async({ state, totalBytes, receivedBytes, saveFilePath }) => {
						// 	const progress = receivedBytes === totalBytes ? 100 : parseInt(receivedBytes / totalBytes * 100)
						// 	this.$store.commit('Chat/downloadFavFileProgress', { id: item.id, progress })
						// 	if (state === 'finished') {
						// 		this.$store.dispatch('Chat/updateFav', { id: item.id, data: { localPath: saveFilePath }})
						// 		// const alreadydown = this.$store.state.Chat.collectChat[index]
						// 		// this._handleClick(alreadydown, index)
						// 	} else if (state === 'abort') {
						// 		this.$store.commit('Chat/downloadFavFileProgress', { id: item.id, progress: '' })
						// 	}
						// })
					} else {
						item.form === this.$CHAT_MSG_TYPE.TYPE_FILE ? this.$utils.fun.openFile(item.localPath) : this.$utils.fun.createWin({
							action: 'openVideoPlayer',
							params: {
								messageId: item.id,
								filePath: item.localPath,
								userName: item.meta.nickName,
								userAvatar: item.meta.userAvatar,
								timestamp: item.time + '000',
								fileSize: item.meta.fileSize,
								burntAfterRead: 0
							}
						})
					}
				}
			},
			async abortDownloadFile(item) {
				await this.$utils.fun.abortDownloadFile(item.id)
				await this.$store.commit('Chat/updateDownloadingMsgs', {
					action: 'del',
					id: item.id
				})
				this.$store.commit('Chat/downloadFavFileProgress', { id: item.id, progress: '' })
			},
			async playVoice(index) {
				const oldPlay = this.$store.state.Setting.currentPlayVoice
				const item = this.$store.state.Chat.collectChat[index]
				const player = this.$refs['play' + item.id][0]
				// 设置延迟器，等待下载完毕自动播放
				if (item.downloadProgress === 1) {
					setTimeout(() => {
						this.playVoice(index)
					}, 500)
					return
				}
				if (oldPlay && oldPlay.id !== player.id) {
					oldPlay.pause()
					oldPlay.currentTime = 0
					this.$store.dispatch('Setting/set_currentPlayVoice', '')
				}
				player.currentTime = 0
				if (!player.paused) {
					player.pause()
				} else {
					player.play()
					if (this.timer) clearInterval(this.timer)
					this.timer = setInterval(() => {
						const itemcollect = this.$store.state.Chat.collectChat[index]
						let playTime = itemcollect.playTime ? itemcollect.playTime : 0
						if (player.paused) {
							this.$store.commit('Chat/updatefavoriate', { data: { id: item.id, playTime: 3 }})
							clearInterval(this.timer)
						} else {
							this.$store.commit('Chat/updatefavoriate', { data: { id: item.id, playTime: playTime === 3 ? 1 : ++playTime }})
						}
					}, 280)
					this.$store.dispatch('Setting/set_currentPlayVoice', player)
				}
			},
			async fileLoad(e, item) {
				const newImageSize = await this.$utils.imageOp.resizeImage(item.meta.width, item.meta.height, 120, 80)
				e.target.width = newImageSize.width
				e.target.height = newImageSize.height
				e.target.style.opacity = 1
			},
			fileLoadError(e, item) {
				e.target.width = 150
				e.target.height = 120
				e.target.src = noimg
				e.target.style.opacity = 1
				if (item.form === this.$CHAT_MSG_TYPE.TYPE_VIDEO) this.$set(this.loadErrors,	item.id, shibai)
				if (item.form === this.$CHAT_MSG_TYPE.TYPE_NOTE || item.form === this.$CHAT_MSG_TYPE.TYPE_IMAGE) this.$set(this.imgageerrors,	item.id, shibai)
			},
			delcollect(item) {
				if (!this.onlineCheck()) return
				this.$store.dispatch('Chat/deletCollect', {
					collectID: item.id
				}).then(res => {
					if (res.code === 0) {
						this.$message.success(this.$t('common.delStatus[0]'))
					} else {
						this.$message.error(this.$t('common.delStatus[1]'))
					}
				})
			},
			share(message) {
				if (!this.onlineCheck()) return
				this.selectingFriends = true
				this.sharingMessages = [message]
			},
			async onSelectedFriends(groups) {
				if (!this.onlineCheck()) return
				this.selectingFriends = false
				this.selectedList = []
				let friend
				let targetThread
				let liuyan
				for (let i = 0; i < groups.length; i++) {
					friend = groups[i]
					// 如果不存在会话，先创建
					targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
					// this.$store.dispatch('Chat/openThread', { id: friend.groupId, type: friend.groupUsers ? 1 : 0 })
					if (!targetThread) {
						const res = await this.$store.dispatch('Chat/createThread', {
							threadID: friend.groupId,
							threadType: friend.groupUsers ? 1 : 0
						})
						if (res && res.code != 0) {
							this.$message.error('转发异常')
						}
					} else if (targetThread.hidden != 0) {
						// 如果消息所属会话隐藏，则显示
						await this.$store.dispatch('Chat/updateThread', {
							threadID: friend.groupId,
							updatingData: { hidden: 0 }
						})
					}
				}
				await this.$store.dispatch('Chat/relayCollect', { messages: this.sharingMessages, groups })
				for (let i = 0; i < groups.length; i++) {
					friend = groups[i]
					liuyan = this.$store.getters['Chat/someThread'](friend.groupId)
					await this.$store.dispatch('Chat/sendMessage', {
						msg: {
							text: this.msg_for_share
						},
						thread: liuyan
					})
				}
				this.msg_for_share = ''
			},
			audioLoadError() {
				// this.audioLoadErr = true
				// this.playerWidth = '135px'
			},
			downloadFile() {
			},
			openImagePlayer(index) {
				const item = this.$store.state.Chat.collectChat[index]
				// 设置延迟器，等待下载完毕自动打开
				if (item.downloadProgress === 1) {
					setTimeout(() => {
						this.openImagePlayer(index)
					}, 500)
					return
				}
				if (!item.localPath || item.localPath === 'error') return
				this.$utils.fun.createWin({
					action: 'openImagePlayer',
					params: {
						messageId: item.id,
						filePath: item.localPath,
						userName: item.meta.nickName,
						userAvatar: item.meta.userAvatar,
						timestamp: item.time + '000',
						fileSize: item.meta.fileSize,
						burntAfterRead: 0
					}
				})
			},
			// async openFileMenu({ key, item }) {
			// 	if (!await this.$utils.fun.fileExist(item.localPath)) {
			// 		if (!this.onlineCheck()) return
			// 		if (await this.$utils.fun.urlExist(item.meta.content)) {
			// 			this.$message.error('文件不存在！请重新下载！')
			// 		} else {
			// 			this.$message.error('文件已过期')
			// 		}
			// 		return
			// 	}
			// 	switch (key) {
			// 	case '0':
			// 		const openState = this.$utils.fun.openFile(item.meta.localPath)
			// 		if (!openState) {
			// 			alert('文件不存在！请重新下载！')
			// 		}
			// 		break
			// 	case '1':
			// 		this._openFolder(item)
			// 		break
			// 	}
			// },
			async previewFile(item, index) {
				// 本地有文件或无网络时直接打开本地预览
				if (await this.$utils.fun.fileExist(item.localPath) || !this.$store.state.Setting.online) {
					this._handleClick(item, index)
				} else {
					// 网络可用，并且未下载到本地
					this.openFilePlayer(item)
				}
				// if (this.$store.state.Setting.online) { // 网络可用，使用在线预览
				// 	this.openFilePlayer(item)
				// } else { // 网络不可用，调用本地打开，本地打开方法会判断本地文件存不存在
				// 	this.openFileMenu({ key: '0', item })
				// }
			},
			async openFilePlayer(item) {
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({
					action: 'openFilePlayer',
					params: {
						url: item.content,
						filePath: item.meta.localPath,
						fileName: item.meta.fileName,
						userName: item.meta.nickName,
						userAvatar: item.meta.userAvatar,
						timestamp: item.time + '000',
						messageId: item.id,
						// threadId: item.meta.localPath,
						burntAfterRead: 0,
						senderId: item.sender,
						fileSize: item.meta.fileSize,
						isUnreadBurntAfterReadMsg: 0,
						fromType: 1
					}
				})
			},
			async _openFolder(value) {
				if (value.localPath !== '' && !await this.$utils.fun.fileExist(value.localPath)) {
					this.$message.error(this.$t('common.fileNotExist[2]'))
					this.$store.dispatch('Chat/updateFav', { id: value.id, data: { localPath: '' }})
					return
				}
				this.$utils.fun.openFolder(value.localPath)
			},
			_denlink() {
				this.allCollectList.forEach(async item => {
					if (item.form === this.$CHAT_MSG_TYPE.TYPE_TEXT) {
						if (this.$utils.fun.validUrl(item.content) && !item.meta.mytype) {
							item.meta.mytype = 'link'
							item.meta.state = 5
							await this.$store.dispatch('Chat/updateCollect', { updatemsg: item })
							const webInfo = await this.$utils.fun.getWebInfoByURL(item.content)
							const data = {
								shareLink: item.content,
								webTitle: webInfo.webTitle,
								webDescription: webInfo.webDescription
							}
							item.meta.data = data
							item.meta.state = 1
							await this.$store.dispatch('Chat/updateCollect', { updatemsg: item })
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss">
	#collection_content{
		height: 100%;
		.title{
			color: $black;
			font-size: 16px;
			height: 80px;
			line-height: 80px;
			padding: 0 20px;
			margin: 0;
			border-bottom: $border;
			-webkit-app-region: drag
		}
		.AAlist-item{
			padding: 19px 15px;
		}
		.collect_alllist{
			position: relative;
			min-height: 400px;
			height: calc(100% - 65px);
			overflow: hidden scroll;
			.collect_mask{
				min-height: 400px;
			}
			.default {
				.main {
					position: absolute;
					left: 50%;
					top: 45%;
					width: 100%;
					transform: translate(-50%, -50%);
					text-align: center;
					p {
						margin: 0;
						color: $black;
						font-weight: normal;
						font-size: 14px;
						span{
							display: block;
							margin-top: 0.5em;
							color: $gray;
							font-size: 12px;
						}
					}
				}
			}
		}
		.collect_list{
			.ant-dropdown-link{
				font-size: 25px!important;
			}
			&>div{
				margin-left: 25px;
				/*&:hover{
					background: #F8F8F8;
				}*/
				border-bottom: 1px solid #E5E5E5;
				position: relative;
			}
			.download-file{
				position: absolute;
				top: 0;
				bottom: 1px;
				left: 0;
				right: 0;
				background:rgba(255,255,255,.9);
				display:flex;
				align-items: center;
				justify-content: center;
				&>div{
					width: 70%;
					display: table;
					&>div{
						display:table-cell;
						vertical-align: middle;
						overflow:hidden;
						&.text{
							width: 50px;
						}
						&.progress {
							p{
								margin: 0;
								width: 100%;
								height: 6px;
								border-radius: 6px;
								border: 1px solid #2E87FF;
								span{
									display:block;
									height: 100%;
									width: 0%;
									background: #2E87FF;
								}
							}
						}
						&.cancel-btn{
							width: 30px;
							text-align:center;
						}
					}
				}
			}
			.AAlist-item{
				border-bottom: none;
				padding: 5px 15px 0 0;
				.item-center{
					padding: 0!important;
				}
				.meta-title{
					font-size: 14px;
					i{
						color: #E5E5E5;
					}
				}
				.item-right{
					i{
						color: #999999;
					}
				}
			}
			.collect_text{
				padding: 0px 35px 15px 0;
			}
			.collect_link{
				.canread{
					height: 80px;
					.left, .right{
						display: inline-block;
						vertical-align: middle;
					}
					.left{
						width: 50px;
						height: 50px;
						margin-right: 10px;
						img{
							width: 100%;
							height: 100%;
						}
					}
					.right{
						width: calc(100% - 110px);
						h2{
							font-size: 14px;
							margin-bottom: 5px;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
						div{
							width: 100%;
							// height: 30px;
							display: -webkit-box;
							overflow: hidden;
							text-overflow: ellipsis;
							-webkit-box-orient: vertical;
							-webkit-line-clamp: 2;
							font-size: 12px;
							color: #999999;
						}
					}

				}
			}
			.right_btn{
				position: absolute;
				font-size: 28px;
				color: #666666;
				right: 17px;
				top: 46%;
			}
			.collect_txt{
				.collect_text{
					img{
						width: 18px;
						height: 18px;
					}
					.noimage{
						width: calc( 100% - 120px);
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 4;
						overflow: hidden;
						text-overflow: ellipsis;
						line-height: 20px;
						max-height: 80px;
					}
					.noimage{
						width: 100%;
						text-align: left;
					}
				}
			}
			.collect_note{
				.collect_text{
					display: flex;
					.left{
						width: 80px;
						height: 80px;
						margin-right: 20px;
						overflow: hidden;
						position: relative;
						img{
							position: absolute;
							left: 0;
							top: 0;
							right: 0;
							bottom: 0;
							margin: auto;
							height: 80px;
							width: 80px;
							object-fit: cover;
						}
					}
					.right{
						width: calc( 100% - 120px);
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 4;
						overflow: hidden;
						text-overflow: ellipsis;
						line-height: 20px;
						max-height: 80px;
					}
				}
			}
			.collect_image, .collect_video, .collect_voice, .collect_file, .collect_note, .collect_txt{
				cursor: pointer;
			}
			.collect_video{
				.collect_main{
					min-height: 80px;
					display: inline-block;
					position:relative;
					.content{
						opacity: 0;
						cursor: pointer;
						min-height: 80px;
					}
					.tip{
						width: 100%;
						text-align: center;
						position: absolute;
						left: 0;
						top: 30%;
						cursor: pointer;
						.iconfont {
							color: #f8f8f8;
							font-size: 24px;
							&:hover{
								color: $darkBlue;
							}
						}
					}
				}
			}
			.collect_voice{
				//语音
				.voice {
					max-width: 350px;
					min-width: 85px;
					display: flex;
					padding: 0 10px;
					background:#F6F6F6;
					border: 1px solid #E5E5E5;
					border-radius: 5px;
					align-items: center;
					position: relative;
					cursor: pointer;
					user-select: none;
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
			}
			.collect_file{
				.file-name-icon {
					width: 95%;
					overflow: auto;
					.icon {
						width: 40px;
						height: 50px;
						@include retinize('file-icon/other');
						margin-top: 5px;
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
						margin: 10px 0 0 55px;
						.name {
							cursor: pointer;
							color: #333;
							line-height: 130%!important;
							display: -webkit-box;
							-webkit-line-clamp: 2;
							-webkit-box-orient: vertical;
							overflow: hidden;
							margin-bottom: 5px;
							font-size: 16px;
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
			}
		}
	}
</style>
