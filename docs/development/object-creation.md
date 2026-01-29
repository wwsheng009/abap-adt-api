# 对象创建

abap-adt-api 支持创建 19+ 种 ABAP 对象类型，包括类、接口、程序、包、表格等。

## 工具函数

### loadTypes

加载系统支持的所有对象类型。

```typescript
public async loadTypes(): Promise<ObjectType[]>
```

**ObjectType 结构:**

```typescript
interface ObjectType {
  CAPABILITIES: string[]
  CATEGORY: string
  CATEGORY_LABEL: string
  OBJECT_TYPE: string
  OBJECT_TYPE_LABEL: string
  OBJNAME_MAXLENGTH: number
  PARENT_OBJECT_TYPE: string
  URI_TEMPLATE: string
}
```

**示例:**

```typescript
const types = await client.loadTypes()

types.forEach(type => {
  console.log(`${type.OBJECT_TYPE_LABEL} (${type.OBJECT_TYPE})`)
  console.log(`  最大长度: ${type.OBJNAME_MAXLENGTH}`)
  console.log(`  父类型: ${type.PARENT_OBJECT_TYPE}`)
})
```

### objectPath

生成对象的 ADT 路径。

```typescript
public async objectPath(typeId: CreatableTypeIds): string
public async objectPath(typeId: CreatableTypeIds, name: string, parentName: string): string
public async objectPath(options: NewObjectOptions): string
```

**示例:**

```typescript
const path1 = client.objectPath("CLAS/OC", "ZMY_CLASS", "$TMP")
console.log("类路径:", path1)

const options = {
  objtype: "PROG/P",
  name: "ZMY_PROG",
  parentName: "$TMP"
}
const path2 = client.objectPath(options)
console.log("程序路径:", path2)
```

### 类型检查函数

检查对象类型的多种工具函数:

```typescript
// 检查是否为函数组类型
isGroupType(type: any): type is GroupTypeIds

// 检查是否为包类型
isPackageType(type: any): type is PackageTypeId

// 检查是否为非组类型
isNonGroupType(type: any): type is NonGroupTypeIds

// 检查是否为可创建的类型 ID
isCreatableTypeId(type: any): type is CreatableTypeIds

// 获取父类型 ID
parentTypeId(type: CreatableTypeIds): ParentTypeIds
```

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

根据对象类型不同，options 应为以下接口之一：

- `ObjectValidateOptions` - 普通对象
  - `objtype` - 对象类型 (如 "CLAS/OC", "PROG/P")
  - `objname` - 对象名称
  - `packagename` - 目标包
  - `description` - 对象描述

- `GroupValidateOptions` - 函数组
  - `objtype` - 类型 ("FUGR/FF" 或 "FUGR/I")
  - `objname` - 对象名称
  - `fugrname` - 函数组名称
  - `description` - 对象描述

- `PackageValidateOptions` - 包
  - `objtype` - 类型 ("DEVC/K")
  - `objname` - 包名称
  - `packagename` - 父包名称
  - `description` - 对象描述
  - `swcomp` - 软件组件
  - `transportLayer` - 传输层
  - `packagetype` - 包类型 ("development", "structure", "main")

- `BindingValidationOptions` - 服务绑定
  - `objtype` - 类型 ("SRVB/SVB")
  - `objname` - 服务绑定名称
  - `package` - 目标包
  - `description` - 对象描述
  - `serviceBindingVersion` - 服务绑定版本 ("ODATA\\V2")
  - `serviceDefinition` - 服务定义名称

**示例:**

```typescript
const validation = await client.validateNewObject({
  objtype: "CLAS/OC",
  objname: "ZMY_CLASS",
  packagename: "$TMP",
  description: "我的类"
})

if (validation.success) {
  console.log("对象名称有效")
} else {
  console.log("验证失败:", validation.SHORT_TEXT)
}
```

## 创建对象

### createObject

创建新的 ABAP 对象。

```typescript
public async createObject(
  options: NewObjectOptions | NewPackageOptions
): Promise<void>
```

**NewObjectOptions 参数:**

- `objtype` - 对象类型 (CreatableTypeIds)
- `name` - 对象名称
- `parentName` - 父对象名称 (包名称或函数组名称)
- `parentPath` - 父对象路径
- `description` - 对象描述
- `responsible` - 负责人 (可选，默认为当前用户)
- `transport` - 传输请求编号 (可选)

**NewPackageOptions 参数 (创建包时):**

继承 NewObjectOptions 的所有参数，并添加:

