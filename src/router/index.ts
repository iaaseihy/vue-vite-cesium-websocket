import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Base from '/@/views/base.vue'
import osm from '/@/views/osm-building.vue'
import tile from '/@/views/3d-tile.vue'
import convert from '/@/views/dataConvert.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'base',
    component: Base,
  },
  {
    path: '/osm',
    name: 'osm',
    component: osm,
  },
  {
    path: '/3d-tiles',
    name: 'tile',
    component: tile,
  },
  {
    path: '/data-convert',
    name: '404',
    component: convert,
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
