<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据库连接管理</span>
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              添加连接
            </el-button>
            <el-dropdown @command="handleBatchCommand">
              <el-button type="success">
                批量操作
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="import-file">
                    <el-icon><Upload /></el-icon>
                    从文件导入配置
                  </el-dropdown-item>
                  <el-dropdown-item command="download-template">
                    <el-icon><Document /></el-icon>
                    下载配置模板
                  </el-dropdown-item>
                  <el-dropdown-item command="export" divided>
                    <el-icon><Download /></el-icon>
                    导出当前配置
                  </el-dropdown-item>
                  <el-dropdown-item command="clear" divided>
                    <el-icon><Delete /></el-icon>
                    清空所有连接
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <el-table :data="databaseStore.connections" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="连接名称" min-width="120" />
        <el-table-column prop="baseURL" label="后端地址" min-width="200" />
        <el-table-column prop="tableName" label="模块名" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="enterManagement(row)">
              <el-icon><Right /></el-icon>
              进入管理
            </el-button>
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="info" size="small" @click="testConnection(row)">
              测试
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加连接' : '编辑连接'"
      width="600px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="连接名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入连接名称" />
        </el-form-item>
        <el-form-item label="后端地址" prop="baseURL">
          <el-input
            v-model="formData.baseURL"
            placeholder="例如：http://localhost:5000 或 https://your-domain.frp.sakura.com"
          />
        </el-form-item>
        <el-form-item label="模块名" prop="tableName">
          <el-input v-model="formData.tableName" placeholder="例如：supplier-archive" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入连接描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Plus, Right, ArrowDown, Upload, Download, Delete, Document } from '@element-plus/icons-vue'
import { useDatabaseStore } from '@/stores/database'
import { DatabaseAPI } from '@/api/database'
import { subsystemConfigs, exportConnections } from '@/utils/importConnections'

const databaseStore = useDatabaseStore()
const router = useRouter()

const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add' | 'edit'
const formRef = ref(null)
const editingId = ref(null)

const formData = reactive({
  name: '',
  baseURL: '',
  tableName: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入连接名称', trigger: 'blur' }],
  baseURL: [
    { required: true, message: '请输入后端地址', trigger: 'blur' },
    {
      pattern: /^https?:\/\/.+/,
      message: '请输入有效的URL地址',
      trigger: 'blur'
    }
  ],
  tableName: [{ required: true, message: '请输入模块名', trigger: 'blur' }]
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.baseURL = ''
  formData.tableName = ''
  formData.description = ''
  editingId.value = null
}

// 打开添加对话框
const openAddDialog = () => {
  resetForm()
  dialogMode.value = 'add'
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  formData.name = row.name
  formData.baseURL = row.baseURL
  formData.tableName = row.tableName
  formData.description = row.description || ''
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (dialogMode.value === 'add') {
        const result = await databaseStore.addConnection(formData)
        if (result) {
          ElMessage.success('添加成功')
          dialogVisible.value = false
          resetForm()
        } else {
          ElMessage.error('添加失败')
        }
      } else {
        const success = await databaseStore.updateConnection(editingId.value, formData)
        if (success) {
          ElMessage.success('更新成功')
          dialogVisible.value = false
          resetForm()
        } else {
          ElMessage.error('更新失败')
        }
      }
    }
  })
}

// 进入数据管理
const enterManagement = (row) => {
  router.push({
    name: 'TableManager',
    params: { connectionId: row.id }
  })
}

// 测试连接
const testConnection = async (row) => {
  const loading = ElMessage.info('正在测试连接...')
  
  try {
    const api = new DatabaseAPI(row.baseURL)
    await api.getList(row.tableName, 1, 1)
    loading.close()
    ElMessage.success('连接测试成功')
  } catch (error) {
    loading.close()
    ElMessage.error('连接测试失败：' + error.message)
  }
}

// 删除连接
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除连接 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      const success = await databaseStore.deleteConnection(row.id)
      if (success) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// 批量操作命令处理
