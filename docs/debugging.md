# 调试功能

本文档介绍如何使用 abap-adt-api 进行 ABAP 调试。

## 概述

调试功能包括：

- 设置和管理断点
- 附加到调试会话
- 单步调试
- 查看调用栈和变量
- 管理调试监听器

## 调试模式

### DebuggingMode

调试器支持两种模式：

```typescript
type DebuggingMode = "user" | "terminal"

// "user" - 调试当前用户的所有活动
// "terminal" - 只调试当前终端的活动
```

## 调试准备

### terminalId 和 ideId

调试需要两个重要标识符：

```typescript
// Terminal ID - 终端 ID（GUID）
// 在 Windows: 存储在注册表 Software\SAP\ABAP Debugging
// 在其他系统: 存储在文件 ~/.SAP/ABAPDebugging/terminalId

// IDE ID - IDE ID（工作区根目录的 UI5 hash）
const ideId = "workspace-root-hash"
```

## 调试监听器管理

### debuggerListeners

检查是否有其他调试器正在监听。

```typescript
const error = await client.debuggerListeners(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  user?: string,
  checkConflict = true
): Promise<DebugListenerError | undefined>
```

**示例:**

```typescript
const terminalId = "your-terminal-id-guid"
const ideId = "workspace-root-hash"
const user = "DEVELOPER"

const error = await client.debuggerListeners(
  "user",      // 调试模式
  terminalId,
  ideId,
  user,
  true         // 检查冲突
)

if (error) {
  console.error("监听器冲突:")
  console.error(`  命名空间: ${error.namespace}`)
  console.error(`  类型: ${error.type}`)
  console.error(`  消息: ${error.message.text}`)
  console.error(`  IDE 用户: ${error.ideUser}`)
} else {
  console.log("没有监听器冲突")
}
```

### debuggerDeleteListener

删除调试监听器。

```typescript
await client.debuggerDeleteListener(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  user?: string
): Promise<void>
```

**示例:**

```typescript
// 删除另一个 IDE 的监听器
await client.debuggerDeleteListener(
  "user",
  terminalId,
  ideId,
  "OTHER_USER"
)

console.log("监听器已删除")
```

## 断点管理

### debuggerSetBreakpoints

设置断点。

```typescript
const breakpoints = await client.debuggerSetBreakpoints(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  clientId: string,
  breakpoints: (string | DebugBreakpoint)[],
  user?: string,
  scope: DebuggerScope = "external",
  systemDebugging = false,
  deactivated = false,
  syncScopeUrl = ""
): Promise<(DebugBreakpoint | DebugBreakpointError)[]>
```

**参数说明:**

- `breakpoints` - 断点列表，可以是 URL 字符串或断点对象
- `scope` - 断点作用域: "external" 或 "internal"
- `systemDebugging` - 是否启用系统调试

**示例 - 使用 URL 设置断点:**

```typescript
const simpleBreakpoints = [
  "/sap/bc/adt/oo/classes/zclass/source/main#start=10,1",
  "/sap/bc/adt/programs/programs/zprog/source/main#start=20,5"
]

const results = await client.debuggerSetBreakpoints(
  "user",
  terminalId,
  ideId,
  "my-client-id",
  simpleBreakpoints,
  "DEVELOPER",
  "external"
)

results.forEach(result => {
  if ("errorMessage" in result) {
    console.error(`断点设置失败: ${result.errorMessage}`)
  } else {
    console.log(`断点 ID: ${result.id}`)
    console.log(`  URI: ${result.uri}`)
    console.log(`  类型: ${result.type}`)
  }
})
```

**示例 - 使用断点对象设置断点:**

```typescript
const advancedBreakpoint: DebugBreakpoint = {
  kind: "breakpoint",
  clientId: "my-client-id",
  id: "",
  uri: {
    type: "source",
    name: "zclass",
    path: "/source/main"
  },
  type: "ABAP",
  name: "Z_MY_METHOD",
  condition: "lv_value > 10"  // 条件断点
}

const results = await client.debuggerSetBreakpoints(
  "user",
  terminalId,
  ideId,
  "my-client-id",
  [advancedBreakpoint],
  "DEVELOPER"
)
```

### debuggerDeleteBreakpoints

删除断点。

```typescript
await client.debuggerDeleteBreakpoints(
  breakpoint: DebugBreakpoint,
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  requestUser?: string,
  scope: DebuggerScope = "external"
): Promise<void>
```

