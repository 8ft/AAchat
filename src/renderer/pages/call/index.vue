<template>
	<div id="call">
		<div class="call-menu">
			<router-link tag="div" class="menu-item" to="/call/recentCall">
				<AAlist-item :data="{title: '最近通话'}">
					<template v-slot:left>
						<i class="iconfont icondianhua"></i>
					</template>
					<template v-slot:right v-if="callRecords.count">
						<span class="count">{{callRecords.count > 99 ? '99+' : callRecords.count}}</span>
					</template>
				</AAlist-item>
			</router-link>
		</div>
		<div class="message">
			<!--子视图-->
			<router-view v-if="$route.params.id"></router-view>
			<div class="default" v-else>
				<div class="main">
					<img src="~@/assets/img/nothing.png" width="240" height="200" :alt="$t('common.noData')">
					<p></p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import AAlistItem from '@/components/AAlist/item.vue'

	export default {
		name: 'Call',
		components: { AAlistItem },
		computed: {
			callRecords() {
				return this.$store.state.OPcomponent.callRecords
			}
		}
	}
</script>
<style lang="scss">
  #call {
    .AAlist-item {
      padding: 15px 0;
    }
    .menu-item:hover {
      .meta {
        color: $darkBlue !important;
        i {
          color: $black !important;
        }
      }
    }
  }
</style>

<style lang="scss" scoped>
  #call {
    width: 100%;
    height: 100%;
    display: flex;
    .call-menu {
      overflow-x: hidden;
      overflow-y: auto;
      width: 248px;
      border-right: $border;
      .menu-item {
        display: block;
        padding-left: 15px;
        flex: 0 0 auto;
        i {
          color: #FFF;
          font-size: 34px;
          padding: 4px;
          line-height: 1;
          &.icondianhua {
            border-radius: 22px;
            background-color: #52BC6F;
          }
        }
        .count {
          color: #FFF;
          font-size: 8px;
          padding: 0 4px;
          background-color: #FF3B30;
          margin-right: 15px;
          display: inline-block;
          height: 15px;
          line-height: 14px;
          min-width: 15px;
          text-align: center;
          border-radius: 10px;
        }
        &:hover, &.active {
          background-color: $bg;
        }
      }
    }
    .message {
      flex: 1 1 auto;
      .default {
        width: 100%;
        height: 100%;
        position: relative;
        .main {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          transform: translate(-50%, -50%);
          text-align: center;
          p {
            margin: 0;
            color: $lightBlack;
            font-size: 20px;
            font-weight: 400;
            min-height: 30px;
          }
        }
      }
    }
  }
</style>
