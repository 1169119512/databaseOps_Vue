import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DatabaseAPI } from '@/api/database'

/**
 * 数据库连接管理Store
 */
export const useDatabaseStore = defineStore('database', () => {
  // 存储的数据库连接列表
  const connections = ref([])
  
  // 当前激活的连接
  const activeConnectionId = ref(null)

  // 从localStorage加载连接配置
  const loadConnections = () => {
    try {
      const saved = localStorage.getItem('database_connections')
      if (saved) {
        connections.value = JSON.parse(saved)
      }
      
      const savedActive = localStorage.getItem('active_connection_id')
      if (savedActive) {
        activeConnectionId.value = savedActive
      }
    } catch (error) {
      console.error('加载数据库连接配置失败：', error)
    }
  }

  // 保存连接配置到localStorage
  const saveConnections = () => {
    try {
      localStorage.setItem('database_connections', JSON.stringify(connections.value))
      if (activeConnectionId.value) {
        localStorage.setItem('active_connection_id', activeConnectionId.value)
      }
    } catch (error) {
      console.error('保存数据库连接配置失败：', error)
    }
  }

  // 添加连接
  const addConnection = (connection) => {
    const newConnection = {
      id: Date.now().toString(),
      name: connection.name,
      baseURL: connection.baseURL,
      tableName: connection.tableName,
      description: connection.description || '',
      createdAt: new Date().toISOString()
    }
    
    connections.value.push(newConnection)
    saveConnections()
    
    return newConnection
  }

  // 更新连接
  const updateConnection = (id, updates) => {
    const index = connections.value.findIndex(c => c.id === id)
    if (index !== -1) {
      connections.value[index] = {
        ...connections.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveConnections()
      return true
    }
    return false
  }

  // 删除连接
  const deleteConnection = (id) => {
    const index = connections.value.findIndex(c => c.id === id)
    if (index !== -1) {
      connections.value.splice(index, 1)
      
      // 如果删除的是当前激活的连接，清空激活状态
      if (activeConnectionId.value === id) {
        activeConnectionId.value = null
        localStorage.removeItem('active_connection_id')
      }
      
      saveConnections()
      return true
    }
    return false
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
    loadConnections
  }
})

