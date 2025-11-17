import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DatabaseAPI } from '@/api/database'
import axios from 'axios'

/**
 * 数据库连接管理Store
 * 使用配置文件存储（connections.json）
 */
export const useDatabaseStore = defineStore('database', () => {
  // 存储的数据库连接列表
  const connections = ref([])
  
  // 当前激活的连接
  const activeConnectionId = ref(null)

  // 配置API基础地址
  const configApiBase = '/config-api'

  // 从配置文件加载连接配置
  const loadConnections = async () => {
    try {
      const response = await axios.get(`${configApiBase}/connections`)
      if (response.data.code === 200) {
        connections.value = response.data.data || []
      }
      
      // activeConnectionId仍然存在localStorage（不需要持久化到文件）
      const savedActive = localStorage.getItem('active_connection_id')
      if (savedActive) {
        activeConnectionId.value = savedActive
      }
    } catch (error) {
      console.error('加载数据库连接配置失败：', error)
      connections.value = []
    }
  }

  // 保存单个连接到配置文件
  const saveConnection = async (connection) => {
    try {
      const response = await axios.post(`${configApiBase}/connections`, connection)
      return response.data.code === 201
    } catch (error) {
      console.error('保存连接配置失败：', error)
      return false
    }
  }

  // 更新单个连接
  const updateConnectionInFile = async (id, updates) => {
    try {
      const response = await axios.put(`${configApiBase}/connections/${id}`, updates)
      return response.data.code === 200
    } catch (error) {
      console.error('更新连接配置失败：', error)
      return false
    }
  }

  // 删除单个连接
  const deleteConnectionFromFile = async (id) => {
    try {
      const response = await axios.delete(`${configApiBase}/connections/${id}`)
      return response.data.code === 200
    } catch (error) {
      console.error('删除连接配置失败：', error)
      return false
    }
  }

  // 添加连接
  const addConnection = async (connection) => {
    const newConnection = {
      id: Date.now().toString(),
      name: connection.name,
      baseURL: connection.baseURL,
      tableName: connection.tableName,
      description: connection.description || '',
      createdAt: new Date().toISOString()
    }
    
    const success = await saveConnection(newConnection)
    if (success) {
      connections.value.push(newConnection)
      return newConnection
    }
    return null
  }

  // 更新连接
  const updateConnection = async (id, updates) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    const success = await updateConnectionInFile(id, updatedData)
    if (success) {
      const index = connections.value.findIndex(c => c.id === id)
      if (index !== -1) {
        connections.value[index] = {
          ...connections.value[index],
          ...updatedData
        }
      }
      return true
    }
    return false
  }

  // 删除连接
  const deleteConnection = async (id) => {
    const success = await deleteConnectionFromFile(id)
    if (success) {
      const index = connections.value.findIndex(c => c.id === id)
      if (index !== -1) {
        connections.value.splice(index, 1)
      }
      
      // 如果删除的是当前激活的连接，清空激活状态
      if (activeConnectionId.value === id) {
        activeConnectionId.value = null
        localStorage.removeItem('active_connection_id')
      }
      
      return true
    }
    return false
  }

  // 批量导入连接
  const batchImportConnections = async (newConnections) => {
    try {
      const response = await axios.post(`${configApiBase}/connections/batch`, newConnections)
      
      if (response.data.code === 200) {
        await loadConnections()
        return response.data.data.count
      }
      
      return 0
    } catch (error) {
      console.error('批量导入失败：', error)
      return 0
    }
  }

  // 清空所有连接
  const clearAllConnections = async () => {
    try {
      const response = await axios.delete(`${configApiBase}/connections`)
      if (response.data.code === 200) {
        connections.value = []
        activeConnectionId.value = null
        localStorage.removeItem('active_connection_id')
        return true
      }
      return false
    } catch (error) {
      console.error('清空连接失败：', error)
      return false
    }
  }

  // 设置激活连接
  const setActiveConnection = (id) => {
    const connection = connections.value.find(c => c.id === id)
    if (connection) {
      activeConnectionId.value = id
      localStorage.setItem('active_connection_id', id)
      return true
    }
    return false
  }

  // 获取当前激活的连接
  const activeConnection = computed(() => {
    if (!activeConnectionId.value) return null
    return connections.value.find(c => c.id === activeConnectionId.value)
  })

  // 获取当前激活连接的API实例
  const getActiveAPI = () => {
    if (!activeConnection.value) {
      return null
    }
    return new DatabaseAPI(activeConnection.value.baseURL)
  }

  // 根据ID获取连接的API实例
  const getAPIById = (id) => {
    const connection = connections.value.find(c => c.id === id)
    if (!connection) {
      return null
    }
    return new DatabaseAPI(connection.baseURL)
  }

  // 初始化时加载数据
  loadConnections()

  return {
    connections,
    activeConnectionId,
    activeConnection,
    addConnection,
    updateConnection,
    deleteConnection,
    setActiveConnection,
    getActiveAPI,
    getAPIById,
    loadConnections,
    batchImportConnections,
    clearAllConnections
  }
})

