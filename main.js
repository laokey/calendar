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
import { i18n, syncStoredLanguage } from './utils/i18n'
export function createApp() {
  const app = createSSRApp(App)
  syncStoredLanguage()
  app.use(i18n)
  return {
    app
  }
}
// #endif
