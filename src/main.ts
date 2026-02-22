import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Play from 'vue-material-design-icons/Play.vue'
import PauseIcon from 'vue-material-design-icons/Pause.vue'
import StopIcon from 'vue-material-design-icons/Stop.vue'
import StepForwardIcon from 'vue-material-design-icons/StepForward.vue'
import CheckIcon from 'vue-material-design-icons/Check.vue'
import DragIcon from 'vue-material-design-icons/Drag.vue'
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue'
import CubeIcon from 'vue-material-design-icons/Cube.vue'
import LightbulbIcon from 'vue-material-design-icons/Lightbulb.vue'
import VideoIcon from 'vue-material-design-icons/Video.vue'
import FolderIcon from 'vue-material-design-icons/Folder.vue'

import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.component('PlayIcon', Play)
app.component('PauseIcon', PauseIcon)
app.component('StopIcon', StopIcon)
app.component('StepForwardIcon', StepForwardIcon)
app.component('CheckIcon', CheckIcon)
app.component('DragIcon', DragIcon)
app.component('ChevronRightIcon', ChevronRightIcon)
app.component('ChevronDownIcon', ChevronDownIcon)
app.component('CubeIcon', CubeIcon)
app.component('LightbulbIcon', LightbulbIcon)
app.component('VideoIcon', VideoIcon)
app.component('FolderIcon', FolderIcon)

app.mount('#app')
