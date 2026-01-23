# ATC 检查

本文档介绍如何使用 abap-adt-api 执行 ABAP 代码检查和代码审查。

## 概述

ABAP Test Cockpit (ATC) 功能包括：

- 获取 ATC 自定义设置
- 运行 ATC 检查
- 获取工作列表
- 管理豁免
- 请求豁免批准

## ATC 自定义设置

### atcCustomizing

获取 ATC 系统自定义设置。

```typescript
const customizing = await client.atcCustomizing(): Promise<AtcCustomizing>
```

**AtcCustomizing 结构:**

```typescript
interface AtcCustomizing {
  properties: AtcProperty[]
  exemptions: AtcExemption[]
}

interface AtcProperty {
  name: string
  value: boolean | string
}

interface AtcExemption {
  id: string
  justificationMandatory: boolean
  title: string
}
```

**示例:**

```typescript
const customizing = await client.atcCustomizing()

console.log("ATC 自定义设置:")
customizing.properties.forEach(prop => {
  console.log(`  ${prop.name}: ${prop.value}`)
})

console.log("\n豁免配置:")
customizing.exemptions.forEach(ex => {
  console.log(`  ${ex.id}: ${ex.title}`)
  console.log(`    需要理由: ${ex.justificationMandatory}`)
})
```

## 运行 ATC 检查

### createAtcRun

创建并执行 ATC 检查运行。

```typescript
const runResult = await client.createAtcRun(
  variant: string,
  mainUrl: string,
  maxResults = 100
): Promise<AtcRunResult>
```

**AtcRunResult 结构:**

```typescript
interface AtcRunResult {
  id: string
  timestamp: number
  infos: Array<{
    type: string
    description: string
  }>
}
```

**示例:**

```typescript
const runResult = await client.createAtcRun(
  "DEFAULT",  // 检查变体
  "/sap/bc/adt/oo/classes/zmyclass",
  100
)

console.log("ATC 检查运行已完成:")
console.log(`  运行 ID: ${runResult.id}`)
console.log(`  时间戳: ${new Date(runResult.timestamp).toISOString()}`)
console.log(`  信息: ${runResult.infos.length}`)

runResult.infos.forEach(info => {
  console.log(`    ${info.type}: ${info.description}`)
})
```

### 获取检查变体

```typescript
const variants = await client.atcCheckVariant(variantName: string)

console.log("检查变体信息:")
console.log(JSON.stringify(variants, null, 2))
```

## 获取工作列表

### atcWorklists

获取 ATC 工作列表（发现的问题）。

```typescript
const worklist = await client.atcWorklists(
  runResultId: string,
  timestamp?: number,
  usedObjectSet?: string,
  includeExempted = false
): Promise<AtcWorkList>
```

**AtcWorkList 结构:**

```typescript
interface AtcWorkList {
  id: string
  timestamp: number
  usedObjectSet: string
  objectSetIsComplete: boolean
  objectSets: Array<{
    name: string
    title: string
    kind: string
  }>
  objects: Array<{
    uri: string
    type: string
    name: string
    packageName: string
    author: string
    objectTypeId?: string
    findings: Array<{
      uri: string
      location: UriParts
      priority: number
      checkId: string
      checkTitle: string
      messageId: string
      messageTitle: string
      exemptionApproval: string
      exemptionKind: string
      quickfixInfo?: string
      link: Link
    }>
  }>
}
```

**示例:**

```typescript
const worklist = await client.atcWorklists(runResult.id)

console.log(`\nATC 工作列表:`)
console.log(`  运行 ID: ${worklist.id}`)
console.log(`  对象集: ${worklist.usedObjectSet}`)
console.log(`  对象数量: ${worklist.objects.length}`)

let totalFindings = 0

worklist.objects.forEach(obj => {
  console.log(`\n  ${obj.name} (${obj.type})`)
  console.log(`    包: ${obj.packageName}`)
  console.log(`    作者: ${obj.author}`)
  console.log(`    发现: ${obj.findings.length}`)

  totalFindings += obj.findings.length

  obj.findings.forEach(finding => {
    const severity = finding.priority > 7 ? "严重" :
                     finding.priority > 4 ? "警告" : "信息"
    console.log(`      [${severity} 行 ${finding.location.line}] ${finding.messageTitle}`)
    console.log(`        检查: ${finding.checkId} - ${finding.checkTitle}`)
    console.log(`        消息: ${finding.messageId}`)

    if (finding.exemptionApproval) {
      console.log(`        豁免: ${finding.exemptionApproval}`)
    }
  })
})

console.log(`\n总计发现: ${totalFindings} 个问题`)
```

