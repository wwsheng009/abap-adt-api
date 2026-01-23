# 重构操作

本文档介绍如何使用 abap-adt-api 执行 ABAP 代码重构操作。

## 概述

重构功能包括：

- 重命名标识符
- 提取方法
- 更改包
- 重构预览和执行

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
  source,
  2,
  8,    // lv_o|ld_name 的起始位置
  16    // lv_old_na|me 的结束位置
)

console.log("重命名评估:")
console.log(\`  需重命名: \${proposal.message}\`)
console.log(\`  重命名次数: \${proposal.occurrences}\`)
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

refactoring.affectedObjects.forEach(obj => {
  console.log(\`  - \${obj.name} (\${obj.type})\`)
  console.log(\`    URI: \${obj.uri}\`)
  console.log(\`    修改: \${obj.changes.length}\`)

  obj.changes.forEach(change => {
    console.log(\`      行 \${change.line}: \${change.oldText} → \${change.newText}\`)
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
  source: string,
  line: number,
  startCol: number,
  endCol: number,
  newName: string
) {
  // 1. 评估
  console.log("1. 评估重命名...")
  const proposal = await client.renameEvaluate(
    objectUrl,
    source,
    line,
    startCol,
    endCol
  )

  if (proposal.occurrences === 0) {
    console.log("没有找到需要重命名的内容")
    return
  }

  console.log(\`  找到 \${proposal.occurrences} 处需要重命名\`)

  // 2. 预览
  console.log("\n2. 预览更改...")
  proposal.newName = newName

  const refactoring = await client.renamePreview(proposal)

  console.log(\`  影响对象: \${refactoring.affectedObjects.length}\`)

  // 3. 执行
  console.log("\n3. 执行重命名...")
  try {
    const result = await client.renameExecute(refactoring)

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
  source,
  2,
  8,
  16,
  "lv_new_variable"
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
  lineStart: number
  columnStart: number
  lineEnd: number
  columnEnd: number
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
    lineStart: 3,
    columnStart: 3,
    lineEnd: 6,
    columnEnd: 26
  }
)

console.log("提取方法评估:")
console.log(\`  建议方法名: \${proposal.suggestedMethodName}\`)
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
proposal.methodName = "calculate_sum"
proposal.returnType = "i"

const preview = await client.extractMethodPreview(proposal)

console.log("提取方法预览:")
preview.affectedObjects.forEach(obj => {
  console.log(\`  对象: \${obj.name}\`)

  obj.changes.forEach(change => {
    console.log(\`    行 \${change.line}: \${change.type}\`)
    console.log(\`      \${change.oldText}\`)
    console.log(\`      →\`)
    console.log(\`      \${change.newText}\`)
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
async function extractMethod(
  client: ADTClient,
  objectUrl: string,
  range: Range,
  methodName: string,
  returnType: string = "void"
) {
  // 1. 评估
  console.log("1. 评估提取方法...")
  const proposal = await client.extractMethodEvaluate(objectUrl, range)

  if (!proposal.canExtract) {
    console.log("无法提取方法:", proposal.message)
    return
  }

  console.log(\`  可以提取方法: \${proposal.suggestedMethodName}\`)

  // 2. 设置参数
  console.log("\n2. 配置方法...")
  proposal.methodName = methodName
  proposal.returnType = returnType

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
    lineStart: 3,
    columnStart: 3,
    lineEnd: 6,
    columnEnd: 26
  },
  "calculate_sum",
  "i"
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
    source: string,
    line: number,
    startCol: number,
    endCol: number,
    newName: string,
    options?: {
      runTests?: boolean
      confirm?: boolean
    }
  ) {
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
      source,
      line,
      startCol,
      endCol
    )

    console.log(\`  找到 \${proposal.occurrences} 处需要重命名\`)

    proposal.newName = newName

    const preview = await this.client.renamePreview(proposal)

    if (options.confirm) {
      console.log("\n3. 重命名预览:")
      preview.affectedObjects.forEach(obj => {
        console.log(\`  \${obj.name}: \${obj.changes.length} 处修改\`)
        obj.changes.slice(0, 3).forEach(c => {
          console.log(\`    行 \${c.line}: ...\`)
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
  sourceCode,
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
