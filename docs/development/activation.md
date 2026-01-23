# 激活对象

本文档介绍如何使用 abap-adt-api 激活 ABAP 对象。

## 概述

ABAP 中的对象修改后需要激活才能生效。激活操作会验证对象的语法和依赖关系。

## 激活的基本概念

### ActivationResult

激活操作的结果。

```typescript
interface ActivationResult {
  success: boolean
  messages: ActivationResultMessage[]
  inactive: InactiveObjectRecord[]
}
```

### ActivationResultMessage

激活过程中的消息。

```typescript
interface ActivationResultMessage {
  objDescr: string          // 对象描述
  type: string              // 消息类型: E=错误, W=警告, I=信息
  line: number              // 行号
  href: string              // 链接
  forceSupported: boolean   // 是否支持强制激活
  shortText: string         // 简短文本
}
```

### InactiveObjectRecord

未激活对象记录。

```typescript
interface InactiveObjectRecord {
  object?: InactiveObjectElement
  transport?: InactiveObjectElement
}
```

## 激活单个对象

### 基本用法

```typescript
const result = await client.activate(
  objectName: string,
  objectUrl: string,
  mainInclude?: string,
  preauditRequested = true
): Promise<ActivationResult>
```

**示例:**

```typescript
const result = await client.activate(
  "ZMY_CLASS",
  "/sap/bc/adt/oo/classes/zmy_class",
  undefined,  // mainInclude
  true        // preauditRequested
)

if (result.success) {
  console.log("激活成功")
} else {
  console.log("激活失败:")
  result.messages.forEach(msg => {
    console.log(`  [${msg.type}] 行 ${msg.line}: ${msg.shortText}`)
  })
}
```

### 指定主包含文件

```typescript
const mainInclude = "/sap/bc/adt/oo/classes/zmy_class/source/main"

const result = await client.activate(
  "ZMY_CLASS",
  "/sap/bc/adt/oo/classes/zmy_class",
  mainInclude,
  true
)
```

## 激活多个对象

### 使用 InactiveObject 数组

```typescript
const result = await client.activate(
  object: InactiveObject[],
  preauditRequested?: boolean
): Promise<ActivationResult>
```

**示例:**

```typescript
const inactiveObjects = [
  {
    "adtcore:uri": "/sap/bc/adt/oo/classes/zclass1",
    "adtcore:type": "CLAS/OC",
    "adtcore:name": "ZCLASS1",
    "adtcore:parentUri": "/sap/bc/adt/packages/$tmp"
  },
  {
    "adtcore:uri": "/sap/bc/adt/oo/classes/zclass2",
    "adtcore:type": "CLAS/OC",
    "adtcore:name": "ZCLASS2",
    "adtcore:parentUri": "/sap/bc/adt/packages/$tmp"
  }
]

const result = await client.activate(inactiveObjects, true)
```

### 激活所有未激活对象

```typescript
// 1. 获取所有未激活对象
const inactiveList = await client.inactiveObjects()

console.log(`找到 ${inactiveList.length} 个未激活对象`)

// 2. 激活所有对象
const result = await client.activate(inactiveObjectsInResults(result), true)

if (result.success) {
  console.log("所有对象激活成功")
} else {
  console.log(`激活失败，仍有 ${result.inactive.length} 个对象未激活`)
}
```

## 获取未激活对象

### inactiveObjects

获取系统中所有未激活的对象。

```typescript
const inactiveRecords = await client.inactiveObjects()

inactiveRecords.forEach(record => {
  if (record.object) {
    console.log(`对象: ${record.object["adtcore:name"]}`)
    console.log(`  类型: ${record.object["adtcore:type"]}`)
    console.log(`  用户: ${record.object.user}`)
    console.log(`  已删除: ${record.object.deleted}`)
  }

  if (record.transport) {
    console.log(`  传输: ${record.transport["adtcore:name"]}`)
  }
})
```

### inactiveObjectsInResults

从激活结果中提取未激活对象。

```typescript
import { inactiveObjectsInResults } from "abap-adt-api"

const result = await client.activate(...)
const inactiveObjects = inactiveObjectsInResults(result)

if (inactiveObjects.length > 0) {
  console.log(`仍有 ${inactiveObjects.length} 个对象未激活`)
}
```

## 主程序

### mainPrograms

获取对象的所有主程序。

```typescript
const mainIncludes = await client.mainPrograms(includeUrl)

mainIncludes.forEach(include => {
  console.log(`主程序: ${include["adtcore:name"]}`)
  console.log(`  URL: ${include["adtcore:uri"]}`)
})
```

