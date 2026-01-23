# abap-adt-api API 文档

欢迎使用 abap-adt-api API 参考文档！

## 文档文件

本目录包含 abap-adt-api 的完整 API 参考文档。

### 目录结构

- **[index.md](index.md)** - 文档主页和快速导航
- **[quickstart.md](quickstart.md)** - 快速开始指南
- **[adt-client.md](adt-client.md)** - ADTClient 主客户端参考
- **[object-operations.md](object-operations.md)** - 对象操作
- **[activation.md](activation.md)** - 对象激活
- **[syntax-check.md](syntax-check.md)** - 语法检查
- **[code-completion.md](code-completion.md)** - 代码补全与导航
- **[search.md](search.md)** - 对象搜索
- **[refactoring.md](refactoring.md)** - 重构操作
- **[transport-management.md](transport-management.md)** - 传输管理
- **[debugging.md](debugging.md)** - 调试功能
- **[unit-testing.md](unit-testing.md)** - 单元测试
- **[atc.md](atc.md)** - ATC 代码检查
- **[abapgit.md](abapgit.md)** - abapGit 集成
- **[traces.md](traces.md)** - 追踪与日志

## 快速开始

### 安装

```bash
npm install abap-adt-api
```

### 基本使用

```typescript
import { ADTClient } from "abap-adt-api"

const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const nodes = await client.nodeContents("DEVC/K", "$TMP")
console.log(nodes)
```

## API 概览

### 核心功能

