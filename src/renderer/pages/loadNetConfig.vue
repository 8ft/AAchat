<template>
	<div class="load-net-config" v-show="pageShow">
		<div class="loading">
			<svg class="circular" viewBox="25 25 50 50">
				<circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="1" stroke-miterlimit="10"></circle>
			</svg>
		</div>
		<div class="bg">
		</div>
		<!--<div class="title">配置读取中，请稍候</div>-->
	</div>
</template>

<script>
	export default {
		name: 'LoadNetConfig',
		data() {
			return {
				pageShow: true
			}
		}
	}
</script>

<style scoped lang="scss">
  .load-net-config {
    width: 200px;
    height: 200px;
    -webkit-app-region: drag;
    .bg {
      position: absolute;
      top: 25px;
      left: 25px;
      width: 150px;
      height: 150px;
      @include retinize('logo_load')
    }
    .title {
      position: absolute;
      bottom: 20px;
      width: 100%;
      text-align: center;
    }
    .loading {
      top: 30px;
      left: 30px;
      width: 140px;
      height: 140px;
      position: absolute;
      z-index: 3;
    }
    .circular {
      animation: rotate 2s linear infinite;
      height: 100%;
      transform-origin: center center;
      width: 100%;
    }
    .path {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
      animation: dash 1.5s ease-in-out infinite;
      stroke: #2E87FF;
      stroke-linecap: round;
    }
    @keyframes dash {
      0% {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -35px;
      }
      100% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -124px;
      }
    }
    @keyframes rotate {
      100% {
        transform: rotate(360deg);
      }
    }
  }
</style>