- `swcomp` - 软件组件
- `transportLayer` - 传输层
- `packagetype` - 包类型 ("development", "structure", "main")

**NewBindingOptions 参数 (创建服务绑定时):**

继承 NewObjectOptions 的所有参数，并添加:

- `service` - 服务定义名称
- `bindingtype` - 绑定类型 (目前只支持 "ODATA")
- `category` - 类别 ("0" = Web API, "1" = UI)

**支持的类型:**

| 类型 ID | 描述 | 最大长度 |
|---------|------|---------|
| `PROG/P` | ABAP 程序 | 30 |
| `CLAS/OC` | ABAP 类 | 30 |
| `INTF/OI` | ABAP 接口 | 30 |
| `PROG/I` | 包含文件 | 30 |
| `FUGR/F` | 函数组 | 26 |
| `FUGR/FF` | 函数模块 | 30 |
| `FUGR/I` | 函数组包含文件 | 3 |
| `DDLS/DF` | CDS 数据定义 | 30 |
| `DCLS/DL` | CDS 访问控制 | 30 |
| `DDLX/EX` | CDS 元数据扩展 | 30 |
| `DDLA/ADF` | CDS 注释定义 | 30 |
| `DEVC/K` | 开发包 | 30 |
| `TABL/DT` | 透明表 | 16 |
| `SRVD/SRV` | 服务定义 | 30 |
| `AUTH` | 授权字段 | 10 |
| `SUSO/B` | 授权对象 | 10 |
| `DTEL/DE` | 数据元素 | 30 |
| `SRVB/SVB` | 服务绑定 | 26 |
| `MSAG/N` | 消息类 | 20 |

**示例:**

```typescript
// 创建类
await client.createObject({
  objtype: "CLAS/OC",
  name: "ZMY_CLASS",
  parentName: "$TMP",
  parentPath: "/sap/bc/adt/packages/%24tmp",
  description: "我的新类"
})
console.log("类已创建")

// 创建程序
await client.createObject({
  objtype: "PROG/P",
  name: "ZMY_PROGRAM",
  parentName: "$TMP",
  parentPath: "/sap/bc/adt/packages/%24tmp",
  description: "我的程序"
})

// 创建包
await client.createObject({
  objtype: "DEVC/K",
  name: "ZMY_PACKAGE",
  parentName: "$TMP",
  parentPath: "/sap/bc/adt/packages/%24tmp",
  description: "我的包",
  swcomp: "HOME",
  transportLayer: "ZHK",
  packagetype: "development"
})

// 创建服务绑定
await client.createObject({
  objtype: "SRVB/SVB",
  name: "ZMY_SERVICE_BINDING",
  parentName: "$TMP",
  parentPath: "/sap/bc/adt/packages/%24tmp",
  description: "我的服务绑定",
  service: "ZMY_SERVICE_DEFINITION",
  bindingtype: "ODATA",
  category: "0"
})
```

## 创建测试类

### createTestInclude

为类创建测试包含文件。

```typescript
public async createTestInclude(
  clas: string,
  lockHandle: string,
  corrNr: string
): Promise<void>
```

**示例:**

```typescript
// 获取锁
const lock = await client.lock(objectUrl, "MODIFY")

try {
  // 创建测试包含
  await client.createTestInclude(
    "ZMY_CLASS",
    lock.handle,
    lock.transport
  )
  console.log("测试包含已创建")

  // 获取类结构以找到测试类包含文件
  const structure = await client.objectStructure(objectUrl)
  const testIncludeLink = structure.links.find(l => l.type === "abapTest")

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
    testIncludeLink.href,
    testSource,
    lock.handle,
    lock.transport
  )
} finally {
  await client.unLock(objectUrl, lock.handle)
}
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
- **FUGR/FF** - 函数模块
- **FUGR/I** - 函数组包含文件

### 类和接口
- **CLAS/OC** - ABAP 类
- **INTF/OI** - ABAP 接口

### 数据字典
- **TABL/DT** - 透明表
- **DTEL/DE** - 数据元素

### CDS 对象
- **DDLS/DF** - CDS 数据定义
- **DCLS/DL** - CDS 访问控制
- **DDLX/EX** - CDS 元数据扩展
- **DDLA/ADF** - CDS 注释定义

### 开发组织
- **DEVC/K** - 开发包

### 服务和授权
- **SRVD/SRV** - 服务定义
- **SRVB/SVB** - 服务绑定
- **AUTH** - 授权字段
- **SUSO/B** - 授权对象
- **MSAG/N** - 消息类

### 其他
- 无
