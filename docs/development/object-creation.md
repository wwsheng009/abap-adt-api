# 对象创建

abap-adt-api 支持创建 20+ 种 ABAP 对象类型，包括类、接口、程序、包、表格等。

## 验证新对象

在创建对象之前，可以先验证对象名称和配置是否有效。

### validateNewObject

验证新对象的配置。

```typescript
public async validateNewObject(
  options: ValidateOptions
): Promise<ValidationResult>
```

**参数:**

- `options.name` - 对象名称
- `options.type` - 对象类型 (如 "CLAS/OC", "PROG/P")
- `options.package` - 目标包
- `options.prefix` - 名称前缀 (可选)

**示例:**

```typescript
const validation = await client.validateNewObject({
  name: "ZMY_CLASS",
  type: "CLAS/OC",
  package: "$TMP"
})

if (validation.isValid) {
  console.log("对象名称有效")
} else {
  console.log("验证失败:", validation.messages)
}
```

## 创建对象

### createObject

创建新的 ABAP 对象。

```typescript
public async createObject(
  name: string,
  type: CreatableTypeIds,
  package: string,
  transport?: string,
  description?: string
): Promise<GenericMetaData>

public async createObject(options: NewObjectOptions): Promise<GenericMetaData>
```

**支持的类型:**

| 类型 ID | 描述 | 类型 ID | 描述 |
|---------|------|---------|------|
| `CLAS/OC` | ABAP 类 | `INTF/OI` | ABAP 接口 |
| `PROG/P` | ABAP 程序 | `PROG/I` | 包含文件 |
| `FUGR/F` | 函数组 | `FUGR/I` | 函数组包含 |
| `TABL/DT` | 数据库表 | `TABL/INT` | 结构体 |
| `VIEW/D` | 数据库视图 | `DTEL/DE` | 数据元素 |
| `DOMA/D` | 定义域 | `DEVC/K` | 开发包 |
| `DDLS/DF` | CDS 数据定义 | `DCLS/DL` | CDS 访问控制 |
| `DDLX/EX` | CDS 扩展 | `SRVD/SRV` | 服务定义 |
| `SRVB/SVB` | 服务绑定 | `SUSO/B` | 授权对象 |
| `MSAG/N` | 消息类 | `AUTH` | 授权类 |
| `TRAN` | 事务代码 | `XSLT` | XSLT 转换 |

**示例:**

```typescript
// 创建类
const classMeta = await client.createObject({
  name: "ZMY_CLASS",
  type: "CLAS/OC",
  package: "$TMP",
  description: "我的新类"
})
console.log("类已创建:", classMeta["adtcore:name"])

// 创建程序
const progMeta = await client.createObject(
  "ZMY_PROGRAM",
  "PROG/P",
  "$TMP",
  "",
  "我的程序"
)

// 创建包
const pkgMeta = await client.createObject({
  name: "ZMY_PACKAGE",
  type: "DEVC/K",
  package: "$TMP",
  description: "我的包"
})
```

## 创建测试类

### createTestInclude

为类创建测试包含文件。

```typescript
public async createTestInclude(
  clas: string,
  lockHandle: string,
  transport = ""
): Promise<ClassInclude>
```

**示例:**

```typescript
// 获取锁
const lock = await client.lock(objectUrl, "MODIFY")

try {
  // 创建测试包含
  const testInclude = await client.createTestInclude(
    "ZMY_CLASS",
    lock.handle,
    lock.transport
  )
  console.log("测试包含已创建:", testInclude["class:includeType"])

  // 写入测试代码
  const testSource = `
CLASS ltcl_my_test DEFINITION FOR TESTING.
  PUBLIC SECTION.
    METHODS: test_example FOR TESTING.
ENDCLASS.

CLASS ltcl_my_test IMPLEMENTATION.
  METHOD test_example.
    cl_abap_unit_assert=>assert_equals(
      act = 1
      exp = 1
    ).
  ENDMETHOD.
ENDCLASS.
`

  await client.setObjectSource(
    testIncludeLink,
    testSource,
    lock.handle,
    lock.transport
  )
} finally {
  await client.unLock(objectUrl, lock.handle)
}
```

## 删除对象

### deleteObject

删除 ABAP 对象。

```typescript
public async deleteObject(
  objectUrl: string,
  transport?: string,
  deleteTransport = ""
): Promise<void>
```

**示例:**

```typescript
// 获取删除信息
const info = await client.objectRegistrationInfo(objectUrl)

// 删除对象
await client.deleteObject(
  objectUrl,
  info.transport || "D01K900123",
  ""
)
```

### objectRegistrationInfo

获取对象的注册信息（包括传输请求）。

```typescript
public async objectRegistrationInfo(
  objectUrl: string
): Promise<RegistrationInfo>
```

**示例:**

```typescript
const info = await client.objectRegistrationInfo(objectUrl)
console.log("传输请求:", info.transport)
console.log("所有者:", info.owner)
```

## 创建 CDS 对象

### 创建 CDS 数据定义

```typescript
const cdsSource = `
@EndUserText.label: '我的 CDS 视图'
define view ZMY_CDS_VIEW as select from sflight {
  key carrid   as 航空公司,
  key connid   as 航班号,
      fldate   as 飞行日期,
      price    as 价格
}
`

const cdsMeta = await client.createObject({
  name: "ZMY_CDS_VIEW",
  type: "DDLS/DF",
  package: "$TMP",
  description: "我的 CDS 视图"
})

// 设置源代码
const cdsStructure = await client.objectStructure(cdsMeta.objectUrl)
await client.setObjectSource(
  cdsStructure.links[0].href,
  cdsSource,
  lockHandle,
  transport
)

// 检查语法
const syntaxErrors = await client.syntaxCheckCDS(cdsMeta.objectUrl)
if (syntaxErrors.length === 0) {
  console.log("CDS 语法正确")
}
```

