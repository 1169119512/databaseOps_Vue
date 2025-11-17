
## 1. 供应商档案管理

### 1.1 查询供应商列表（分页）

**URL**: `GET /api/supplier-archive/`

**传入参数**:
```
?page=1&page_size=10&KYZT=在营&order_by=CLSJ&order_desc=true
```

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 15,
    "page": 1,
    "page_size": 10,
    "total_pages": 2,
    "data": [
      {
        "ZBXH": 11,
        "GYSMC": "小米科技有限责任公司",
        "GYSSH": "911100001234567892",
        "KYZT": "在营",
        "CLSJ": "2010-04-06",
        "SFAJ": "是",
        "YCQK": null,
        "GXSJ": "2024-11-16 10:00:00.000000",
        "KZZD": null
      }
    ]
  }
}
```

### 1.2 根据ID查询供应商详情

**URL**: `GET /api/supplier-archive/{id}`

**传入参数**:
```
GET /api/supplier-archive/1
```

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "ZBXH": 1,
    "GYSMC": "深圳市腾讯科技有限公司",
    "GYSSH": "914403001234567890",
    "KYZT": "在营",
    "CLSJ": "1998-11-11",
    "SFAJ": "是",
    "YCQK": null,
    "GXSJ": "2024-11-16 10:00:00.000000",
    "KZZD": null
  }
}
```

### 1.3 新增供应商

**URL**: `POST /api/supplier-archive/`

**传入参数**:
```json
{
  "GYSMC": "字节跳动科技有限公司",
  "GYSSH": "911100001234567893",
  "KYZT": "在营",
  "CLSJ": "2012-03-09",
  "SFAJ": "否",
  "YCQK": null
}
```

**响应数据**:
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 11
  }
}
```

### 1.4 更新供应商信息

**URL**: `PUT /api/supplier-archive/{id}`

**传入参数**:
```json
{
  "KYZT": "停业",
  "YCQK": "因经营异常被列入监管"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "affected_rows": 1
  }
}
```

### 1.5 删除供应商

**URL**: `DELETE /api/supplier-archive/{id}`

**传入参数**:
```
DELETE /api/supplier-archive/11
```

**响应数据**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "affected_rows": 1
  }
}
```

## 14. 字段信息查询（所有子系统通用）

### 14.1 获取表字段信息

**功能名**: 查询数据库表字段信息

**URL**: `GET /api/{module}/fields`

其中 `{module}` 可以是以下任意子系统：
- `supplier-archive` - 供应商档案
- `invoice-header` - 发票池表头
- `invoice-detail` - 发票池明细
- `expense-mapping` - 费用映射
- `customer-branch-config` - 客户分部配置
- `legal-entity-config` - 法人主体配置
- `user-management` - 用户管理
- `tax-calculation-config` - 税率配置
- `admin-config` - 管理员配置
- `red-letter-header` - 红字信息表主表
- `red-letter-detail` - 红字信息明细表
- `role-management` - 角色管理
- `project-management` - 项目管理

**传入参数**: 无

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "table_name": "supplier_archive",
    "table_comment": "供应商档案表",
    "fields": [
      {
        "field_name": "ZBXH",
        "comment": "自编序号"
      },
      {
        "field_name": "GYSMC",
        "comment": "供应商名称"
      },
      {
        "field_name": "GYSSH",
        "comment": "供应商税号"
      },
      {
        "field_name": "KYZT",
        "comment": "开业状态"
      },
      {
        "field_name": "CLSJ",
        "comment": "成立时间"
      }
    ]
  }
}
```

**字段说明**:
- `table_name`: 表名
- `table_comment`: 表注释（中文说明）
- `fields`: 字段列表（按数据库定义顺序）
  - `field_name`: 字段名
  - `comment`: 字段注释（中文说明）



  
## 通用批量操作

### 批量删除（所有子系统通用）

所有子系统都支持批量删除操作，接口格式统一为：

**URL**: `POST /api/{module}/batch-delete`

**传入参数**:
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**参数说明**:
- `ids`: 必填，要删除的记录 ID 数组，不能为空

**响应数据（全部成功）**:
```json
{
  "code": 200,
  "message": "批量删除成功，共删除 5 条记录",
  "data": {
    "deleted_count": 5,
    "failed_ids": []
  }
}
```

**响应数据（部分成功）**:
```json
{
  "code": 200,
  "message": "部分删除成功，成功 3 条，失败 2 条",
  "data": {
    "deleted_count": 3,
    "failed_ids": [
      {
        "id": 4,
        "reason": "记录不存在"
      },
      {
        "id": 5,
        "reason": "记录不存在"
      }
    ]
  }
}
```

**响应数据（全部失败）**:
```json
{
  "code": 400,
  "message": "批量删除失败",
  "data": {
    "deleted_count": 0,
    "failed_ids": [
      {
        "id": 1,
        "reason": "记录不存在"
      },
      {
        "id": 2,
        "reason": "外键约束错误"
      }
    ]
  }
}
```