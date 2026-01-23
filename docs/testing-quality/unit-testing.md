# 单元测试

本文档介绍如何使用 abap-adt-api 运行和管理 ABAP 单元测试。

## 概述

单元测试功能包括：

- 运行单元测试
- 评估测试结果
- 获取测试标记
- 管理测试风险级别和持续时间

## UnitTestClass

测试类结构。

```typescript
interface UnitTestClass {
  "adtcore:uri": string
  "adtcore:type": string
  "adtcore:name": string
  uriType: string
  navigationUri?: string
  durationCategory: string
  riskLevel: string
  testmethods: UnitTestMethod[]
  alerts: UnitTestAlert[]
}
```

## UnitTestMethod

测试方法结构。

```typescript
interface UnitTestMethod {
  "adtcore:uri": string
  "adtcore:type": string
  "adtcore:name": string
  executionTime: number
  uriType: string
  navigationUri?: string
  unit: string
  alerts: UnitTestAlert[]
}
```

## UnitTestAlert

测试警告和信息。

```typescript
interface UnitTestAlert {
  kind: UnitTestAlertKind
  severity: UnitTestSeverity
  details: string[]
  stack: UnitTestStackEntry[]
  title: string
}

enum UnitTestAlertKind {
  exception = "exception",
  failedAssertion = "failedAssertion",
  warning = "warning"
}

enum UnitTestSeverity {
  critical = "critical",
  fatal = "fatal",
  tolerable = "tolerable",
  tolerant = "tolerant"
}
```

## 运行单元测试

### unitTestRun

运行单元测试。

```typescript
const results = await client.unitTestRun(
  url: string,
  flags: UnitTestRunFlags = DefaultUnitTestRunFlags
): Promise<UnitTestClass[]>
```

**UnitTestRunFlags 结构:**

```typescript
interface UnitTestRunFlags {
  harmless: boolean      // 无风险测试
  dangerous: boolean     // 危险测试
  critical: boolean      // 关键测试
  short: boolean         // 短持续时间测试
  medium: boolean        // 中等持续时间测试
  long: boolean          // 长持续时间测试
}

const DefaultUnitTestRunFlags: UnitTestRunFlags = {
  harmless: true,
  dangerous: false,
  critical: false,
  short: true,
  medium: false,
  long: false
}
```

**示例:**

```typescript
const url = "/sap/bc/adt/oo/classes/ztest_class"

// 使用默认标志运行
const results = await client.unitTestRun(url)

console.log(`测试完成，共 ${results.length} 个测试类`)

results.forEach(testClass => {
  console.log(`\n类: ${testClass["adtcore:name"]}`)
  console.log(`  风险级别: ${testClass.riskLevel}`)
  console.log(`  持续时间类别: ${testClass.durationCategory}`)

  const passed = testClass.testmethods.filter(m => m.alerts.length === 0)
  const failed = testClass.testmethods.filter(m =>
    m.alerts.some(a => a.kind !== "warning")
  )

  console.log(`  通过: ${passed.length}`)
  console.log(`  失败: ${failed.length}`)
})
```

### 使用自定义标志

```typescript
const flags: UnitTestRunFlags = {
  harmless: true,
  dangerous: true,      // 包含危险测试
  critical: true,       // 包含关键测试
  short: true,
  medium: true,         // 包含中等持续时间测试
  long: false
}

const results = await client.unitTestRun(url, flags)
```

### 运行特定方法

```typescript
const methodUrl = "/sap/bc/adt/oo/classes/ztest_class/source/main#method=test_method"

const results = await client.unitTestRun(methodUrl, {
  harmless: true,
  short: true
})
```

## 评估测试

### unitTestEvaluation

重新评估测试结果。

```typescript
const methods = await client.unitTestEvaluation(
  clas: UnitTestClass,
  flags: UnitTestRunFlags = DefaultUnitTestRunFlags
): Promise<UnitTestMethod[]>
```

**示例:**

```typescript
const testResults = await client.unitTestRun(url)

// 选择一个测试类
const testClass = testResults[0]

// 重新评估该类的测试方法
const methods = await client.unitTestEvaluation(testClass)

methods.forEach(method => {
  console.log(`方法: ${method["adtcore:name"]}`)
  console.log(`  警告: ${method.alerts.length}`)

  if (method.alerts.length > 0) {
    method.alerts.forEach(alert => {
      console.log(`    [${alert.kind}] ${alert.title}`)
      alert.details.forEach(d => {
        console.log(`      - ${d}`)
      })
    })
  }
})
```

## 测试标记

### unitTestOccurrenceMarkers

获取测试标记。

```typescript
const markers = await client.unitTestOccurrenceMarkers(
  uri: string,
  source: string
): Promise<UnitTestOccurrenceMarker[]>
```

**Example:**

```typescript
const source = `
  " method test_addition

  cl_abap_unit_assert=>assert_equals(
    exp = 3,
    act = lv_result
  ).
`

const markers = await client.unitTestOccurrenceMarkers(
  "/sap/bc/adt/oo/classes/ztest/source/main",
  source
)

markers.forEach(marker => {
  console.log(`标记: ${marker.kind}`)
  console.log(`  位置: ${marker.location.line}, ${marker.location.column}`)
  console.log(`  保留结果: ${marker.keepsResult}`)
})
```

