<template>
  <div class="advanced-filter">
    <el-form :model="filters" label-width="100px" class="filter-form">
      <el-row :gutter="16">
        <el-col
          v-for="field in fields"
          :key="field.name"
          :span="8"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="8"
        >
          <el-form-item :label="field.name">
            <!-- 数值类型 (int, decimal) -->
            <template v-if="field.type === 'int' || field.type === 'decimal'">
              <div style="display: flex; gap: 4px; width: 100%;">
                <el-select
                  v-model="filters[field.name].operator"
                  style="width: 60px;"
                  placeholder="="
                  size="small"
                >
                  <el-option label="=" value="=" />
                  <el-option label=">" value=">" />
                  <el-option label=">=" value=">=" />
                  <el-option label="<" value="<" />
                  <el-option label="<=" value="<=" />
                </el-select>
                <el-input-number
                  v-model="filters[field.name].value"
                  :controls="false"
                  :precision="field.type === 'decimal' ? 2 : 0"
                  style="flex: 1; width: 100%;"
                  placeholder="数值"
                  size="small"
                />
              </div>
            </template>

            <!-- 字符串类型 (varchar) -->
            <template v-else-if="field.type === 'varchar'">
              <el-input
                v-model="filters[field.name].value"
                placeholder="模糊查询"
                clearable
                size="small"
              />
            </template>

            <!-- 日期类型 (date, timestamp) -->
            <template v-else-if="field.type === 'date' || field.type === 'timestamp'">
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                <el-date-picker
                  v-model="filters[field.name].startDate"
                  type="date"
                  placeholder="开始日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                  size="small"
                />
                <el-date-picker
                  v-model="filters[field.name].endDate"
                  type="date"
                  placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                  size="small"
                />
              </div>
            </template>

            <!-- 其他类型默认使用输入框 -->
            <template v-else>
              <el-input
                v-model="filters[field.name].value"
                placeholder="请输入"
                clearable
                size="small"
              />
            </template>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item style="margin-bottom: 0;">
            <el-button type="primary" @click="handleSearch" size="small">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset" size="small">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['search', 'reset'])

const filters = ref({})

// 初始化筛选条件
const initFilters = () => {
  const newFilters = {}
  props.fields.forEach(field => {
    newFilters[field.name] = {
      type: field.type,
      operator: '=', // 默认等于
      value: null,
      startDate: null,
      endDate: null
    }
  })
  filters.value = newFilters
}

// 监听fields变化
watch(
  () => props.fields,
  () => {
    initFilters()
  },
  { immediate: true, deep: true }
)

// 查询
const handleSearch = () => {
  emit('search', filters.value)
}

// 重置
const handleReset = () => {
  initFilters()
  emit('reset')
}

onMounted(() => {
  initFilters()
})
</script>

<style scoped>
.advanced-filter {
  margin-bottom: 20px;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.filter-form :deep(.el-form-item__label) {
  font-size: 13px;
  padding-right: 8px;
}

.filter-form :deep(.el-input-number) {
  width: 100%;
}

.filter-form :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.filter-form :deep(.el-date-editor) {
  width: 100%;
}
</style>