**示例:**

```typescript
await client.debuggerDeleteBreakpoints(
  breakpoint,  // 要删除的断点对象
  "user",
  terminalId,
  ideId,
  "DEVELOPER"
)

console.log("断点已删除")
```

## 附加和监听

### debuggerListen

开始监听调试事件。

**注意:** 此方法通常只在命中断点、超时或另一个客户端终止时返回。

```typescript
const result = await client.debuggerListen(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  user?: string,
  checkConflict = true,
  isNotifiedOnConflict = true
): Promise<DebugListenerError | Debuggee | undefined>
```

**Debuggee 结构:**

```typescript
interface Debuggee {
  CLIENT: number
  DEBUGGEE_ID: string
  TERMINAL_ID: string
  IDE_ID: string
  DEBUGGEE_USER: string
  PRG_CURR: string          // 当前程序
  INCL_CURR: string         // 当前包含文件
  LINE_CURR: number         // 当前行号
  RFCDEST: string
  APPLSERVER: string
  SYSID: string
  SYSNR: number
  DBGKEY: string
  TSTMP: number
  DBGEE_KIND: string
  URI: UriParts            // 当前位置
  TYPE: string
  NAME: string
  PARENT_URI: string
  PACKAGE_NAME: string
  DESCRIPTION: string
  // ... 更多字段
}
```

**示例:**

```typescript
console.log("开始监听调试事件...")

const debuggee = await client.debuggerListen(
  "user",
  terminalId,
  ideId,
  "DEVELOPER",
  true,
  true
)

if (debuggee) {
  console.log("命中断点!")
  console.log(`  程序: ${debuggee.PRG_CURR}`)
  console.log(`  包含: ${debuggee.INCL_CURR}`)
  console.log(`  行: ${debuggee.LINE_CURR}`)
  console.log(`  用户: ${debuggee.DEBUGGEE_USER}`)
  console.log(`  对象: ${debuggee.TYPE} ${debuggee.NAME}`)
  console.log(`  描述: ${debuggee.DESCRIPTION}`)
} else {
  console.log("调试器监听已停止（超时或被终止）")
}
```

### debuggerAttach

附加到调试会话。

```typescript
const attach = await client.debuggerAttach(
  debuggingMode: DebuggingMode,
  debuggeeId: string,
  user?: string,
  dynproDebugging = false
): Promise<DebugAttach>
```

**示例:**

```typescript
// 附加到调试会话
const attach = await client.debuggerAttach(
  "user",
  debuggee!.DEBUGGEE_ID,
  "DEVELOPER",
  false  // dynpro 调试
)

console.log("已附加到调试会话")
console.log(`  调试会话 ID: ${attach.debugSessionId}`)
console.log(`  进程 ID: ${attach.processId}`)
console.log(`  是否为 RFC: ${attach.isRfc}`)

console.log("\n可用操作:")
attach.actions.forEach(action => {
  console.log(`  - ${action.name} (${action.title})`)
})
```

## 单步执行

### debuggerStep

执行单步操作。

```typescript
const stepResult = await client.debuggerStep(
  steptype: DebugStepType,
  url?: string
): Promise<DebugStep>
```

**DebugStepType 选项:**

```typescript
type DebugStepType =
  | "stepInto"      // 步入
  | "stepOver"      // 步过
  | "stepReturn"    // 步出
  | "stepContinue"  // 继续执行
  | "terminateDebuggee"  // 终止调试
  | "stepRunToLine"      // 运行到指定行
  | "stepJumpToLine"     // 跳转到指定行
```

**示例:**

```typescript
// 步入
const stepIn = await client.debuggerStep("stepInto")
console.log("已步入")

// 步过
const stepOver = await client.debuggerStep("stepOver")
console.log("已步过")

// 步出（返回到调用者）
const stepOut = await client.debuggerStep("stepReturn")
console.log("已步出")

// 继续执行
const continue = await client.debuggerStep("stepContinue")
console.log("继续执行")

// 终止调试
const terminate = await client.debuggerStep("terminateDebuggee")
console.log("调试已终止")

// 运行到指定行
const runToLine = await client.debuggerStep(
  "stepRunToLine",
  "/sap/bc/adt/oo/classes/zclass/source/main#start=50,1"
)
console.log("已运行到第 50 行")
```

