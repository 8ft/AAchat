<template>
	<div id="chatSetup" :class="{'sub-page':true,'first-floor':true,hidden:!visible,animate:animate}" v-clickoutside="_hideSetting" ref="chatSetup">
		<div class="sub-page-title">
			<span>{{frame[thread.type].title}}</span>
			<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
		</div>

		<ul class="sub-page-content setup-list" ref="setupList">
			<template v-for="li in frame[thread.type].list[isGroupManager?1:0]">
				<thread
					:key="`${thread.id}_setup_${li}`"
					:click-avatar="true"
					:thread="thread"
					:active="visible"
					locate="in-setup"
					v-if="li===0"
				/>
				<li :key="`${thread.id}_setup_${li}`" class="base-info" v-if="li===1">
					<AAlistItem :src="thread.avatar" style="height: 80px;" :title="thread.name">
						<div slot="center" v-show="!editingThreadName">
							<span class="thread-name-in-setup">{{thread.name}}</span>
							<span
								v-show="(!isGroupManager&&thread.forbidEditGroupName!=1)||isGroupManager"
								class="iconfont iconbeizhu hoverable"
								@click.stop="_startEditThreadName"
							/>
						</div>
						<a-input
							ref="threadNameInput"
							slot="center"
							v-show="editingThreadName"
							v-model.trim="newThreadName"
							@pressEnter="_endEditThreadName"
							@blur="_endEditThreadName"
							maxlength="16"
						/>

						<span
							slot="right"
							class="iconfont iconerweima hoverable"
							@click="showQrcodeCard = true"
						/>
					</AAlistItem>
				</li>

				<!-- 群成员 -->
				<li :key="`${thread.id}_setup_${li}`" class="group-members" v-if="li===2">
					<div class="header" v-show="!searching">
						<label>
							{{$t('chat.groupMembers')}}
							<span
								class="iconfont iconsousuo hoverable"
								style="margin-left:8px;"
								@click.stop="showSearchInput"
							/>
						</label>
						<!-- <span class="iconfont iconjia hoverable" @click.stop="_addMember"></span> -->

						<span class="memberCount hoverable" @click="_showMemberList">
							{{thread.memberNum}}{{$t('common.people')}}
							<span class="iconfont iconxiayiye" />
						</span>
					</div>

					<div class="header" v-show="searching" ref="searchInput">
						<a-input v-model.trim="searchKey" />
						<div class="cancel" @click.stop="searching=false;searchKey='';">
							{{$t('common.exitBtn')}}
						</div>
					</div>

					<div
						:class="{members:true,'show-all':showAllMembers||(searching&&searchResult.length>12)}"
					>
						<div
							v-for="(member,index) in groupUsers"
							v-show="(searchResult.length===0&&!searching&&index<11)||(searchResult.length>0&&searchResult.indexOf(member.userId)>=0)||(searchResult.length===0&&!searchKey&&index<11)"
							:key="member.userId"
							@click.stop="_showUserCard(member)"
							class="member hoverable"
						>
							<a-spin :spinning="removingMemberID==member.userId" size="small">
								<!-- <label v-show="member.userId==thread.groupOwnerId">{{$t('common.owner')}}</label>
								<label class="admin" v-show="member.adminFlag==2">{{$t('chat.groupAdmin')}}</label> -->
								<img :src="member.userAvatar || ''" class="avatargerenbg" @error="e => $utils.setDefaultAvatar(e, 0)">
								<span
									v-if="(isGroupManager&&member.adminFlag==0) ||(isGroupOwner&&member.adminFlag!=1)"
									class="iconfont iconmacguanbi"
									@click.stop="preRemoveMember(member.userId)"
								/>
							</a-spin>
							<p>{{member.label||member.userLabel||member.nickName}}</p>
						</div>

						<div
							class="member"
							style="margin-right:0;"
							@click.stop="_addMember"
							v-show="!searching||!searchKey"
						>
							<div class="icon-addMember hoverable">
								<span class="iconfont iconjia" />
							</div>
						</div>
					</div>
				</li>

				<!-- 群管理 -->
				<li
					:key="`${thread.id}_setup_${li}`"
					v-if="li===18"
					@click.stop="showGroupManage=true;"
					class="clickable"
				>
					<label>{{$t('chat.groupManagement')}}</label>
					<span class="iconfont iconxiayiye" />
				</li>

				<!-- 置顶 -->
				<li :key="`${thread.id}_setup_${li}`" v-if="li===17">
					<label>{{$t('chat.stickyOnTop')}}</label>
					<a-switch
						:disabled="setting!==''&&setting!=='setTop'"
						:loading="setting==='setTop'"
						:checked="thread.topTime?true:false"
						@change="checked=>{_switchChange(checked,'setTop')}"
					/>
				</li>

				<!-- 免打扰 -->
				<li :key="`${thread.id}_setup_${li}`" v-if="li===3&&!isMyself">
					<label>{{$t('chat.muteNotifications')}}</label>
					<a-switch
						:disabled="setting!==''&&setting!=='notDisturb'"
						:loading="setting==='notDisturb'"
						:checked="thread.notDisturb?true:false"
						@change="checked=>{_switchChange(checked,'notDisturb')}"
					/>
				</li>

				<!-- 阅后即焚 -->
				<li :key="`${thread.id}_setup_${li}`" v-if="li===14&&!isMyself&&$store.state.Setting.organParamsConfig.showSnapchat==1">
					<label>{{$t('chat.burnAfterReading')}}</label>
					<a-switch
						:disabled="setting!==''&&setting!=='burntAfterRead'"
						:loading="setting==='burntAfterRead'"
						:checked="thread.burntAfterRead?true:false"
						@change="checked=>{_switchChange(checked,'burntAfterRead')}"
					/>
				</li>

				<!-- 不允许添加我 -->
				<li :key="`${thread.id}_setup_${li}`" v-if="li===4&&thread.isAnoymous!=1">
					<label>{{$t('chat.dontAddMe')}}</label>
					<a-switch
						:disabled="setting!==''&&setting!=='notAllowAddme'"
						:loading="setting==='notAllowAddme'"
						:checked="myInfo.notAllowAddme?true:false"
						@change="checked=>{_switchChange(checked,'notAllowAddme')}"
					/>
				</li>

				<!-- 我在本群的昵称 -->
				<li :key="`${thread.id}_setup_${li}`" v-if="li===5">
					<label>{{$t('chat.myNicknameInGroup')}}</label>

					<div v-show="!editingUserLabel" style="display:flex;align-items:center;">
						<span style="max-width: 190px;display: inline-block;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">{{myInfo.userLabel||$t('setting.notSet')}}</span>
						<span class="iconfont iconbeizhu hoverable" @click.stop="_startEditUserLabel" />
					</div>

					<a-input
						ref="userLabelInput"
						v-show="editingUserLabel"
						v-model.trim="newUserLabel"
						@pressEnter="_endEditUserLabel"
						@blur="_endEditUserLabel"
						maxlength="16"
					/>
				</li>

				<!-- 清除历史记录 -->
				<li
					:key="`${thread.id}_setup_${li}`"
					v-if="li===10"
					@click.stop="$store.dispatch('OPcomponent/set_deleteChatConfirm', { deleteId: thread.id, container: 'chatSetup' })"
					class="clickable"
				>
					<label>{{$t('chat.clearHistory')}}</label>
				</li>

				<!-- 退出群聊 -->
				<li
					:key="`${thread.id}_setup_${li}`"
					v-if="li===12&&!isGroupOwner"
					style="color: #FF5943;"
					@click.stop="activeModal='killThread'"
					class="clickable"
				>
					<label>{{$t('chat.leaveGroupChat')}}</label>
				</li>

				<!-- 解散群组 -->
				<li
					:key="`${thread.id}_setup_${li}`"
					v-if="li===13&&isGroupOwner"
					style="color: #FF5943;"
					@click.stop="activeModal='killThread'"
					class="clickable"
				>
					<label>{{$t('chat.dismissGroupChat')}}</label>
				</li>
			</template>
		</ul>

		<!----------------------------------------------------------- 弹 窗 ----------------------------------------------->

		<template v-if="thread.type==1&&thread.latestStatus=='8'">
			<!-- 群设置 -->
			<div :class="{'sub-page':true,hidden:!showGroupManage}">
				<div class="sub-page-title">
					<i class="iconfont iconfanhui hoverable" @click="showGroupManage=false;" />
					<span>{{$t('chat.groupManagement')}}</span>
					<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
				</div>
				<ul class="sub-page-content setup-list">
					<template v-for="li in frame[thread.type].list[isGroupManager?1:0]">
						<!-- 群管理员 -->
						<li
							:key="`${thread.id}_setup_${li}`"
							v-if="li===19"
							@click.stop="showGroupManagers=true;"
							class="clickable"
						>
							<label>{{$t('chat.groupAdmin')}}</label>
							<span>{{groupManagers.length?`${$t('common.countPeople', { number: groupManagers.length })}`:$t('common.null')}}</span>
							<span class="iconfont iconxiayiye" />
						</li>

						<!-- 进群审核 -->
						<li :key="`${thread.id}_setup_${li}`" v-if="li===6">
							<label>{{$t('chat.joiningGroupCheck')}}</label>
							<a-switch
								:disabled="setting!==''&&setting!=='joinAudit'"
								:loading="setting==='joinAudit'"
								:checked="thread.joinAudit?true:false"
								@change="checked=>{_switchChange(checked,'joinAudit')}"
							/>
						</li>

						<!-- 匿名聊天 -->
						<li :key="`${thread.id}_setup_${li}`" v-if="li===7">
							<label>{{$t('chat.anonymousChat')}}</label>
							<a-switch
								:disabled="setting!==''&&setting!=='isAnoymous'"
								:loading="setting==='isAnoymous'"
								:checked="thread.isAnoymous == 1?true:false"
								@change="checked=>{_switchChange(checked,'isAnoymous')}"
							/>
						</li>

						<!-- 转移群主 -->
						<li
							:key="`${thread.id}_setup_${li}`"
							v-if="li===8&&isGroupOwner&&thread.isAnoymous!=1"
							@click.stop="activeModal='transferOwner'"
							class="clickable"
						>
							<label>{{$t('chat.transferGroupOwnership')}}</label>
							<span class="iconfont iconxiayiye" />
						</li>

						<!-- 群成员保护模式 -->
						<li :key="`${thread.id}_setup_${li}`" v-if="li===16">
							<label>{{$t('chat.groupMemberProMode')}}</label>
							<a-switch
								:disabled="setting!==''&&setting!=='privacyProtection'"
								:loading="setting==='privacyProtection'"
								:checked="thread.privacyProtection?true:false"
								@change="checked=>{_switchChange(checked,'privacyProtection')}"
							/>
						</li>

						<!-- 设置群内禁言 -->
						<li
							:key="`${thread.id}_setup_${li}`"
							v-if="li===15"
							@click.stop="showBanList=true;getBannedSpeechConfig()"
							class="clickable"
						>
							<label>{{$t('chat.muteSetting')}}</label>
							<span class="iconfont iconxiayiye" />
						</li>

						<!-- 禁止添加群成员 -->
						<li :key="`${thread.id}_setup_${li}`" v-if="li===9">
							<label>{{$t('chat.prohibitNewMembersJoining')}}</label>
							<a-switch
								:disabled="setting!==''&&setting!=='forbidMemberJoin'"
								:loading="setting==='forbidMemberJoin'"
								:checked="thread.forbidMemberJoin?true:false"
								@change="checked=>{_switchChange(checked,'forbidMemberJoin')}"
							/>
						</li>

						<!-- 禁止群成员修改群名 -->
						<li :key="`${thread.id}_setup_${li}`" v-if="li===11">
							<label>{{$t('chat.prohibitEditGroupName')}}</label>
							<a-switch
								:disabled="setting!==''&&setting!=='forbidEditGroupName'"
								:loading="setting==='forbidEditGroupName'"
								:checked="thread.forbidEditGroupName?true:false"
								@change="checked=>{_switchChange(checked,'forbidEditGroupName')}"
							/>
						</li>
					</template>
				</ul>
			</div>

			<!-- 群成员列表 -->
			<div :class="{'sub-page':true,hidden:!showMemberList}">
				<div class="sub-page-title">
					<i class="iconfont iconfanhui hoverable" @click="showMemberList=false;" />
					<span>{{$t('chat.groupMembers')}}</span>
					<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
				</div>

				<div class="sub-page-content" v-if="memberList!==null">
					<div v-for="(memberArr,letter) in memberList" :key="`letter${letter}`">
						<div class="letter" v-if="letter!=='Administrators'">
							{{letter}}
						</div>
						<div
							v-for="member in memberArr"
							:key="`gm${member.userId}`"
							@click.stop="_showUserCard(member)"
							class="member-in-list"
						>
							<label v-show="member.adminFlag==1">{{$t('common.owner')}}</label>
							<label v-show="member.adminFlag==2" :class="{'label-manager':true,isGroupOwner}">{{$t('common.admin')}}</label>
							<img :src="member.userAvatar || ''" class="avatargerenbg" @error="e => $utils.setDefaultAvatar(e, 0)">
							<button
								v-if="(isGroupManager&&member.adminFlag==0) ||(isGroupOwner&&member.adminFlag!=1)"
								@click.stop="preRemoveMember(member.userId)"
							>
								{{$t('common.delete')}}
							</button>

							<div>
								<p>
									{{member.label||member.userLabel||member.nickName}}
									<template v-if="member.workingStatusId">
										<img v-if="member.workingStatusExpression" :src="$utils.message.getEmojiSrc(member.workingStatusExpression)">
										<span class="working-status-value">{{['1', '2', '3', '4'].includes(member.workingStatusId)?$t(`workStatus.defaultStatus[${member.workingStatusId - 1}]`):member.workingStatusValue}}</span>
									</template>
								</p>
								<span class="online-status">
									<template v-if="serverTime">
										{{_getOnlineStatus(member.onlineState,member.onlineTime)}}
									</template>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 设置禁言 -->
			<div :class="{'sub-page':true,hidden:!showBanList}">
				<div class="sub-page-title">
					<i class="iconfont iconfanhui hoverable" @click="showBanList=false;banConfig=null;" />
					<span>{{$t('chat.muteSetting')}}</span>
					<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
				</div>
				<div class="sub-page-content" style="padding:0 30px;">
					<a-spin :spinning="updatingConfig">
						<div class="part-header">
							<span>{{$t('chat.memberMuteMode')}}</span>
							<div @click="preSelectMember('ban')" style="display:flex">
								<i class="iconfont icontianjia"></i>{{$t('chat.selectMuteMembers')}}
							</div>
						</div>

						<div
							v-show="bannedList&&bannedList.length"
							v-for="member in bannedList"
							:key="`ban${member.userId}`"
							@click.stop="_showUserCard(member)"
							class="member-in-list ban"
						>
							<img :src="member.userAvatar || ''" class="avatargerenbg" @error="e => $utils.setDefaultAvatar(e, 0)">
							<button
								@click.stop="!unbanning&&unban(member.userId,1)"
							>
								{{$t('common.remove')}}
							</button>

							<div>
								<p>{{member.label||member.userLabel||member.nickName}}</p>
								<span>{{getCountDown(member.userId)}}</span>
							</div>
						</div>

						<div class="part-header bannedSpeech">
							<span>{{$t('chat.muteMode')}}</span>
							<a-switch
								:disabled="setting!==''&&setting!=='bannedSpeech'"
								:loading="setting==='bannedSpeech'"
								:checked="thread.bannedSpeech==1"
								@change="checked=>{_switchChange(checked,'bannedSpeech')}"
							/>
						</div>

						<div class="part-header" v-show="thread.bannedSpeech==1">
							<span>{{$t('chat.memberCanSendMessages')}}</span>
							<div @click="preSelectMember('allow')">
								<i class="iconfont icontianjia"></i>{{$t('chat.selectCanSendMembers')}}
							</div>
						</div>

						<div
							v-for="member in allowedList"
							v-show="thread.bannedSpeech==1&&allowedList&&allowedList.length"
							:key="`allow${member.userId}`"
							@click.stop="_showUserCard(member)"
							class="member-in-list ban"
						>
							<img :src="member.userAvatar || ''" class="avatargerenbg" @error="e => $utils.setDefaultAvatar(e, 0)">
							<button
								@click.stop="!unbanning&&unban(member.userId,0)"
							>
								{{$t('common.remove')}}
							</button>

							<div>
								<p>{{member.label||member.userLabel||member.nickName}}</p>
							</div>
						</div>
					</a-spin>
				</div>
			</div>

			<!-- 添加群管理员 -->
			<div :class="{'sub-page':true,hidden:!showGroupManagers}">
				<div class="sub-page-title">
					<i class="iconfont iconfanhui hoverable" @click="showGroupManagers=false;" />
					<span>{{$t('chat.groupAdmin')}}</span>
					<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
				</div>
				<div class="sub-page-content" style="padding:0 30px;">
					<div v-if="isGroupOwner" class="part-header bannedSpeech hoverable" @click="preSelectMember('manager')">
						<div><i class="iconfont icontianjia"></i></div>
						<span>{{$t('chat.addGroupAdmin')}}</span>
						<div>{{groupManagers.length}}/10<i class="iconfont iconxiayiye" /></div>
					</div>

					<div
						v-show="showGroupManagers&&groupManagers&&groupManagers.length"
						v-for="member in groupManagers"
						:key="`manager${member.userId}`"
						@click.stop="_showUserCard(member)"
						class="member-in-list ban"
					>
						<img :src="member.userAvatar || ''" class="avatargerenbg" @error="e => $utils.setDefaultAvatar(e, 0)">
						<button
							v-if="isGroupOwner"
							@click.stop="fireGroupManager(member.userId)"
						>
							{{$t('common.remove')}}
						</button>

						<div>
							<p>{{member.label||member.userLabel||member.nickName}}</p>
							<!-- <span>{{getCountDown(member.userId)}}</span> -->
						</div>
					</div>

					<div v-show="showGroupManagers" class="no-manager">
						<div>{{$t('chat.groupAdminTip1')}} <span class="hoverable" @click="showManagerRights=true">{{$t('chat.viewSpecificPermission')}}</span></div>
						<template v-if="isGroupOwner&&groupManagers&&groupManagers.length==0">
							<img src="@/assets/img/no-manager.png">
							<div v-if="isGroupOwner" style="text-align:center;">
								<span class="hoverable" @click="preSelectMember('manager')">添加</span>群管理员，一起管理群组吧
							</div>
						</template>
					</div>
				</div>
			</div>

			<!-- 群管理员权限 -->
			<div :class="{'sub-page':true,hidden:!showManagerRights}">
				<div class="sub-page-title">
					<i class="iconfont iconfanhui hoverable" @click="showManagerRights=false;" />
					<span>{{$t('chat.groupAdminPermission')}}</span>
					<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
				</div>
				<div class="sub-page-content manager-rights">
					<img src="@/assets/img/managerRightsBanner.png">
					<h1>{{$t('chat.groupAdminPermissionTip0')}}</h1>
					<div>
						<span>
							01
						</span>
						<p>
							{{$t('chat.groupAdminPermissionTip6')}}
						</p>
					</div>
					<div><span>02</span><p>{{$t('chat.groupAdminPermissionTip7')}}</p></div>
					<div><span>03</span><p>{{$t('chat.groupAdminPermissionTip1')}}</p></div>
					<div><span>04</span><p>{{$t('chat.groupAdminPermissionTip2')}}</p></div>
					<div><span>05</span><p>{{$t('chat.groupAdminPermissionTip3')}}</p></div>
					<div><span>06</span><p>{{$t('chat.groupAdminPermissionTip4')}}</p></div>
					<div><span>07</span><p>{{$t('chat.groupAdminPermissionTip5')}}</p></div>
				</div>
			</div>

			<!-- 选择群成员 -->
			<MultiplePanel
				v-if="selectingMemberType!==''"
				:visible="selectingMemberType!==''"
				:confirm="onSelectedMembers"
				:cancel="cancelSelectMember"
				:modeltitle="modeltitle"
				dataType="groupMembers"
				:limit="selectLimit"
				:groupName="thread.name"
				:groupMembers="groupMembers"
				:selectedIds="selectedMembers"
				:disabledIds="disabledIds"
			>
				<div v-show="selectingMemberType=='ban'" class="ban-select">
					<div>
						{{$t('chat.selectMutedTime')}}<span style="color:red;font-size:18px;"> *</span>
					</div>
					<a-select default-value="0" @change="(e)=>{banTime=e}">
						<a-select-option value="0">
							{{$t('common.select')}}
						</a-select-option>
						<a-select-option :value="item.dictValue" v-for="item in $store.state.Chat.banned_time_dict" :key="`banTime${item.dictValue}`">
							{{item.dictName}}
						</a-select-option>
					</a-select>
					<div class="clearfix"></div>
				</div>
			</MultiplePanel>

			<!-- 创建群聊 -->
			<creat-group
				v-if="thread.type==1&&thread.latestStatus=='8'"
				:groupId="thread.id"
				:joinAudit="isGroupManager?0:thread.joinAudit"
				:forbidMemberJoin="isGroupManager?0:thread.forbidMemberJoin"
				:friendsInGroup="groupMembers"
				ref="addMemberBox"
			/>

			<!-- 二维码 -->
			<qrcode-card v-if="thread.type" :visible.sync="showQrcodeCard" :data="thread" />

			<!-- 删除群成员 -->
			<a-modal
				v-if="thread.type"
				class="notification-IM"
				:getContainer="()=>$refs.chatSetup"
				:title="$t('chat.delGroupMembers[0]')"
				centered
				:width="436"
				:maskClosable="false"
				:visible="activeModal==='removeMember'"
				@cancel="_modalCancel('removeMember')"
			>
				<p>{{$t('chat.delGroupMembers[1]')}}</p>
				<template #footer>
					<a-button type="primary" :loading="processing" @click="_modalOk('removeMember')">
						{{$t('common.delete')}}
					</a-button>
					<a-button @click="_modalCancel('removeMember')">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>

			<!-- 解散群组 -->
			<a-modal
				v-if="thread.type"
				class="notification-IM"
				:getContainer="()=>$refs.chatSetup"
				:title="isGroupOwner?$t('chat.dismissGroupChat'):$t('chat.leaveGroupChat')"
				centered
				:width="436"
				:maskClosable="false"
				:visible="activeModal==='killThread'"
				@cancel="_modalCancel('killThread')"
			>
				<p>{{isGroupOwner?$t('chat.dismissGroupChat'):$t('chat.leaveGroupChat')}}？</p>
				<template #footer>
					<a-button type="primary" :loading="processing" @click="_modalOk('killThread')">
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="_modalCancel('killThread')">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>

			<!-- 转移群主 -->
			<a-modal
				class="notification-IM"
				v-if="thread.type"
				centered
				:getContainer="()=>$refs.chatSetup"
				:title="$t('chat.transferGroupOwnership')"
				:width="436"
				:maskClosable="false"
				:visible="activeModal==='transferOwner'"
				@cancel="_modalCancel('transferOwner')"
				:afterClose="()=>{serverTime = 0}"
			>
				<div id="transferOwner">
					<a-radio-group v-model="newOwner">
						<a-radio
							v-for="member in groupMembers"
							:class="{'is-groupOwner':member.userId==thread.groupOwnerId}"
							:key="`transferOwner${member.userId}`"
							:style="radioStyle"
							:value="member.userId"
						>
							<img
								class="group-user-avatar"
								:src="member.userAvatar || ''"
								@error="e => $utils.setDefaultAvatar(e,0)"
							>
							<div class="group-user-info">
								<div class="group-user-name">
									{{member.label||member.userLabel||member.nickName}}
								</div>
								<div class="group-user-onlineTime">
									<template v-if="serverTime">
										{{_getOnlineStatus(member.onlineState,member.onlineTime)}}
									</template>
								</div>
							</div>
						</a-radio>
					</a-radio-group>
				</div>
				<template #footer>
					<a-button type="primary" :loading="processing" @click="_modalOk('transferOwner')">
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="_modalCancel('transferOwner')">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>
		</template>
	</div>
