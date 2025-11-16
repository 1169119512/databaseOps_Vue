import { createRequest } from '@/utils/request'

/**
 * 数据库API类
 * 支持动态切换后端地址
 */
export class DatabaseAPI {
  constructor(baseURL) {
    this.request = createRequest(baseURL)
  }

  /**
   * 构建查询参数
   * @param {Object} filters - 筛选条件对象
   * @returns {Object} - URL查询参数对象
   */
  buildQueryParams(filters) {
    const params = {}
    
    if (!filters) return params

    Object.keys(filters).forEach(key => {
      const filter = filters[key]
      
      if (!filter || filter.value === undefined || filter.value === null || filter.value === '') {
        return
      }

      const { type, operator, value } = filter

      switch (type) {
        case 'int':
        case 'decimal':
          // 数值型：支持 >、<、=、>=、<=
          switch (operator) {
            case '>':
              params[`${key}_gt`] = value
              break
            case '>=':
              params[`${key}_gte`] = value
              break
            case '<':
              params[`${key}_lt`] = value
              break
            case '<=':
              params[`${key}_lte`] = value
              break
            case '=':
              params[key] = value
              break
          }
          break
          
        case 'varchar':
          // 字符串型：模糊查询
          params[`${key}_like`] = value
          break
          
        case 'date':
        case 'timestamp':
          // 日期型：范围查询
          if (filter.startDate) {
            params[`${key}_start`] = filter.startDate
          }
          if (filter.endDate) {
            params[`${key}_end`] = filter.endDate
          }
          break
          
        default:
          // 默认精确匹配
          params[key] = value
      }
    })

    return params
  }

  /**
   * 分页查询
   * @param {String} tableName - 表名
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页条数
   * @param {Object} filters - 筛选条件
   * @param {String} orderBy - 排序字段
   * @param {Boolean} orderDesc - 是否降序
   */
  async getList(tableName, page = 1, pageSize = 10, filters = {}, orderBy = '', orderDesc = false) {
    const params = {
      page,
      page_size: pageSize,
      ...this.buildQueryParams(filters)
    }

    if (orderBy) {
      params.order_by = orderBy
      params.order_desc = orderDesc
    }

    return this.request.get(`/api/${tableName}/`, { params })
  }

  /**
   * 根据ID查询详情
   * @param {String} tableName - 表名
   * @param {Number} id - 记录ID
   */
  async getById(tableName, id) {
    return this.request.get(`/api/${tableName}/${id}`)
  }

  /**
   * 新增记录
   * @param {String} tableName - 表名
   * @param {Object} data - 记录数据
   */
  async create(tableName, data) {
    return this.request.post(`/api/${tableName}/`, data)
  }

  /**
   * 更新记录
   * @param {String} tableName - 表名
   * @param {Number} id - 记录ID
   * @param {Object} data - 更新的数据
   */
  async update(tableName, id, data) {
    return this.request.put(`/api/${tableName}/${id}`, data)
  }

  /**
   * 删除记录
   * @param {String} tableName - 表名
   * @param {Number} id - 记录ID
   */
  async delete(tableName, id) {
    return this.request.delete(`/api/${tableName}/${id}`)
  }

  /**
   * 获取表字段信息（通过分页查询第一条数据）
   * @param {String} tableName - 表名
   */
  async getTableSchema(tableName) {
    try {
      const response = await this.getList(tableName, 1, 1)
      if (response.data && response.data.data && response.data.data.length > 0) {
        const firstRecord = response.data.data[0]
        return Object.keys(firstRecord)
      }
      return []
    } catch (error) {
      console.error('获取表结构失败：', error)
      return []
    }
  }

  /**
   * 推断字段类型（基于值的类型判断）
   * @param {*} value - 字段值
   * @returns {String} - 字段类型
   */
  inferFieldType(value) {
    if (value === null || value === undefined) {
      return 'varchar' // 默认文本类型
    }

    // 检查是否为日期时间字符串
    if (typeof value === 'string') {
      // timestamp格式：YYYY-MM-DD HH:mm:ss
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'timestamp'
      }
      // date格式：YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'date'
      }
      return 'varchar'
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'decimal'
    }

    return 'varchar'
  }

  /**
   * 获取表结构及类型信息
   * @param {String} tableName - 表名
   */
  async getTableSchemaWithTypes(tableName) {
    try {
      const response = await this.getList(tableName, 1, 1)
      if (response.data && response.data.data && response.data.data.length > 0) {
        const firstRecord = response.data.data[0]
        const schema = {}
        
        Object.keys(firstRecord).forEach(key => {
          schema[key] = this.inferFieldType(firstRecord[key])
        })
        
        return schema
      }
      return {}
    } catch (error) {
      console.error('获取表结构失败：', error)
      return {}
    }
  }
}

// 默认API实例
export const defaultAPI = new DatabaseAPI()

