# 对象操作

本文档介绍如何使用 abap-adt-api 操作 ABAP 对象。

## 概述

对象操作包括：
- 对象结构分析
- 源代码读取
- 源代码编辑
- 对象锁定
- 对象删除
- 主包含文件查找

## 对象结构

### AbapObjectStructure

对象结构包含对象的元数据、链接和相关信息。

```typescript
interface AbapObjectStructure {
  metaData: {
    "adtcore:uri": string
    "adtcore:type": string
    "adtcore:name": string
    "adtcore:description": string
    "adtcore:parentUri": string
    "adtcore:packageRef": string
    "abapsource:sourceUri"?: string
  }
  links: Link[]
  objectUrl: string
  includes?: ClassInclude[]
}
```

### AbapClassStructure

类的特殊结构，包含包含文件信息。

```typescript
interface AbapClassStructure extends AbapObjectStructure {
  includes: ClassInclude[]
}
```

## 获取对象结构

```typescript
const structure = await client.objectStructure("/sap/bc/adt/oo/classes/zcl_myclass")

console.log("对象类型:", structure.metaData["adtcore:type"])
console.log("对象名称:", structure.metaData["adtcore:name"])
console.log("描述:", structure.metaData["adtcore:description"])
console.log("包:", structure.metaData["adtcore:packageRef"])
```

## 类型的包含文件

### classIncludes

如果对象是一个类，可以获取其包含文件。

```typescript
if (isClassStructure(structure)) {
  const includes = ADTClient.classIncludes(structure)

  includes.forEach((url, includeType) => {
    console.log(`${includeType}: ${url}`)
  })
}
```

**包含类型 (classIncludes):**

- `"localTypes"` - 本地类型
- `"public"` - 公共部分
- `"private"` - 私有部分
- `"protected"` - 受保护部分
- `"testclasses"` - 测试类
- `"macros"` - 宏
- `"definitions"` - 定义

### classComponents

获取类的组件（方法、属性、事件等）。

```typescript
const components = await client.classComponents("/sap/bc/adt/oo/classes/zcl MyClass")

function printComponents(component: ClassComponent, indent = 0) {
  const prefix = "  ".repeat(indent)
  console.log(`${prefix}${component["adtcore:name"]} (${component["adtcore:type"]})`)

  component.components.forEach(c => printComponents(c, indent + 1))
}

printComponents(components)
```

## 主包含文件

### mainInclude

获取对象的主包含文件 URL。

```typescript
// 简单用法
const mainInclude = ADTClient.mainInclude(structure)

// 如果没有主包含文件，返回默认 URL
const mainIncludeWithDefault = ADTClient.mainInclude(structure, true)
```

**示例:**

```typescript
const structure = await client.objectStructure("/sap/bc/adt/programs/programs/zmyprog")
const mainIncludeUrl = ADTClient.mainInclude(structure)
console.log("主包含文件:", mainIncludeUrl)
// 输出: /sap/bc/adt/programs/programs/zmyprog/source/main
```

## 读取源代码

### getObjectSource

读取对象的源代码内容。

```typescript
const source = await client.getObjectSource(objectSourceUrl)
console.log(source)
```

### ObjectSourceOptions

用于读取源代码的选项。

```typescript
interface ObjectSourceOptions {
  gitUser?: string
  gitPassword?: string
}
```

**示例 - 读取 abapGit 对象:**

```typescript
const gitSource = await client.getObjectSource(url, {
  gitUser: "git-user",
  gitPassword: "git-pass"
})
```

## 编辑源代码

### 设置对象源代码的标准流程

```typescript
async function editObjectSource(
  client: ADTClient,
  objectUrl: string,
  newSource: string
) {
  // 1. 获取对象结构
  const structure = await client.objectStructure(objectUrl)

  // 2. 锁定对象
  const lock = await client.lock(objectUrl, "MODIFY")

  try {
    // 3. 获取主包含文件 URL
    const mainInclude = ADTClient.mainInclude(structure)

    // 4. 获取传输信息
    const transportInfo = await client.transportInfo(objectUrl)
    const transport = transportInfo.TRANSPORTS[0]?.TRKORR || ""

    // 5. 保存新源代码
    await client.setObjectSource(mainInclude, newSource, lock.handle, transport)

    // 6. 激活对象
    const result = await client.activate(
      structure.metaData["adtcore:name"],
      objectUrl,
      mainInclude
    )

    if (result.success) {
      console.log("编辑成功")
    } else {
      console.log("激活失败:", result.messages)
    }

  } finally {
    // 7. 释放锁
    await client.unLock(objectUrl, lock.handle)
  }
}

// 使用
await editObjectSource(
  client,
  "/sap/bc/adt/programs/programs/zmyprog",
  "WRITE: 'Hello World'."
)
```

