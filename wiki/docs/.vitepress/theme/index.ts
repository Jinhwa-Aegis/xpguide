import DefaultTheme from 'vitepress/theme'
import './custom.css'
import AdminPage from './components/AdminPage.vue'
import AdminLayout from './layouts/AdminLayout.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AdminPage', AdminPage)
    app.component('AdminLayout', AdminLayout)
  }
}