## 创建数据库表

### 创建表格对象

```typescript
const tableSource = `
@EndUserText.label: '测试表'
define table zmy_table {
  key client   : abap.clnt not null;
  key id       : abap.int4 not null;
  name         : abap.char(50);
  created_at   : abap.timstmpl;
  created_by   : abap.char(12);
}
with size_check
// 跟踪
// 标准交付
@AbapCatalog.enhancementCategory : #NOT_EXTENSIBLE
`

const tableMeta = await client.createObject({
  name: "ZMY_TABLE",
  type: "TABL/DT",
  package: "$TMP",
  description: "测试表"
})
```

## 批量创建示例

### 创建完整的类结构

```typescript
async function createClassStructure() {
  const className = "ZCOMPLETE_CLASS"

  // 1. 创建类
  const classMeta = await client.createObject({
    name: className,
    type: "CLAS/OC",
    package: "$TMP",
    description: "完整示例类"
  })

  // 2. 获取锁
  const lock = await client.lock(classMeta.objectUrl, "MODIFY")

  try {
    // 3. 获取类结构
    const structure = await client.objectStructure(classMeta.objectUrl)

    // 4. 设置主程序源代码
    const mainInclude = ADTClient.mainInclude(structure)
    const source = `
CLASS ${className} DEFINITION
  PUBLIC
  INHERITING FROM zbase_class
  CREATE PUBLIC .

  PUBLIC SECTION.
    INTERFACES: if_serializable_object.
    METHODS: constructor IMPORTING iv_id TYPE i,
             get_id RETURNING VALUE(rv_id) TYPE i,
             process_data.

  PROTECTED SECTION.
    DATA: mv_id TYPE i.

  PRIVATE SECTION.
    METHODS: validate_data RETURNING VALUE(rv_valid) TYPE abap_bool.
ENDCLASS.
`
    await client.setObjectSource(mainInclude, source, lock.handle, lock.transport)

    // 5. 设置实现源代码
    const implInclude = ADTClient.classIncludes(structure).get("testclasses")
    const implSource = `
CLASS ${className} IMPLEMENTATION.
  METHOD constructor.
    mv_id = iv_id.
  ENDMETHOD.

  METHOD get_id.
    rv_id = mv_id.
  ENDMETHOD.

  METHOD process_data.
    " 处理逻辑
  ENDMETHOD.

  METHOD validate_data.
    rv_valid = abap_true.
  ENDMETHOD.
ENDCLASS.
`
    await client.setObjectSource(implInclude, implSource, lock.handle, lock.transport)

    // 6. 创建测试类
    await client.createTestInclude(className, lock.handle, lock.transport)

    // 7. 激活
    const result = await client.activate(
      className,
      classMeta.objectUrl,
      mainInclude
    )

    if (result.success) {
      console.log("类创建并激活成功")
    } else {
      console.error("激活失败:", result.messages)
    }

  } finally {
    await client.unLock(classMeta.objectUrl, lock.handle)
  }
}
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  const obj = await client.createObject({
    name: "ZMY_OBJ",
    type: "CLAS/OC",
    package: "$TMP"
  })
} catch (error) {
  if (error.message.includes("400")) {
    console.error("对象已存在或名称无效")
  } else if (error.message.includes("403")) {
    console.error("权限不足")
  } else if (error.message.includes("404")) {
    console.error("包不存在")
  }
}
```

### 2. 传输管理

```typescript
// 创建对象前获取传输信息
const transportInfo = await client.transportInfo(objectUrl, "$TMP", "I")

if (transportInfo.TRANSPORTS.length === 0) {
  // 创建新传输
  const newTransport = await client.createTransport(objectUrl, "描述", "$TMP")
  console.log("新传输:", newTransport.transportNumber)
}
```

### 3. 批量创建

```typescript
async function createMultipleObjects() {
  const objects = [
    { name: "ZCLASS_A", type: "CLAS/OC" },
    { name: "ZCLASS_B", type: "CLAS/OC" },
    { name: "ZPROG_C", type: "PROG/P" }
  ]

  const results = []

  for (const obj of objects) {
    try {
      const result = await client.createObject({
        name: obj.name,
        type: obj.type,
        package: "$TMP"
      })
      results.push({ name: obj.name, status: "created", url: result.objectUrl })
    } catch (error) {
      results.push({ name: obj.name, status: "failed", error: error.message })
    }
  }

  return results
}
```

## 支持的对象类型详情

### 程序对象
- **PROG/P** - 可执行程序
- **PROG/I** - 包含文件
- **FUGR/F** - 函数组
- **FUGR/I** - 函数组包含文件

### 类和接口
- **CLAS/OC** - ABAP 类
- **INTF/OI** - ABAP 接口

### 数据字典
- **TABL/DT** - 透明表
- **TABL/INT** - 结构体
- **VIEW/D** - 数据库视图
- **DTEL/DE** - 数据元素
- **DOMA/D** - 定义域

### CDS 对象
- **DDLS/DF** - CDS 数据定义
- **DCLS/DL** - CDS 访问控制
- **DDLX/EX** - CDS 元数据扩展

### 开发组织
- **DEVC/K** - 开发包

### 服务和授权
- **SRVD/SRV** - 服务定义
- **SRVB/SVB** - 服务绑定
- **SUSO/B** - 授权对象
- **MSAG/N** - 消息类

### 其他
- **TRAN** - 事务代码
- **XSLT** - XSLT 转换
- **SSFO** - Smart Form
- **SSST** - Smart Style