## ATC 用户

### atcUsers

获取 ATC 用户列表（豁免批准者）。

```typescript
const users = await client.atcUsers(): Promise<AtcUser[]>
```

**示例:**

```typescript
const users = await client.atcUsers()

console.log("ATC 用户（豁免批准者）:")
users.forEach(user => {
  console.log(`  ${user.id}: ${user.title}`)
})
```

## 豁免管理

### atcExemptProposal

获取豁免建议。

```typescript
const proposal = await client.atcExemptProposal(
  markerId: string
): Promise<AtcProposal>
```

### atcRequestExemption

请求豁免批准。

```typescript
const result = await client.atcRequestExemption(
  proposal: AtcProposal
): Promise<void>
```

**AtcProposal 结构:**

```typescript
interface AtcProposal {
  finding: string | { uri, type, name, location, ... }
  package: string
  subObject: string
  subObjectType: string
  subObjectTypeDescr: string
  objectTypeDescr: string
  approver: string
  reason: "FPOS" | "OTHR" | ""
  justification: string
  notify: "never" | "on_rejection" | "always"
  restriction: {
    enabled: boolean
    singlefinding: boolean
    rangeOfFindings: {
      enabled: boolean
      restrictByObject: {
        object: boolean
        package: boolean
        subobject: boolean
        target: "subobject" | "object" | "package" | ""
      }
      restrictByCheck: {
        check: boolean
        message: boolean
        target: "message" | "check" | ""
      }
    }
  }
}
```

**示例:**

```typescript
async function requestExemption(
  client: ADTClient,
  markerId: string,
  justification: string,
  approver: string
) {
  // 1. 获取豁免建议
  console.log("1. 获取豁免建议...")
  const proposal = await client.atcExemptProposal(markerId)

  // 2. 设置豁免参数
  console.log("2. 配置豁免...")
  proposal.justification = "OTHR"  // 其他原因
  proposal.justificationText = justification
  proposal.approver = approver
  proposal.notify = "on_rejection"  // 拒绝时通知

  // 3. 请求豁免
  console.log("3. 请求豁免批准...")
  await client.atcRequestExemption(proposal)

  console.log("豁免请求已提交")
}

// 使用
await requestExemption(
  client,
  "marker-id-123",
  "此问题是误报，已确认代码正确",
  "APPROVER1"
)
```

## ATC 文档

### atcDocumentation

获取检查规则的文档。

```typescript
const documentation = await client.atcDocumentation(docUri: string): Promise<string>
```

**示例:**

```typescript
const docUri = "/sap/bc/adt/atc/docu/123"
const docs = await client.atcDocumentation(docUri)

console.log("检查规则文档:")
console.log(docs)
```

### atcContactUri

获取问题的联系人信息。

```typescript
const contactUri = await client.atcContactUri(findingUri: string): Promise<string>
```

### atcChangeContact

更改问题联系人。

```typescript
await client.atcChangeContact(itemUri: string, userId: string)
```

## 完整示例：ATC 工作流

