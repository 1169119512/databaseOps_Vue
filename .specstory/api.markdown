
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
