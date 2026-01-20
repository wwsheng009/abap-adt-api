# 语法检查

本文档介绍如何使用 abap-adt-api 进行 ABAP 代码语法检查。

## 概述

语法检查功能用于在激活前验证 ABAP 代码，发现语法错误和潜在问题。

## SyntaxCheckResult

语法检查结果。

```typescript
interface SyntaxCheckResult {
  uri: string        // 错误位置 URI
  line: number       // 行号
  offset: number     // 列偏移量
  severity: string   // 严重程度: E=错误, W=警告, I=信息
  text: string       // 消息文本
}
```

## 基本语法检查

### syntaxCheck

检查 ABAP 源代码的语法。

```typescript
const errors = await client.syntaxCheck(
  url: string,
  mainUrl: string,
  content: string,
  mainProgram?: string,
  version?: string
): Promise<SyntaxCheckResult[]>
```

**参数说明:**

- `url` - 语法检查 URL (通常是对象 URL)
- `mainUrl` - 主包含文件 URL
- `content` - 源代码内容
- `mainProgram` - 主程序名称 (可选)
- `version` - 版本: "active" 或 "inactive" (默认 "active")

**示例:**

```typescript
const objectUrl = "/sap/bc/adt/programs/programs/zmyprog"
const mainUrl = "/sap/bc/adt/programs/programs/zmyprog/source/main"
const sourceCode = `
REPORT zmyprog.

DATA: lv_value TYPE i VALUE 10.
WRITE: lv_value.
`

const errors = await client.syntaxCheck(
  objectUrl,
  mainUrl,
  sourceCode
)

if (errors.length === 0) {
  console.log("没有语法错误")
} else {
  console.log(`发现 ${errors.length} 个语法问题:`)

  errors.forEach(error => {
    const icon = error.severity === "E" ? "❌" :
                error.severity === "W" ? "⚠️" : "ℹ️"
    console.log(`${icon} 行 ${error.line}: ${error.text}`)
  })
}
```

## CDS 对象语法检查

### syntaxCheck (CDS)

CDS 对象使用专门的语法检查方法。

```typescript
const errors = await client.syntaxCheck(cdsUrl)
```

CDS URL 会自动识别:

- `/sap/bc/adt/ddic/ddlx/sources/...` - CDS metadata extensions
- `/sap/bc/adt/acm/dcl/sources/...` - CDS access control
- 其他CDS相关路径

**示例:**

```typescript
const cdsErrors = await client.syntaxCheck(
  "/sap/bc/adt/ddic/ddlx/sources/z_my_view"
)

cdsErrors.forEach(error => {
  console.log(`行 ${error.line}: ${error.text}`)
})
```

## 语法检查类型

### syntaxCheckTypes

获取系统支持的语法检查类型。

```typescript
const reporters = await client.syntaxCheckTypes()

reporters.forEach((types, reporter) => {
  console.log(`${reporter}:`)
  types.forEach(type => {
    console.log(`  - ${type}`)
  })
})
```

**输出示例:**

```
abapCheckRun:
  - CLAS/OC
  - PROG/P
  - FUGR/F
  - INTF/OI
cdsCheckRun:
  - DDLS/DF
  - DDLX/EX
  - DCLS/DL
```

## 使用语法检查的最佳实践

### 编辑前检查

```typescript
async function safeEditObject(
  client: ADTClient,
  objectUrl: string,
  newSource: string
) {
  const structure = await client.objectStructure(objectUrl)
  const mainUrl = ADTClient.mainInclude(structure)

  // 1. 语法检查
  console.log("进行语法检查...")
  const errors = await client.syntaxCheck(
    objectUrl,
    mainUrl,
    newSource
  )

  const fatalErrors = errors.filter(e => e.severity === "E")

  if (fatalErrors.length > 0) {
    console.log("发现语法错误，无法保存:")
    fatalErrors.forEach(e => {
      console.log(`  行 ${e.line}: ${e.text}`)
    })
    throw new Error("语法检查失败")
  }

  if (errors.length > 0) {
    console.log("发现警告:")
    errors.filter(e => e.severity === "W").forEach(e => {
      console.log(`  行 ${e.line}: ${e.text}`)
    })
  }

  console.log("语法检查通过")

  // 2. 获取锁并保存
  const lock = await client.lock(objectUrl)

  try {
    await client.setObjectSource(
      mainUrl,
      newSource,
      lock.handle,
      lock.transport
    )

    console.log("保存成功")

    return structure.metaData["adtcore:name"]

  } finally {
    await client.unLock(objectUrl, lock.handle)
  }
}
```

### 批量检查

