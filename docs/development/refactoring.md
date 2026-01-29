# 重构操作

本文档介绍如何使用 abap-adt-api 执行 ABAP 代码重构操作。

## 概述

重构功能包括：

- 重命名标识符
- 提取方法
- 更改包
- 重构预览和执行

## 快速修复

在执行复杂重构前，可以先使用快速修复功能解决代码问题。

### fixProposals

获取代码问题的快速修复建议。

```typescript
const proposals = await client.fixProposals(
  uri: string,
  body: string,
  line: number,
  column: number
): Promise<FixProposal[]>
```

**FixProposal 结构:**

```typescript
interface FixProposal {
  "adtcore:uri": string
  "adtcore:type": string
  "adtcore:name": string
  "adtcore:description": string
  uri: string
  line: string
  column: string
  userContent: string
}
```

**示例:**

```typescript
const proposals = await client.fixProposals(
  "/sap/bc/adt/oo/classes/zclass/source/main",
  sourceCode,
  10,
  15
)

if (proposals.length > 0) {
  console.log("找到修复建议:")
  proposals.forEach(p => {
    console.log(`  - ${p["adtcore:description"]}`)
  })
}
```

### fixEdits

应用快速修复。

```typescript
const deltas = await client.fixEdits(
  proposal: FixProposal,
  source: string
): Promise<Delta[]>
```

**Delta 结构:**

```typescript
interface Delta {
  uri: string
  range: Range
  name: string
  type: string
  content: string
}
```

**示例:**

```typescript
if (proposals.length > 0) {
  const deltas = await client.fixEdits(proposals[0], sourceCode)
  
  deltas.forEach(delta => {
    console.log(`修改 ${delta.uri}:`)
    console.log(`  位置: ${delta.range.start.line},${delta.range.start.column}`)
    console.log(`  内容: ${delta.content}`)
  })
}
```

## 重命名标识符

重命名的完整流程包括：评估、预览和执行。

### 1. 重命名评估

