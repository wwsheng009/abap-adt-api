# 传输管理

本文档介绍如何使用 abap-adt-api 管理 ABAP 传输请求。

## 概述

传输管理系统包含：

- 查询传输信息
- 创建传输请求
- 管理传输任务
- 释放传输请求
- 配置传输过滤器
- 传输用户管理

## TransportInfo

传输信息结构。

```typescript
interface TransportInfo {
  PGMID: string              // 程序 ID
  OBJECT: string             // 对象类型
  OBJECTNAME: string         // 对象名称
  OPERATION: string          // 操作类型
  DEVCLASS: string           // 开发类
  CTEXT: string              // 描述文本
  KORRFLAG: string           // 修正标志
  AS4USER: string            // 用户
  PDEVCLASS: string          // 主开发类
  DLVUNIT: string            // 交付单元
  MESSAGES?: Array<{
    SEVERITY: string
    TEXT: string
    VARIABLES: string[]
  }>
  NAMESPACE: string
  RESULT: string
  RECORDING: string
  EXISTING_REQ_ONLY: string
  TRANSPORTS: TransportHeader[]
  TADIRDEVC?: string
  URI?: string
  LOCKS?: TransportLock
}
```

## 查询传输信息

### transportInfo

获取对象的传输信息。

```typescript
const info = await client.transportInfo(
  objSourceUrl: string,
  devClass?: string,
  operation: string = "I"
): Promise<TransportInfo>
```

**参数说明:**

- `objSourceUrl` - 对象 URL
- `devClass` - 开发类（可选）
- `operation` - 操作类型: "I"=插入, "D"=删除, "E"=编辑

**示例:**

```typescript
const objectUrl = "/sap/bc/adt/oo/classes/zmyclass"

const transportInfo = await client.transportInfo(
  objectUrl,
  "$TMP",  // 开发类
  "I"      // 插入操作
)

console.log("传输信息:")
console.log(`  操作: ${transportInfo.OPERATION}`)
console.log(`  开发类: ${transportInfo.DEVCLASS}`)
console.log(`  结果: ${transportInfo.RESULT}`)
console.log(`  记录: ${transportInfo.RECORDING}`)

console.log("\n可用的传输:")
transportInfo.TRANSPORTS.forEach(t => {
  console.log(`  ${t.TRKORR}: ${t.TRFUNCTION} - ${t.AS4TEXT}`)
  console.log(`    状态: ${t.TRSTATUS}`)
  console.log(`    所有者: ${t.AS4USER}`)
})

if (transportInfo.LOCKS) {
  console.log("\n锁定信息:")
  console.log(`  任务: ${transportInfo.LOCKS.TASKS.length}`)
}
```

## 创建传输请求

### createTransport

创建新的传输请求。

```typescript
const transportNumber = await client.createTransport(
  objSourceUrl: string,
  REQUEST_TEXT: string,
  DEVCLASS: string,
  transportLayer?: string
): Promise<string>
```

**参数说明:**

- `objSourceUrl` - 对象 URL
- `REQUEST_TEXT` - 传输描述文本
- `DEVCLASS` - 开发类
- `transportLayer` - 传输层（可选）

**示例:**

```typescript
const objectUrl = "/sap/bc/adt/oo/classes/znewclass"

const transport = await client.createTransport(
  objectUrl,
  "创建新的 ABAP 类",
  "$TMP"
)

console.log(`传输请求已创建: ${transport}`)
```

## 查询用户传输

### userTransports

获取用户的传输请求。

```typescript
const transports = await client.userTransports(
  user: string,
  targets = true
): Promise<TransportsOfUser>
```

**TransportsOfUser 结构:**

```typescript
interface TransportsOfUser {
  workbench: TransportTarget[]   // 工作台传输
  customizing: TransportTarget[] // 自定义传输
}

interface TransportTarget {
  "tm:name": string           // 目标系统
  "tm:desc": string           // 描述
  modifiable: TransportRequest[]  // 可修改的请求
  released: TransportRequest[]    // 已释放的请求
}

interface TransportRequest {
  "tm:number": string        // 传输号
  "tm:owner": string         // 所有者
  "tm:desc": string          // 描述
  "tm:status": string        // 状态
  "tm:uri": string           // URI
  links: Link[]
  objects: TransportObject[]
  tasks: TransportTask[]
}
```

**示例:**

