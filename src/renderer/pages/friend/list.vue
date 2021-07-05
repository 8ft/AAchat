<template>
	<div>
		<div id="header">
			{{$route.params.group}}
		</div>
		<div id="content"></div>
	</div>
</template>

<script>
	export default {
		components: {},
		data() {
			return {}
		}
	}
</script>

<style lang="scss" scoped>
  #list {
    background: #F9F9F9;
    #header {
      height: 74px;
    }
    #content {
      flex: 1;
      overflow-x: hidden;
      overflow-y: auto;
      border-top: $border;
      border-bottom: $border;
    }
  }
</style>
