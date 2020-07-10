import Vue from 'vue'
import App from './App'
// import mui from "../../js_sdk/mui/js/mui.js";

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