</template>

<script>
	import Thread from './Thread'
	import AAlistItem from '@/components/AAlist/item'
	import CreatGroup from '@/components/creatgroup'
	import qrcodeCard from '@/components/qrcodeCard'
	import { searchGroupMembers } from '@/utils/common/fuzzySearch'
	import getLetter from '@/utils/common/pinyin'
	import { isNickNameAllow } from '@/utils/web'
	import MultiplePanel from '@/components/MultiplePanel'

	export default {
		name: 'ChatSetup',
		components: {
			Thread,
			AAlistItem,
			MultiplePanel,
			CreatGroup,
			qrcodeCard
		},
		props: {
			isGroupOwner: {
				type: Boolean,
				default: false
			},
			isGroupManager: {
				type: Boolean,
				default: false
			},
			animate: {
				type: Boolean,
				default: true
			},
			thread: {
				type: Object,
				default: () => ({})
			},
			groupMembers: {
				type: Array,
				default: () => ([])
			},
			visible: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				serverTime: 0,
				showManagerRights: false,
				showGroupManage: false,
				showGroupManagers: false,
				showMemberList: false,
				showQrcodeCard: false,

				processing: false,
				removingMemberID: '',
				editingThreadName: false,
				editingUserLabel: false,

				showAllMembers: false,

				newThreadName: this.thread.name,
				newUserLabel: '',
				userCardId: '',
				newOwner: '',

				setting: '',
				activeModal: '',

				radioStyle: {
					display: 'block',
					height: '30px',
					lineHeight: '30px'
				},

				// 搜索相关
				searching: false,
				searchKey: '', // 搜索关键字
				searchResult: [],

				// 禁言相关
				showBanList: false,
				banTime: 0,
				updatingConfig: false,
				banConfig: null,
				unbanning: false,

				firingGroupManager: false,

				// 选择群成员相关
				selectingMemberType: '', // ban禁言 allow可发言 manager管理员
				selectedMembers: '',
				modeltitle: '',
				selectLimit: 0,
				disabledIds: ''
			}
		},
		computed: {
			groupManagers() {
				return this.groupMembers.filter(user => {
					return user.adminFlag == 2
				})
			},
			groupUsers() {
				const users = this.groupMembers
				if (this.searchResult.length > 0) {
					return users.filter(user => {
						return this.searchResult.indexOf(user.userId) >= 0
					})
				} else {
					return users
				}
			},
			allowedList() {
				if (this.thread.isAnoymous == 0 && this.banConfig) {
					return this.banConfig.data.allowedList.map(data => {
						return this.groupMembers.find(user => {
							return data.userId == user.userId
						})
					})
				} else {
					return []
				}
			},
			bannedList() {
				if (this.thread.isAnoymous == 0 && this.banConfig) {
					const newList = []
					let member
					this.banConfig.data.bannedList.forEach(data => {
						member = this.groupMembers.find(user => {
							return data.userId == user.userId
						})
						if (member) {
							newList.push(member)
						}
					})
					return newList
				} else {
					return []
				}
			},
			memberList() {
				return this._sortByPinyin(this.groupMembers)
			},
			userCardWorking() {
				return !!this.$store.state.OPcomponent.userCard.userId
			},
			isMyself() {
				return this.thread.userId == this.$store.state.User.accountInfo.userId
			},
			myInfo() {
				const myInfo = this.groupMembers.find(user => {
					return user.userId == this.$store.state.User.accountInfo.userId
				})
				return myInfo || {}
			},
			// 在多语言切换时候，data里不会自动更新语言，所以挪到computed里
			frame() {
				/**
				 * 0：单聊头像及名称等
				 * 1：群聊头像及名称等
				 * 2：群成员
				 * 3：免打扰
				 * 4：不允许添加我
				 * 5：我在本群的昵称
				 * 6：进群审核
				 * 7：匿名聊天
				 * 8：转移群主
				 * 9：禁止添加群成员
				 * 10：清除历史记录
				 * 11：禁止群成员修改群名
				 * 12：退出群聊
				 * 13：解散群组
				 * 14：阅后即焚
				 * 15：设置群内禁言
				 * 16：群成员保护模式
				 * 17: 置顶
				 * 18：群组设置
				 * 19：群管理员
				 */
				return {
					0: {
						// 私聊
						title: this.$t('chat.chatSettings'),
						list: {
							0: [0, 17, 14, 3, 10],
							1: [0, 17, 14, 3, 10]
						}
					},
					1: {
						// 群聊
						title: this.$t('chat.groupSettings'),
						list: {
							0: [1, 2, 17, 3, 4, 5, 10, 12], // 群成员
							1: [1, 2, 18, 17, 3, 4, 5, 19, 6, 7, 16, 15, 9, 11, 8, 10, 12, 13] // 群主
						}
					}
				}
			}
		},
		watch: {
			visible(val) {
				if (this.thread.type == 1 && val) { // 刷新群配置
					const threadID = this.thread.id
					setTimeout(() => {
						this.$store.dispatch('MyGrounp/refreshSettings', threadID).then(res => {
							if (res.code == 0) {
								this.$store.dispatch('Chat/preUpdateThread', { threadID })
							}
						}).catch(e => {
							console.log(e)
						})
					}, 300)
				}
			},
			activeModal(newVal, oldVal) {
				if (newVal == 'transferOwner') {
					setTimeout(() => {
						this.serverTime = this.$utils.fun.getServerTime('formatOnlineTime')
					}, 500)
				}
			},
			showMemberList(val) {
				if (val) {
					setTimeout(() => {
						this.serverTime = this.$utils.fun.getServerTime('formatOnlineTime')
					}, 300)
				} else {
					setTimeout(() => {
						this.serverTime = 0
					}, 300)
				}
			},
			'isGroupManager'(val) {
				if (!val) {
					this.showManagerRights = false
					this.showGroupManage = false
					this.showGroupManagers = false
					this.showBanList = false
				}
			},
			'$route.path'() {
				this._hideSetting('routeChange')
			},
			'thread.name'(val) {
				this.newThreadName = val
			},
			searchKey(val) {
				const privacyProtection = this.thread.privacyProtection && !this.isGroupManager
				this.searchResult = searchGroupMembers(val, this.groupMembers, privacyProtection).map(user => {
					return user.userId
				})
			}
		},
		methods: {
			preSelectMember(list) {
				if (this.showBanList && this.thread.isAnoymous == 1) {
					this.$message.error(this.$t('chat.anonymousChatFirst'))
				} else {
					const titles = {
						'ban': this.$t('chat.selectMuteMembers'),
						'allow': this.$t('chat.selectCanSendMembers'),
						'manager': this.$t('chat.addGroupAdmin')
					}
					this.selectingMemberType = list
					this.modeltitle = titles[list]
					this.selectLimit = this.showGroupManagers ? 10 : this.groupMembers.length - 1

					const managers = []
					this.groupMembers.forEach(user => {
						if (user.adminFlag > 0) {
							managers.push(user.userId)
						}
					})

					if (['ban', 'allow'].includes(list)) {
						const selectedMembers = this.getSelectedMembers()
						this.selectedMembers = selectedMembers.join('|')
						this.disabledIds = [...managers, ...selectedMembers]
					} else if (list === 'manager') {
						this.selectedMembers = managers.join('|')
						this.disabledIds = [...managers, this.thread.groupOwnerId]
					}
				}
			},

			onSelectedMembers(data) {
				return new Promise(async(resolve, reject) => {
					if (this.selectingMemberType == 'ban' && this.banTime == 0) {
						this.$message.error(this.$t('chat.selectMutedTime'))
						return resolve()
					}

					this.processing = true

					if (this.selectedMembers) {
						const selectedIds = this.selectedMembers.split('|')
						data = data.filter(user => {
							return !selectedIds.includes(user.userId)
						})
					}

					if (['ban', 'allow'].includes(this.selectingMemberType)) {
						console.log(this.thread.id)
						const res = await this.$utils.api.user.updateSpeechMembers({
							groupId: this.thread.id,
							userIds: data.map(member => {
								return member.userId
							}).join('|'),
							action: 0,
							type: this.selectingMemberType === 'ban' ? 1 : 0,
							bannedMinutes: this.banTime,
							custError: true
						}).get().catch(e => {
							console.log(e)
							if (e.code == '605003') {
								this.$message.error(e.message)
								this.cancelSelectMember()
							} else {
								this.$message.error(e.message || (this.selectingMemberType == 'ban' ? '添加禁言失败' : '添加可发言失败'))
							}
						})

						if (res.code == 0) {
							this.getBannedSpeechConfig()
						}
						this.banTime = 0
						this.selectingMemberType = ''
					} else if (this.selectingMemberType === 'manager') {
						await this.$utils.api.user.updateGroupManager({
							groupId: this.thread.id,
							userIds: data.map(member => {
								return member.userId
							}).join('|'),
							action: 2,
							custError: true
						}).get().catch(e => {
							console.log(e)
							if (e.code == '605003') {
								this.$message.error(e.message)
								this.cancelSelectMember()
							} else {
								this.$message.error(e.message || '添加群管理员失败')
							}
						})

						this.selectingMemberType = ''
					}

					this.processing = false
					resolve()
				})
			},

			cancelSelectMember() {
				if (this.selectingMemberType == 'ban') {
					this.banTime = 0
				}
				this.selectingMemberType = ''
			},

			getSelectedMembers() {
				if (this.thread.isAnoymous == 0 && this.banConfig) {
					let banList
					if (this.selectingMemberType == 'ban') {
						banList = this.banConfig.data.bannedList
					} else if (this.selectingMemberType == 'allow') {
						banList = this.banConfig.data.allowedList
					}

					banList = banList.map(data => {
						return data.userId
					})
					return banList
				}
			},

			async fireGroupManager(userId) {
				if (this.firingGroupManager) return
				this.firingGroupManager = true
				const res = await this.$utils.api.user.updateGroupManager({
					groupId: this.thread.id,
					userIds: userId,
					action: 0
				}).get()

				if (res.code != 0) {
					this.$message.error(res.message || '删除群管理员失败')
				}
				this.firingGroupManager = false
			},

			unban(userId, type) {
				this.unbanning = true
				this.$utils.api.user.updateSpeechMembers({
					groupId: this.thread.id,
					userIds: userId,
					action: 1,
					type
				}).get().then(res => {
					if (res.code == 0) {
						this.getBannedSpeechConfig()
					}
					this.unbanning = false
				})
			},
			getCountDown(userId) {
				const leftTime = this.banConfig.data.bannedList.find(data => {
					return data.userId == userId
				}).bannedTimeCountDown
				// return `约${this.$utils.time.getLeftBanTime(leftTime)}后解除禁言`
				return this.$t('chat.silencedTime[8]', { time: this.$utils.time.getLeftBanTime(leftTime) })
			},

			getBannedSpeechConfig() {
				this.updatingConfig = true
				this.$utils.api.user.getBannedSpeechConfig({
					groupId: this.thread.id,
					moreInfo: 1
				}).get().then(res => {
					console.log(res)
					if (res.code == 0) {
						this.banConfig = res
						this.updatingConfig = false
					} else {
						this.showBanList = false
						this.$message.error('获取禁言配置信息失败，请稍后重试')
					}
				})
			},

			showSearchInput() {
				this.searching = true
				this.$nextTick(() => {
					this.$refs.searchInput[0].children[0].focus()
				})
			},

			_showMemberList() {
				this.showMemberList = true
			},

			_sortByPinyin(list = []) {
				const store = {}
				const letterList = [
					'Administrators',
					'A',
					'B',
					'C',
					'D',
					'E',
					'F',
					'G',
					'H',
					'I',
					'J',
					'K',
					'L',
					'M',
					'N',
					'O',
					'P',
					'Q',
					'R',
					'S',
					'T',
					'U',
					'V',
					'W',
					'X',
					'Y',
					'Z',
					'#'
				]

				letterList.forEach(letter => {
					store[letter] = []
				})

				list = list.sort((a, b) => {
					return a.onlineTime - b.onlineTime < 0
				})

				const letterReg = new RegExp('^[a-zA-Z]')
				list.forEach(item => {
					if (item.adminFlag != 0) {
						store['Administrators'].push(item)
					} else {
						const value = item.label || item.userLabel || item.nickName
						if (value && letterReg.test(value[0])) {
							// 以字母命名的情况后续可看是否有要求再优化
							store[value[0].toUpperCase()].push(item)
						} else if (value && letterReg.test(getLetter(value[0])[0])) {
							store[getLetter(value[0])[0]].push(item)
						} else store['#'].push(item)
					}
				})

				window._.keys(store).forEach(key => {
					if (store[key].length === 0) {
						delete store[key]
					}
				})

				return store
			},

			_getOnlineStatus(state, timestamp) {
				if (state == 1) {
					return this.$t('common.online')
				} else {
					// return this.$t('common.offline')
					return this.$utils.time.formatOnlineTime(timestamp, this.serverTime)
				}
			},

			_showUserCard(member) {
				const isMyfriend = this.$store.state.MyFriend.list.some(friend => {
					return friend.userId == member.userId
				})

				if (member.notAllowAddme != 1 || (isMyfriend || member.userId == this.myInfo.userId) && !this.removingMemberID) {
					this.$store.dispatch('OPcomponent/set_userCard', {
						userId: member.userId,
						privacyProtection: !this.isGroupManager && this.thread.privacyProtection == 1 && !isMyfriend
					})
				} else if (member.notAllowAddme == 1) {
					this.$message.warn(this.$t('chat.personalInformation'))
				}
			},

			_addMember() {
				//      if (this.thread.forbidMemberJoin) {
				//        this.$message.error("群主关闭进群申请");
				//      } else {
				//        this.$refs.addMemberBox.addnewgroup = true;
				//      }
				this.$refs.addMemberBox.addnewgroup = true
			},

			preRemoveMember(userId) {
				if (this.removingMemberID) return
				this.removingMemberID = userId
				this.activeModal = 'removeMember'
			},

			async _removeMember() {
				const res = await this.$store.dispatch('Chat/removeMember', {
					userId: this.removingMemberID,
					groupId: this.thread.id
				})

				if (res && res.code != 0) {
					this.removingMemberID = ''
					return
				}

				const reload = this.groupMembers.length < 9
				this.$store.dispatch('MyGrounp/update_info', {
					groupId: this.thread.id,
					reload
				})

				this.$store.dispatch('MyGrounp/update_userRelation', {
					groupId: this.thread.id
				})

				this.removingMemberID = ''
			},

			async _modalOk(modal) {
				this.processing = true
				const groupId = this.thread.id

				// 清空聊天记录
				if (modal === 'clearMsg') {
					await this.$store.dispatch('Chat/clearMsg', { threadID: groupId })
				} else if (modal === 'transferOwner') { // 转移群主
					if (this.newOwner) {
						const res = await this.$store.dispatch('Chat/transferOwner', {
							groupId: groupId,
							ownerId: this.newOwner
						})

						if (res && res.code != 0) {
							this.activeModal = ''
							this.newOwner = ''
							this.processing = false
							return
						}

						await this.$store.dispatch('MyGrounp/update_info', {
							groupId: groupId,
							groupOwnerId: this.newOwner
						})
						await this.$store.dispatch('MyGrounp/update_userRelation', {
							groupId: groupId
						})
						this.newOwner = ''
						this.showGroupManage = false
					} else {
						this.$message.error('请选择新群主')
						this.processing = false
						return
					}
				} else if (modal === 'killThread') { // 退出群聊，解散群组
					const res = await this.$store.dispatch('Chat/killThread', { groupId })
					if (res && res.code != 0) {
						this.activeModal = ''
						this.processing = false
						return
					}
					// ---更新我的群组;更新群组关系列表
					await this.$store.dispatch('MyGrounp/delete_info', { groupId })
					await this.$store.dispatch('MyGrounp/delete_userRelation', { groupId })

					this.$emit('hide', {}, {})
				} else if (modal === 'removeMember') { // 删除群成员
					this._removeMember()
				}

				this.activeModal = ''
				this.processing = false
			},

			_modalCancel(modal) {
				if (modal === 'transferOwner') {
					this.newOwner = ''
				} else if (modal === 'removeMember') {
					this.removingMemberID = ''
				}
				this.activeModal = ''
				this.processing = false
			},

			_hideSetting(e) {
				if (e !== 'routeChange' && (e.target.id === 'chatSetupSwitch' || this.userCardWorking || this.selectingMemberType !== '')) return

				setTimeout(() => {
					if (this.$refs.setupList) {
						this.$refs.setupList.scrollTop = 0
					}

					// 初始化
					window._.assign(this.$data, {
						showManagerRights: false,
						showGroupManage: false,
						showGroupManagers: false,
						showMemberList: false,
						showQrcodeCard: false,

						processing: false,
						removingMemberID: '',
						editingThreadName: false,
						editingUserLabel: false,

						showAllMembers: false,

						newThreadName: this.thread.name,
						newUserLabel: '',
						userCardId: '',
						newOwner: '',

						setting: '',
						activeModal: '',

						// 搜索相关
						searching: false,
						searchKey: '', // 搜索关键字
						searchResult: [],

						// 禁言相关
						showBanList: false,
						banTime: 0,
						updatingConfig: false,
						banConfig: null,
						unbanning: false,

						firingGroupManager: false,

						// 选择群成员相关
						selectingMemberType: '', // ban禁言 allow可发言 manager管理员
						selectedMembers: '',
						modeltitle: '',
						selectLimit: 0,
						disabledIds: ''
					})
				}, 300)

				this.$emit('hide')
			},

			_startEditThreadName() {
				this.editingThreadName = true
				this.$nextTick(() => {
					this.$refs.threadNameInput[0].$refs.input.focus()
				})
			},

			async _endEditThreadName() {
				this.newThreadName = this.newThreadName.replace(/(^\s*)|(\s*$)/g, '')

				if (this.newThreadName.length > 16) {
					this.$message.error('群名称不能超过16个字符')
					return
				}
				if (this.newThreadName !== this.thread.name) {
					const res = await this._updateSetup({ groupName: this.newThreadName })
					if (res && res.code != 0) {
						this.newThreadName = this.thread.name
					}
				}

				this.editingThreadName = false
			},

			_startEditUserLabel() {
				this.editingUserLabel = true
				this.newUserLabel = this.myInfo.userLabel
				this.$nextTick(() => {
					this.$refs.userLabelInput[0].$refs.input.focus()
				})
			},

			async _endEditUserLabel() {
				if (this.newUserLabel != this.myInfo.userLabel) {
					if (this.newUserLabel && !isNickNameAllow(this.newUserLabel)) {
						this.$message.error('输入内容不能包含<>/等特殊符号，请修改重试')
						this.$refs.userLabelInput[0].$refs.input.focus()
						return
					}
					const res = await this._updateSetup({ userLabel: this.newUserLabel })
					if (res && res.code != 0) {
						this.newUserLabel = this.myInfo.userLabel
					}
				}

				this.editingUserLabel = false
			},

			_switchChange(checked, key) {
				this._updateSetup({
					[`${key}`]: checked ? 1 : 0
				})
			},

			_updateSetup(updatingData) {
				return new Promise(async(resolve, reject) => {
					if (!this.$store.state.Setting.online) {
						this.$message.error(this.$t('common.netErrorTip[0]'))
						return resolve()
					}

					this.setting = Object.keys(updatingData)[0]

					if (this.setting === 'setTop') {
						await this.$store.dispatch('Chat/setTop', this.thread)
					} else {
						updatingData.groupId = this.thread.id
						if (this.thread.type == 0) {
							updatingData.userId = this.thread.userId
						}
						const res = await this.$store.dispatch('updateThreadSetup', {
							type: 'send',
							updatingData: updatingData
						})
						resolve(res)
					}
					// loading延迟
					setTimeout(()	=> {
						this.setting = ''
					}, 350)
				})
			}
		}
	}
