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
              表名：{{ currentConnection.tableName }} | 
              地址：{{ currentConnection.baseURL }}
            </span>
          </div>
          <div>
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
      >
        <el-table-column type="index" label="序号" width="60" fixed="left" />
        <el-table-column
          v-for="field in displayFields"
          :key="field"
          :prop="field"
          :label="field"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ formatValue(row[field]) }}
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

      <!-- 分页 -->
      <div class="pagination-container">
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
          :label="field.name"
        >
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Setting } from '@element-plus/icons-vue'
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
const tableSchema = ref({}) // 字段名 -> 类型
const displayFields = ref([]) // 显示的字段列表
const activeCollapse = ref(['filter'])

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
  return tableFields.value.filter(field => {
    // 排除常见的自动字段
    const autoFields = ['ZBXH', 'GXSJ', 'id', 'created_at', 'updated_at']
    return !autoFields.includes(field.name)
  })
})

// 表字段列表（用于筛选组件）
const tableFields = computed(() => {
  return Object.keys(tableSchema.value).map(name => ({
    name,
    type: tableSchema.value[name]
  }))
})

// 获取主键字段
const getPrimaryKey = () => {
  // 常见主键字段名
  const pkFields = ['ZBXH', 'id', 'ID']
  for (const field of pkFields) {
    if (displayFields.value.includes(field)) {
      return field
    }
  }
  return displayFields.value[0] // 默认第一个字段
}

// 连接切换处理
const handleConnectionChange = () => {
  // 重置数据
  tableData.value = []
  tableSchema.value = {}
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
    displayFields.value = Object.keys(schema)
    
    if (Object.keys(schema).length > 0) {
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

.pagination-container {
  margin-top: 20px;
}
</style>