const handleBatchCommand = (command) => {
  switch (command) {
    case 'import-file':
      handleImportFromFile()
      break
    case 'download-template':
      handleDownloadTemplate()
      break
    case 'export':
      handleExport()
      break
    case 'clear':
      handleClearAll()
      break
  }
}

// 从文件导入配置
const handleImportFromFile = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const loading = ElMessage.info({
      message: '正在读取文件...',
      duration: 0
    })

    try {
      const text = await file.text()
      const configs = JSON.parse(text)

      loading.close()

      // 验证配置格式
      if (!Array.isArray(configs)) {
        throw new Error('配置文件格式错误：必须是数组格式')
      }

      // 验证每个配置项
      configs.forEach((config, index) => {
        if (!config.name || !config.baseURL || !config.tableName) {
          throw new Error(`配置项 ${index + 1} 缺少必需字段 (name, baseURL, tableName)`)
        }
      })

      // 显示确认对话框
      ElMessageBox.confirm(
        `将从文件导入 ${configs.length} 个连接配置，是否继续？`,
        '确认导入',
        {
          confirmButtonText: '导入',
          cancelButtonText: '取消',
          type: 'info',
          message: `
            <div>
              <p><strong>文件名：</strong>${file.name}</p>
              <p><strong>配置数量：</strong>${configs.length} 个</p>
              <div style="margin-top: 10px;">
                <p><strong>配置列表：</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px; max-height: 300px; overflow-y: auto;">
                  ${configs.map(c => `<li>${c.name} (${c.tableName})</li>`).join('')}
                </ul>
              </div>
              <p style="color: #E6A23C; margin-top: 10px;">
                ⚠️ 注意：将与现有配置合并，不会删除已有连接
              </p>
            </div>
          `,
          dangerouslyUseHTMLString: true
        }
      )
        .then(async () => {
          // 导入配置
          const timestamp = Date.now()

          const newConnections = configs.map((config, index) => ({
            id: `${timestamp}_${index}`,
            name: config.name,
            baseURL: config.baseURL,
            tableName: config.tableName,
            description: config.description || '',
            createdAt: new Date().toISOString()
          }))

          // 批量导入到配置文件
          const count = await databaseStore.batchImportConnections(newConnections)

          if (count > 0) {
            ElNotification({
              title: '导入成功',
              message: `成功导入 ${count} 个连接配置`,
              type: 'success',
              duration: 3000
            })
          } else {
            ElNotification({
              title: '导入失败',
              message: '未能导入任何连接配置，请检查控制台错误信息',
              type: 'error',
              duration: 5000
            })
          }
        })
        .catch(() => {})

    } catch (error) {
      loading.close()
      ElMessage.error('导入失败：' + error.message)
    }
  }

  input.click()
}

// 下载配置模板
const handleDownloadTemplate = () => {
  const template = subsystemConfigs.map(config => ({
    name: config.name,
    baseURL: config.baseURL,
    tableName: config.tableName,
    description: config.description
  }))

  const dataStr = JSON.stringify(template, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'database_connections_template.json'
  link.click()
  URL.revokeObjectURL(url)

  ElNotification({
    title: '模板已下载',
    message: '已下载配置文件模板，您可以编辑后重新导入',
    type: 'success',
    duration: 3000
  })
}

// 导出配置
const handleExport = () => {
  const connections = exportConnections()
  
  if (connections.length === 0) {
    ElMessage.warning('暂无连接配置可导出')
    return
  }

  // 生成 JSON 文件并下载
  const dataStr = JSON.stringify(connections, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `database_connections_${new Date().getTime()}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success(`已导出 ${connections.length} 个连接配置`)
}

// 清空所有连接
const handleClearAll = () => {
  if (databaseStore.connections.length === 0) {
    ElMessage.warning('当前没有连接配置')
    return
  }

  ElMessageBox.confirm(
    `确定要清空所有 ${databaseStore.connections.length} 个连接配置吗？此操作不可恢复！`,
    '危险操作',
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  )
    .then(async () => {
      const success = await databaseStore.clearAllConnections()
      if (success) {
        ElMessage.success('已清空所有连接配置')
      } else {
        ElMessage.error('清空失败')
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.page-container {
  height: 100%;
}
</style>

