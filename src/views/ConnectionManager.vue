<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据库连接管理</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            添加连接
          </el-button>
        </div>
      </template>

      <el-table :data="databaseStore.connections" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="连接名称" min-width="120" />
        <el-table-column prop="baseURL" label="后端地址" min-width="200" />
        <el-table-column prop="tableName" label="表名" min-width="120" />
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
        <el-form-item label="表名" prop="tableName">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Right } from '@element-plus/icons-vue'
import { useDatabaseStore } from '@/stores/database'
import { DatabaseAPI } from '@/api/database'

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
  tableName: [{ required: true, message: '请输入表名', trigger: 'blur' }]
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

  await formRef.value.validate((valid) => {
    if (valid) {
      if (dialogMode.value === 'add') {
        databaseStore.addConnection(formData)
        ElMessage.success('添加成功')
      } else {
        databaseStore.updateConnection(editingId.value, formData)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      resetForm()
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
    .then(() => {
      if (databaseStore.deleteConnection(row.id)) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error('删除失败')
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