## 锁定和解锁

### Lock

锁定对象以进行编辑。

```typescript
const lock = await client.lock(objectUrl, "MODIFY")

console.log("锁句柄:", lock.handle)
console.log("传输:", lock.transport)
```

**访问模式:**

- `"MODIFY"` - 修改
- `"DISPLAY"` - 显示（只读）

### UnLock

释放对象锁。

```typescript
await client.unLock(objectUrl, lock.handle)
```

**示例:**

```typescript
const objectUrl = "/sap/bc/adt/oo/classes/zcl MyClass"

// 获取锁
const lock = await client.lock(objectUrl)

try {
  // 执行操作
  const mainInclude = ADTClient.mainInclude(
    await client.objectStructure(objectUrl)
  )
  const source = await client.getObjectSource(mainInclude)

  // 修改源码
  const newSource = source + "\n  \" new method."

  await client.setObjectSource(mainInclude, newSource, lock.handle)

} catch (error) {
  console.error("操作失败:", error)
} finally {
  // 确保释放锁
  await client.unLock(objectUrl, lock.handle)
}
```

## 删除对象

### deleteObject

删除 ABAP 对象。

```typescript
await client.deleteObject(
  objectUrl: string,
  lockHandle: string,
  transport?: string
)
```

**示例:**

```typescript
async function deleteObject(
  client: ADTClient,
  objectUrl: string
) {
  // 1. 锁定对象
  const lock = await client.lock(objectUrl)

  try {
    // 2. 获取传输
    const transportInfo = await client.transportInfo(objectUrl, "")
    const transport = transportInfo.TRANSPORTS[0]?.TRKORR

    // 3. 删除对象
    await client.deleteObject(objectUrl, lock.handle, transport)

    console.log("删除成功")

  } finally {
    // 4. 释放锁
    await client.unLock(objectUrl, lock.handle)
  }
}

// 使用
await deleteObject(
  client,
  "/sap/bc/adt/programs/programs/zoldprog"
)
```

## 对象注册信息

### objectRegistrationInfo

获取对象的注册信息。

```typescript
const regInfo = await client.objectRegistrationInfo(objectUrl)

console.log("可用的操作:", regInfo.operations)
```

## 版本管理

### revisions

获取对象的版本历史。

```typescript
// 获取对象的所有版本
const revisions = await client.revisions("/sap/bc/adt/oo/classes/zcl MyClass")

revisions.forEach(revision => {
  console.log(`版本 ${revision.version}: ${revision.date}`)
  console.log(`作者: ${revision.author}`)
  console.log(`描述: ${revision.description}`)
})
```

**对于类，可以指定包含文件:**

```typescript
const classRevisions = await client.revisions(
  objectUrl,
  "public" // classIncludes
)
```

### ObjectVersion

对象版本类型。

```typescript
type ObjectVersion = "active" | "inactive"
```

**示例:**

```typescript
// 获取 inactive 版本的结构
const inactiveStructure = await client.objectStructure(
  objectUrl,
  "inactive"
)
```

## 类型层次结构

### typeHierarchy

获取类型层次结构（子类或父类）。

```typescript
// 获取子类
const subTypes = await client.typeHierarchy(
  "/sap/bc/adt/oo/classes/zcl_base",
  sourceCode,
  10,
  5,
  false // 查找子类
)

// 获取父类
const superTypes = await client.typeHierarchy(
  "/sap/bc/adt/oo/classes/zcl_child",
  sourceCode,
  10,
  5,
  true // 查找父类
)

subTypes.forEach(node => {
  console.log(`类 ${node.name} 在包 ${node.parentUri}`)
})
```

## 代码格式化

### prettyPrinter

格式化 ABAP 代码。