```typescript
async function batchSyntaxCheck(
  client: ADTClient,
  items: Array<{
    url: string
    mainUrl: string
    source: string
  }>
) {
  const results: {
    url: string
    errors: SyntaxCheckResult[]
    hasErrors: boolean
  }[] = []

  for (const item of items) {
    console.log(`检查: ${item.url}`)

    const errors = await client.syntaxCheck(
      item.url,
      item.mainUrl,
      item.source
    )

    results.push({
      url: item.url,
      errors,
      hasErrors: errors.some(e => e.severity === "E")
    })
  }

  // 生成报告
  console.log("\n=== 语法检查报告 ===")
  const withErrors = results.filter(r => r.hasErrors)
  const withWarnings = results.filter(r =>
    !r.hasErrors && r.errors.some(e => e.severity === "W")
  )
  const clean = results.filter(r => r.errors.length === 0)

  console.log(`通过: ${clean.length}`)
  console.log(`警告: ${withWarnings.length}`)
  console.log(`错误: ${withErrors.length}`)

  if (withErrors.length > 0) {
    console.log("\n有错误的对象:")
    withErrors.forEach(r => {
      console.log(`  ${r.url}`)
      r.errors.filter(e => e.severity === "E").forEach(e => {
        console.log(`    行 ${e.line}: ${e.text}`)
      })
    })
  }

  return results
}
```

### 格式化错误输出

```typescript
function formatSyntaxErrors(errors: SyntaxCheckResult[]): string {
  if (errors.length === 0) {
    return "✓ 没有语法错误"
  }

  const lines: string[] = []

  // 按严重程度分组
  const bySeverity = {
    E: errors.filter(e => e.severity === "E"),
    W: errors.filter(e => e.severity === "W"),
    I: errors.filter(e => e.severity === "I")
  }

  if (bySeverity.E.length > 0) {
    lines.push("\n❌ 错误:")
    bySeverity.E.forEach(e => {
      lines.push(`  行 ${e.line}: ${e.text}`)
    })
  }

  if (bySeverity.W.length > 0) {
    lines.push("\n⚠️  警告:")
    bySeverity.W.forEach(e => {
      lines.push(`  行 ${e.line}: ${e.text}`)
    })
  }

  if (bySeverity.I.length > 0) {
    lines.push("\nℹ️  信息:")
    bySeverity.I.forEach(e => {
      lines.push(`  行 ${e.line}: ${e.text}`)
    })
  }

  return lines.join("\n")
}

// 使用
const errors = await client.syntaxCheck(...)
console.log(formatSyntaxErrors(errors))
```

### 获取特定行的错误

```typescript
function getErrorsAtLine(
  errors: SyntaxCheckResult[],
  line: number
): SyntaxCheckResult[] {
  return errors.filter(e => e.line === line)
}

// 使用
const errors = await client.syntaxCheck(...)
const lineErrors = getErrorsAtLine(errors, 42)

if (lineErrors.length > 0) {
  console.log(`第 42 行的错误:`)
  lineErrors.forEach(e => console.log(`  ${e.text}`))
}
```

### 统计错误类型

```typescript
function analyzeErrors(errors: SyntaxCheckResult[]) {
  const stats = {
    total: errors.length,
    errors: 0,
    warnings: 0,
    info: 0,
    byLine: new Map<number, SyntaxCheckResult[]>()
  }

  for (const error of errors) {
    if (error.severity === "E") stats.errors++
    else if (error.severity === "W") stats.warnings++
    else stats.info++

    if (!stats.byLine.has(error.line)) {
      stats.byLine.set(error.line, [])
    }
    stats.byLine.get(error.line)!.push(error)
  }

  return stats
}

// 使用
const errors = await client.syntaxCheck(...)
const stats = analyzeErrors(errors)

console.log(`总计: ${stats.total}`)
console.log(`  错误: ${stats.errors}`)
console.log(`  警告: ${stats.warnings}`)
console.log(`  信息: ${stats.info}`)

// 找出错误最多的行
const problematicLines = [...stats.byLine.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5)

console.log("\n问题最多的前 5 行:")
problematicLines.forEach(([line, lineErrors]) => {
  console.log(`  行 ${line}: ${lineErrors.length} 个问题`)
})
```

## 与其他功能结合

### 与代码补全结合

```typescript
async function checkAndComplete(
  client: ADTClient,
  url: string,
  source: string,
  line: number,
  column: number
) {
  // 1. 先进行语法检查
  const errors = await client.syntaxCheck(url, url, source)

  if (errors.some(e => e.line === line && e.severity === "E")) {
    console.log("当前位置有语法错误，无法获取代码补全")
    return []
  }

  // 2. 获取代码补全
  const proposals = await client.codeCompletion(url, source, line, column)
  return proposals
}
```

### 与激活结合

