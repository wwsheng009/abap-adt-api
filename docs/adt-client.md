# ADTClient 主客户端

ADTClient 是 abap-adt-api 的主类，提供了访问 ABAP ADT 服务的所有主要功能。

## 构造函数

```typescript
constructor(
  baseUrlOrClient: string | HttpClient,
  username: string,
  password: string | BearerFetcher,
  client: string = "",
  language: string = "",
  options: ClientOptions = {}
)
```

### 参数

- `baseUrlOrClient` - SAP 系统的 URL 或自定义 HTTP 客户端
- `username` - SAP 用户名
- `password` - 密码或返回 bearer token 的函数
- `client` - SAP 客户端 ID (可选)
- `language` - 语言代码，默认为 "EN" (可选)
- `options` - 客户端选项 (可选)

### 示例

```typescript
import { ADTClient, createSSLConfig } from "abap-adt-api"

// 基本使用
const client1 = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

// 带客户端和语言
const client2 = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password",
  "800",
  "EN"
)

// 使用 SSL 配置
const sslOptions = createSSLConfig(false, "-----BEGIN CERTIFICATE-----...")
const client3 = new ADTClient(
  "https://secure-sap.com:44300",
  "developer",
  "password",
  "",
  "",
  sslOptions
)
```

## 属性

### 只读属性

```typescript
// 客户端 ID
client.id

// HTTP 客户端实例
client.httpClient

// 基础 URL
client.baseUrl

// 用户名
client.username

// 客户端编号
client.client

// 语言设置
client.language

// CSRF token
client.csrfToken

// 登录状态
client.loggedin

// 是否为有状态会话
client.isStateful
```

### 可读写属性

```typescript
// 会话类型
client.stateful = "stateful" | "stateless"
```

## 静态方法

### mainInclude

获取 ABAP 类或对象的主包含文件路径。

```typescript
public static mainInclude(
  object: AbapObjectStructure,
  withDefault = true
): string
```

### classIncludes

获取 ABAP 类的所有包含文件。

```typescript
public static classIncludes(clas: AbapClassStructure): Map<classIncludes, string>
```

## 认证方法

### login

登录到 ADT 服务器。

```typescript
public async login(): Promise<void>
```

**示例:**

```typescript
await client.login()
console.log("登录成功")
```

### logout

登出当前用户。

```typescript
public async logout(): Promise<void>
```

**注意:** 登出后无法再使用此客户端。

### dropSession

删除当前会话。

```typescript
public async dropSession(): Promise<void>
```

### reentranceTicket

获取再入票据。

```typescript
public async reentranceTicket(): Promise<string>
```

## 对象浏览方法

### nodeContents

浏览包或对象树结构。

```typescript
public async nodeContents(
  parent_type: NodeParents,
  parent_name?: string,
  user_name?: string,
  parent_tech_name?: string,
  rebuild_tree?: boolean,
  parentnodes?: number[]
): Promise<NodeStructure>
```

**父节点类型 (NodeParents):**

- `"DEVC/K"` - 包
- `"repository"` - 存储库根节点

**示例:**

```typescript
// 浏览包
const packageTree = await client.nodeContents("DEVC/K", "$TMP")
console.log("包中的节点:", packageTree.nodes)

// 浏览用户收藏夹
const userFavorites = await client.nodeContents("repository", "", "user")
```

### objectStructure

获取对象的完整结构。

```typescript
public async objectStructure(
  objectUrl: string,
  version?: ObjectVersion
): Promise<AbapObjectStructure>
```

**示例:**

```typescript
const structure = await client.objectStructure("/sap/bc/adt/oo/classes/zcl MyClass")
console.log("对象类型:", structure.metaData["adtcore:type"])
console.log("对象名称:", structure.metaData["adtcore:name"])
```

### getObjectSource

读取对象的源代码。

```typescript
public async getObjectSource(
  objectSourceUrl: string,
  options?: ObjectSourceOptions
): Promise<string>
```

**示例:**

```typescript
// 读取程序源代码
const programSource = await client.getObjectSource(
  "/sap/bc/adt/programs/programs/zmyprog/source/main"
)

// 读取 abapGit 对象（需要凭据）
const gitSource = await client.getObjectSource(
  url,
  { gitUser: "user", gitPassword: "pass" }
)
```

### setObjectSource

保存对象的源代码。

```typescript
public async setObjectSource(
  objectSourceUrl: string,
  source: string,
  lockHandle: string,
  transport?: string
): Promise<void>
```