## 完整的编辑和激活流程

### 标准流程示例

```typescript
async function editAndActivateObject(
  client: ADTClient,
  objectUrl: string,
  newSource: string
) {
  // 1. 获取对象结构
  const structure = await client.objectStructure(objectUrl)

  // 2. 锁定对象
  const lock = await client.lock(objectUrl, "MODIFY")

  try {
    // 3. 获取主包含文件
    const mainInclude = ADTClient.mainInclude(structure)

    // 4. 获取传输信息
    const transportInfo = await client.transportInfo(
      objectUrl,
      structure.metaData["adtcore:packageRef"] || "$TMP"
    )

    // 如果没有传输，创建一个
    let transport = transportInfo.TRANSPORTS[0]?.TRKORR
    if (!transport) {
      transport = await client.createTransport(
        objectUrl,
        "修改对象",
        structure.metaData["adtcore:packageRef"] || "$TMP"
      )
      console.log(`创建传输: ${transport}`)
    }

    // 5. 保存新源代码
    await client.setObjectSource(
      mainInclude,
      newSource,
      lock.handle,
      transport
    )

    console.log("源代码已保存")

    // 6. 激活对象
    const result = await client.activate(
      structure.metaData["adtcore:name"],
      objectUrl,
      mainInclude,
      true
    )

    // 7. 处理激活结果
    if (result.success) {
      console.log("✓ 激活成功")

      // 检查是否有其他未激活对象
      if (result.inactive.length > 0) {
        console.log(`注意: ${result.inactive.length} 个相关对象未激活`)

        // 激活所有未激活对象
        const allInactive = inactiveObjectsInResults(result)
        if (allInactive.length > 0) {
          console.log("尝试激活相关对象...")
          const batchResult = await client.activate(allInactive, true)
          if (!batchResult.success) {
            console.log("某些对象激活失败")
          }
        }
      }
    } else {
      console.log("✗ 激活失败")

      result.messages.forEach(msg => {
        if (msg.type === "E") {
          console.error(`  [错误] 行 ${msg.line}: ${msg.shortText}`)
        } else if (msg.type === "W") {
          console.warn(`  [警告] 行 ${msg.line}: ${msg.shortText}`)
        } else {
          console.log(`  [信息] ${msg.shortText}`)
        }
      })
    }

    return result

  } catch (error) {
    console.error("操作失败:", error)
    throw error

  } finally {
    // 8. 释放锁
    await client.unLock(objectUrl, lock.handle)
  }
}

// 使用示例
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const objectUrl = "/sap/bc/adt/oo/classes/zmyclass"
const newSource = "CLASS zmyclass DEFINITION PUBLIC.\nENDCLASS."

await editAndActivateObject(client, objectUrl, newSource)
```

## 激活策略

### 批量激活

```typescript
async function batchActivateObjects(
  client: ADTClient,
  objectUrls: string[]
) {
  // 1. 将 URL 转换为 InactiveObject 格式
  const inactiveObjects: InactiveObject[] = []

  for (const url of objectUrls) {
    try {
      const structure = await client.objectStructure(url)
      inactiveObjects.push({
        "adtcore:uri": structure.metaData["adtcore:uri"],
        "adtcore:type": structure.metaData["adtcore:type"],
        "adtcore:name": structure.metaData["adtcore:name"],
        "adtcore:parentUri": structure.metaData["adtcore:parentUri"]
      })
    } catch (error) {
      console.warn(`无法获取对象 ${url} 的结构`)
    }
  }

  // 2. 批量激活
  return await client.activate(inactiveObjects, true)
}

// 使用
const urls = [
  "/sap/bc/adt/oo/classes/zclass1",
  "/sap/bc/adt/oo/classes/zclass2",
  "/sap/bc/adt/oo/classes/zclass3"
]

await batchActivateObjects(client, urls)
```

### 激活包中的所有对象

```typescript
async function activatePackageObjects(
  client: ADTClient,
  packageName: string
) {
  console.log(`正在激活包 ${packageName} 中的对象...`)

  // 1. 递归查找包中的所有对象
  async function findPackageObjects(
    pkgName: string,
    objects: string[] = []
  ): Promise<string[]> {
    const tree = await client.nodeContents("DEVC/K", pkgName)

    for (const node of tree.nodes) {
      if (node.type === "DEVC/K") {
        // 子包，递归查找
        await findPackageObjects(node.name, objects)
      } else if (node.objectType && node.uri) {
        // ABAP 对象
        objects.push(node.uri)
      }
    }

    return objects
  }

  // 2. 获取所有对象
  const objects = await findPackageObjects(packageName)
  console.log(`找到 ${objects.length} 个对象`)

  // 3. 批量激活
  if (objects.length > 0) {
    const result = await batchActivateObjects(client, objects)

    if (result.success) {
      console.log("所有对象激活成功")
    } else {
      console.log(`${result.inactive.length} 个对象未激活`)
    }
  }
}

// 使用
await activatePackageObjects(client, "$TMP")
```

