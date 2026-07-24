// #ifdef VUE3
import { i18n, syncStoredLanguage } from './utils/i18n'
// #endif
import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(i18n)
  syncStoredLanguage()
  return {
    app
  }
}
// #endif