## 分析测试结果

### 详细测试报告

```typescript
function generateTestReport(results: UnitTestClass[]): string {
  const report: string[] = []

  let totalMethods = 0
  let totalPassed = 0
  let totalFailed = 0

  results.forEach((testClass, idx) => {
    report.push(`\n${idx + 1}. ${testClass["adtcore:name"]}`)
    report.push(`   风险级别: ${testClass.riskLevel}`)
    report.push(`   持续时间: ${testClass.durationCategory}\n`)

    const classFailed = testClass.testmethods.filter(m =>
      m.alerts.some(a => a.kind !== "warning")
    )

    testClass.testmethods.forEach(method => {
      totalMethods++
      const hasFatal = method.alerts.some(a =>
        a.kind === "exception" || a.kind === "failedAssertion"
      )

      if (hasFatal) {
        totalFailed++
        report.push(`   ✗ ${method["adtcore:name"]}`)

        method.alerts.forEach(alert => {
          if (alert.kind !== "warning") {
            report.push(`      [${alert.severity}] ${alert.title}`)
            alert.details.forEach(d => {
              report.push(`        - ${d}`)
            })

            if (alert.stack.length > 0) {
              report.push(`      调用栈:`)
              alert.stack.forEach(entry => {
                report.push(`        ${entry["adtcore:name"]} (${entry["adtcore:type"]})`)
              })
            }
          }
        })
      } else {
        totalPassed++
        report.push(`   ✓ ${method["adtcore:name"]}`)
      }
    })

    report.push(`\n   统计: 通过 ${testClass.testmethods.length - classFailed.length}, 失败 ${classFailed.length}`)
  })

  // 汇总
  report.push("\n=== 总体统计 ===")
  report.push(`测试类: ${results.length}`)
  report.push(`测试方法: ${totalMethods}`)
  report.push(`通过: ${totalPassed}`)
  report.push(`失败: ${totalFailed}`)
  report.push(`通过率: ${((totalPassed / totalMethods) * 100).toFixed(2)}%`)

  return report.join("\n")
}

// 使用
const results = await client.unitTestRun(url)
console.log(generateTestReport(results))
```

### 测试失败分析

```typescript
interface TestFailure {
  className: string
  methodName: string
  kind: string
  severity: string
  message: string
  stack: string[]
}

function analyzeFailures(results: UnitTestClass[]): TestFailure[] {
  const failures: TestFailure[] = []

  results.forEach(testClass => {
    testClass.testmethods.forEach(method => {
      const fatalAlerts = method.alerts.filter(a =>
        a.kind !== "warning"
      )

      fatalAlerts.forEach(alert => {
        failures.push({
          className: testClass["adtcore:name"],
          methodName: method["adtcore:name"],
          kind: alert.kind,
          severity: alert.severity,
          message: alert.title,
          stack: alert.stack.map(s =>
            `${s["adtcore:name"]} (${s["adtcore:type"]})`
          )
        })
      })
    })

  return failures
}

// 使用
const results = await client.unitTestRun(url)
const failures = analyzeFailures(results)

if (failures.length > 0) {
  console.log("失败分析:")
  failures.forEach((f, i) => {
    console.log(`\n${i + 1}. ${f.className}.${f.methodName}`)
    console.log(`   类型: ${f.kind}`)
    console.log(`   严重性: ${f.severity}`)
    console.log(`   消息: ${f.message}`)
    console.log(`   调用栈: ${f.stack.join(" -> ")}`)
  })
}
```

## 测试覆盖率

### 测试持续时间和风险配置

```typescript
// 只运行快速测试（短持续时间，低风险）
const quickTests = await client.unitTestRun(url, {
  harmless: true,
  dangerous: false,
  critical: false,
  short: true,
  medium: false,
  long: false
})

// 只运行高风险测试
const highRiskTests = await client.unitTestRun(url, {
  harmless: false,
  dangerous: true,
  critical: true,
  short: false,
  medium: false,
  long: false
})

// 完整测试套件
const fullSuite = await client.unitTestRun(url, {
  harmless: true,
  dangerous: true,
  critical: true,
  short: true,
  medium: true,
  long: true
})
```

## 运行特定风险级别的测试

```typescript
async function runTestByRiskLevel(
  client: ADTClient,
  url: string,
  riskLevel: "harmless" | "dangerous" | "critical"
): Promise<UnitTestClass[]> {
  const flags: UnitTestRunFlags = {
    harmless: riskLevel === "harmless",
    dangerous: riskLevel === "dangerous",
    critical: riskLevel === "critical",
    short: true,
    medium: false,
    long: false
  }

  return await client.unitTestRun(url, flags)
}

// 使用
const harmlessTests = await runTestByRiskLevel(client, url, "harmless")
const criticalTests = await runTestByRiskLevel(client, url, "critical")
```

## 批量测试