## 调用栈

### debuggerStackTrace

获取调用栈。

```typescript
const stackInfo = await client.debuggerStackTrace(
  semanticURIs = true
): Promise<DebugStackInfo>
```

**DebugStackInfo 结构:**

```typescript
interface DebugStackInfo {
  isRfc: boolean
  debugCursorStackIndex?: number
  isSameSystem: boolean
  serverName: string
  stack: DebugStack[]  // 调用栈列表
}

interface DebugStack {
  stackPosition: number
  stackType: "ABAP" | "DYNP" | "ENHANCEMENT"
  programName: string
  includeName: number | string
  line: number
  eventType: string
  eventName: number | string
  sourceType: "ABAP" | "DYNP" | "ST"
  systemProgram: boolean
  isVit: boolean
  uri: UriParts
}
```

**示例:**

```typescript
const stack = await client.debuggerStackTrace(true)

console.log("调用栈:")
stack.stack.forEach((frame, index) => {
  const current = frame.stackPosition === stack.debugCursorStackIndex ? " ←" : ""
  console.log(`${index}${current}. ${frame.programName}`)
  console.log(`   包含: ${frame.includeName}`)
  console.log(`   行: ${frame.line}`)
  console.log(`   类型: ${frame.stackType}`)
  console.log(`   URI: ${frame.uri.uri}`)

  if (frame.stackType === "ABAP" && !("isVit" in frame)) {
    // 简单栈
    console.log(`   系统程序: ${frame.systemProgram}`)
    console.log(`   事件: ${frame.eventType} ${frame.eventName}`)
  }
})
```

### debuggerGoToStack

跳转到调用栈中的某个位置。

```typescript
// 使用 URL（新系统）
await client.debuggerGoToStack(
  "/sap/bc/adt/oo/classes/zcalled_method"
)

// 使用位置（旧系统）
await client.debuggerGoToStack(2)  // 跳转到第 3 个栈帧
```

## 变量查看

### debuggerVariables

获取变量列表。

```typescript
const variables = await client.debuggerVariables(
  parents: string[]
): Promise<DebugVariable[]>
```

**示例:**

```typescript
// 获取根级变量
const rootVariables = await client.debuggerVariables(["@ROOT"])

console.log("根级变量:")
rootVariables.forEach(v => {
  console.log(`  ${v.name}: ${v.type} = ${v.value}`)
  console.log(`    属性: ${v.attributes.map(a => a.name).join(", ")}`)
})

// 获取特定变量的子变量
const vars = await client.debuggerVariables(["@ROOT", "lv_my_table", "@DATAAGING", "@ROOT"])
```

### debuggerChildVariables

获取变量的子变量。

```typescript
const childInfo = await client.debuggerChildVariables(
  parent: string[] = ["@DATAAGING", "@ROOT"]
): Promise<DebugChildVariablesInfo>
```

**示例:**

```typescript
// 获取 DATAAGING 的子变量
const children = await client.debuggerChildVariables(
  ["@DATAAGING", "@ROOT"]
)

console.log(`找到 ${children.hierarchies.length} 个变量层次:`)

children.hierarchies.forEach(hierarchy => {
  console.log(`\n变量: ${hierarchy.name}`)
  console.log(`  类型: ${hierarchy.type}`)
  console.log(`  可视类型: ${hierarchy.visualType}`)

  if (hierarchy.hasChildren) {
    hierarchy.children.forEach(child => {
      console.log(`    - ${child.name}: ${child.type}`)
    })
  }
})
```

### debuggerSetVariableValue

设置变量值。

```typescript
const newValue = await client.debuggerSetVariableValue(
  variableName: string,
  value: string
): Promise<string>
```

**示例:**

```typescript
// 修改变量值
const result = await client.debuggerSetVariableValue(
  "lv_value",
  "100"
)

console.log(`变量值已设置为: ${result}`)
```

## 调试设置

### debuggerSaveSettings

保存调试设置。

```typescript
const settings = await client.debuggerSaveSettings(
  settings: Partial<DebugSettings>
): Promise<void>
```

**DebugSettings 结构:**

```typescript
interface DebugSettings {
  systemDebugging: boolean
  createExceptionObject: boolean
  backgroundRFC: boolean
  sharedObjectDebugging: boolean
  showDataAging: boolean
  updateDebugging: boolean
}
```