| 功能 | 文档 | 说明 |
|------|------|------|
| **ADTClient** | [adt-client.md](adt-client.md) | 主客户端类，所有功能的入口 |
| **身份验证** | [adt-client.md](adt-client.md#认证方法) | 登录、登出、会话管理 |
| **对象浏览** | [object-operations.md](object-operations.md) | 浏览包结构，获取对象信息 |
| **源代码操作** | [object-operations.md](object-operations.md#读取源代码) | 读取、编辑源代码 |
| **对象激活** | [activation.md](activation.md) | 激活 ABAP 对象 |
| **语法检查** | [syntax-check.md](syntax-check.md) | 检查代码语法错误 |
| **代码补全** | [code-completion.md](code-completion.md) | 智能代码补全建议 |
| **查找导航** | [code-completion.md](code-completion.md#查找定义) | 跳转到定义，查找引用 |
| **搜索功能** | [search.md](search.md) | 搜索 ABAP 对象 |
| **重构操作** | [refactoring.md](refactoring.md) | 重命名、提取方法等 |
| **传输管理** | [transport-management.md](transport-management.md) | 管理传输请求 |
| **调试功能** | [debugging.md](debugging.md) | 调试器、断点、单步执行 |
| **单元测试** | [unit-testing.md](unit-testing.md) | 运行 ABAP 单元测试 |
| **ATC 检查** | [atc.md](atc.md) | 代码审查和检查 |
| **abapGit** | [abapgit.md](abapgit.md) | Git 版本控制集成 |
| **性能追踪** | [traces.md](traces.md) | 性能分析和追踪 |

## 支持的对象类型

- **程序 (PROG/P, PROG/I)** - ABAP 程序和包含文件
- **类 (CLAS/OC)** - ABAP 类
- **接口 (INTF/OI)** - ABAP 接口
- **函数组 (FUGR/F, FUGR/FF, FUGR/I)** - 函数组和模块
- **包 (DEVC/K)** - 开发包
- **CDS 数据定义 (DDLS/DF)** - CDS 数据定义
- **CDS 访问控制 (DCLS/DL)** - CDS 访问控制
- **CDS 扩展 (DDLX/EX)** - CDS 元数据扩展
- **表 (TABL/DT)** - 数据库表
- **服务定义 (SRVD/SRV)** - 服务定义
- **服务绑定 (SRVB/SVB)** - 服务绑定
- **授权对象 (SUSO/B, AUTH)** - 授权
- **数据元素 (DTEL/DE)** - 数据元素
- **消息类 (MSAG/N)** - 消息类

## 使用示例

### 浏览包结构

```typescript
import { ADTClient } from "abap-adt-api"

const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

// 浏览包
const packageNode = await client.nodeContents("DEVC/K", "$TMP")

// 递归处理子节点
async function processNode(node: any) {
  console.log(`${node.name} (${node.type})`)

  if (node.nodes) {
    for (const child of node.nodes) {
      await processNode(child)
    }
  }
}

await processNode(packageNode)
```

### 编辑和激活对象

```typescript
// 读取源代码
const structure = await client.objectStructure(objectUrl)
const mainInclude = ADTClient.mainInclude(structure)
const source = await client.getObjectSource(mainInclude)

// 编辑源代码
const newSource = source + "\nWRITE: 'Hello World'."

// 获取锁
const lock = await client.lock(objectUrl, "MODIFY")

try {
  // 保存更改
  await client.setObjectSource(mainInclude, newSource, lock.handle, lock.transport)

  // 激活
  const result = await client.activate(
    structure.metaData["adtcore:name"],
    objectUrl,
    mainInclude
  )

  if (result.success) {
    console.log("激活成功")
  } else {
    console.log("激活失败:", result.messages)
  }
} finally {
  // 释放锁
  await client.unLock(objectUrl, lock.handle)
}
```

### 运行单元测试

```typescript
const testUrl = "/sap/bc/adt/oo/classes/ztest_class"

const results = await client.unitTestRun(testUrl)

results.forEach(testClass => {
  const passed = testClass.testmethods.filter(m => m.alerts.length === 0)
  const failed = testClass.testmethods.filter(m =>
    m.alerts.some(a => a.kind !== "warning")
  )

  console.log(`${testClass["adtcore:name"]}:`)
  console.log(`  通过: ${passed.length}`)
  console.log(`  失败: ${failed.length}`)
})
```

### 调试会话

```typescript
const terminalId = "your-terminal-id-guid"
const ideId = "workspace-root-hash"

// 检查监听器
const error = await client.debuggerListeners("user", terminalId, ideId, "DEVELOPER")
if (error) {
  console.error("冲突:", error.message)
}

// 设置断点
const breakpoints = await client.debuggerSetBreakpoints(
  "user", terminalId, ideId, "client-id",
  ["/sap/bc/adt/oo/classes/zclass/source/main#start=10,1"],
  "DEVELOPER"
)

// 开始监听
const debuggee = await client.debuggerListen("user", terminalId, ideId, "DEVELOPER")

if (debuggee) {
  console.log("命中断点:", debuggee.URI)

  // 查看调用栈
  const stack = await client.debuggerStackTrace(true)

  // 单步执行
  await client.debuggerStep("stepInto")

  // 继续执行
  await client.debuggerStep("stepContinue")
}
```

### 使用传输

```typescript
// 获取传输信息
const transportInfo = await client.transportInfo(
  objectUrl,
  "$TMP",
  "I"
)

// 创建传输（如果需要）
if (transportInfo.TRANSPORTS.length === 0) {
  const transport = await client.createTransport(
    objectUrl,
    "新对象",
    "$TMP"
  )
  console.log("创建传输:", transport)
}

// 查询用户传输
const userTransports = await client.userTransports("DEVELOPER")

userTransports.workbench.forEach(target => {
  console.log(`目标系统: ${target["tm:name"]}`)
  console.log(`可修改: ${target.modifiable.length}`)
  console.log(`已释放: ${target.released.length}`)
})

// 释放传输
const reports = await client.transportRelease("D01K900123", false, false)

reports.forEach(report => {
  console.log(`状态: ${report["chkrun:status"]}`)
  report.messages.forEach(msg => {
    console.log(`  ${msg["chkrun:shortText"]}`)
  })
})
```

## 最佳实践

### 错误处理

```typescript
try {
  const result = await client.activate(...)
} catch (error) {
  if (error.message.includes("404")) {
    console.error("对象不存在")
  } else if (error.message.includes("403")) {
    console.error("权限不足")
  } else {
    console.error("操作失败:", error)
  }
}
```

### 会话管理

```typescript
// 使用有状态会话
client.stateful = "stateful"

// 使用无状态克隆（并发安全）
const statelessClient = client.statelessClone

// 登出
await client.logout()
```

### SSL 配置

```typescript
import { createSSLConfig } from "abap-adt-api"

// 允许自签名证书
const options = createSSLConfig(true)

// 使用自定义 CA
const optionsWithCA = createSSLConfig(false, "-----BEGIN CERTIFICATE-----...")

const client = new ADTClient(
  "https://secure-sap.com",
  "user",
  "password",
  "",
  "",
  options
)
```

## 更多资源

- [GitHub 仓库](https://github.com/marcellourbani/abap-adt-api)
- [NPM 包](https://www.npmjs.com/package/abap-adt-api)
- [VSCode ABAP Remote FS](https://github.com/marcellourbani/vscode_abap_remote_fs)
- [SAP ADT 文档](https://help.sap.com/viewer/p/SAP_ADT)

## 贡献

欢迎贡献文档改进！请提交 Pull Request 或 Issue。

## 许可证

[MIT License](../LICENSE)
