
<template>
	<div class="point-card" v-if="uiText&&detail">
		<div class="time">
			{{$utils.time.formatForDetail($utils.time.formatTimestamp(message.timestamp,'Y/M/D h:m:s'))}}
		</div>

		<div class="card">
			<div class="title">
				{{uiText.title}}
			</div>
			<div class="point">
				<div class="type">
					{{uiText.subTitle}}
				</div>
				{{detail.operateFee ? (detail.operateFee * 1).toFixed(1) : ''}}
			</div>
			<div class="line">
				<span>{{uiText.time}}</span>
				<div>{{detail.createTime}}</div>
			</div>
			<div class="line">
				<span>{{uiText.remark}}</span>
				<div>{{detail.remark||''}}</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'PointCard',
		props: {
			message: {
				type: Object,
				default: () => ({})
			}
		},
		data() {
			return {
				detail: null,
				uiText: null
			}
		},
		mounted() {
			this.detail = this.message.data
			this.uiText = this.getPointCardUiText()
		},
		methods: {
			getPointCardUiText() {
				if (this.message.data.uiText) {
					return this.message.data.uiText
				} else {
					const type = this.message.data.type
					let uiText
					switch (type) {
					case 0:
						uiText = {
							title: this.$t('point.adminAssistant'),
							subTitle: this.$t('point.rechargePoints'),
							time: this.$t('point.arrivalTime'),
							remark: this.$t('point.alias')
						}
						break
					case 1:
						uiText = {
							title: this.$t('point.adminRecycle'),
							subTitle: this.$t('point.recyclePoints'),
							time: this.$t('point.recycleTime'),
							remark: this.$t('point.alias')
						}
						break
					case 2:
						uiText = {
							title: this.$t('point.expiredAndReturned'),
							subTitle: this.$t('point.returnPoints'),
							time: this.$t('point.arrivalTime'),
							remark: this.$t('point.alias')
						}
						break
					}

					const newData = JSON.parse(JSON.stringify(this.message.data))
					newData.uiText = uiText

					this.$store.dispatch('Chat/updateMsg', {
						id: this.message.id,
						updatingData: {
							data: newData
						},
						updateDatabaseOnly: true
					})

					return uiText
				}
			}
		}
	}
</script>

<style lang="scss">
    .point-card{
        padding-top:14px;
	      padding-bottom: 20px;
        .time {
			font-size: 12px;
			line-height: 16px;
			margin-bottom: 15px;
			color: rgba(153, 153, 153, 1);
			text-align: center;
		}

        .card{
            width:430px;
            box-sizing: border-box;
            background: #fff;
            border-radius: 8px;
            padding:0 18px 20px;
            margin:0 auto;
            font-size: 14px;
            color:#333;

            .title{
                line-height: 44px;
                border-bottom: solid 1px #e6e6e6;
            }
            .point{
                padding:15px 0;
                text-align: center;
                font-size: 26px;
                .type{
                    font-size: 12px;
                    color:#999;
                }
            }
			.line{
				display: flex;
				line-height: 30px;
				span{display: inline-block;width:100px;color:#999;}
				div{flex:1;white-space: pre-wrap;}
			}
        }
    }
</style>

