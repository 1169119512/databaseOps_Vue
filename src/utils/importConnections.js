/**
 * 批量导入数据库连接配置
 * 将子系统配置信息批量保存到 localStorage
 */

export const subsystemConfigs = [
  {
    name: '供应商档案',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'supplier-archive',
    description: '供应商档案管理子系统'
  },
  {
    name: '发票池表头',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'invoice-header',
    description: '发票池表头管理子系统'
  },
  {
    name: '发票池明细',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'invoice-detail',
    description: '发票池明细管理子系统'
  },
  {
    name: '费用映射',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'expense-mapping',
    description: '费用映射配置子系统'
  },
  {
    name: '客户分部配置',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'customer-branch-config',
    description: '客户分部配置子系统'
  },
  {
    name: '法人主体配置',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'legal-entity-config',
    description: '法人主体配置子系统'
  },
  {
    name: '用户管理',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'user-management',
    description: '用户管理子系统'
  },
  {
    name: '税率配置',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'tax-calculation-config',
    description: '税率配置子系统'
  },
  {
    name: '管理员配置',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'admin-config',
    description: '管理员配置子系统'
  },
  {
    name: '红字信息表主表',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'red-letter-header',
    description: '红字信息表主表子系统'
  },
  {
    name: '红字信息明细表',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'red-letter-detail',
    description: '红字信息明细表子系统'
  },
  {
    name: '角色管理',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'role-management',
    description: '角色管理子系统'
  },
  {
    name: '项目管理',
    baseURL: 'https://frp-fun.com:16570',
    tableName: 'project-management',
    description: '项目管理子系统'
  }
]

/**
 * 批量导入连接配置到 localStorage
 * @param {Array} configs - 配置数组
 * @param {Boolean} merge - 是否与现有配置合并（true：合并，false：覆盖）
 * @returns {Number} - 导入的配置数量
 */
export function importConnections(configs = subsystemConfigs, merge = true) {
  try {
    let existingConnections = []
    
    // 如果选择合并，先读取现有配置
    if (merge) {
      const saved = localStorage.getItem('database_connections')
      if (saved) {
        existingConnections = JSON.parse(saved)
      }
    }

    // 生成新的连接配置
    const timestamp = Date.now()
    const newConnections = configs.map((config, index) => ({
      id: `${timestamp}_${index}`,
      name: config.name,
      baseURL: config.baseURL,
      tableName: config.tableName,
      description: config.description || '',
      createdAt: new Date().toISOString()
    }))

    // 合并或覆盖
    const finalConnections = merge 
      ? [...existingConnections, ...newConnections]
      : newConnections

    // 保存到 localStorage
    localStorage.setItem('database_connections', JSON.stringify(finalConnections))

    console.log(`✅ 成功导入 ${newConnections.length} 个数据库连接配置`)
    console.log(`📊 当前总共有 ${finalConnections.length} 个连接配置`)

    return newConnections.length
  } catch (error) {
    console.error('❌ 导入失败：', error)
    throw error
  }
}

/**
 * 清空所有连接配置
 */
export function clearAllConnections() {
  localStorage.removeItem('database_connections')
  localStorage.removeItem('active_connection_id')
  console.log('🗑️ 已清空所有连接配置')
}

/**
 * 导出当前所有连接配置
 * @returns {Array} - 连接配置数组
 */
export function exportConnections() {
  try {
    const saved = localStorage.getItem('database_connections')
    if (saved) {
      const connections = JSON.parse(saved)
      console.log('📤 当前连接配置：', connections)
      return connections
    }
    console.log('📭 暂无连接配置')
    return []
  } catch (error) {
    console.error('❌ 导出失败：', error)
    return []
  }
}

