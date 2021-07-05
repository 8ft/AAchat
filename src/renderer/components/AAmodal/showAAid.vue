<template>
	<a-modal centered :maskClosable="false" class="notification-IM  showAAid" :visible="visible" :width="390"
		@cancel="cancel"
	>
		<div class="container">
			<h3>{{$t('chat.welcome', { projectName: $PROJECT_NAME })}}！</h3>
			<p>{{$t('chat.yourAAnumber')}}：</p>
			<div id="key">
				{{aaId}}
			</div>
			<p>{{$t('chat.welcomeText')}}！</p>
		</div>
		<div class="operator">
			<a-button type="primary" @click="handle">
				{{$t('chat.copyIDnumber')}}
			</a-button>
		</div>
		<template #footer></template>
	</a-modal>
</template>
<script>
	export default {
		name: 'ShowAAid',
		props: {
			visible: Boolean,
			aaId: {
				type: [String, Number],
				require: true
			}
		},
		methods: {
			setNewUser() {
				this.$store.dispatch('User/set_accountInfo', { newUser: 0 })
			},
			cancel() {
				this.setNewUser()
				this.$store.dispatch('Setting/set_showModal', '')
			},
			handle() {
				this.$utils.fun.writeToClipboard({ text: this.aaId })
				this.cancel()
			}
		}
	}
</script>
<style lang="scss">
  .showAAid {
    .ant-modal-content {
      border-radius: 12px;
    }
    .container {
      padding: 20px;
      text-align: center;
      h3 {
        color: #2E87FF;
        font-size: 25px;
        font-weight: 500;
        margin-bottom: 15px;
      }
      p {
        color: $lightBlack;
        font-size: 12px;
      }
      p:last-child {
        font-size: 13px;
        margin-top: 40px
      }
      div {
        border: 2px solid #D9D9D9;
        line-height: 53px;
        border-radius: 27px;
        color: $black;
        font-size: 28px;
        font-weight: 500;
        margin-top: 5px;
        letter-spacing: 2px;
        user-select: text;
      }
    }
    .operator {
      text-align: center;
      padding-bottom: 15px;
      .ant-btn {
        width: 136px;
        height: 44px;
        line-height: 44px;
        border-radius: 22px;
      }
    }
    .ant-modal-footer {
      display: none;
    }
  }
</style>
