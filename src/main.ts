import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PlayIcon from 'vue-material-design-icons/Play.vue'
import PauseIcon from 'vue-material-design-icons/Pause.vue'
import StopIcon from 'vue-material-design-icons/Stop.vue'
import StepForwardIcon from 'vue-material-design-icons/StepForward.vue'

import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.component('PlayIcon', PlayIcon)
app.component('PauseIcon', PauseIcon)
app.component('StopIcon', StopIcon)
app.component('StepForwardIcon', StepForwardIcon)

app.mount('#app')