```typescript
const transports = await client.userTransports("DEVELOPER")

console.log("=== 工作台传输 ===")
transports.workbench.forEach(target => {
  console.log(`\n目标系统: ${target["tm:name"]}`)
  console.log(`  描述: ${target["tm:desc"]}`)

  console.log("\n  可修改的请求:")
  target.modifiable.forEach(req => {
    console.log(`    ${req["tm:number"]}: ${req["tm:desc"]}`)
    console.log(`      所有者: ${req["tm:owner"]}`)
    console.log(`      状态: ${req["tm:status"]}`)
    console.log(`      包含 ${req.tasks.length} 个任务`)
    console.log(`      包含 ${req.objects.length} 个对象`)
  })

  console.log("\n  已释放的请求:")
  target.released.forEach(req => {
    console.log(`    ${req["tm:number"]}: ${req["tm:desc"]}`)
    console.log(`      所有者: ${req["tm:owner"]}`)
    console.log(`      状态: ${req["tm:status"]}`)
  })
})

console.log("\n=== 自定义传输 ===")
transports.customizing.forEach(target => {
  console.log(`\n目标系统: ${target["tm:name"]}`)
  console.log(`  描述: ${target["tm:desc"]}`)
  console.log(`  请求总数: ${target.modifiable.length + target.released.length}`)
})
```

## 按配置查询传输

### transportsByConfig

根据传输配置查询传输。

```typescript
const transports = await client.transportsByConfig(
  configUri: string,
  targets = true
): Promise<TransportsOfUser>
```

**示例:**

```typescript
// 先获取配置
const configs = await client.transportConfigurations()

if (configs.length > 0) {
  const config = configs[0]
  const transports = await client.transportsByConfig(config.link)

  console.log(`配置: ${config.changedBy}`)
  console.log(`传输数量: ${transports.workbench.reduce((sum, t) =>
    sum + t.modifiable.length + t.released.length, 0
  )}`)
}
```

## 释放传输请求

### transportRelease

释放传输请求。

```typescript
const reports = await client.transportRelease(
  transportNumber: string,
  ignoreLocks = false,
  IgnoreATC = false
): Promise<TransportReleaseReport[]>
```

**TransportReleaseReport 结构:**

```typescript
interface TransportReleaseReport {
  "chkrun:reporter": string
  "chkrun:triggeringUri": string
  "chkrun:status": string          // "released" | "abortrelapifail"
  "chkrun:statusText": string
  messages: TransportReleaseMessage[]
}

interface TransportReleaseMessage {
  "chkrun:uri": string
  "chkrun:type": SAPRC
  "chkrun:shortText": string
}
```

**示例:**

```typescript
const transportNumber = "D01K900123"

try {
  // 标准释放
  const reports = await client.transportRelease(transportNumber)

  reports.forEach(report => {
    console.log(`状态: ${report["chkrun:status"]}`)
    console.log(`文本: ${report["chkrun:statusText"]}`)

    if (report.messages.length > 0) {
      console.log("消息:")
      report.messages.forEach(msg => {
        const icon = msg["chkrun:type"] === "E" ? "❌" :
                    msg["chkrun:type"] === "W" ? "⚠️" : "ℹ️"
        console.log(`  ${icon} ${msg["chkrun:shortText"]}`)
        console.log(`     URI: ${msg["chkrun:uri"]}`)
      })
    }
  })

} catch (error) {
  console.error("释放失败:", error.message)

  // 尝试忽略锁重试
  try {
    console.log("\n尝试忽略锁释放...")
    const reports = await client.transportRelease(transportNumber, true)
    console.log("成功")
  } catch (e) {
    console.error("仍然失败:", e.message)
  }
}
```

## 传输用户管理

### transportAddUser

向传输请求添加用户。

```typescript
const response = await client.transportAddUser(
  transportNumber: string,
  user: string
): Promise<TransportAddUserResponse>
```

**TransportAddUserResponse 结构:**

```typescript
interface TransportAddUserResponse {
  "tm:number": string
  "tm:targetuser": string
  "tm:uri": string
  "tm:useraction": string
}
```

**示例:**

```typescript
const response = await client.transportAddUser(
  "D01K900123",
  "USER2"
)

console.log(`用户已添加: ${response["tm:targetuser"]}`)
console.log(`操作: ${response["tm:useraction"]}`)
```

### transportSetOwner

设置传输请求的所有者。

```typescript
const response = await client.transportSetOwner(
  transportNumber: string,
  targetuser: string
): Promise<TransportOwnerResponse>
```

**TransportOwnerResponse 结构:**

```typescript
interface TransportOwnerResponse {
  "tm:targetuser": string
  "tm:number": string
}
```

**示例:**

