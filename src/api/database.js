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
      
      if (!filter) return
      
      // 处理数组形式的多个条件（同一字段多个筛选）
      const filterArray = Array.isArray(filter) ? filter : [filter]
      
      filterArray.forEach(singleFilter => {
        // 跳过空值（日期类型除外，因为可能只有startDate/endDate）
        if (!singleFilter) return
        
        const hasValue = singleFilter.value !== undefined && 
                        singleFilter.value !== null && 
                        singleFilter.value !== ''
        const hasDateRange = singleFilter.startDate || singleFilter.endDate
        
        if (!hasValue && !hasDateRange) return

        const { type, operator, value } = singleFilter

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
                params[`${key}_eq`] = value
                break
            }
            break
            
          case 'varchar':
            // 字符串型：模糊查询（直接使用字段名）
            if (hasValue) {
              params[key] = value
            }
            break
            
          case 'date':
          case 'timestamp':
            // 日期型：范围查询
            if (singleFilter.startDate) {
              params[`${key}_start`] = singleFilter.startDate
            }
            if (singleFilter.endDate) {
              params[`${key}_end`] = singleFilter.endDate
            }
            break
            
          default:
            // 默认精确匹配
            if (hasValue) {
              params[key] = value
            }
        }
      })
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
   * 批量删除记录
   * @param {String} tableName - 表名
   * @param {Array} ids - 记录ID数组
   * @returns {Object} - { deleted_count, failed_ids }
   */
  async batchDelete(tableName, ids) {
    return this.request.post(`/api/${tableName}/batch-delete`, { ids })
  }

  /**
   * 获取表字段信息（新接口：包含字段名和注释）
   * @param {String} tableName - 表名
   * @returns {Object} - { fields: [{field_name, comment, type}], table_comment }
   */
  async getTableFields(tableName) {
    try {
      const response = await this.request.get(`/api/${tableName}/fields`)
      if (response.data && response.data.fields) {
        return {
          fields: response.data.fields,
          tableName: response.data.table_name,
          tableComment: response.data.table_comment
        }
      }
      return { fields: [], tableName: '', tableComment: '' }
    } catch (error) {
      console.error('获取表字段信息失败：', error)
      // 如果新接口失败，降级到旧方法
      return this.getTableSchemaFallback(tableName)
    }
  }

  /**
   * 获取表字段信息（降级方案：通过分页查询第一条数据）
   * @param {String} tableName - 表名
   */
  async getTableSchemaFallback(tableName) {
    try {
      const response = await this.getList(tableName, 1, 1)
      if (response.data && response.data.data && response.data.data.length > 0) {
        const firstRecord = response.data.data[0]
        const fields = Object.keys(firstRecord).map(fieldName => ({
          field_name: fieldName,
          comment: fieldName, // 降级方案：注释就是字段名
          type: this.inferFieldType(firstRecord[fieldName])
        }))
        return { fields, tableName: '', tableComment: '' }
      }
      return { fields: [], tableName: '', tableComment: '' }
    } catch (error) {
      console.error('获取表结构失败：', error)
      return { fields: [], tableName: '', tableComment: '' }
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
   * 获取表结构及类型信息（增强版：包含注释）
   * @param {String} tableName - 表名
   * @returns {Object} - { fields: [{name, type, comment}], tableComment }
   */
  async getTableSchemaWithTypes(tableName) {
    try {
      // 1. 获取字段信息（字段名+注释）
      const fieldInfo = await this.getTableFields(tableName)
      
      // 2. 获取第一条数据用于推断类型
      const response = await this.getList(tableName, 1, 1)
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const firstRecord = response.data.data[0]
        
        // 3. 合并字段信息和类型信息
        const fields = fieldInfo.fields.map(field => {
          const fieldName = field.field_name
          const fieldValue = firstRecord[fieldName]
          
          return {
            name: fieldName,
            comment: field.comment || fieldName,
            type: this.inferFieldType(fieldValue)
          }
        })
        
        return {
          fields,
          tableComment: fieldInfo.tableComment
        }
      }
      
      // 如果没有数据，只返回字段信息
      if (fieldInfo.fields.length > 0) {
        const fields = fieldInfo.fields.map(field => ({
          name: field.field_name,
          comment: field.comment || field.field_name,
          type: 'varchar' // 默认类型
        }))
        
        return {
          fields,
          tableComment: fieldInfo.tableComment
        }
      }
      
      return { fields: [], tableComment: '' }
    } catch (error) {
      console.error('获取表结构失败：', error)
      return { fields: [], tableComment: '' }
    }
  }
}

// 默认API实例
export const defaultAPI = new DatabaseAPI()

