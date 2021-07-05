<template>
	<div class="license">
		<div v-if="type == 1">
			<!--隐私政策-->
			<h1 class="title1">
				{{$t('common.privacyTitle')}}
			</h1>
			<p v-html="$t('common.privacyInfo', {projectName: $PROJECT_NAME})"></p>
		</div>
		<div v-else>
			<!--服务协议-->
			<h1 class="title1">
				{{$t('common.serviceAgreement')}}
			</h1>
			<p v-html="content"></p>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'License',
		data() {
			return {
				content: '',
				type: ''
			}
		},
		mounted() {
			this.type = this.$route.query.type
			if (this.type === 'undefined') {
				this.$utils.api.public.userProtocolInfoGetList().get().then(res => {
					this.content = res.data.list[0].content
				})
			}
		}
	}
</script>

<style scoped lang="scss">
  .license {
    padding: 30px;
    font-size: 16px;
    line-height: 180%;
    height: 500px;
    overflow-y: auto;
    .title1 {
      font-size: 30px;
      text-align: center;
      margin-bottom: 30px;
    }
  }
</style>