**示例:**

```typescript
await client.debuggerSaveSettings({
  systemDebugging: true,
  createExceptionObject: true,
  backgroundRFC: true,
  sharedObjectDebugging: false,
  showDataAging: true,
  updateDebugging: false
})

console.log("调试设置已保存")
```

## 完整示例：调试会话

```typescript
import { ADTClient } from "abap-adt-api"

async function debugSession(
  client: ADTClient,
  classUrl: string,
  lineToBreak: number
) {
  const terminalId = "your-terminal-id-guid"
  const ideId = "workspace-root-hash"
  const user = "DEVELOPER"

  console.log("=== 调试会话 ===\n")

  // 1. 检查监听器冲突
  console.log("1. 检查调试监听器...")
  const error = await client.debuggerListeners("user", terminalId, ideId, user)

  if (error) {
    console.error("监听器冲突，删除现有监听器...")
    await client.debuggerDeleteListener("user", terminalId, ideId, error.ideUser)
  }

  // 2. 设置断点
  console.log("\n2. 设置断点...")
  const breakpointUrl = `${classUrl}#start=${lineToBreak},1`

  const breakpoints = await client.debuggerSetBreakpoints(
    "user",
    terminalId,
    ideId,
    "debug-client-1",
    [breakpointUrl],
    user,
    "external"
  )

  console.log(`设置了 ${breakpoints.length} 个断点`)

  // 3. 开始监听（这将等待命中断点）
  console.log("\n3. 开始监听（等待断点命中）...")
  const debuggee = await client.debuggerListen("user", terminalId, ideId, user)

  if (!debuggee) {
    console.log("调试器已停止")
    return
  }

  console.log("\n=== 断点命中 ===")
  console.log(`程序: ${debuggee.PRG_CURR}`)
  console.log(`行号: ${debuggee.LINE_CURR}`)
  console.log(`对象: ${debuggee.NAME}`)

  // 4. 附加到调试会话
  console.log("\n4. 附加到调试会话...")
  const attach = await client.debuggerAttach("user", debuggee!.DEBUGGEE_ID, user)
  console.log("已附加")

  // 5. 查看调用栈
  console.log("\n5. 调用栈:")
  const stack = await client.debuggerStackTrace(true)

  for (let i = 0; i < Math.min(5, stack.stack.length); i++) {
    const frame = stack.stack[i]
    const cursor = i === stack.debugCursorStackIndex ? " ← 当前" : ""
    console.log(`${i + 1}. ${frame.programName}:${frame.line}`)
    if (cursor) console.log(`${cursor}`)
  }

  // 6. 查看变量
  console.log("\n6. 查看变量:")
  const variables = await client.debuggerVariables(["@ROOT"])

  for (let i = 0; i < Math.min(10, variables.length); i++) {
    const v = variables[i]
    console.log(`  ${v.name}: ${v.type}`)
    if (v.value) console.log(`    值: ${v.value}`)
  }

  // 7. 执行一些调试步骤
  console.log("\n7. 单步调试...")

  console.log("  步入...")
  await client.debuggerStep("stepInto")

  console.log("  步过...")
  await client.debuggerStep("stepOver")

  console.log("  继续执行...")
  await client.debuggerStep("stepContinue")

  // 8. 清理
  console.log("\n8. 清理...")
  await client.debuggerDeleteBreakpoints(
    breakpoints[0] as any,  // 获取第一个断点
    "user",
    terminalId,
    ideId,
    user
  )

  console.log("调试会话完成")
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

await debugSession(
  client,
  "/sap/bc/adt/oo/classes/zdebug_class/source/main",
  42
)
```

## 调试最佳实践

1. **总是清理断点**
```typescript
try {
  // 调试代码
} finally {
  // 清理断点
  await client.debuggerDeleteBreakpoints(...)
}
```

2. **处理超时**
```typescript
// 设置超时
const debugPromise = client.debuggerListen("user", terminalId, ideId)
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("调试超时")), 300000) // 5 分钟
)

const debuggee = await Promise.race([debugPromise, timeoutPromise])
```

3. **错误处理**
```typescript
try {
  const debuggee = await client.debuggerListen(...)
  if (debuggee) {
    // 处理命中断点
  } else {
    // �时或终止
    console.log("调试器已停止")
  }
} catch (error) {
  console.error("调试错误:", error)
}
```