**示例:**

```typescript
const lock = await client.lock("/sap/bc/adt/programs/programs/zmyprog")

try {
  await client.setObjectSource(
    "/sap/bc/adt/programs/programs/zmyprog/source/main",
    newSourceCode,
    lock.handle,
    lock.transport
  )
} finally {
  await client.unLock("/sap/bc/adt/programs/programs/zmyprog", lock.handle)
}
```

### lock/unLock

锁定或解锁对象。

```typescript
public async lock(objectUrl: string, accessMode: string = "MODIFY"): Promise<AdtLock>
public async unLock(objectUrl: string, lockHandle: string): Promise<void>
```

**示例:**

```typescript
const lock = await client.lock("/sap/bc/adt/oo/classes/zcl_class")

// ... 执行操作 ...

await client.unLock("/sap/bc/adt/oo/classes/zcl_class", lock.handle)
```

## 激活方法

### activate

激活单个或多个对象。

```typescript
public async activate(
  object: InactiveObject | InactiveObject[],
  preauditRequested?: boolean
): Promise<ActivationResult>

public async activate(
  objectName: string,
  objectUrl: string,
  mainInclude?: string,
  preauditRequested?: boolean
): Promise<ActivationResult>
```

**示例:**

```typescript
// 激活单个对象
const result = await client.activate(
  "ZMY_CLASS",
  "/sap/bc/adt/oo/classes/zmy_class",
  undefined,
  true
)

if (result.success) {
  console.log("激活成功")
} else {
  console.log("激活失败:", result.messages)
}

// 激活多个对象
const inactiveList = await client.inactiveObjects()
const multiResult = await client.activate(inactiveList, true)
```

### inactiveObjects

获取所有未激活对象。

```typescript
public async inactiveObjects(): Promise<InactiveObjectRecord[]>
```

## 搜索方法

### searchObject

搜索 ABAP 对象。

```typescript
public async searchObject(
  query: string,
  objType?: string,
  max: number = 100
): Promise<SearchResult[]>
```

**示例:**

```typescript
// 搜索所有以 Z 开头的程序
const programs = await client.searchObject("Z*", "PROG/P", 50)

// 搜索所有对象
const all = await client.searchObject("MYSEARCH")
```

### findObjectPath

查找对象的完整路径。

```typescript
public async findObjectPath(objectUrl: string): Promise<PathStep[]>
```

## 对象创建方法

### validateNewObject

验证新对象配置。

```typescript
public async validateNewObject(options: ValidateOptions): Promise<ValidationResult>
```

### createObject

创建新对象。

```typescript
public async createObject(
  options: NewObjectOptions
): Promise<void>

public async createObject(
  objtype: CreatableTypeIds,
  name: string,
  parentName: string,
  description: string,
  parentPath: string,
  responsible?: string,
  transport?: string
): Promise<void>
```

**示例:**

```typescript
// 使用选项创建
await client.createObject({
  objtype: "CLAS/OC",
  name: "ZCL_NEW_CLASS",
  parentName: "$TMP",
  description: "新的类",
  parentPath: "/sap/bc/adt/packages/$tmp",
  transport: "TRKORR123"
})

// 使用参数创建
await client.createObject(
  "PROG/P",
  "ZNEW_PROGRAM",
  "$TMP",
  "新程序",
  "/sap/bc/adt/packages/$tmp"
)
```

## 语法检查方法

### syntaxCheck

执行语法检查。

```typescript
public async syntaxCheck(
  url: string,
  mainUrl: string,
  content: string,
  mainProgram?: string,
  version?: string
): Promise<SyntaxCheckResult[]>
```

**示例:**

```typescript
const errors = await client.syntaxCheck(
  "/sap/bc/adt/programs/programs/zprog/main",
  "/sap/bc/adt/programs/programs/zprog/source/main",
  sourceCode
)

if (errors.length > 0) {
  errors.forEach(error => {
    console.log(`行 ${error.line}: ${error.text}`)
  })
}
```

### syntaxCheckTypes

获取支持的语法检查类型。

```typescript
public async syntaxCheckTypes(): Promise<Map<string, string[]>>
```

## 代码补全与导航方法

### codeCompletion

获取代码补全建议。

```typescript
public async codeCompletion(
  sourceUrl: string,
  source: string,
  line: number,
  column: number
): Promise<CompletionProposal[]>
```

**示例:**