```typescript
import { ADTClient } from "abap-adt-api"

async function atcWorkflow(
  client: ADTClient,
  objectUrl: string
) {
  console.log("=== ATC 检查工作流 ===\n")

  // 1. 获取 ATC 自定义设置
  console.log("1. 获取 ATC 自定义设置...")
  const customizing = await client.atcCustomizing()

  console.log(`  豁免配置: ${customizing.exemptions.length}`)

  // 2. 运行 ATC 检查
  console.log("\n2. 运行 ATC 检查...")
  const runResult = await client.createAtcRun(
    "DEFAULT",
    objectUrl,
    100
  )

  console.log(`  运行 ID: ${runResult.id}`)

  // 3. 获取工作列表
  console.log("\n3. 获取工作列表...")
  const worklist = await client.atcWorklists(runResult.id)

  let criticalIssues = 0
  let moderateIssues = 0
  let lowIssues = 0

  worklist.objects.forEach(obj => {
    obj.findings.forEach(finding => {
      if (finding.priority > 7) criticalIssues++
      else if (finding.priority > 4) moderateIssues++
      else lowIssues++
    })
  })

  console.log(`  问题统计:`)
  console.log(`    严重: ${criticalIssues}`)
  console.log(`    中等: ${moderateIssues}`)
  console.log(`    轻微: ${lowIssues}`)

  // 4. 分析问题
  console.log("\n4. 问题分析:")

  const problemsByCheck = new Map<string, number>()

  worklist.objects.forEach(obj => {
    obj.findings.forEach(finding => {
      const key = `${finding.checkId}: ${finding.checkTitle}`
      problemsByCheck.set(
        key,
        (problemsByCheck.get(key) || 0) + 1
      )
    })
  })

  // 显示最常见的问题
  const sortedProblems = [...problemsByCheck.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  console.log("  最常见的问题:")
  sortedProblems.forEach(([check, count]) => {
    console.log(`    ${count}x - ${check}`)
  })

  // 5. 如果有严重问题，显示详细信息
  if (criticalIssues > 0) {
    console.log("\n5. 严重问题详情:")

    worklist.objects.forEach(obj => {
      obj.findings.filter(f => f.priority > 7).forEach(finding => {
        console.log(`\n  ${obj.name}.`)
        console.log(`    行 ${finding.location.line}: ${finding.messageTitle}`)
        console.log(`    检查: ${finding.checkTitle}`)

        // 显示代码位置
        console.log(`    URI: ${finding.uri}`)
        console.log(`    类型: ${finding.location.type}`)
        console.log(`    名称: ${finding.location.name}`)
      })
    })
  }

  // 6. 生成报告
  const report = {
    runId: runResult.id,
    timestamp: runResult.timestamp,
    totalFindings: criticalIssues + moderateIssues + lowIssues,
    byPriority: {
      critical: criticalIssues,
      moderate: moderateIssues,
      low: lowIssues
    },
    topProblems: sortedProblems.map(([check, count]) => ({ check, count }))
  }

  return report
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const report = await atcWorkflow(
  client,
  "/sap/bc/adt/oo/classes/zmyclass"
)

console.log("\n=== 最终报告 ===")
console.log(JSON.stringify(report, null, 2))
```

## 批量 ATC 检查

```typescript
async function batchAtcCheck(
  client: ADTClient,
  objectUrls: string[]
) {
  const results: {
    url: string
    runId: string
    totalFindings: number
    critical: number
    moderate: number
    low: number
  }[] = []

  for (const url of objectUrls) {
    console.log(`检查对象: ${url}`)

    try {
      // 运行 ATC 检查
      const runResult = await client.createAtcRun("DEFAULT", url)

      // 获取工作列表
      const worklist = await client.atcWorklists(runResult.id)

      // 统计问题
      let critical = 0, moderate = 0, low = 0

      worklist.objects.forEach(obj => {
        obj.findings.forEach(finding => {
          if (finding.priority > 7) critical++
          else if (finding.priority > 4) moderate++
          else low++
        })
      })

      results.push({
        url,
        runId: runResult.id,
        totalFindings: critical + moderate + low,
        critical,
        moderate,
        low
      })

    } catch (error) {
      console.error(`检查失败: ${error.message}`)
    }
  }

  // 汇总报告
  console.log("\n=== 汇总报告 ===")
  const totalFindings = results.reduce((sum, r) => sum + r.totalFindings, 0)
  const totalCritical = results.reduce((sum, r) => sum + r.critical, 0)

  console.log(`对象总数: ${results.length}`)
  console.log(`总问题数: ${totalFindings}`)
  console.log(`严重问题: ${totalCritical}`)

  // 找出问题最多的对象
  const sorted = [...results].sort((a, b) => b.totalFindings - a.totalFindings)
  console.log("\n问题最多的前 5 个对象:")
  sorted.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.url}`)
    console.log(`     总计: ${r.totalFindings} (严重: ${r.critical})`)
  })

  return results
}

// 使用
const urls = [
  "/sap/bc/adt/oo/classes/zclass1",
  "/sap/bc/adt/oo/classes/zclass2",
  "/sap/bc/adt/oo/classes/zclass3"
]

await batchAtcCheck(client, urls)
```

## 优先级和过滤

```typescript
function filterFindingsByPriority(
  worklist: AtcWorkList,
  minPriority: number
) {
  const filtered: typeof worklist.objects = []

  worklist.objects.forEach(obj => {
    const filteredFindings = obj.findings.filter(
      f => f.priority >= minPriority
    )

    if (filteredFindings.length > 0) {
      filtered.push({
        ...obj,
        findings: filteredFindings
      })
    }
  })

  return { ...worklist, objects: filtered }
}

// 使用：只显示高优先级问题（优先级 > 5）
const worklist = await client.atcWorklists(runResult.id)
const highPriority = filterFindingsByPriority(worklist, 5)

console.log(`高优先级问题: ${highPriority.objects.reduce(
  (sum, o) => sum + o.findings.length, 0
)}`)
```