```typescript
// 获取当前格式化设置
const settings = await client.prettyPrinterSetting()
console.log("缩进:", settings["abapformatter:indentation"])
console.log("样式:", settings["abapformatter:style"])

// 设置格式化
await client.setPrettyPrinterSetting(true, "keywordUpper")

// 格式化代码
const formattedCode = await client.prettyPrinter(uglyCode)
console.log("格式化后的代码:\n", formattedCode)
```

**PrettyPrinterStyle 选项:**

- `"toLower"` - 全部小写
- `"toUpper"` - 全部大写
- `"keywordUpper"` - 关键字大写
- `"keywordLower"` - 关键字小写
- `"keywordAuto"` - 关键字自动
- `"none"` - 不更改大小写

## 片段映射

### fragmentMappings

查找片段的实际位置（CDS 视图等）。

```typescript
const location = await client.fragmentMappings(
  "/sap/bc/adt/ddic/ddlx/sources/z_cds_view",
  "field",
  "FIELD_NAME"
)

console.log("位置:", `行 ${location.line}, 列 ${location.column}`)
```

## 完整示例

```typescript
import { ADTClient, isClassStructure } from "abap-adt-api"

async function analyzeAndEditClass(
  client: ADTClient,
  className: string
) {
  const objectUrl = `/sap/bc/adt/oo/classes/${className.toLowerCase()}`

  // 1. 获取对象结构
  const structure = await client.objectStructure(objectUrl)

  console.log(`=== 分析类: ${structure.metaData["adtcore:name"]} ===`)
  console.log(`描述: ${structure.metaData["adtcore:description"]}`)
  console.log(`包: ${structure.metaData["adtcore:packageRef"]}`)

  // 2. 如果是类，获取包含文件
  if (isClassStructure(structure)) {
    console.log("\n=== 包含文件 ===")
    const includes = ADTClient.classIncludes(structure)
    includes.forEach((url, type) => {
      console.log(`  ${type}: ${url}`)
    })
  }

  // 3. 获取主包含文件
  const mainInclude = ADTClient.mainInclude(structure)
  console.log(`\n主包含文件: ${mainInclude}`)

  // 4. 读取源代码
  const source = await client.getObjectSource(mainInclude)
  console.log(`\n源代码长度: ${source.length} 字符`)

  // 5. 获取组件（如果是类）
  if (structure.metaData["adtcore:type"] === "CLAS/OC") {
    const components = await client.classComponents(objectUrl)
    console.log("\n=== 类组件 ===")
    const methods = components.components.filter(
      c => c["adtcore:type"] === "method"
    )
    console.log(`方法数量: ${methods.length}`)
  }

  // 6. 获取版本历史
  const revisions = await client.revisions(objectUrl)
  console.log(`\n版本历史: ${revisions.length} 个版本`)

  // 7. 尝试编辑
  const lock = await client.lock(objectUrl)

  try {
    const newSource = source + "\n* 新增的注释"

    await client.setObjectSource(mainInclude, newSource, lock.handle)

    const result = await client.activate(
      structure.metaData["adtcore:name"],
      objectUrl,
      mainInclude
    )

    if (result.success) {
      console.log("\n编辑和激活成功!")
    } else {
      console.log("\n激活失败:")
      result.messages.forEach(m => {
        console.log(`  ${m.severity}: ${m.shortText}`)
      })
    }
  } finally {
    await client.unLock(objectUrl, lock.handle)
  }
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()
await analyzeAndEditClass(client, "ZCL_MY_CLASS")
```

## 错误处理

处理对象操作中的常见错误。

```typescript
async function safeObjectOperation(
  client: ADTClient,
  objectUrl: string
) {
  try {
    const structure = await client.objectStructure(objectUrl)

    // 检查权限
    const lock = await client.lock(objectUrl)

    try {
      const mainInclude = ADTClient.mainInclude(structure)
      await client.setObjectSource(mainInclude, "...", lock.handle)

    } catch (editError) {
      if (editError.message.includes("403")) {
        console.error("没有编辑权限")
      } else if (editError.message.includes("locked")) {
        console.error("对象已被锁定")
      }
      throw editError
    } finally {
      await client.unLock(objectUrl, lock.handle)
    }

  } catch (error) {
    if (error.message.includes("404")) {
      console.error("对象不存在")
    } else if (error.message.includes("401")) {
      console.error("未授权，请检查登录状态")
    } else {
      console.error("操作失败:", error)
    }
  }
}
```
