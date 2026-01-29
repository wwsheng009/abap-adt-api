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

// 当前会话 ID (部分)
client.sessionID
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

### mainPrograms

获取包含文件的主要程序列表。

```typescript
public async mainPrograms(includeUrl: string): Promise<MainInclude[]>
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

### debuggerListeners

检查调试监听器状态。

```typescript
public async debuggerListeners(
  debuggingMode: DebuggingMode,
  terminalId: string,
  ideId: string,
  user?: string,
  checkConflict = true
): Promise<DebugListenerError | undefined>
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

### atcUsers

获取 ATC 用户列表。

```typescript
public async atcUsers(): Promise<SystemUser[]>
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

## 发现与功能方法

### adtDiscovery

获取 ADT 发现文档。

```typescript
public async adtDiscovery(): Promise<AdtDiscoveryResult[]>
```

### adtCoreDiscovery

获取核心发现文档。

```typescript
public async adtCoreDiscovery(): Promise<AdtCoreDiscoveryResult[]>
```

### adtCompatibiliyGraph

获取兼容性图表。

```typescript
public async adtCompatibiliyGraph(): Promise<AdtCompatibilityGraph>
```

### featureDetails

获取特定功能的详细信息。

```typescript
public async featureDetails(title: string): Promise<AdtDiscoveryResult | undefined>
```

### collectionFeatureDetails

获取集合功能的详细信息。

```typescript
public async collectionFeatureDetails(url: string): Promise<AdtDiscoveryResult | undefined>
```

### findCollectionByUrl

通过 URL 查找集合。

```typescript
public async findCollectionByUrl(url: string): Promise<{ discoveryResult: AdtDiscoveryResult; collection: AdtCollection }>
```

## 重构方法

### renameEvaluate

评估重命名重构。

```typescript
public async renameEvaluate(
  uri: string,
  line: number,
  startColumn: number,
  endColumn: number
): Promise<RenameRefactoringProposal>
```

### renamePreview

预览重命名重构。

```typescript
public async renamePreview(
  renameRefactoring: RenameRefactoringProposal,
  transport: string = ""
): Promise<RenameRefactoring>
```

### renameExecute

执行重命名重构。

```typescript
public async renameExecute(
  refactoring: RenameRefactoring
): Promise<RenameRefactoring>
```

### changePackagePreview

预览包变更重构。

```typescript
public async changePackagePreview(
  changePackageRefactoring: ChangePackageRefactoring,
  transport: string = ""
): Promise<ChangePackageRefactoring>
```

### changePackageExecute

执行包变更重构。

```typescript
public async changePackageExecute(
  refactoring: ChangePackageRefactoring
): Promise<ChangePackageRefactoring>
```

### extractMethodEvaluate

评估提取方法重构。

```typescript
public async extractMethodEvaluate(
  uri: string,
  range: Range
): Promise<ExtractMethodProposal>
```

### extractMethodPreview

预览提取方法重构。

```typescript
public async extractMethodPreview(proposal: ExtractMethodProposal): Promise<GenericRefactoring>
```

### extractMethodExecute

执行提取方法重构。

```typescript
public async extractMethodExecute(refactoring: GenericRefactoring): Promise<GenericRefactoring>
```

### fixProposals

获取快速修复建议。

```typescript
public async fixProposals(
  url: string,
  source: string,
  line: number,
  column: number
): Promise<FixProposal[]>
```

### fixEdits

获取修复建议的编辑内容。

```typescript
public async fixEdits(proposal: FixProposal, source: string): Promise<Delta[]>
```

## 跟踪方法 (Traces)

### tracesList

列出跟踪。

```typescript
public async tracesList(user?: string): Promise<TraceResults[]>
```

### tracesListRequests

列出跟踪请求。

```typescript
public async tracesListRequests(user?: string): Promise<TraceRequestList[]>
```

### tracesHitList

获取跟踪命中列表。

```typescript
public async tracesHitList(id: string, withSystemEvents = false): Promise<TraceHitList>
```

### tracesDbAccess

获取跟踪数据库访问信息。

```typescript
public async tracesDbAccess(id: string, withSystemEvents = false): Promise<TraceDBAccessResponse>
```

### tracesStatements

获取跟踪语句。

```typescript
public async tracesStatements(id: string, options: TraceStatementOptions = {}): Promise<TraceStatementResponse>
```

### tracesSetParameters

设置跟踪参数。

```typescript
public async tracesSetParameters(parameters: TraceParameters): Promise<void>
```

### tracesCreateConfiguration

创建跟踪配置。

```typescript
public async tracesCreateConfiguration(config: TracesCreationConfig): Promise<string>
```

### tracesDeleteConfiguration

删除跟踪配置。

```typescript
public async tracesDeleteConfiguration(id: string): Promise<void>
```

### tracesDelete

删除跟踪。

```typescript
public async tracesDelete(id: string): Promise<void>
```

## 传输配置与管理

### transportConfigurations

获取传输配置。

```typescript
public async transportConfigurations(): Promise<TransportConfiguration[]>
```

### getTransportConfiguration

获取特定 URL 的传输配置。

```typescript
public async getTransportConfiguration(url: string): Promise<TransportConfiguration>
```

### setTransportsConfig

设置传输配置。

```typescript
public async setTransportsConfig(
  uri: string,
  etag: string,
  config: TransportConfiguration
): Promise<void>
```

### createTransportsConfig

创建传输配置。

```typescript
public async createTransportsConfig(): Promise<void>
```

### transportsByConfig

通过配置获取传输。

```typescript
public async transportsByConfig(configUri: string, targets = true): Promise<TransportInfo[]>
```

### transportDelete

删除传输请求。

```typescript
public async transportDelete(transportNumber: string): Promise<void>
```

### transportSetOwner

设置传输请求所有者。

```typescript
public async transportSetOwner(transportNumber: string, targetuser: string): Promise<void>
```

### transportAddUser

添加用户到传输请求。

```typescript
public async transportAddUser(transportNumber: string, user: string): Promise<TransportAddUserResponse>
```

### transportReference

获取传输引用。

```typescript
public async transportReference(
  pgmid: string,
  obj_wbtype: string,
  obj_name: string,
  tr_number = ""
): Promise<TransportObject>
```

### hasTransportConfig

检查是否存在传输配置。

```typescript
public hasTransportConfig: () => Promise<boolean>
```

## abapGit 高级方法

### checkRepo

检查仓库状态。

```typescript
public async checkRepo(repo: GitRepo, user = "", password = ""): Promise<GitObject[]>
```

### remoteRepoInfo (已弃用)

**已弃用**: 请使用 `gitExternalRepoInfo`。

```typescript
public async remoteRepoInfo(repo: GitRepo, user = "", password = ""): Promise<GitExternalInfo>
```

### stageRepo

暂存仓库更改。

```typescript
public async stageRepo(repo: GitRepo, user = "", password = ""): Promise<GitStagingObject[]>
```

### switchRepoBranch

切换仓库分支。

```typescript
public async switchRepoBranch(
  repo: GitRepo,
  branch: string,
  create = false,
  user = "",
  password = ""
): Promise<void>
```

### gitUnlinkRepo

取消关联仓库。

```typescript
public async gitUnlinkRepo(repoId: string): Promise<void>
```

### gitExternalRepoInfo

获取外部仓库信息。

```typescript
public async gitExternalRepoInfo(repourl: string, user = "", password = ""): Promise<GitExternalInfo>
```

## ATC 高级方法

### atcCheckVariant

获取 ATC 检查变式。

```typescript
public async atcCheckVariant(variant: string): Promise<any>
```

### atcExemptProposal

获取 ATC 豁免建议。

```typescript
public async atcExemptProposal(markerId: string): Promise<any>
```

### atcRequestExemption

请求 ATC 豁免。

```typescript
public async atcRequestExemption(proposal: AtcProposal): Promise<void>
```

### atcDocumentation

获取 ATC 文档。

```typescript
public async atcDocumentation(docUri: string): Promise<string>
```

### isProposalMessage

检查对象是否为 ATC 建议消息。

```typescript
public isProposalMessage(object: any): boolean
```

### atcContactUri

获取 ATC 联系人 URI。

```typescript
public async atcContactUri(findingUri: string): Promise<string>
```

### atcChangeContact

更改 ATC 联系人。

```typescript
public async atcChangeContact(itemUri: string, userId: string): Promise<void>
```

## 更多 API 方法

### deleteObject

删除对象。

```typescript
public async deleteObject(
  objectUrl: string,
  lockHandle: string,
  transport?: string
): Promise<void>
```

### objectRegistrationInfo

获取对象注册信息。

```typescript
public async objectRegistrationInfo(objectUrl: string): Promise<RegistrationInfo>
```

### createTestInclude

创建测试包含文件。

```typescript
public async createTestInclude(clas: string, lockHandle: string, transport = ""): Promise<string>
```

### runClass

运行 ABAP 类（控制台应用）。

```typescript
public async runClass(className: string): Promise<string>
```

### abapDocumentation

获取 ABAP 文档。

```typescript
public async abapDocumentation(
  objectUri: string,
  body: string,
  line: number,
  column: number,
  language = "EN"
): Promise<string>
```

### objectTypes

获取支持的对象类型。

```typescript
public async objectTypes(): Promise<ObjectType[]>
```

### loadTypes

加载类型定义。

```typescript
public async loadTypes(): Promise<void>
```

### fragmentMappings

获取片段映射。

```typescript
public async fragmentMappings(url: string, type: string, name: string): Promise<FragmentLocation>
```

### prettyPrinterSetting

获取 Pretty Printer 设置。

```typescript
public async prettyPrinterSetting(): Promise<PrettyPrinterSettings>
```

### setPrettyPrinterSetting

设置 Pretty Printer 设置。

```typescript
public async setPrettyPrinterSetting(indent: boolean, style: PrettyPrinterStyle): Promise<void>
```

### codeCompletionFull

获取完整的代码补全。

```typescript
public async codeCompletionFull(
  sourceUrl: string,
  source: string,
  line: number,
  column: number,
  patternKey: string
): Promise<CompletionProposal[]>
```

### codeCompletionElement

获取代码补全元素。

```typescript
public async codeCompletionElement(
  sourceUrl: string,
  source: string,
  line: number,
  column: number
): Promise<CompletionElementInfo>
```

### usageReferenceSnippets

获取使用引用的代码片段。

```typescript
public async usageReferenceSnippets(references: UsageReference[]): Promise<UsageReferenceSnippet[]>
```

### unitTestOccurrenceMarkers

获取单元测试出现标记。

```typescript
public async unitTestOccurrenceMarkers(url: string, source: string): Promise<UnitTestOccurrenceMarker[]>
```

### annotationDefinitions

获取注解定义。

```typescript
public async annotationDefinitions(): Promise<DdicAnnotation[]>
```

### ddicElement

获取 DDIC 元素信息。

```typescript
public async ddicElement(
  path: string | string[],
  getTargetForAssociation = false,
  getExtensionViews = true,
  getSecondaryObjects = true
): Promise<DdicElement>
```

### ddicRepositoryAccess

访问 DDIC 存储库。

```typescript
public async ddicRepositoryAccess(path: string | string[]): Promise<any>
```

### publishServiceBinding

发布服务绑定。

```typescript
public async publishServiceBinding(name: string, version: string): Promise<void>
```

### unPublishServiceBinding

取消发布服务绑定。

```typescript
public async unPublishServiceBinding(name: string, version: string): Promise<void>
```

### bindingDetails

获取绑定详情。

```typescript
public async bindingDetails(binding: ServiceBinding, index = 0): Promise<BindingServiceResult>
```

### feeds

获取订阅源。

```typescript
public async feeds(): Promise<Feed[]>
```

### dumps

获取系统转储 (Dumps)。

```typescript
public async dumps(query?: string): Promise<Dump[]>
```

### systemUsers

获取系统用户。

```typescript
public async systemUsers(): Promise<SystemUser[]>
```

### packageSearchHelp

包搜索帮助。

```typescript
public async packageSearchHelp(type: PackageValueHelpType, name = "*"): Promise<PackageValueHelpResult[]>
```

### debuggerSaveSettings

保存调试器设置。

```typescript
public async debuggerSaveSettings(settings: Partial<DebugSettings>): Promise<void>
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