```typescript
async function batchRunTests(
  client: ADTClient,
  urls: string[]
) {
  const results: {
    url: string
    results: UnitTestClass[]
    passed: number
    failed: number
  }[] = []

  for (const url of urls) {
    console.log(`运行测试: ${url}`)

    try {
      const testResults = await client.unitTestRun(url)

      const passed = testResults.reduce((sum, cls) =>
        sum + cls.testmethods.filter(m => m.alerts.length === 0).length, 0
      )

      const failed = testResults.reduce((sum, cls) =>
        sum + cls.testmethods.filter(m =>
          m.alerts.some(a => a.kind !== "warning")
        ).length, 0
      )

      results.push({ url, results: testResults, passed, failed })

    } catch (error) {
      console.error(`测试失败: ${error.message}`)
      results.push({
        url,
        results: [],
        passed: 0,
        failed: 0
      })
    }
  }

  // 生成汇总报告
  console.log("\n=== 测试汇总 ===")
  results.forEach(r => {
    console.log(`${r.url}:`)
    console.log(`  通过: ${r.passed}`)
    console.log(`  失败: ${r.failed}`)
    console.log(`  总数: ${r.passed + r.failed}`)
  })

  return results
}

// 使用
const testUrls = [
  "/sap/bc/adt/oo/classes/ztest_class1",
  "/sap/bc/adt/oo/classes/ztest_class2",
  "/sap/bc/adt/oo/classes/ztest_class3"
]

await batchRunTests(client, testUrls)
```

## CI/CD 集成

```typescript
async function runTestsForCI(client: ADTClient, url: string) {
  // 运行完整测试套件
  const results = await client.unitTestRun(url, {
    harmless: true,
    dangerous: true,
    critical: true,
    short: true,
    medium: true,
    long: true
  })

  // 统计
  const totalMethods = results.reduce(
    (sum, cls) => sum + cls.testmethods.length, 0
  )

  const failed = results.reduce(
    (sum, cls) =>
      sum + cls.testmethods.filter(m =>
        m.alerts.some(a => a.kind !== "warning")
      ).length,
    0
  )

  const passed = totalMethods - failed
  const passRate = (passed / totalMethods) * 100

  // 构建输出
  const output = {
    timestamp: new Date().toISOString(),
    tests: {
      total: totalMethods,
      passed,
      failed,
      passRate: `${passRate.toFixed(2)}%`
    },
    classes: results.map(cls => ({
      name: cls["adtcore:name"],
      methods: cls.testmethods.map(m => ({
        name: m["adtcore:name"],
        passed: !m.alerts.some(a => a.kind !== "warning"),
        alerts: m.alerts
      }))
    }))
  }

  // 如果有失败测试，返回非零退出码（CI 失败）
  if (failed > 0) {
    console.error(`${failed} 个测试失败`)
    process.exit(1)
  } else {
    console.log("所有测试通过 ✓")
  }

  return output
}

// 使用
expect async() => {
  const client = new ADTClient(
    "http://vhcalnplci.local:8000",
    "ci_user",
    "password"
  )

  await client.login()

  const output = await runTestsForCI(
    client,
    "/sap/bc/adt/oo/classes/ztest_class"
  )

  return output
}
```

## 最佳实践

1. **在不同风险级别下运行测试**
```typescript
// 开发阶段：快速反馈
await client.unitTestRun(url, DefaultUnitTestRunFlags)

// 发布前：完整测试
await client.unitTestRun(url, {
  harmless: true,
  dangerous: true,
  critical: true,
  short: true,
  medium: true,
  long: true
})
```

2. **持续监控测试通过率**
```typescript
async function monitorTestPassRate(
  client: ADTClient,
  url: string,
  duration: number = 60000
) {
  const startTime = Date.now()
  const history: { time: number; passRate: number }[] = []

  while (Date.now() - startTime < duration) {
    const results = await client.unitTestRun(url)
    const total = results.reduce((sum, cls) =>
      sum + cls.testmethods.length, 0
    )
    const failed = results.reduce((sum, cls) =>
      sum + cls.testmethods.filter(m =>
        m.alerts.some(a => a.kind !== "warning")
      ).length, 0
    )

    const passRate = ((total - failed) / total) * 100
    history.push({ time: Date.now(), passRate })

    const avgPassRate = history.reduce((sum, h) =>
      sum + h.passRate, 0
    ) / history.length

    console.log(`通过率: ${passRate.toFixed(2)}%, 平均: ${avgPassRate.toFixed(2)}%`)

    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

// 监控 1 分钟
await monitorTestPassRate(client, url, 60000)
```

3. **失败后立即运行**
```typescript
async function testOnFailure(
  client: ADTClient,
  url: string,
  runFn: () => Promise<void>
): Promise<boolean> {
  // 运行功能
  await runFn()

  // 激活对象
  const structure = await client.objectStructure(url)
  await client.activate(structure.metaData["adtcore:name"], url)

  // 运行测试
  const results = await client.unitTestRun(url)
  const failed = results.reduce((sum, cls) =>
    sum + cls.testmethods.filter(m =>
      m.alerts.some(a => a.kind !== "warning")
    ).length, 0
  )

  return failed === 0
}

// 使用
const success = await testOnFailure(client, url, async () => {
  // 运行代码变更
})
```
