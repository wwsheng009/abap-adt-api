# 追踪与日志

本文档介绍如何使用 abap-adt-api 进行 ABAP 性能追踪和日志分析。

## 概述

追踪功能包括：

- 列出追踪
- 命中列表
- 数据库访问
- SQL 语句
- 追踪参数管理
- 创建和删除追踪配置

## 列出追踪

### tracesList

列出用户的追踪。

```typescript
const traces = await client.tracesList(user?: string): Promise<TraceRequestList>
```

**示例:**

```typescript
const traces = await client.tracesList()

console.log(`找到 ${traces.length} 个追踪:`)

traces.forEach((trace, index) => {
  console.log(`\n${index + 1}. ${trace.id}`)
  console.log(`   时间: ${new Date(trace.timestamp).toISOString()}`)
  console.log(`   类型: ${trace.type}`)
  console.log(`   状态: ${trace.status}`)
  console.log(`   用户: ${trace.user}`)
  console.log(`   描述: ${trace.description}`)
})
```

### tracesListRequests

列出追踪请求。

```typescript
const requests = await client.tracesListRequests(user?: string): Promise<any[]>
```

**示例:**

```typescript
const requests = await client.tracesListRequests(requestedUser)

console.log("追踪请求:")
requests.forEach(req => {
  console.log(`  ID: ${req.id}`)
  console.log(`  时间: ${new Date(req.timestamp).toISOString()}`)
  console.log(`  用户: ${req.user}`)
  console.log(`  系统用户: ${req.systemUser}`)
  console.log(`  终端 ID: ${req.terminalId}`)
})
```

## 追踪数据

### tracesHitList

获取追踪命中列表。

```typescript
const hitList = await client.tracesHitList(
  id: string,
  withSystemEvents = false
): Promise<TraceHitList>
```

**TraceHitList 包含追踪的命中点信息。**

**示例:**

```typescript
const hitList = await client.tracesHitList(
  "trace-id-123",
  false  // 不包含系统事件
)

console.log("追踪命中:")
hitList.hits.forEach(hit => {
  console.log(`  URI: ${hit.uri}`)
  console.log(`  行号: ${hit.line}`)
  console.log(`  命中次数: ${hit.count}`)
  console.log(`  耗时: ${hit.duration}ms`)
})
```

### tracesDbAccess

获取数据库访问信息。

```typescript
const dbAccess = await client.tracesDbAccess(
  id: string,
  withSystemEvents = false
): Promise<TraceDBAccessResponse>
```

**示例:**

```typescript
const dbAccess = await client.tracesDbAccess(
  "trace-id-123"
)

console.log(`\n数据库访问:`)
console.log(`总请求数: ${dbAccess.totalRequests}`)
console.log(`执行时间: ${dbAccess.executionTime}ms`)

dbAccess.accesses.forEach(access => {
  console.log(`\n表: ${access.table}`)
  console.log(`  记录数: ${access.records}`)
  console.log(`  耗时: ${access.duration}ms`)
  console.log(`  操作: ${access.operation}`)

  if (access.sql) {
    console.log(`  SQL: ${access.sql}`)
  }
})
```

### tracesStatements

获取 SQL 语句详情。

```typescript
const statements = await client.tracesStatements(
  id: string,
  options: TraceStatementOptions = {}
): Promise<TraceStatementResponse>
```

**TraceStatementOptions 结构:**

```typescript
interface TraceStatementOptions {
  fromLine?: number
  toLine?: number
  minDuration?: number
  maxDuration?: number
}
```

**示例:**

```typescript
const statements = await client.tracesStatements(
  "trace-id-123",
  {
    fromLine: 100,
    toLine: 200,
    minDuration: 10,  // 至少 10ms
    maxDuration: 1000 // 最多 1000ms
  }
)

console.log("SQL 语句:")
statements.statements.forEach((stmt, index) => {
  console.log(`\n${index + 1}. 行 ${stmt.line}`)
  console.log(`   SQL: ${stmt.sql}`)
  console.log(`   执行时间: ${stmt.duration}ms`)
  console.log(`   记录数: ${stmt.records}`)
  console.log(`   表: ${stmt.table}`)
})
```

## 追踪参数

### tracesSetParameters

设置追踪参数。

```typescript
await client.tracesSetParameters(parameters: TraceParameters)
```

**TraceParameters 结构:**

```typescript
interface TraceParameters {
  duration?: number           // 持续时间（秒）
  maxSize?: number           // 最大大小（MB）
  components?: string[]      // 追踪组件
  activationType?: string    // 激活类型
  filter?: string            // 过滤器
}
```

**示例:**

```typescript
await client.tracesSetParameters({
  duration: 300,       // 5 分钟
  maxSize: 100,        // 100MB
  components: ["SAPSQL", "SAPABAP", "SAPHANA"],
  activationType: "PROFILE",
  filter: "Z*"
})

console.log("追踪参数已设置")
```

## 追踪配置

### tracesCreateConfiguration

创建追踪配置。

```typescript
const config = await client.tracesCreateConfiguration(
  config: TracesCreationConfig
): Promise<void>
```

**TracesCreationConfig 结构:**