</script>

<style lang="scss">
	#chatSetup {
		-webkit-app-region: no-drag;
		box-shadow: 0px 4px 16px 0px rgba(224, 224, 224, 0.55);
		z-index: 999;
		&.hidden {
			box-shadow: 0px 0px 0px 0px rgba(224, 224, 224, 0)!important;
		}

		&.sub-page,.sub-page {
			position: absolute;
			top: 0;
			right: 0;
			width: 417px;
			height: 100%;
			background: #fff;
			flex-direction: column;
			transition: all 0.3s ease-out;
			display: flex;
			justify-content: center;
			flex-direction: column;
			&.hidden {
				transform: translateX(100%);
			}

			&:not(.first-floor){
				z-index: 1000;
			}

			.sub-page-title {
				height: 80px;
				line-height: 80px;
				font-size: 18px;
				color: #333;
				border-bottom: 1px solid #f0f0f0;
				padding-left: 30px;
				display: flex;
				align-items: center;
				-webkit-app-region: drag;
				span{flex:1;}

				.iconfanhui {
					font-size: 14px;
					margin-right: 5px;
					-webkit-app-region: no-drag;
				}

				.icontongyongguanbi{
					font-size: 12px;
					margin: 20px 30px 20px 20px;
					-webkit-app-region: no-drag;
				}
			}

			.sub-page-content {
				flex: 1;
				overflow-y: auto;

				&.manager-rights{
					img{display: block;width:100%;}
					h1{
						font-size: 16px;
						color: #333;
						margin: 25px auto 20px;
						width: 80%;
					}
					div{
						font-size: 12px;
						display: flex;
						width: 80%;
						margin: 8px auto 0;
						color:#666;
						span{color:#2e87ff;padding-right: 10px;}
					}
				}

				.part-header{
					display: flex;
					align-items: center;
					font-size: 12px;
					line-height: 40px;
					span{flex:1;color:#999;}
					div{cursor: pointer;display: flex;}
					.icontianjia{
						vertical-align: middle;
						color:#1677ff;
						margin-right: 5px;
					}

					&.bannedSpeech{
						font-size: 14px;
						line-height: 56px;
						span{color:#333;}
						border-bottom: 1px solid #e6e6e6;
					}
				}
			}
		}

		.no-manager{
			padding: 10px	0	20px;
			font-size: 12px;
			color:#333;
			span{
				color:#2e87ff;
			}
			img{
				width:241px;
				display: block;
				margin: 30px auto 25px;
			}
		}

		&.animate{
			transition: all 0.3s ease-out;
		}

		ul > li > .iconfont,
		.hoverable {
			color: #999;
		}

		ul > li.clickable {
			cursor: pointer;
			* {
				cursor: pointer;
			}
		}

		#multiple-panel .panel-body .left .left-bottom{
			padding-top: 15px!important;
		}

		.setup-list {
			flex: 1;
			padding: 0 30px !important;
			font-size: 16px;
			color: #333333;

			.AAlist-item {
				.item-left .ant-avatar {
					width: 40px;
					height: 40px;
					margin-right: 16px;
				}
			}

			.item-center{
				.thread-name-in-setup{
					display: inline-block;
					vertical-align: middle;
					max-width: 220px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				.ant-input{
					max-width:none;
					width:220px;
				}
			}

			.ant-switch-disabled{
				opacity: 1!important;
				.ant-switch:after {
					cursor: not-allowed!important;
				}
			}

			.ant-input{
				max-width: 50%;
			}

			.base-info {
				.item-center {
					padding: 0;
				}
			}

			.group-members {
				.header {
					height: 73px;
					display: flex;
					align-items: center;
					label {
						flex: 1;
					}
					// .iconjia,
					// .iconjian {
					//   margin-right: 14px;
					// }
					.cancel {
						font-size: 16px;
						margin-left: 14px;
						cursor: pointer;
						line-height: 28px;
						&:hover {
							color: $darkBlue;
						}
					}

					.ant-input {
						max-width: none;
						flex: 1;
						height: 28px;
						background: rgba(249, 249, 249, 1);
						border: 1px solid rgba(240, 240, 240, 1);
						border-radius: 2px;
					}
				}

				.members {
					display: flex;
					flex-wrap: wrap;
					max-height: 156px;
					// overflow: hidden;
					&.show-all {
						max-height: unset;
					}

					.member {
						width: 35px;
						margin-bottom: 13px;
						margin-right: 27px;
						position: relative;

						&:nth-of-type(6n) {
							margin-right: 0;
						}

						img,
						.icon-addMember {
							width: 100%;
							height: 35px;
							border-radius: 50%;
						}

						.icon-addMember {
							line-height: 35px;
							text-align: center;
							border: 1px solid #e9e9e9;

							&:hover {
								border-color: #2e87ff;
							}
						}

						p {
							margin-top: 7px;
							font-size: 12px;
							text-align: center;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
						label {
							position: absolute;
							top:-8px;
							left: 18px;
							width: max-content;
							padding: 0 4px;
							line-height: 16px;
							background: #f2f2f5;
							border: 1px solid #fff;
							border-radius: 2px;
							font-size: 10px;
							text-align: center;
							&.admin{left: 10px;}
						}
						.iconmacguanbi {
							visibility: hidden;
							pointer-events: none;
							position: absolute;
							right: 0;
							top: 25px;
							border: 1px solid rgba(255, 90, 57, 1);
							border-radius: 50%;
							color: #ff5a39;
							width: 12px;
							height: 12px;
							line-height: 12px;
							text-align: center;
							font-size: 6px;
							background: #fff;
							cursor: default;
						}
						&:hover .iconmacguanbi {
							visibility: visible;
							pointer-events: all;
						}
					}
				}

				.more {
					color: #999;
					font-size: 10px;
					margin: 10px 0 30px;
					text-align: center;
					.iconfont {
						font-size: 10px;
					}
				}
			}

			li:not(.group-members):not(.base-info):not(.thread-list-item) {
				border-top: 1px solid #f0f0f0;
				height: 55px;
				display: flex;
				align-items: center;

				label {
					flex: 1;
				}

				span,
				.iconfont {
					color: #999999;
					font-size: 15px;
				}
			}
		}

		#transferOwner {
			overflow-x: hidden;
			overflow-y: scroll;
			max-height: 340px;
			.ant-radio-group{
				width:100%
			}

			.ant-radio-wrapper {
				display: flex!important;
				align-items: center;
				margin-bottom: 24px;
				height: auto!important;
				line-height: auto!important;

				&.is-groupOwner{
					display: none!important;
				}

				span:not(.ant-radio){
					flex: 1;
					display: flex;
					align-items: center;
				}

				.group-user-avatar {
					width: 40px;
					height: 40px;
					border-radius: 50%;
					margin: 0 15px;
				}
				.group-user-info{
					flex: 1;
					.group-user-name {
						color: rgba(0, 0, 0, 0.85);
						font-weight: 500;
						font-size: 14px;
						line-height: 18px;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					.group-user-onlineTime{
						color: #999;
						font-size: 12px;
						height:12px;
						line-height: 12px;
						margin-top: 6px;
					}
				}

			}
		}

		button:focus {
			outline: $darkBlue auto 5px;
		}

		.letter {
			text-indent: 30px;
			line-height: 24px;
			background: #f9f9f9;
		}

		.member-in-list {
			height: 60px;
			padding: 0 30px 0 86px;
			position: relative;
			font-size: 16px;
			color: #333;

			&.ban{
				padding: 0 0 0 56px;
			}

			&:not(.ban):hover {
				background: #eeeeee;
				.label-manager.isGroupOwner{
					visibility: hidden;
				}
				button {
					visibility: visible;
					&:hover {
						cursor: pointer;
						color: $darkBlue;
						border-color: $darkBlue;
					}
				}
			}

			.avatargerenbg {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				position: absolute;
				top: 10px;
				left: 30px;
			}
			label {
				position: absolute;
				right: 30px;
				line-height: 60px;
			}
			button {
				visibility: hidden;
				position: absolute;
				right: 30px;
				top: 19px;
				height: 22px;
				font-size: 12px;
				border: 1px solid rgba(153, 153, 153, 1);
				border-radius: 4px;
				text-align: center;
			}
			div {
				display: flex;
				flex-direction: column;
				justify-content: center;
				height: 100%;
				border-bottom: 1px solid #f0f0f0;
				p {
					margin: 0;
					max-width: 240px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					vertical-align: middle;
					img{
						width:14px;
						height:14px;
						margin:0 4px 0 10px;
					}
					.working-status-value{
						font-size: 12px;
						color: #999999;
					}
				}
				.online-status {
					display: block;
					font-size: 12px;
					height: 12px;
					line-height: 12px;
					color: #666666;
					margin-top: 4px;
				}
			}

			&.ban{
				button{
					// width: 56px;
					height: 26px;
					top:17px;
					visibility: visible;
					right:0;
					border-color: #e5e5e5;
					background:  #f9f9f9;
					font-size: 12px;
					cursor: pointer;

					&:hover{
						color:#1677ff;
						border-color:#1677ff;
					}
				}
				img{
					left:0;
				}
				div{
					border-bottom: none;
				}
				span{
					font-size: 12px;
					color:#999;
				}
				border-bottom: 1px solid #e6e6e6;

			}
		}

		.ban-select{
			margin-bottom: 15px;
			display: flex;
			align-items: center;
			.ant-select{
				margin-left:8px;
				flex:1;
			}
		}
	}
</style>

