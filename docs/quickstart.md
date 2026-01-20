# 快速开始

本指南将帮助你快速开始使用 abap-adt-api。

## 安装

```bash
npm install abap-adt-api
```

## 基本用法

### 1. 创建客户端

```typescript
import { ADTClient } from "abap-adt-api"

const client = new ADTClient(
  "http://vhcalnplci.local:8000", // SAP 系统 URL
  "developer", // 用户名
  "password", // 密码
  "800", // 客户端（可选）
  "EN" // 语言（可选）
)
```

### 2. 登录

```typescript
await client.login()
console.log("已登录:", client.username)
```

### 3. 浏览包结构

```typescript
// 获取包的内容
const packageNode = await client.nodeContents("DEVC/K", "$TMP")
console.log("包节点:", packageNode)

// 获取对象结构
const objectUrl = packageNode.nodes[0].uri
const objectStructure = await client.objectStructure(objectUrl)
console.log("对象结构:", objectStructure)
```

### 4. 读取源代码

```typescript
// 获取对象的主包含文件
const mainInclude = ADTClient.mainInclude(objectStructure)

// 读取源代码
const source = await client.getObjectSource(mainInclude)
console.log("源代码:", source)
```

### 5. 修改源代码

```typescript
// 获取锁
const lock = await client.lock(objectUrl)

try {
  const newSource = source + "\nWRITE: 'Hello World'."

  // 保存修改
  await client.setObjectSource(
    mainInclude,
    newSource,
    lock.handle,
    lock.transport
  )
} finally {
  // 释放锁
  await client.unLock(objectUrl, lock.handle)
}
```

### 6. 激活对象

```typescript
const result = await client.activate(
  objectStructure.metaData["adtcore:name"],
  objectUrl,
  mainInclude
)

if (result.success) {
  console.log("激活成功")
} else {
  console.log("激活失败:", result.messages)
}
```

## 常见操作示例

### 搜索对象

```typescript
// 搜索程序
const programs = await client.searchObject("Z*", "PROG/P", 50)
console.log("找到的程序:", programs)

// 查找对象路径
const path = await client.findObjectPath(objectUrl)
console.log("对象路径:", path)
```

### 使用传输

```typescript
// 获取传输信息
const transportInfo = await client.transportInfo(objectUrl, "$TMP")
console.log("传输信息:", transportInfo)

// 创建传输请求
if (transportInfo.TRANSPORTS.length === 0) {
  const transport = await client.createTransport(
    objectUrl,
    "新对象",
    "$TMP"
  )
  console.log("创建的传输:", transport)
}
```

### 语法检查

```typescript
const sourceUrl = objectStructure.metaData["abapsource:sourceUri"]
const errors = await client.syntaxCheck(
  sourceUrl,
  url,
  source
)

if (errors.length > 0) {
  console.log("语法错误:", errors)
}
```

### 运行单元测试

```typescript
const testUrl = "/sap/bc/adt/oo/classes/ZTEST_CLASS"
const results = await client.unitTestRun(testUrl)

results.forEach(testClass => {
  console.log(`测试类: ${testClass["adtcore:name"]}`)
  testClass.testmethods.forEach(method => {
    console.log(`  方法: ${method["adtcore:name"]}`)
    if (method.alerts.length > 0) {
      console.log(`    失败: ${method.alerts.length}`)
    } else {
      console.log(`    通过`)
    }
  })
})
```

### 使用调试器

```typescript
const terminalId = "your-terminal-id"
const ideId = "workspace-root-hash"
const user = "developer"

// 检查调试监听器
const listenerError = await client.debuggerListeners(
  "user",
  terminalId,
  ideId,
  user
)

if (listenerError) {
  console.log("监听器错误:", listenerError)
}

// 设置断点
const breakpoints = [
  "/sap/bc/adt/oo/classes/ZCL_MAIN/source/main#start=10,1"
]
await client.debuggerSetBreakpoints(
  "user",
  terminalId,
  ideId,
  "client-id",
  breakpoints,
  user
)

// 开始监听
const debuggee = await client.debuggerListen(
  "user",
  terminalId,
  ideId,
  user
)

if (debuggee) {
  console.log("命中断点:", debuggee.URI)

  // 获取调用栈
  const stack = await client.debuggerStackTrace()
  console.log("调用栈:", stack)

  // 获取变量
  const variables = await client.debuggerVariables(["@ROOT"])
  console.log("变量:", variables)

  // 继续执行
  await client.debuggerStep("stepContinue")
}
```

### abapGit 操作

```typescript
// 列出所有仓库
const repos = await client.gitRepos()

// 创建新仓库
await client.gitCreateRepo(
  "$TMP",
  "https://github.com/user/repo.git",
  "refs/heads/master",
  ""
)

// 拉取更改
await client.gitPullRepo(repo.key, "refs/heads/master", "")

// 提交并推送
const staging = await client.stageRepo(repo, "", "")
await client.pushRepo(repo, staging, "", "")
```

## 高级配置

### 使用自定义 HTTP 客户端

```typescript
import { HttpClient } from "abap-adt-api"

const httpClient: HttpClient = {
  // 实现自定义 HTTP 客户端
}

const client = new ADTClient(httpClient, "user", "password")
```

### SSL 配置

```typescript
import { createSSLConfig } from "abap-adt-api"

// 允许自签名证书
const options = createSSLConfig(true)

// 使用自定义 CA
const optionsWithCA = createSSLConfig(false, "-----BEGIN CERTIFICATE-----...")

const client = new ADTClient(
  "https://...",
  "user",
  "pass",
  "",
  "",
  options
)
```

### 无状态克隆

```typescript
const clone = client.statelessClone

// 克隆的客户端可以安全地用于并发操作
// 它不会改变主客户端的状态
```

### 登出

```typescript
await client.logout()
// 注意：登出后无法再使用此客户端
```

## 下一步

- 查看 [ADTClient 文档](adt-client.md) 了解完整的客户端 API
- 查看 [对象操作](object-operations.md) 了解如何操作 ABAP 对象
- 查看 [语法检查](syntax-check.md) 了解代码分析功能
- 查看 [单元测试](unit-testing.md) 了解如何运行测试

## 故障排除

### 连接问题

```typescript
try {
  await client.login()
} catch (error) {
  console.error("登录失败:", error.message)

  // 检查 URL、用户名和密码
  // 确认 ADT 服务已启用
}
```

### 权限问题

```typescript
// 每个操作都返回详细错误信息
try {
  const source = await client.getObjectSource(url)
} catch (error) {
  if (error.message.includes("403")) {
    console.error("权限不足")
  }
}
```

### 会话问题

```typescript
// 如果遇到会话问题，尝试重新登录
if (!client.loggedin) {
  await client.login()
}

// 或使用无状态克隆
const statelessClient = client.statelessClone
```
