// 全局监听器
import store from '@/store'
// const updateOnlineStatus = ({ type }) => {
// 	store.dispatch('Setting/set_online', type === 'online')
// }
module.exports = function(Vue) {
	// window.addEventListener("online", updateOnlineStatus);
	// window.addEventListener("offline", updateOnlineStatus)
	// setInterval(()=>{
	//   navigator.onLine ? store.dispatch('Setting/set_online', true) : store.dispatch('Setting/set_online', false)
	// },500)

	//
	// var EventUtil = {
	//   addHandler: function (element, type, handler) {
	//     if (element.addEventListener) {
	//       element.addEventListener(type, handler, false);
	//     } else if (element.attachEvent) {
	//       element.attachEvent("on" + type, handler);
	//     } else {
	//       element["on" + type] = handler;
	//     }
	//   }
	// };
	// EventUtil.addHandler(window, "online", function () {
	//   store.dispatch('Setting/set_online', true)
	// });
	// EventUtil.addHandler(window, "offline", function () {
	//   store.dispatch('Setting/set_online', false)
	// });

	// setInterval(function () {
	//   if (window.navigator.onLine) {
	//     store.dispatch('Setting/set_online', true)
	//   } else {
	//     //执行离线状态时的任务
	//     store.dispatch('Setting/set_online', false)
	//   }
	// },500)

	var i = new Image()
	setInterval(function() {
		/* Vue.prototype.$utils.chatSdk.cHeartbeat().then(res => {
			console.log(res)
		})*/
		// i.src = 'https://www.juniuhui.com/img/qzone@2x.ccaf57c.png?t=' + Date.parse(new Date());
		i.src = 'https://ss1.bdstatic.com/5eN1bjq8AAUYm2zgoY3K/r/www/cache/static/protocol/https/soutu/img/camera_new_5606e8f.png?t=' + Date.parse(new Date())
		i.onload = function() {
			store.dispatch('Setting/set_online', store.state.Setting.sdkOnline && true)
		}
		i.onerror = function() {
			store.dispatch('Setting/set_online', false)
		}
	}, 1000)

	// Vue.prototype.$utils.api.public.getVersionList().get().then(res => {
	//   console.log(res)
	// }).catch(err =>{
	//   console.log(err.message,1111111)
	// })
}
