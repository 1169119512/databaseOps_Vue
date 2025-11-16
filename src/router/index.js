import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/table',
    children: [
      {
        path: '/table/:connectionId?',
        name: 'TableManager',
        component: () => import('@/views/TableManager.vue'),
        meta: {
          title: '数据管理',
          icon: 'Grid'
        }
      },
      {
        path: '/connection',
        name: 'ConnectionManager',
        component: () => import('@/views/ConnectionManager.vue'),
        meta: {
          title: '连接管理',
          icon: 'Connection'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