\`\`\`typescript
const proposal = await client.renameEvaluate(
  uri: string,
  line: number,
  startColumn: number,
  endColumn: number
): Promise<RenameRefactoringProposal>
\`\`\`

**示例:**

\`\`\`typescript
const source = \`
  DATA: lv_old_name TYPE i VALUE 10.
  WRITE: lv_old_name.
\`

// 选中 lv_old_name 执行重命名评估
const proposal = await client.renameEvaluate(
  "/sap/bc/adt/programs/programs/zprog/source/main",
  2,
  8,    // lv_o|ld_name 的起始位置
  16    // lv_old_na|me 的结束位置
)

console.log("重命名评估:")
console.log(\`  旧名称: \${proposal.oldName}\`)
console.log(\`  新名称: \${proposal.newName}\`)
console.log(\`  影响对象数: \${proposal.affectedObjects.length}\`)
\`\`\`

### 2. 重命名预览

\`\`\`typescript
const refactoring = await client.renamePreview(
  renameRefactoring: RenameRefactoringProposal,
  transport = ""
): Promise<RenameRefactoring>
\`\`\`

**示例:**

\`\`\`typescript
// 设置新名称并预览
proposal.newName = "lv_new_value"

const refactoring = await client.renamePreview(
  proposal,
  ""  // 传输号（如果是新对象则为空）
)

console.log("重命名预览:")
console.log(\`  影响的对象: \${refactoring.affectedObjects.length}\`)

// 遍历受影响对象
refactoring.affectedObjects.forEach(obj => {
  console.log(\`  - \${obj.name} (\${obj.type})\`)
  console.log(\`    URI: \${obj.uri}\`)
  console.log(\`    修改: \${obj.textReplaceDeltas.length}\`)

  obj.textReplaceDeltas.forEach(delta => {
    const { start, end } = delta.rangeFragment
    console.log(\`      行 \${start.line}-\${end.line}: \${delta.contentOld} → \${delta.contentNew}\`)
  })
})
\`\`\`

### 3. 重命名执行

\`\`\`typescript
const result = await client.renameExecute(
  refactoring: RenameRefactoring
): Promise<RenameRefactoring>
\`\`\`

**示例:**

\`\`\`typescript
async function safeRename(
  client: ADTClient,
  objectUrl: string,
  line: number,
  startCol: number,
  endCol: number,
  newName: string,
  transport: string = ""
) {
  // 1. 评估
  console.log("1. 评估重命名...")
  const proposal = await client.renameEvaluate(
    objectUrl,
    line,
    startCol,
    endCol
  )

  if (!proposal.oldName) {
    console.log("没有找到需要重命名的内容")
    return
  }

  console.log(\`  当前名称: \${proposal.oldName}\\n  新名称: \${newName}\`)

  // 2. 预览
  console.log("\n2. 预览更改...")
  proposal.newName = newName

  const preview = await client.renamePreview(proposal, transport)

  console.log(\`  影响对象: \${preview.affectedObjects.length}\`)

  // 显示预览详情
  preview.affectedObjects.forEach(obj => {
    console.log(\`  对象: \${obj.name}\`)
    console.log(\`    修改数: \${obj.textReplaceDeltas.length}\`)
  })

  // 3. 执行
  console.log("\n3. 执行重命名...")
  try {
    const result = await client.renameExecute(preview)

    console.log("重命名成功!")

    // 激活受影响的对象
    for (const obj of result.affectedObjects) {
      try {
        await client.activate(obj.name, obj.uri)
        console.log(\`  已激活: \${obj.name}\`)
      } catch (e) {
        console.warn(\`  激活失败: \${obj.name}\`)
      }
    }

  } catch (error) {
    console.error("重命名失败:", error)
    throw error
  }
}

// 使用
await safeRename(
  client,
  "/sap/bc/adt/programs/programs/zprog/source/main",
  2,
  8,
  16,
  "lv_new_variable",
  ""
)
\`\`\`

## 提取方法

提取方法的完整流程：评估、预览和执行。

### 1. 提取方法评估

\`\`\`typescript
const proposal = await client.extractMethodEvaluate(
  uri: string,
  range: Range
): Promise<ExtractMethodProposal>
\`\`\`

**Range 结构:**

\`\`\`typescript
interface Range {
  start: { line: number, column: number }
  end: { line: number, column: number }
}
\`\`\`

**示例:**

\`\`\`typescript
const source = \`
METHOD calculate.
  DATA: lv_sum TYPE i.
  DATA: lv_count TYPE i.

  lv_sum = 10 + 20.
  lv_count = 2.

  rv_result = lv_sum / lv_count.
ENDMETHOD.
\`

// 选中要提取的代码（第 3-6 行）
const proposal = await client.extractMethodEvaluate(
  "/sap/bc/adt/oo/classes/zclass/source/main",
  {
    start: { line: 3, column: 3 },
    end: { line: 6, column: 26 }
  }
)

console.log("提取方法评估:")
console.log(\`  建议方法名: \${proposal.name}\`)
console.log(\`  参数数量: \${proposal.parameters.length}\`)

proposal.parameters.forEach(p => {
  console.log(\`    - \${p.name} (\${p.type}): \${p.mode}\`)
})
\`\`\`

### 2. 提取方法预览

\`\`\`typescript
const refactoring = await client.extractMethodPreview(
  proposal: ExtractMethodProposal
): Promise<GenericRefactoring>
\`\`\`

**示例:**

\`\`\`typescript
// 设置方法参数
proposal.name = "calculate_sum"

const preview = await client.extractMethodPreview(proposal)

console.log("提取方法预览:")
preview.affectedObjects.forEach(obj => {
  console.log(\`  对象: \${obj.name}\`)

  obj.textReplaceDeltas.forEach(delta => {
    const { start, end } = delta.rangeFragment
    console.log(\`    行 \${start.line}: 替换文本\`)
    console.log(\`      \${delta.contentOld}\`)
    console.log(\`      →\`)
    console.log(\`      \${delta.contentNew}\`)
  })
})
\`\`\`

### 3. 提取方法执行

\`\`\`typescript
const result = await client.extractMethodExecute(
  refactoring: GenericRefactoring
): Promise<void>
\`\`\`

**示例:**

\`\`\`typescript
/**
 * 提取方法
 * @param client ADT 客户端
 * @param objectUrl 对象 URI
 * @param range 选中的代码范围
 * @param methodName 方法名称
 */
async function extractMethod(
  client: ADTClient,
  objectUrl: string,
  range: Range,
  methodName: string
) {
  // 1. 评估
  console.log("1. 评估提取方法...")
  const proposal = await client.extractMethodEvaluate(objectUrl, range)

  if (!proposal.name) {
    console.log("无法提取方法")
    return
  }

  console.log(\`  可以提取方法: \${proposal.name}\`)

  // 2. 设置参数
  console.log("\n2. 配置方法...")
  proposal.name = methodName

  // 设置方法参数
  if (proposal.parameters.length > 0) {
    console.log("  参数:")
    proposal.parameters.forEach(p => {
      console.log(\`    \${p.name}: \${p.type}\`)
    })
  }

  // 3. 预览
  console.log("\n3. 预览更改...")
  const preview = await client.extractMethodPreview(proposal)

  console.log(\`  影响对象: \${preview.affectedObjects.length}\`)

  // 4. 执行
  console.log("\n4. 提取方法...")
  try {
    await client.extractMethodExecute(preview)

    console.log("方法提取成功!")

    // 激活对象
    await client.activate(
      preview.affectedObjects[0].name,
      preview.affectedObjects[0].uri
    )

    console.log("对象已激活")

  } catch (error) {
    console.error("提取方法失败:", error)
    throw error
  }
}

// 使用
await extractMethod(
  client,
  "/sap/bc/adt/oo/classes/zclass/source/main",
  {
    start: { line: 3, column: 3 },
    end: { line: 6, column: 26 }
  },
  "calculate_sum"
)
\`\`\`

## 更改包

将对象从一个包移动到另一个包。

### 更改包评估

\`\`\`typescript
const refactoring = await client.changePackagePreview(
  changePackageRefactoring: ChangePackageRefactoring,
  transport = ""
): Promise<ChangePackageRefactoring>
\`\`\`

### 更改包执行

\`\`\`typescript
const result = await client.changePackageExecute(
  refactoring: ChangePackageRefactoring
): Promise<ChangePackageRefactoring>
\`\`\`

**示例:**

\`\`\`typescript
async function changeObjectPackage(
  client: ADTClient,
  objectUrl: string,
  newPackage: string,
  transport = ""
) {
  // 1. 获取对象结构
  const structure = await client.objectStructure(objectUrl)

  // 2. 准备重配置
  const refactoring = {
    objectUri: objectUrl,
    newPackage,
    operation: "move"
  }

  // 3. 预览更改
  console.log("预览包更改...")
  const preview = await client.changePackagePreview(
    refactoring,
    transport
  )

  console.log(\`  影响对象: \${preview.affectedObjects.length}\`)

  // 4. 执行
  console.log("执行包更改...")
  try {
    const result = await client.changePackageExecute(refactoring)

    console.log("包更改成功!")

    // 激活所有受影响的对象
    for (const obj of result.affectedObjects) {
      await client.activate(obj.name, obj.uri)
      console.log(\`  已激活: \${obj.name}\`)
    }

  } catch (error) {
    console.error("包更改失败:", error)
    throw error
  }
}

// 使用
await changeObjectPackage(
  client,
  "/sap/bc/adt/oo/classes/zold_class",
  "ZNEW_PACKAGE",
  "D01K900123"
)
\`\`\`

## 重构最佳实践

### 1. 始终预览更改

\`\`\`typescript
async function safeRefactoring(
  evaluateFn: () => Promise<any>,
  previewFn: (proposal: any) => Promise<any>,
  executeFn: (refactoring: any) => Promise<any>,
  confirm: boolean = true
) {
  // 1. 评估
  const proposal = await evaluateFn()

  // 2. 预览
  const preview = await previewFn(proposal)

  // 3. 确认
  if (confirm) {
    console.log("预览更改:")
    preview.affectedObjects.forEach(obj => {
      console.log(\`  \${obj.name}: \${obj.changes.length} 处修改\`)
    })

    const shouldProceed = await askUser("继续执行吗? (y/n)")
    if (!shouldProceed) {
      console.log("取消重构")
      return
    }
  }

  // 4. 执行
  return await executeFn(preview)
}

// 使用重命名时
await safeRefactoring(
  () => client.renameEvaluate(...),
  (p) => client.renamePreview({ ...p, newName: "new_name" }),
  (r) => client.renameExecute(r)
)
\`\`\`

### 2. 错误处理和回滚

\`\`\`typescript
async function refactoringWithRollback(
  client: ADTClient,
  refactoringFn: () => Promise<any>
) {
  // 保存原始状态（如果可能）
  const originalState = await saveOriginalState()

  try {
    // 执行重构
    const result = await refactoringFn()

    console.log("重构成功")

    return result

  } catch (error) {
    console.error("重构失败:", error)

    // 尝试回滚
    try {
      console.log("尝试回滚...")
      await rollbackToState(originalState)
      console.log("已回滚到原始状态")

    } catch (rollbackError) {
      console.error("回滚失败，需要手动修复:", rollbackError)
    }

    throw error
  }
}
\`\`\`

### 3. 批量重构

\`\`\`typescript
async function batchRename(
  client: ADTClient,
  items: Array<{
    objectUrl: string
    source: string
    line: number
    startCol: number
    endCol: number
    newName: string
  }>
) {
  const results = []

  for (const item of items) {
    console.log(\`\n处理: \${item.objectUrl}\`)

    try {
      // 评估
      const proposal = await client.renameEvaluate(
        item.objectUrl,
        item.source,
        item.line,
        item.startCol,
        item.endCol
      )

      proposal.newName = item.newName

      // 预览
      const preview = await client.renamePreview(proposal)

      // 执行
      const result = await client.renameExecute(preview)

      // 激活
      for (const obj of result.affectedObjects) {
        await client.activate(obj.name, obj.uri)
      }

      results.push({
        objectUrl: item.objectUrl,
        success: true,
        message: \`重命名为 \${item.newName}\`
      })

    } catch (error) {
      results.push({
        objectUrl: item.objectUrl,
        success: false,
        message: error.message
      })
    }
  }

  // 生成报告
  const successCount = results.filter(r => r.success).length
  console.log(\`\n完成: \${successCount}/\${results.length} 成功\`)

  return results
}
\`\`\`

### 4. 重构前后测试

\`\`\`typescript
async function refactoringWithTests(
  client: ADTClient,
  objectUrl: string,
  source: string,
  refactoringFn: () => Promise<void>
) {
  // 1. 重构前测试
  console.log("1. 重构前测试...")
  const beforeTests = await client.unitTestRun(objectUrl)
  const beforeFailed = countFailedTests(beforeTests)

  if (beforeFailed > 0) {
    console.warn(\`重构前有 \${beforeFailed} 个测试失败\`)
  }

  // 2. 执行重构
  console.log("\n2. 执行重构...")
  await refactoringFn()

  // 3. 等待激活
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 4. 重构后测试
  console.log("\n3. 重构后测试...")
  const afterTests = await client.unitTestRun(objectUrl)
  const afterFailed = countFailedTests(afterTests)

  console.log(\`测试结果: 重构前 \${beforeFailed} 个失败, 重构后 \${afterFailed} 个失败\`)

  if (afterFailed > beforeFailed) {
    console.warn("警告: 重构后测试失败数量增加了!")
  } else if (afterFailed < beforeFailed) {
    console.log("好消息: 测试失败数量减少了!")
  }

  return {
    beforeFailed,
    afterFailed,
    testsPassed: afterFailed <= beforeFailed
  }
}

function countFailedTests(results: UnitTestClass[]): number {
  return results.reduce((sum, cls) =>
    sum + cls.testmethods.filter(m =>
      m.alerts.some(a => a.kind !== "warning")
    ).length, 0
  )
}
\`\`\`

## 完整示例：智能重构助手

\`\`\`typescript
import { ADTClient } from "abap-adt-api"

class RefactoringAssistant {
  constructor(private client: ADTClient) {}

  async smartRename(
    objectUrl: string,
    line: number,
    startCol: number,
    endCol: number,
    newName: string,
    options?: {
      runTests?: boolean
      confirm?: boolean
      transport?: string
    }
  ) {
    const transport = options?.transport || ""
    options = {
      runTests: true,
      confirm: true,
      ...options
    }

    console.log(\`=== 智能重命名: \${newName} ===\n\`)

    // 1. 检查测试
    let beforeFailed = 0
    let afterFailed = 0

    if (options.runTests) {
      console.log("1. 运行重构前测试...")
      beforeFailed = await this.runTests(objectUrl)
    }

    // 2. 重命名流程
    console.log("\n2. 重命名流程...")

    const proposal = await this.client.renameEvaluate(
      objectUrl,
      line,
      startCol,
      endCol
    )

    console.log(\`  找到 \${proposal.affectedObjects.length} 个受影响对象\`)

    proposal.newName = newName

    const preview = await this.client.renamePreview(proposal, transport)

    if (options.confirm) {
      console.log("\n3. 重命名预览:")
      preview.affectedObjects.forEach(obj => {
        console.log(\`  \${obj.name}: \${obj.textReplaceDeltas.length} 处修改\`)
        obj.textReplaceDeltas.slice(0, 3).forEach(d => {
          console.log(\`    行 \${d.rangeFragment.start.line}: ...\`)
        })
      })

      const confirmed = await this.confirmAction()
      if (!confirmed) {
        console.log("取消重命名")
        return { cancelled: true }
      }
    }

    console.log("\n4. 执行重命名...")
    const result = await this.client.renameExecute(preview)

    // 5. 激活对象
    console.log("\n5. 激活对象...")
    for (const obj of result.affectedObjects) {
      await this.client.activate(obj.name, obj.uri)
      console.log(\`  已激活: \${obj.name}\`)
    }

    // 6. 运行测试
    if (options.runTests) {
      console.log("\n6. 运行重构后测试...")
      afterFailed = await this.runTests(objectUrl)

      console.log(\`\n测试结果:\`)
      console.log(\`  重构前: \${beforeFailed} 个失败\`)
      console.log(\`  重构后: \${afterFailed} 个失败\`)

      const delta = afterFailed - beforeFailed
      if (delta > 0) {
        console.warn(\`  ⚠️  测试失败增加 \${delta} 个\`)
      } else if (delta < 0) {
        console.log(\`  ✓ 测试失败减少 \${Math.abs(delta)} 个\`)
      } else {
        console.log(\`  ✓ 测试结果保持稳定\`)
      }
    }

    console.log("\n重命名完成 ✓")

    return {
      success: true,
      cancelled: false,
      beforeFailed,
      afterFailed,
      affectedObjects: result.affectedObjects.length
    }
  }

  private async runTests(objectUrl: string): Promise<number> {
    const results = await this.client.unitTestRun(objectUrl)
    return results.reduce((sum, cls) =>
      sum + cls.testmethods.filter(m =>
        m.alerts.some(a => a.kind !== "warning")
      ).length, 0
    )
  }

  private async confirmAction(): Promise<boolean> {
    // 在实际应用中，可能通过 UI 或 CLI 提示用户
    // 这里总是返回 true
    return true
  }
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const assistant = new RefactoringAssistant(client)

await assistant.smartRename(
  "/sap/bc/adt/oo/classes/zclass/source/main",
  10,
  8,
  20,
  "lv_calculated_value",
  {
    runTests: true,
    confirm: true
  }
)
\`\`\`