```typescript
async function checkAndActivate(
  client: ADTClient,
  objectUrl: string,
  objectName: string,
  source: string
) {
  const structure = await client.objectStructure(objectUrl)
  const mainInclude = ADTClient.mainInclude(structure)

  // 1. 语法检查
  const errors = await client.syntaxCheck(
    objectUrl,
    mainInclude,
    source
  )

  const fatalErrors = errors.filter(e => e.severity === "E")

  if (fatalErrors.length > 0) {
    console.log("语法检查失败，无法激活")
    return { success: false, checkErrors: errors }
  }

  // 2. 保存代码
  await client.setObjectSource(mainInclude, source, "lock-handle", "")

  // 3. 激活
  const result = await client.activate(objectName, objectUrl, mainInclude)

  return {
    success: result.success,
    checkErrors: errors,
    activateErrors: result.messages
  }
}
```

### 与查找定义结合

```typescript
async function checkWord(
  client: ADTClient,
  url: string,
  source: string,
  line: number,
  column: number
) {
  // 1. 语法检查确保代码有效
  const errors = await client.syntaxCheck(url, url, source)

  const lineErrors = errors.filter(e => e.line === line && e.severity === "E")
  if (lineErrors.length > 0) {
    console.log("当前行有语法错误")
    return
  }

  // 2. 查找定义
  const definition = await client.findDefinition(
    url,
    source,
    line,
    column,
    column
  )

  console.log(`定义位于: ${definition.url} 行 ${definition.line}`)
}
```

## 性能建议

### 调整检查粒度

```typescript
// 对于大型文件，可以只检查修改的部分
async function incrementalCheck(
  client: ADTClient,
  url: string,
  source: string,
  modifiedLines: number[]
) {
  const errors = await client.syntaxCheck(url, url, source)

  // 只关注修改行附近的错误
  const nearbyErrors = errors.filter(e =>
    modifiedLines.some(l => Math.abs(l - e.line) <= 5)
  )

  return nearbyErrors
}
```

### 缓存检查结果

```typescript
class SyntaxCheckCache {
  private cache = new Map<string, SyntaxCheckResult[]>()
  private maxAge = 60000 // 60秒

  async check(
    client: ADTClient,
    url: string,
    source: string
  ): Promise<SyntaxCheckResult[]> {
    const key = `${url}:${hashCode(source)}`

    const cached = this.cache.get(key)
    if (cached) {
      console.log("使用缓存结果")
      return cached
    }

    const errors = await client.syntaxCheck(url, url, source)
    this.cache.set(key, errors)

    // 60秒后清除缓存
    setTimeout(() => this.cache.delete(key), this.maxAge)

    return errors
  }
}
```

## 完整示例

```typescript
import { ADTClient } from "abap-adt-api"

async function comprehensiveSyntaxCheck(
  client: ADTClient,
  objectUrl: string
) {
  console.log("=== 综合语法检查 ===\n")

  // 1. 获取对象结构和源代码
  const structure = await client.objectStructure(objectUrl)
  const mainInclude = ADTClient.mainInclude(structure)
  const source = await client.getObjectSource(mainInclude)

  console.log(`对象: ${structure.metaData["adtcore:name"]}`)
  console.log(`类型: ${structure.metaData["adtcore:type"]}`)
  console.log(`源代码长度: ${source.length} 字符\n`)

  // 2. 执行语法检查
  console.log("执行语法检查...")
  const errors = await client.syntaxCheck(
    objectUrl,
    mainInclude,
    source
  )

  // 3. 统计结果
  const stats = analyzeErrors(errors)

  console.log("\n=== 检查结果 ===")
  console.log(`总计: ${stats.total} 个问题`)
  console.log(`  错误: ${stats.errors} ❌`)
  console.log(`  警告: ${stats.warnings} ⚠️`)
  console.log(`  信息: ${stats.info} ℹ️\n`)

  // 4. 显示错误详情
  if (stats.errors > 0) {
    console.log("=== 错误详情 ===")
    errors.filter(e => e.severity === "E").forEach((error, i) => {
      console.log(`\n错误 ${i + 1}:`)
      console.log(`  位置: 行 ${error.line}`)
      console.log(`  URI: ${error.uri}`)
      console.log(`  描述: ${error.text}`)
    })
  }

  // 5. 按行显示问题
  console.log("\n=== 按行汇总 ===")
  const sortedLines = [...stats.byLine.entries()]
    .sort((a, b) => a[0] - b[0])

  for (const [line, lineErrors] of sortedLines) {
    const eCount = lineErrors.filter(e => e.severity === "E").length
    const wCount = lineErrors.filter(e => e.severity === "W").length

    if (eCount > 0 || wCount > 0) {
      console.log(`行 ${line}: ${eCount} 错误, ${wCount} 警告`)
    }
  }

  // 6. 返回结果
  return {
    passed: stats.errors === 0,
    stats,
    errors
  }
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const result = await comprehensiveSyntaxCheck(
  client,
  "/sap/bc/adt/programs/programs/zmyprog"
)

if (result.passed) {
  console.log("\n语法检查通过 ✓")
} else {
  console.log("\n语法检查失败，请修复错误")
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
```
