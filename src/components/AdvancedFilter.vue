<template>
  <div class="advanced-filter">
    <!-- 空状态：简洁的添加按钮 -->
    <div v-if="filterList.length === 0" class="empty-state">
      <el-button type="primary" @click="addFilter" size="small" :icon="Plus">
        添加筛选条件
      </el-button>
      <span style="color: #909399; font-size: 13px; margin-left: 12px;">
        点击添加筛选条件
      </span>
    </div>

    <!-- 有筛选条件时显示 -->
    <el-form v-else :model="formData" label-width="0" class="filter-form">
      <!-- 已添加的筛选条件 -->
      <div class="filter-list">
        <div
          v-for="(filter, index) in filterList"
          :key="filter.id"
          class="filter-item"
        >
          <el-row :gutter="12" align="middle">
            <!-- 字段选择 -->
            <el-col :span="5">
              <el-select
                v-model="filter.fieldName"
                placeholder="选择字段"
                @change="handleFieldChange(index)"
                size="small"
                style="width: 100%;"
              >
                <el-option
                  v-for="field in availableFields"
                  :key="field.name"
                  :label="field.name"
                  :value="field.name"
                >
                  <div style="display: flex; flex-direction: column;">
                    <span>{{ field.name }}</span>
                    <span style="color: #909399; font-size: 11px;">
                      {{ field.comment }}
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-col>

            <!-- 筛选条件（根据字段类型显示） -->
            <el-col :span="18">
              <!-- 数值类型 -->
              <div v-if="filter.type === 'int' || filter.type === 'decimal'" style="display: flex; gap: 8px;">
                <el-select
                  v-model="filter.operator"
                  placeholder="运算符"
                  size="small"
                  style="width: 80px;"
                >
                  <el-option label="=" value="=" />
                  <el-option label=">" value=">" />
                  <el-option label=">=" value=">=" />
                  <el-option label="<" value="<" />
                  <el-option label="<=" value="<=" />
                </el-select>
                <el-input-number
                  v-model="filter.value"
                  :controls="false"
                  :precision="filter.type === 'decimal' ? 2 : 0"
                  placeholder="请输入数值"
                  size="small"
                  style="flex: 1;"
                />
              </div>

              <!-- 字符串类型 -->
              <div v-else-if="filter.type === 'varchar'" style="display: flex; gap: 8px;">
                <el-input
                  v-model="filter.value"
                  placeholder="支持模糊查询"
                  size="small"
                  clearable
                  style="flex: 1;"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <!-- 日期类型 -->
              <div v-else-if="filter.type === 'date' || filter.type === 'timestamp'" style="display: flex; gap: 8px;">
                <el-date-picker
                  v-model="filter.startDate"
                  type="date"
                  placeholder="开始日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="flex: 1;"
                />
                <span style="line-height: 24px; color: #909399;">至</span>
                <el-date-picker
                  v-model="filter.endDate"
                  type="date"
                  placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="flex: 1;"
                />
              </div>

              <!-- 未选择字段 -->
              <div v-else style="color: #909399; font-size: 13px; line-height: 24px;">
                请先选择字段
              </div>
            </el-col>

            <!-- 删除按钮 -->
            <el-col :span="1">
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                circle
                @click="removeFilter(index)"
              />
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="filter-actions">
        <el-button type="primary" @click="addFilter" size="small" :icon="Plus">
          继续添加
        </el-button>
        <el-button
          type="success"
          @click="handleSearch"
          size="small"
          :icon="Search"
        >
          查询
        </el-button>
        <el-button
          @click="handleReset"
          size="small"
          :icon="Refresh"
        >
          清空
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Refresh, Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true,
    default: () => []
    // 数组格式：[{ name: '字段名', type: '类型', comment: '注释' }]
  }
})

const emit = defineEmits(['search', 'reset'])

const formData = ref({})
const filterList = ref([])
let nextFilterId = 1

// 可用的字段列表
const availableFields = computed(() => {
  return props.fields
})

// 添加筛选条件
const addFilter = () => {
  filterList.value.push({
    id: nextFilterId++,
    fieldName: '',
    type: '',
    operator: '=',
    value: null,
    startDate: null,
    endDate: null
  })
}

// 字段改变时，更新筛选条件类型
const handleFieldChange = (index) => {
  const filter = filterList.value[index]
  const field = props.fields.find(f => f.name === filter.fieldName)
  
  if (field) {
    filter.type = field.type
    // 重置值
    filter.operator = '='
    filter.value = null
    filter.startDate = null
    filter.endDate = null
  }
}

// 删除筛选条件
const removeFilter = (index) => {
  filterList.value.splice(index, 1)
}

// 构建筛选参数
const buildFilters = () => {
  const filters = {}
  
  filterList.value.forEach(filter => {
    if (!filter.fieldName) return
    
    filters[filter.fieldName] = {
      type: filter.type,
      operator: filter.operator,
      value: filter.value,
      startDate: filter.startDate,
      endDate: filter.endDate
    }
  })
  
  return filters
}

// 查询
const handleSearch = () => {
  const filters = buildFilters()
  emit('search', filters)
}

// 重置
const handleReset = () => {
  filterList.value = []
  emit('reset')
}

// 暴露方法给父组件
defineExpose({
  reset: handleReset
})
</script>

<style scoped>
.advanced-filter {
  border-radius: 4px;
}

.empty-state {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

.filter-form {
  width: 100%;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.filter-list {
  margin-bottom: 16px;
}

.filter-item {
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.filter-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.filter-item:last-child {
  margin-bottom: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}

:deep(.el-empty) {
  padding: 20px 0;
}

:deep(.el-empty__description) {
  color: #909399;
  font-size: 13px;
}

:deep(.el-select .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-date-editor) {
  width: 100%;
}
</style>