```typescript
interface TracesCreationConfig {
  name: string
  description?: string
  components: string[]
  duration: number       // 秒
  filter?: string
  userId?: string
}
```

**示例:**

```typescript
await client.tracesCreateConfiguration({
  name: "Z_MY_TRACE_CONFIG",
  description: "自定义追踪配置",
  components: [
    "SAPSQL"      // SQL 追踪
    "SAPABAP"     // ABAP 追踪
    "SAPHANA"     // HANA 追踪
  ],
  duration: 600,     // 10 分钟
  filter: "ZCL_*",
  userId: "DEVELOPER"
})

console.log("追踪配置已创建")
```

### tracesDeleteConfiguration

删除追踪配置。

```typescript
await client.tracesDeleteConfiguration(id: string)
```

**示例:**

```typescript
await client.tracesDeleteConfiguration("Z_MY_TRACE_CONFIG")

console.log("追踪配置已删除")
```

### tracesDelete

删除追踪记录。

```typescript
await client.tracesDelete(id: string)
```

**示例:**

```typescript
await client.tracesDelete("trace-id-123")

console.log("追踪记录已删除")
```

## 完整示例：性能追踪工作流

```typescript
import { ADTClient } from "abap-adt-api"

async function traceWorkflow(
  client: ADTClient,
  traceName: string,
  filter: string,
  duration: number
) {
  console.log("=== 性能追踪工作流 ===\n")

  // 1. 创建追踪配置
  console.log("1. 创建追踪配置...")
  await client.tracesCreateConfiguration({
    name: traceName,
    description: `追踪性能: ${filter}`,
    components: [
      "SAPSQL",
      "SAPABAP",
      "SAPHANA"
    ],
    duration,
    filter
  })

  console.log(`  配置名称: ${traceName}`)
  console.log(`  过滤器: ${filter}`)
  console.log(`  持续时间: ${duration} 秒`)

  // 2. 设置追踪参数
  console.log("\n2. 设置追踪参数...")
  await client.tracesSetParameters({
    duration,
    maxSize: 100,
    components: ["SAPSQL", "SAPABAP"],
    activationType: "PROFILE",
    filter
  })

  // 3. 开始追踪（这里需要实际执行代码）
  console.log("\n3. 追踪已配置，请执行要追踪的代码...")
  console.log(`  等待 ${duration} 秒...`)

  await new Promise(resolve => setTimeout(resolve, duration * 1000))

  // 4. 列出追踪
  console.log("\n4. 列出追踪...")
  const traces = await client.tracesList()

  if (traces.length === 0) {
    console.log("没有找到追踪记录")
    return
  }

  const latestTrace = traces[0]

  console.log(`  最新追踪 ID: ${latestTrace.id}`)
  console.log(`  时间: ${new Date(latestTrace.timestamp).toISOString()}`)

  // 5. 分析命中列表
  console.log("\n5. 分析命中列表...")
  const hitList = await client.tracesHitList(latestTrace.id)

  console.log(`  总命中: ${hitList.hits.length}`)

  // 按行号排序
  const sorted = [...hitList.hits].sort((a, b) => a.line - b.line)

  console.log("\n  命中最多的前 10 行:")
  sorted.slice(0, 10).forEach((hit, i) => {
    console.log(`    ${i + 1}. 行 ${hit.line}: ${hit.count} 次, ${hit.duration}ms`)
  })

  // 6. 分析数据库访问
  console.log("\n6. 分析数据库访问...")
  const dbAccess = await client.tracesDbAccess(latestTrace.id)

  console.log(`  总数据库请求: ${dbAccess.totalRequests}`)
  console.log(`  总执行时间: ${dbAccess.executionTime}ms`)
  console.log(`  平均请求时间: ${(dbAccess.executionTime / dbAccess.totalRequests).toFixed(2)}ms`)

  // 找出最慢的数据库操作
  const slowOperations = [...dbAccess.accesses]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)

  console.log("\n  最慢的 5 个数据库操作:")
  slowOperations.forEach((op, i) => {
    console.log(`    ${i + 1}. ${op.table}: ${op.duration}ms`)
    console.log(`       操作: ${op.operation}`)
    console.log(`       记录数: ${op.records}`)
    if (op.sql) {
      console.log(`       SQL: ${op.sql.substring(0, 100)}...`)
    }
  })

  // 7. 分析 SQL 语句
  console.log("\n7. 分析 SQL 语句...")
  const statements = await client.tracesStatements(
    latestTrace.id,
    { minDuration: 10 }  // 只显示耗时超过 10ms 的
  )

  console.log(`  找到 ${statements.statements.length} 个慢 SQL 语句:`)

  statements.statements.forEach((stmt, i) => {
    console.log(`\n  ${i + 1}. 行 ${stmt.line} (${stmt.duration}ms)`)
    console.log(`     记录数: ${stmt.records}`)
    console.log(`     类型: ${stmt.operation}`)
    console.log(`     SQL: ${stmt.sql}`)
  })

  // 8. 生成性能报告
  const report = {
    traceId: latestTrace.id,
    timestamp: latestTrace.timestamp,
    summary: {
      totalHits: hitList.hits.length,
      totalDbRequests: dbAccess.totalRequests,
      totalDbTime: dbAccess.executionTime,
      slowStatements: statements.statements.length
    },
    topHits: sorted.slice(0, 10).map(h => ({
      line: h.line,
      count: h.count,
      duration: h.duration
    })),
    slowDbOperations: slowOperations.map(op => ({
      table: op.table,
      operation: op.operation,
      duration: op.duration,
      records: op.records
    }))
  }

  console.log("\n=== 性能报告 ===")
  console.log(JSON.stringify(report, null, 2))

  // 清理
  console.log("\n删除追踪配置...")
  await client.tracesDeleteConfiguration(traceName)

  return report
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const report = await traceWorkflow(
  client,
  "Z_PERF_TRACE",
  "ZCL_*",
  60  // 1 分钟
)
```