```typescript
const proposals = await client.codeCompletion(
  "/sap/bc/adt/oo/classes/zcl_class/source/main",
  sourceCode,
  10,
  5
)

proposals.forEach(p => {
  console.log(`建议: ${p.IDENTIFIER}`)
})
```

### findDefinition

查找定义位置。

```typescript
public async findDefinition(
  url: string,
  source: string,
  line: number,
  startCol: number,
  endCol: number,
  implementation = false,
  mainProgram = ""
): Promise<DefinitionLocation>
```

### usageReferences

查找使用引用。

```typescript
public async usageReferences(
  url: string,
  line?: number,
  column?: number
): Promise<UsageReference[]>
```

## 传输管理方法

### transportInfo

获取对象的传输信息。

```typescript
public async transportInfo(
  objSourceUrl: string,
  devClass?: string,
  operation: string = "I"
): Promise<TransportInfo>
```

### createTransport

创建传输请求。

```typescript
public async createTransport(
  objSourceUrl: string,
  REQUEST_TEXT: string,
  DEVCLASS: string,
  transportLayer?: string
): Promise<string>
```

### userTransports

获取用户的传输请求。

```typescript
public async userTransports(
  user: string,
  targets = true
): Promise<TransportsOfUser>
```

### transportRelease

释放传输请求。

```typescript
public async transportRelease(
  transportNumber: string,
  ignoreLocks = false,
  IgnoreATC = false
): Promise<TransportReleaseReport[]>
```

## 单元测试方法

### unitTestRun

运行单元测试。

```typescript
public async unitTestRun(
  url: string,
  flags: UnitTestRunFlags = DefaultUnitTestRunFlags
): Promise<UnitTestClass[]>
```

**示例:**

```typescript
const results = await client.unitTestRun("/sap/bc/adt/oo/classes/ztestclass")

results.forEach(testClass => {
  const failedMethods = testClass.testmethods.filter(m =>
    m.alerts.some(a => a.kind !== "warning")
  )

  console.log(`类 ${testClass["adtcore:name"]}:`)
  console.log(`  通过: ${testClass.testmethods.length - failedMethods.length}`)
  console.log(`  失败: ${failedMethods.length}`)
})
```

### unitTestEvaluation

重新评估测试。

```typescript
public async unitTestEvaluation(
  clas: UnitTestClass,
  flags: UnitTestRunFlags = DefaultUnitTestRunFlags
): Promise<UnitTestMethod[]>
```

## 调试方法

### debuggerSetBreakpoints

设置断点。

```typescript
public async debuggerSetBreakpoints(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  clientId: string,
  breakpoints: (string | DebugBreakpoint)[],
  user?: string,
  scope: DebuggerScope = "external",
  systemDebugging?: boolean,
  deactivated?: boolean,
  syncScopeUrl?: string
): Promise<(DebugBreakpoint | DebugBreakpointError)[]>
```

### debuggerListen

监听调试事件。

```typescript
public async debuggerListen(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  user?: string,
  checkConflict = true,
  isNotifiedOnConflict = true
): Promise<DebugListenerError | Debuggee | undefined>
```

### debuggerAttach

附加到调试会话。

```typescript
public async debuggerAttach(
  debuggingMode: DebuggingMode,
  debuggeeId: string,
  user?: string,
  dynproDebugging?: boolean
): Promise<DebugAttach>
```

### debuggerStep

执行单步调试。

```typescript
public async debuggerStep(
  steptype: DebugStepType,
  url?: string
): Promise<DebugStep>
```

**调试步骤类型 (DebugStepType):**

- `"stepInto"` - 步入
- `"stepOver"` - 步过
- `"stepReturn"` - 步出
- `"stepContinue"` - 继续执行
- `"terminateDebuggee"` - 终止调试
- `"stepRunToLine"` - 运行到指定行
- `"stepJumpToLine"` - 跳转到指定行

### debuggerStackTrace

获取调用栈。

```typescript
public async debuggerStackTrace(
  semanticURIs = true
): Promise<DebugStackInfo>
```

### debuggerVariables

获取变量。

```typescript
public async debuggerVariables(parents: string[]): Promise<DebugVariable[]>
```

### debuggerChildVariables

获取子变量。

```typescript
public async debuggerChildVariables(
  parent: string[] = ["@DATAAGING", "@ROOT"]
): Promise<DebugChildVariablesInfo>
```

### debuggerDeleteListener

删除调试监听器。

```typescript
public async debuggerDeleteListener(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  user?: string
): Promise<void>
```

