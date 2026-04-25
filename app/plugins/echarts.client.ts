import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

export default defineNuxtPlugin((nuxtApp) => {
  use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent])
  nuxtApp.vueApp.component('VChart', VChart)
})