## 批量追踪分析

```typescript
async function analyzeMultipleTraces(
  client: ADTClient,
  traceIds: string[]
) {
  const analyses: any[] = []

  for (const id of traceIds) {
    console.log(`分析追踪: ${id}`)

    try {
      const hitList = await client.tracesHitList(id)
      const dbAccess = await client.tracesDbAccess(id)

      const analysis = {
        traceId: id,
        totalHits: hitList.hits.length,
        totalDbTime: dbAccess.executionTime,
        avgDbTime: dbAccess.totalRequests > 0
          ? dbAccess.executionTime / dbAccess.totalRequests
          : 0,
        totalDbRequests: dbAccess.totalRequests
      }

      analyses.push(analysis)

    } catch (error) {
      console.error(`分析失败: ${error.message}`)
    }
  }

  // 汇总
  console.log("\n=== 追踪汇总 ===")

  const sorted = [...analyses].sort((a, b) => b.totalDbTime - a.totalDbTime)

  sorted.forEach((a, i) => {
    console.log(`${i + 1}. ${a.traceId}:`)
    console.log(`   数据库时间: ${a.totalDbTime}ms`)
    console.log(`   请求数: ${a.totalDbRequests}`)
    console.log(`   平均请求时间: ${a.avgDbTime.toFixed(2)}ms`)
    console.log(`   总命中: ${a.totalHits}`)
  })

  return analyses
}

// 使用
const traces = await client.tracesList()
const traceIds = traces.map(t => t.id).slice(0, 10)

await analyzeMultipleTraces(client, traceIds)
```

## 追踪过滤器

```typescript
async function traceWithFilters(
  client: ADTClient,
  filterConfig: {
    objectFilter: string
    userFilter: string
    componentFilter: string[]
  }
) {
  // 1. 创建带过滤器的配置
  await client.tracesCreateConfiguration({
    name: `Z_FILTERED_TRACE_${Date.now()}`,
    components: filterConfig.componentFilter,
    duration: 300,
    filter: filterConfig.objectFilter,
    userId: filterConfig.userFilter
  })

  // 2. 设置参数
  await client.tracesSetParameters({
    duration: 300,
    filter: `${filterConfig.objectFilter}|${filterConfig.userFilter}`,
    components: filterConfig.componentFilter
  })

  console.log("已设置追踪过滤器:")
  console.log(`  对象: ${filterConfig.objectFilter}`)
  console.log(`  用户: ${filterConfig.userFilter}`)
  console.log(`  组件: ${filterConfig.componentFilter.join(", ")}`)
}

// 使用
await traceWithFilters(client, {
  objectFilter: "ZCL_MY*",
  userFilter: "DEVELOPER",
  componentFilter: ["SAPSQL", "SAPABAP"]
})
```

## 性能分析建议

1. **识别慢 SQL**
```typescript
const dbAccess = await client.tracesDbAccess(traceId)
const slowQueries = dbAccess.accesses.filter(a => a.duration > 1000)

if (slowQueries.length > 0) {
  console.warn("发现慢 SQL 查询:")
  slowQueries.forEach(q => {
    console.warn(`  ${q.table}: ${q.duration}ms`)
  })
}
```

2. **分析热点代码**
```typescript
const hitList = await client.tracesHitList(traceId)
const hotLines = hitList.hits.filter(h => h.count > 10)

console.log("热点代码行:")
hotLines.forEach(line => {
  console.log(`  行 ${line.line}: 命中 ${line.count} 次`)
})
```

3. **比较追踪**
```typescript
async function compareTraces(
  client: ADTClient,
  beforeId: string,
  afterId: string
) {
  const before = await client.tracesDbAccess(beforeId)
  const after = await client.tracesDbAccess(afterId)

  const improvement = before.executionTime - after.executionTime
  const percentChange = (improvement / before.executionTime) * 100

  console.log(`\n性能对比:`)
  console.log(`  之前: ${before.executionTime}ms`)
  console.log(`  之后: ${after.executionTime}ms`)
  console.log(`  改进: ${improvement}ms (${percentChange.toFixed(2)}%)`)

  return {
    improvement,
    percentChange
  }
}

// 使用
const beforeTrace = "trace-1"
const afterTrace = "trace-2"

const comparison = await compareTraces(client, beforeTrace, afterTrace)
```