```typescript
const response = await client.transportSetOwner(
  "D01K900123",
  "NEWOWNER"
)

console.log(`传输 ${response["tm:number"]} 的新所有者: ${response["tm:targetuser"]}`)
```

## 删除传输请求

### transportDelete

删除传输请求。

```typescript
await client.transportDelete(transportNumber: string)
```

**示例:**

```typescript
try {
  await client.transportDelete("D01K900123")
  console.log("传输请求已删除")
} catch (error) {
  console.error("删除失败:", error.message)
}
```

## 传输配置管理

### transportConfigurations

获取传输配置列表。

```typescript
const configs = await client.transportConfigurations(): Promise<TransportConfigurationEntry[]>
```

**TransportConfigurationEntry 结构:**

```typescript
interface TransportConfigurationEntry {
  createdBy: string
  changedBy: string
  client: string
  link: string
  etag: string
  createdAt: number
  changedAt: number
}
```

**示例:**

```typescript
const configs = await client.transportConfigurations()

console.log(`找到 ${configs.length} 个配置:`)
configs.forEach(config => {
  console.log(`\n由 ${config.createdBy} 创建`)
  console.log(`修改者: ${config.changedBy}`)
  console.log(`客户端: ${config.client}`)
  console.log(`创建日期: ${new Date(config.createdAt).toISOString()}`)
  console.log(`修改日期: ${new Date(config.changedAt).toISOString()}`)
  console.log(`ETag: ${config.etag}`)
})
```

### getTransportConfiguration

获取传输配置详情。

```typescript
const config = await client.getTransportConfiguration(
  url: string
): Promise<TransportConfiguration>
```

**TransportConfiguration 结构:**

```typescript
type TransportConfiguration =
  | SimpleTransportConfiguration
  | RangeTransportConfiguration

interface SimpleTransportConfiguration {
  DateFilter: TransportDateFilter
  WorkbenchRequests: boolean
  TransportOfCopies: boolean
  Released: boolean
  User: string
  CustomizingRequests: boolean
  Modifiable: boolean
}

interface RangeTransportConfiguration extends SimpleTransportConfiguration {
  FromDate: number
  ToDate: number
}

enum TransportDateFilter {
  SinceYesterday = 0,
  SinceTwoWeeks = 1,
  SinceFourWeeks = 2,
  DateRange = 3
}
```

**示例:**

```typescript
const config = await client.getTransportConfiguration(
  "/sap/bc/adt/cts/transportrequests/searchconfiguration/configurations/123"
)

console.log("传输配置:")
console.log(`  用户: ${config.User}`)
console.log(`  日期过滤: ${TransportDateFilter[config.DateFilter]}`)
console.log(`  工作台请求: ${config.WorkbenchRequests}`)
console.log(`  自定义请求: ${config.CustomizingRequests}`)
console.log(`  传输副本: ${config.TransportOfCopies}`)
console.log(`  已释放: ${config.Released}`)
console.log(`  可修改: ${config.Modifiable}`)

if (config.DateFilter === TransportDateFilter.DateRange) {
  console.log(`  日期范围: ${new Date(config.FromDate)} 到 ${new Date(config.ToDate)}`)
}
```

### createTransportsConfig

创建传输配置。

```typescript
const config = await client.createTransportsConfig(): Promise<TransportConfiguration>
```

### setTransportsConfig

更新传输配置。

```typescript
const config = await client.setTransportsConfig(
  uri: string,
  etag: string,
  config: TransportConfiguration
): Promise<TransportConfiguration>
```

**示例:**

```typescript
// 创建新配置
const newConfig = await client.createTransportsConfig()
console.log("新配置:", newConfig)

// 更新配置
const updatedConfig = await client.setTransportsConfig(
  "/path/to/config",
  "\"123\"",  // ETag 需要引号
  {
    DateFilter: TransportDateFilter.SinceTwoWeeks,
    WorkbenchRequests: true,
    TransportOfCopies: true,
    Released: true,
    User: "DEVELOPER",
    CustomizingRequests: false,
    Modifiable: true
  }
)
```

## 获取系统用户

### systemUsers

获取系统用户列表。

```typescript
const users = await client.systemUsers(): Promise<SystemUser[]>
```

**SystemUser 结构:**

```typescript
interface SystemUser {
  id: string
  title: string
}
```

**示例:**

```typescript
const users = await client.systemUsers()

console.log(`系统用户总数: ${users.length}`)
users.forEach(user => {
  console.log(`  ${user.id}: ${user.title}`)
})
```

## 传输引用

### transportReference