### debuggerDeleteBreakpoints

删除断点。

```typescript
public async debuggerDeleteBreakpoints(
  breakpoint: DebugBreakpoint,
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  requestUser?: string,
  scope: DebuggerScope = "external"
): Promise<void>
```

### debuggerSetVariableValue

设置变量值。

```typescript
public async debuggerSetVariableValue(
  variableName: string,
  value: string
): Promise<string>
```

### debuggerGoToStack

跳转到调用栈中的某个位置。

```typescript
public async debuggerGoToStack(urlOrPosition: number | string)
```

## ATC 方法

### atcCustomizing

获取 ATC 自定义设置。

```typescript
public async atcCustomizing(): Promise<AtcCustomizing>
```

### createAtcRun

创建 ATC 运行。

```typescript
public async createAtcRun(
  variant: string,
  mainUrl: string,
  maxResults = 100
): Promise<AtcRunResult>
```

### atcWorklists

获取 ATC 工作列表。

```typescript
public async atcWorklists(
  runResultId: string,
  timestamp?: number,
  usedObjectSet?: string,
  includeExempted = false
): Promise<AtcWorkList>
```

## abapGit 方法

### gitRepos

列出所有 abapGit 仓库。

```typescript
public async gitRepos(): Promise<GitRepo[]>
```

### gitCreateRepo

创建 abapGit 仓库。

```typescript
public async gitCreateRepo(
  packageName: string,
  repourl: string,
  branch = "refs/heads/master",
  transport = "",
  user = "",
  password = ""
)
```

### gitPullRepo

拉取 abapGit 仓库。

```typescript
public async gitPullRepo(
  repoId: string,
  branch = "refs/heads/master",
  transport = "",
  user = "",
  password = ""
)
```

### pushRepo

推送到 abapGit 仓库。

```typescript
public async pushRepo(
  repo: GitRepo,
  staging: GitStaging,
  user = "",
  password = ""
)
```

## 其他方法

### revisions

获取对象的版本历史。

```typescript
public async revisions(
  objectUrl: string | AbapObjectStructure,
  clsInclude?: classIncludes
): Promise<Revision[]>
```

### classComponents

获取类的组件。

```typescript
public async classComponents(url: string): Promise<ClassComponent>
```

### typeHierarchy

获取类型层次结构。

```typescript
public async typeHierarchy(
  url: string,
  body: string,
  line: number,
  offset: number,
  superTypes = false
): Promise<HierarchyNode[]>
```

### prettyPrinter

格式化 ABAP 代码。

```typescript
public async prettyPrinter(source: string): Promise<string>
```

### tableContents

读取表内容。

```typescript
public async tableContents(
  ddicEntityName: string,
  rowNumber: number = 100,
  decode = true,
  sqlQuery = ""
): Promise<QueryResult>
```

### runQuery

执行 SQL 查询。

```typescript
public async runQuery(
  sqlQuery: string,
  rowNumber: number = 100,
  decode = true
): Promise<QueryResult>
```

## 会话管理

### statelessClone

获取无状态克隆客户端。

```typescript
public get statelessClone(): ADTClient
```

**说明:** 无状态克隆可以安全地用于并发操作，不会影响主客户端的状态。

## 完整示例

```typescript
import { ADTClient } from "abap-adt-api"

async function main() {
  // 1. 创建客户端
  const client = new ADTClient(
    "http://vhcalnplci.local:8000",
    "developer",
    "password",
    "800",
    "EN"
  )

  try {
    // 2. 登录
    await client.login()

    // 3. 浏览包
    const packageTree = await client.nodeContents("DEVC/K", "$TMP")

    // 4. 搜索对象
    const results = await client.searchObject("Z*", "CLAS/OC")

    // 5. 获取对象结构
    if (results.length > 0) {
      const structure = await client.objectStructure(results[0].uri)

      // 6. 读取源代码
      const mainInclude = ADTClient.mainInclude(structure)
      const source = await client.getObjectSource(mainInclude)

      // 7. 语法检查
      const errors = await client.syntaxCheck(
        structure.metaData["abapsource:sourceUri"],
        mainInclude,
        source
      )

      if (errors.length === 0) {
        console.log("没有语法错误")
      }

      // 8. 运行测试
      const testResults = await client.unitTestRun(results[0].uri)
      console.log("测试结果:", testResults)
    }

  } catch (error) {
    console.error("错误:", error)
  } finally {
    // 9. 登出
    await client.logout()
  }
}

main()
```
