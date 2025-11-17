<template>
  <div class="page-container">
    <!-- 连接选择器 -->
    <el-card style="margin-bottom: 20px;" v-if="databaseStore.connections.length > 0">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 600; white-space: nowrap;">选择数据库：</span>
        <el-select
          v-model="currentConnectionId"
          placeholder="请选择要管理的数据库"
          style="flex: 1; max-width: 500px;"
          @change="handleConnectionChange"
          size="large"
        >
          <el-option
            v-for="conn in databaseStore.connections"
            :key="conn.id"
            :label="`${conn.name} (${conn.tableName})`"
            :value="conn.id"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ conn.name }}</span>
              <span style="color: #909399; font-size: 12px;">{{ conn.tableName }}</span>
            </div>
          </el-option>
        </el-select>
        <el-button @click="$router.push('/connection')">
          <el-icon><Setting /></el-icon>
          管理连接
        </el-button>
      </div>
    </el-card>

    <!-- 未添加连接提示 -->
    <el-alert
      v-if="databaseStore.connections.length === 0"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template #title>
        请先在"连接管理"页面添加数据库连接
      </template>
    </el-alert>

    <!-- 数据表管理 -->
    <el-card v-if="currentConnection">
      <template #header>
        <div class="card-header">
          <div>
            <h3 style="margin: 0;">{{ currentConnection.name }}</h3>
            <span style="color: #909399; font-size: 13px;">
              模块：{{ currentConnection.tableName }} | 
              地址：{{ currentConnection.baseURL }}
            </span>
          </div>
          <div style="display: flex; gap: 8px;">
            <el-button @click="loadTableSchema">
              <el-icon><Refresh /></el-icon>
              刷新结构
            </el-button>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              新增记录
            </el-button>
          </div>
        </div>
      </template>

      <!-- 高级筛选 -->
      <el-collapse v-model="activeCollapse" style="margin-bottom: 20px;">
        <el-collapse-item title="高级筛选" name="filter">
          <AdvancedFilter
            v-if="tableFields.length > 0"
            :fields="tableFields"
            @search="handleSearch"
            @reset="handleReset"
          />
        </el-collapse-item>
      </el-collapse>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%;"
        max-height="500"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column type="index" label="序号" width="60" fixed="left" />
        <el-table-column
          v-for="field in displayFields"
          :key="field.name"
          :prop="field.name"
          min-width="150"
          show-overflow-tooltip
        >
          <template #header>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-weight: 600;">{{ field.name }}</span>
              <span style="color: #909399; font-size: 12px; font-weight: normal;">
                {{ field.comment }}
              </span>
            </div>
          </template>
          <template #default="{ row }">
            {{ formatValue(row[field.name]) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部操作栏 -->
      <div class="table-footer">
        <!-- 批量操作 -->
        <div class="batch-actions">
          <el-button
            type="danger"
            @click="handleBatchDelete"
            :disabled="selectedRows.length === 0"
            size="default"
          >
            <el-icon><Delete /></el-icon>
            批量删除
            <el-tag
              v-if="selectedRows.length > 0"
              type="danger"
              size="small"
              style="margin-left: 8px;"
            >
              {{ selectedRows.length }}
            </el-tag>
          </el-button>
          <span v-if="selectedRows.length > 0" style="color: #909399; font-size: 13px; margin-left: 12px;">
            已选中 {{ selectedRows.length }} 条记录
          </span>
        </div>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增记录' : '编辑记录'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        v-if="dialogVisible"
        :model="formData"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item
          v-for="field in editableFields"
          :key="field.name"
        >
          <template #label>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span>{{ field.name }}</span>
              <span style="color: #909399; font-size: 12px; font-weight: normal;">
                {{ field.comment }}
              </span>
            </div>
          </template>
          <!-- 数值类型 -->
          <el-input-number
            v-if="field.type === 'int' || field.type === 'decimal'"
            v-model="formData[field.name]"
            :controls="true"
            :precision="field.type === 'decimal' ? 2 : 0"
            style="width: 100%;"
          />
          
          <!-- 日期类型 -->
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="formData[field.name]"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
          
          <!-- 日期时间类型 -->
          <el-date-picker
            v-else-if="field.type === 'timestamp'"
            v-model="formData[field.name]"
            type="datetime"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
          
          <!-- 文本类型 -->
          <el-input
            v-else
            v-model="formData[field.name]"
            :type="field.multiline ? 'textarea' : 'text'"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Plus, Refresh, Setting, Delete } from '@element-plus/icons-vue'
import { useDatabaseStore } from '@/stores/database'
import AdvancedFilter from '@/components/AdvancedFilter.vue'

const route = useRoute()
const router = useRouter()
const databaseStore = useDatabaseStore()

// 当前选择的连接ID
const currentConnectionId = ref(null)

// 当前连接对象
const currentConnection = computed(() => {
  if (!currentConnectionId.value) return null
  return databaseStore.connections.find(c => c.id === currentConnectionId.value)
})

// 获取当前连接的API实例
const getCurrentAPI = () => {
  if (!currentConnection.value) return null
  return databaseStore.getAPIById(currentConnection.value.id)
}

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const tableSchema = ref({ fields: [], tableComment: '' }) // 表结构信息
const displayFields = ref([]) // 显示的字段列表
const activeCollapse = ref(['filter'])
const selectedRows = ref([]) // 选中的行

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add' | 'edit'
const formRef = ref(null)
const formData = ref({})
const editingId = ref(null)
const currentFilters = ref({})

// 可编辑的字段（排除主键和自动更新字段）
const editableFields = computed(() => {
  if (!tableSchema.value.fields) return []
  return tableSchema.value.fields.filter(field => {
    // 排除常见的自动字段
    const autoFields = ['ZBXH', 'GXSJ', 'id', 'created_at', 'updated_at']
    return !autoFields.includes(field.name)
  })
})

// 表字段列表（用于筛选组件）
const tableFields = computed(() => {
  if (!tableSchema.value.fields) return []
  return tableSchema.value.fields
})

// 获取主键字段
const getPrimaryKey = () => {
  // 常见主键字段名
  const pkFields = ['ZBXH', 'id', 'ID']
  for (const field of pkFields) {
    const found = displayFields.value.find(f => f.name === field)
    if (found) {
      return field
    }
  }
  return displayFields.value[0]?.name // 默认第一个字段
}

// 连接切换处理
const handleConnectionChange = () => {
  // 重置数据
  tableData.value = []
  tableSchema.value = { fields: [], tableComment: '' }
  displayFields.value = []
  pagination.page = 1
  currentFilters.value = {}
  
  // 加载新连接的数据
  if (currentConnectionId.value) {
    loadTableSchema()
  }
}

// 加载表结构
const loadTableSchema = async () => {
  const api = getCurrentAPI()
  if (!api || !currentConnection.value) return

  try {
    const schema = await api.getTableSchemaWithTypes(
      currentConnection.value.tableName
    )
    tableSchema.value = schema
    displayFields.value = schema.fields.map(f => ({
      name: f.name,
      comment: f.comment
    }))
    
    if (schema.fields.length > 0) {
      ElMessage.success('表结构加载成功')
      loadTableData()
    } else {
      ElMessage.warning('表中暂无数据，无法获取表结构')
    }
  } catch (error) {
    ElMessage.error('加载表结构失败：' + error.message)
  }
}

// 加载表数据
const loadTableData = async () => {
  const api = getCurrentAPI()
  if (!api || !currentConnection.value) return

  loading.value = true
  try {
    const response = await api.getList(
      currentConnection.value.tableName,
      pagination.page,
      pagination.pageSize,
      currentFilters.value
    )

    if (response.data) {
      tableData.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.page = response.data.page || 1
      pagination.pageSize = response.data.page_size || 10
    }
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 格式化值显示
const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }
  return value
}

// 高级筛选
const handleSearch = (filters) => {
  currentFilters.value = filters
  pagination.page = 1 // 重置到第一页
  loadTableData()
}

// 重置筛选
const handleReset = () => {
  currentFilters.value = {}
  pagination.page = 1
  loadTableData()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  loadTableData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadTableData()
}

// 重置表单
const resetForm = () => {
  formData.value = {}
  editingId.value = null
}

// 打开新增对话框
const openAddDialog = () => {
  resetForm()
  dialogMode.value = 'add'
  
  // 初始化表单数据
  const initialData = {}
  editableFields.value.forEach(field => {
    initialData[field.name] = null
  })
  formData.value = initialData
  
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  const pkField = getPrimaryKey()
  editingId.value = row[pkField]
  
  // 复制行数据到表单
  const data = {}
  editableFields.value.forEach(field => {
    data[field.name] = row[field.name]
  })
  formData.value = data
  
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  const api = getCurrentAPI()
  if (!api || !currentConnection.value) return

  submitting.value = true
  try {
    // 清理空值
    const submitData = {}
    Object.keys(formData.value).forEach(key => {
      const value = formData.value[key]
      if (value !== null && value !== undefined && value !== '') {
        submitData[key] = value
      }
    })

    if (dialogMode.value === 'add') {
      await api.create(currentConnection.value.tableName, submitData)
      ElMessage.success('新增成功')
    } else {
      await api.update(
        currentConnection.value.tableName,
        editingId.value,
        submitData
      )
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadTableData()
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 删除记录
const handleDelete = (row) => {
  const pkField = getPrimaryKey()
  const id = row[pkField]

  ElMessageBox.confirm(
    `确定要删除该记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      const api = getCurrentAPI()
      if (!api || !currentConnection.value) return

      try {
        await api.delete(currentConnection.value.tableName, id)
        ElMessage.success('删除成功')
        loadTableData()
      } catch (error) {
        ElMessage.error('删除失败：' + error.message)
      }
    })
    .catch(() => {})
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }

  const pkField = getPrimaryKey()
  const ids = selectedRows.value.map(row => row[pkField])

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  )
    .then(async () => {
      const api = getCurrentAPI()
      if (!api || !currentConnection.value) return

      const loading = ElMessage({
        message: '正在删除...',
        type: 'info',
        duration: 0
      })

      try {
        const response = await api.batchDelete(currentConnection.value.tableName, ids)
        loading.close()

        const { deleted_count, failed_ids } = response.data

        // 情况1：全部成功
        if (failed_ids.length === 0) {
          ElNotification({
            title: '删除成功',
            message: `成功删除 ${deleted_count} 条记录`,
            type: 'success',
            duration: 3000
          })
        }
        // 情况2：部分成功
        else if (deleted_count > 0) {
          const failedList = failed_ids.map(item => 
            `ID ${item.id}: ${item.reason}`
          ).join('\n')

          ElNotification({
            title: '部分删除成功',
            dangerouslyUseHTMLString: true,
            message: `
              <div>
                <p style="margin: 0 0 8px 0;">成功删除 ${deleted_count} 条，失败 ${failed_ids.length} 条</p>
                <div style="max-height: 200px; overflow-y: auto; font-size: 12px; color: #909399;">
                  ${failed_ids.map(item => `<div>• ID ${item.id}: ${item.reason}</div>`).join('')}
                </div>
              </div>
            `,
            type: 'warning',
            duration: 5000
          })
        }
        // 情况3：全部失败
        else {
          const failedList = failed_ids.map(item => 
            `ID ${item.id}: ${item.reason}`
          ).join('\n')

          ElNotification({
            title: '删除失败',
            dangerouslyUseHTMLString: true,
            message: `
              <div>
                <p style="margin: 0 0 8px 0;">所有记录删除失败</p>
                <div style="max-height: 200px; overflow-y: auto; font-size: 12px; color: #909399;">
                  ${failed_ids.map(item => `<div>• ID ${item.id}: ${item.reason}</div>`).join('')}
                </div>
              </div>
            `,
            type: 'error',
            duration: 5000
          })
        }

        // 刷新数据并清空选中
        loadTableData()
        selectedRows.value = []
      } catch (error) {
        loading.close()
        ElMessage.error('批量删除失败：' + error.message)
      }
    })
    .catch(() => {})
}

// 初始化
onMounted(() => {
  // 从路由参数获取连接ID
  if (route.params.connectionId) {
    currentConnectionId.value = route.params.connectionId
  } else if (databaseStore.connections.length > 0) {
    // 如果没有路由参数，默认选择第一个连接
    currentConnectionId.value = databaseStore.connections[0].id
  }

  if (currentConnectionId.value) {
    loadTableSchema()
  }
})

// 监听路由变化
watch(() => route.params.connectionId, (newId) => {
  if (newId && newId !== currentConnectionId.value) {
    currentConnectionId.value = newId
    handleConnectionChange()
  }
})
</script>

<style scoped>
.page-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .table-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .batch-actions {
    justify-content: center;
  }
}
</style>