## 错误处理

### 处理激活失败

```typescript
async function activateWithErrorHandling(
  client: ADTClient,
  objectName: string,
  objectUrl: string
) {
  const result = await client.activate(objectName, objectUrl)

  if (!result.success) {
    console.log("激活错误分析:")

    // 分析错误类型
    const errors = result.messages.filter(m => m.type === "E")
    const warnings = result.messages.filter(m => m.type === "W")

    console.log(`  错误: ${errors.length}`)
    console.log(`  警告: ${warnings.length}`)

    // 显示详细信息
    errors.forEach((msg, index) => {
      console.log(`\n  错误 ${index + 1}:`)
      console.log(`    对象: ${msg.objDescr}`)
      console.log(`    位置: 行 ${msg.line}`)
      console.log(`    描述: ${msg.shortText}`)
      console.log(`    可强制激活: ${msg.forceSupported}`)

      if (msg.href) {
        console.log(`    链接: ${msg.href}`)
      }
    })

    // 如果有未激活的依赖对象
    if (result.inactive.length > 0) {
      console.log("\n未激活的依赖对象:")
      result.inactive.forEach(record => {
        if (record.object) {
          console.log(`  - ${record.object["adtcore:name"]} ` +
            `(${record.object["adtcore:type"]})`)
        }
      })
    }

    // 尝试强制激活（如果支持）
    const canForce = errors.every(e => e.forceSupported)
    if (canForce) {
      console.log("\n可以尝试强制激活")
    }
  }

  return result
}
```

### 重试激活

```typescript
async function activateWithRetry(
  client: ADTClient,
  objectName: string,
  objectUrl: string,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`尝试激活 ${objectName} (第 ${attempt}/${maxRetries} 次)...`)

    const result = await client.activate(objectName, objectUrl)

    if (result.success) {
      console.log("激活成功!")
      return result
    }

    console.log(`激活失败，剩余重试次数: ${maxRetries - attempt}`)

    // 检查是否是致命错误（不应该重试）
    const fatalErrors = result.messages.filter(m =>
      m.type === "E" && !m.forceSupported
    )

    if (fatalErrors.length > 0) {
      console.error("遇到无法修复的错误，终止重试")
      return result
    }

    // 等待一段时间再重试
    await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
  }

  console.error("达到最大重试次数，激活失败")
  return await client.activate(objectName, objectUrl)
}
```

## 性能优化

### 减少激活次数

```typescript
async function smartActivate(
  client: ADTClient,
  objectUrls: string[]
) {
  // 先获取所有未激活对象
  const allInactive = await client.inactiveObjects()

  // 筛选出需要激活的对象
  const toActivate = allInactive
    .filter(r => r.object && objectUrls.includes(r.object["adtcore:uri"]))
    .map(r => r.object!)

  if (toActivate.length === 0) {
    console.log("没有需要激活的对象")
    return { success: true, messages: [], inactive: [] }
  }

  console.log(`将激活 ${toActivate.length} 个对象`)

  // 批量激活
  return await client.activate(toActivate, true)
}
```

## 最佳实践

1. **总是使用 try-finally 确保锁被释放**
   ```typescript
   const lock = await client.lock(objectUrl)
   try {
     // 操作...
   } finally {
     await client.unLock(objectUrl, lock.handle)
   }
   ```

2. **检查激活结果，不要假设总是成功**
   ```typescript
   const result = await client.activate(...)
   if (!result.success) {
     // 处理错误
   }
   ```

3. **批量激活多个对象以提高性能**
   ```typescript
   await client.activate(objectList, true)
   // 而不是循环激活
   ```

4. **分析失败原因，不要盲目重试**
   ```typescript
   const fatalErrors = result.messages.filter(m => m.type === "E")
   if (fatalErrors.length > 0) {
     // 处理错误，而不是重试
   }
   ```

5. **考虑对象间的依赖关系**
   ```typescript
   // 激活前确保依赖的对象已激活
   const dependencies = await getDependencies(objectUrl)
   for (const dep of dependencies) {
     await activateDependency(dep)
   }
   ```
