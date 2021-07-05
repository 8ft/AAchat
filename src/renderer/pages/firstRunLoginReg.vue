<template>
	<div class="login-wrapper">
		<div class="main">
			<div class="firstRun">
				<div style="width: 100%">
					<div class="logo"></div>
					<h2 class="appName">
						{{$PROJECT_NAME}}
					</h2>
					<div class="form">
						<a-button @click="gotoReg" class="login-btn" style="margin-top: 0; color: #999999;background: #FBFBFC">
							{{$t('login.newregister')}}
						</a-button>
						<a-button @click="$router.push('/login')" type="primary" style="margin-top: 16px;" class="login-btn">
							{{$t('login.loginBtn')}}
						</a-button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'FirstRunLoginReg',
		methods: {
			gotoReg() {
				this.$router.push('/register')
			}
		}
	}
</script>

<style scoped>

</style>
