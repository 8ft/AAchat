<template>
	<div id="collection" ref="collection_page">
		<div class="left-list-content">
			<global-search />
			<div class="layout-menu">
				<div class="layout-menu-item new-note">
					<div @click="write">
						<span class="iconfont iconxinjianbiji"></span>{{$t('common.newNote')}}
					</div>
				</div>
				<div :class="{'layout-menu-item':true,'exact-active':selectingType=='all'}" @click="switchSelect('all')">
					<div class="iconfont iconicon_shoucang"></div>
					<div class="name">
						{{$t('favorite.allFavorites')}}
					</div>
				</div>
				<div :class="{'layout-menu-item':true,'exact-active':selectingType=='note'}" @click="switchSelect('note')">
					<div class="iconfont iconicon_biji"></div>
					<div class="name">
						{{$t('common.note')}}
					</div>
				</div>
				<div :class="{'layout-menu-item':true,'exact-active':selectingType=='image'}" @click="switchSelect('image')">
					<div class="iconfont iconicon_tupian"></div>
					<div class="name">
						{{$t('common.image')}}
					</div>
				</div>
				<div :class="{'layout-menu-item':true,'exact-active':selectingType=='voice'}" @click="switchSelect('voice')">
					<div class="iconfont iconicon_yuyin"></div>
					<div class="name">
						{{$t('common.voice')}}
					</div>
				</div>
				<div :class="{'layout-menu-item':true,'exact-active':selectingType=='file'}" @click="switchSelect('file')">
					<div class="iconfont iconicon_wenjian"></div>
					<div class="name">
						{{$t('common.file')}}
					</div>
				</div>
				<div :class="{'layout-menu-item':true,'exact-active':selectingType=='video'}" @click="switchSelect('video')">
					<div class="iconfont iconicon_shipin"></div>
					<div class="name">
						{{$t('common.video')}}
					</div>
				</div>
			</div>
		</div>
		<div class="message">
			<Colletcs :selecting-type="selectingType" @write="write"></Colletcs>
		</div>

		<a-modal
			class="note-editor"
			v-model="writingNote"
			centered
			:getContainer="()=>$refs.collection_page"
			:title="$t('common.note')"
			:footer="null"
			:maskClosable="false"
			:closable="false"
			:destroyOnClose="true"
		>
			<Editor :note-data="noteContent" @done="noteContent={};writingNote=false;"></Editor>
		</a-modal>
	</div>
</template>

<script>
	import GlobalSearch from '@/components/GlobalSearch'
	import Colletcs from './content'
	import Editor from './components/Editor/index'

	export default {
		name: 'Collection',
		components: { GlobalSearch, Colletcs, Editor },
		data() {
			return {
				selectingType: 'all',
				writingNote: false,
				noteContent: {}
			}
		},
		methods: {
			switchSelect(val) {
				this.selectingType = val
			},
			write(data) {
				this.noteContent = (data && data.noteContent) || {}
				this.writingNote = true
			}
		}
	}
</script>

<style lang="scss">
	#collection {
		.note-editor .ant-modal-body{
			padding:0!important;
		}
	}
</style>

<style lang="scss" scoped>
	#collection {
		width: 100%;
		height: 100%;
		display: flex;
		.layout-menu {
			.layout-menu-item{
				.iconicon_shoucang{color:#ff7a4a;}
				.iconicon_biji,.iconicon_shipin{color:#1e8eff;}
				.iconicon_tupian,.iconicon_wenjian{color:#05c55f;}
				.iconicon_yuyin{color:#fc9211;}
			}
			.new-note{
				&:hover{background-color:unset;}
				padding-left: 0;
				cursor:unset;
				div{
					width:168px;
					height:28px;
					margin:19px auto 21px;
					font-size: 12px;
					color: #333333;
					background: #fff;
					border: 1px solid #e6e6e6;
					border-radius: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
					.iconxinjianbiji{
						font-size: 16px!important;
						margin-right: 9px;
					}
					&:hover{
						cursor: pointer;
						color: #2e87ff;
						border-color: #2e87ff;;
					}
				}
			}

		}
		.message {
			flex: 1 1 auto;
			width: calc( 100% - 248px);
		}
	}
</style>

