import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const createRequest = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })

  // 请求拦截器
  instance.interceptors.request.use(
    config => {
      return config
    },
    error => {
      console.error('请求错误：', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    response => {
      const res = response.data
      
      // 根据后端返回的code判断
      if (res.code === 200 || res.code === 201) {
        return res
      } else {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    },
    error => {
      console.error('响应错误：', error)
      let message = '网络错误'
      
      if (error.response) {
        message = `请求失败：${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        message = '网络连接失败，请检查网络'
      }
      
      ElMessage.error(message)
      return Promise.reject(error)
    }
  )

  return instance
}

// 默认实例
export const request = createRequest()

// 导出创建实例的方法，用于动态切换后端地址
export { createRequest }