获取传输引用链接。

```typescript
const referenceUri = await client.transportReference(
  pgmid: string,
  obj_wbtype: string,
  obj_name: string,
  tr_number = ""
): Promise<string>
```

**示例:**

```typescript
const refUri = await client.transportReference(
  "R3TR",
  "CLAS",
  "ZCL_MYCLASS"
)

console.log(`传输引用: ${refUri}`)
```

## 检查传输配置支持

### hasTransportConfig

检查系统是否支持传输配置。

```typescript
const hasConfig = await client.hasTransportConfig()

if (hasConfig) {
  console.log("系统支持传输配置")
  const configs = await client.transportConfigurations()
} else {
  console.log("系统不支持传输配置")
}
```

## 完整示例：传输工作流

```typescript
import { ADTClient, TransportDateFilter } from "abap-adt-api"

async function transportWorkflow(
  client: ADTClient,
  objectUrl: string
) {
  console.log("=== 传输管理工作流 ===\n")

  // 1. 检查传输信息
  console.log("1. 检查传输信息...")
  const transportInfo = await client.transportInfo(
    objectUrl,
    "$TMP",
    "I"
  )

  console.log(`  可用传输: ${transportInfo.TRANSPORTS.length}`)

  // 2. 如果没有传输，创建一个
  let transportNumber: string

  if (transportInfo.TRANSPORTS.length === 0) {
    console.log("\n2. 创建新传输...")
    transportNumber = await client.createTransport(
      objectUrl,
      "新建对象",
      "$TMP"
    )
    console.log(`  传输号: ${transportNumber}`)
  } else {
    transportNumber = transportInfo.TRANSPORTS[0].TRKORR
    console.log(`\n使用现有传输: ${transportNumber}`)
  }

  // 3. 查询用户的传输
  console.log("\n3. 查询用户传输...")
  const userTransports = await client.userTransports(client.username)

  console.log(`  工作台传输数: ${userTransports.workbench.reduce(
    (sum, t) => sum + t.modifiable.length, 0
  )}`)

  // 4. 配置传输过滤器
  if (await client.hasTransportConfig()) {
    console.log("\n4. 配置传输过滤器...")
    const configs = await client.transportConfigurations()

    if (configs.length > 0) {
      const config = await client.getTransportConfiguration(configs[0].link)
      console.log(`  当前配置用户: ${config.User}`)

      // 尝试创建配置
      try {
        await client.createTransportsConfig()
        console.log("  新配置已创建")
      } catch (e) {
        console.log("  配置可能已存在")
      }
    }
  }

  // 5. 添加合作者
  console.log("\n5. 添加合作者...")
  try {
    const addUserResponse = await client.transportAddUser(
      transportNumber,
      "USER2"
    )
    console.log(`  用户 ${addUserResponse["tm:targetuser"]} 已添加`)
  } catch (e) {
    console.log("  添加用户失败（用户可能已存在）")
  }

  // 6. 释放传输（可选）
  console.log("\n6. 传输管理选项:")
  console.log("  a) 释放传输")
  console.log("  b) 传输给其他用户")
  console.log("  c) 删除传输")

  // 可选：实际释放传输
  // console.log("\n7. 释放传输...")
  // const reports = await client.transportRelease(transportNumber)
  // const success = reports.some(r => r["chkrun:status"] === "released")
  // console.log(`  释放${success ? '成功' : '失败'}`)

  return {
    transportNumber,
    info: transportInfo
  }
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "DEVELOPER",
  "password"
)

await client.login()

const result = await transportWorkflow(
  client,
  "/sap/bc/adt/oo/classes/znewclass"
)
```

## 批量传输操作

```typescript
async function batchAddObjectsToTransport(
  client: ADTClient,
  transportNumber: string,
  objectUrls: string[]
) {
  for (const url of objectUrls) {
    try {
      const info = await client.transportInfo(url, "", "I")

      // 创建传输任务需要特定流程
      // 这里简化为检查对象是否已在传输中

      console.log(`对象 ${url} 传输信息:`)
      console.log(`  操作: ${info.OPERATION}`)
      console.log(`  结果: ${info.RESULT}`)

    } catch (error) {
      console.error(`处理 ${url} 失败:`, error.message)
    }
  }
}

// 使用
await batchAddObjectsToTransport(
  client,
  "D01K900123",
  [
    "/sap/bc/adt/oo/classes/zclass1",
    "/sap/bc/adt/oo/classes/zclass2",
    "/sap/bc/adt/oo/classes/zclass3"
  ]
)
```
