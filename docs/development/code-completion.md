# 代码补全与导航

本文档介绍如何使用 abap-adt-api 进行代码补全、查找定义和引用等导航功能。

## 概述

代码补全和导航功能帮助开发者：

- 获取智能代码补全建议
- 快速跳转到定义
- 查找使用位置
- 获取元素信息
- 格式化代码

## 代码补全

### codeCompletion

获取指定位置的代码补全建议。

```typescript
const proposals = await client.codeCompletion(
  sourceUrl: string,
  source: string,
  line: number,
  column: number
): Promise<CompletionProposal[]>
```

**CompletionProposal 结构:**

```typescript
interface CompletionProposal {
  KIND: number           // 建议类型
  IDENTIFIER: string     // 标识符文本
  ICON: number           // 图标
  SUBICON: number        // 子图标
  BOLD: number           // 是否粗体
  COLOR: number          // 颜色
  QUICKINFO_EVENT: number
  INSERT_EVENT: number
  IS_META: number
  PREFIXLENGTH: number   // 匹配前缀长度
  ROLE: number
  LOCATION: number
  GRADE: number
  VISIBILITY: number
  IS_INHERITED: number
  PROP1: number
  PROP2: number
  PROP3: number
  SYNTCNTXT: number
}
```

**示例:**

```typescript
const source = `
DATA lv_value TYPE i.
lv_v`

const proposals = await client.codeCompletion(
  "/sap/bc/adt/programs/programs/zprog/source/main",
  source,
  3,
  5  // lv_v| 的位置
)

console.log(`找到 ${proposals.length} 个补全建议:`)
proposals.forEach(p => {
  console.log(`- ${p.IDENTIFIER} (匹配: ${p.PREFIXLENGTH} 字符)`)
})
```

### codeCompletionFull

获取完整的代码补全内容。

```typescript
const content = await client.codeCompletionFull(
  sourceUrl: string,
  source: string,
  line: number,
  column: number,
  patternKey: string
): Promise<string>
```

**示例:**

```typescript
const proposals = await client.codeCompletion(
  url,
  source,
  line,
  column
)

if (proposals.length > 0) {
  const selected = proposals[0]
  const fullContent = await client.codeCompletionFull(
    url,
    source,
    line,
    column,
    selected.IDENTIFIER
  )

  console.log("完整内容:", fullContent)
}
```

### codeCompletionElement

获取补全元素的详细信息。

```typescript
const info = await client.codeCompletionElement(
  sourceUrl: string,
  source: string,
  line: number,
  column: number
): Promise<CompletionElementInfo | string>
```

**CompletionElementInfo 结构:**

```typescript
interface CompletionElementInfo {
  name: string                    // 元素名称
  type: string                    // 元素类型
  href: string                    // 文档链接
  doc: string                     // 文档内容
  components: {                   // 组件信息
    "adtcore:type": string
    "adtcore:name": string
    entries: { key: string; value: string }[]
  }[]
}
```

**示例:**

```typescript
const info = await client.codeCompletionElement(
  "/sap/bc/adt/oo/classes/zclass/source/main",
  source,
  10,
  8
)

if (typeof info === "object") {
  console.log(`元素: ${info.name}`)
  console.log(`类型: ${info.type}`)
  console.log(`文档: ${info.doc}`)

  info.components.forEach(c => {
    console.log(`  组件 ${c.name} (${c.type}):`)
    c.entries.forEach(e => {
      console.log(`    ${e.key}: ${e.value}`)
    })
  })
}
```

## 查找定义

### findDefinition

查找标识符定义的位置。

```typescript
const location = await client.findDefinition(
  url: string,
  source: string,
  line: number,
  firstof: number,
  lastof: number,
  implementation: boolean,
  mainProgram?: string
): Promise<DefinitionLocation>
```

**DefinitionLocation 结构:**

```typescript
interface DefinitionLocation {
  url: string      // 定义所在的 URL
  line: number     // 行号
  column: number   // 列号
}
```

**示例 - 查找方法定义:**

```typescript
const source = `
  get_data( )-> VALUE:|).
`

// 跳转到定义
const definition = await client.findDefinition(
  "/sap/bc/adt/oo/classes/zcaller/source/main",
  source,
  2,
  12,  // get_data 的开始位置
  19   // get_data 的结束位置
)

console.log(`定义位于: ${definition.url}`)
console.log(`行: ${definition.line}, 列: ${definition.column}`)
```

**查找实现:**

```typescript
// 查找接口方法的实现
const impl = await client.findDefinition(
  url,
  source,
  line,
  startCol,
  endCol,
  true  // 查找实现而不是定义
)
```

## 查找使用引用

### usageReferences

查找对象的使用位置。

```typescript
const references = await client.usageReferences(
  url: string,
  line?: number,
  column?: number
): Promise<UsageReference[]>
```

**UsageReference 结构:**

```typescript
interface UsageReference {
  uri: string                         // 使用位置 URI
  objectIdentifier: string            // 对象标识符
  parentUri: string                   // 父对象 URI
  isResult: boolean                   // 是否是结果
  canHaveChildren: boolean            // 是否可以包含子结果
  usageInformation: string             // 使用信息
  "adtcore:responsible": string        // 负责人
  "adtcore:name": string              // 名称
  "adtcore:type"?: string             // 类型
  "adtcore:description"?: string      // 描述
  packageRef: {
    "adtcore:uri": string
    "adtcore:name": string
  }
}
```

**示例:**

```typescript
// 查找类的所有使用位置
const references = await client.usageReferences(
  "/sap/bc/adt/oo/classes/zmy_class"
)

console.log(`找到 ${references.length} 个使用位置:`)

references.forEach(ref => {
  console.log(`\n使用:`)
  console.log(`  对象: ${ref["adtcore:name"]}`)
  console.log(`  类型: ${ref["adtcore:type"]}`)
  console.log(`  URI: ${ref.uri}`)

  if (ref.usageInformation) {
    // 解析行号信息
    const match = ref.uri.match(/#start=(\d+),(\d+)/)
    if (match) {
      console.log(`  位置: 行 ${match[1]}, 列 ${match[2]}`)
    }
  }
})
```

**查找特定位置的使用:**

```typescript
// 查找光标位置的标识符使用
const cursorRefs = await client.usageReferences(
  url,
  42,  // 行号
  10   // 列号
)
```

### usageReferenceSnippets

获取使用引用的代码片段。

```typescript
const snippets = await client.usageReferenceSnippets(
  references: UsageReference[]
): Promise<UsageReferenceSnippet[]>
```

**UsageReferenceSnippet 结构:**

```typescript
interface UsageReferenceSnippet {
  objectIdentifier: string
  snippets: {
    uri: ReferenceUri
    matches: string
    content: string
    description: string
  }[]
}
```

**示例:**

```typescript
// 先获取引用列表
const references = await client.usageReferences(url)

// 然后获取代码片段
const snippets = await client.usageReferenceSnippets(references)

snippets.forEach(s => {
  console.log(`\n对象: ${s.objectIdentifier}`)
  s.snippets.forEach(snippet => {
    console.log(`片段:`)
    console.log(`  匹配: ${snippet.matches}`)
    console.log(`  描述: ${snippet.description}`)
    console.log(`  内容:\n${snippet.content}`)
  })
})
```

## 类型层次结构

### typeHierarchy

获取类的类型层次结构（继承关系）。

```typescript
const hierarchy = await client.typeHierarchy(
  url: string,
  body: string,
  line: number,
  offset: number,
  superTypes = false
): Promise<HierarchyNode[]>
```

**HierarchyNode 结构:**

```typescript
interface HierarchyNode {
  hasDefOrImpl: boolean
  uri: string
  line: number
  character: number
  type: string
  name: string
  parentUri: string
  description: string
}
```

**示例 - 查找子类:**

```typescript
const subTypes = await client.typeHierarchy(
  "/sap/bc/adt/oo/classes/zcl_base",
  source,
  10,
  5,
  false  // 查找子类
)

console.log("子类:")
subTypes.forEach(node => {
  console.log(`  ${node.name} (${node.type})`)
  console.log(`    位于: ${node.uri}`)
  console.log(`    行 ${node.line}`)

  if (node.hasDefOrImpl) {
    console.log(`    有定义或实现`)
  }
})
```

**示例 - 查找父类:**

```typescript
const superTypes = await client.typeHierarchy(
  "/sap/bc/adt/oo/classes/zcl_child",
  source,
  10,
  5,
  true  // 查找父类
)

console.log("父类:")
superTypes.forEach(node => {
  console.log(`  ${node.name}`)
  console.log(`    路径: ${node.uri}`)
})
```

## 类组件

### classComponents

获取类的完整组件结构（方法、属性、事件等）。

```typescript
const components = await client.classComponents(url: string): Promise<ClassComponent>
```

**ClassComponent 结构:**

```typescript
interface ClassComponent {
  "adtcore:name": string
  "adtcore:type": string
  links: Link[]
  visibility: string
  "xml:base": string
  components: ClassComponent[]
  constant?: boolean
  level?: string
  readOnly?: boolean
}
```

**示例:**

```typescript
const components = await client.classComponents(
  "/sap/bc/adt/oo/classes/zcl_myclass"
)

function printComponent(comp: ClassComponent, indent = 0) {
  const prefix = "  ".repeat(indent)
  const icon = comp.visibility === "public" ? "🔓" :
              comp.visibility === "private" ? "🔒" :
              comp.visibility === "protected" ? "🔐" : "⚪"

  console.log(`${prefix}${icon} ${comp["adtcore:name"]} (${comp["adtcore:type"]})`)

  // 递归打印子组件
  comp.components.forEach(c => printComponent(c, indent + 1))
}

console.log("类结构:")
printComponent(components)
```

## 片段映射

### fragmentMappings

查找片段（如 CDS 字段）的实际位置。

```typescript
const location = await client.fragmentMappings(
  url: string,
  type: string,
  name: string
): Promise<FragmentLocation>
```

**FragmentLocation 结构:**

```typescript
interface FragmentLocation {
  uri: string
  line: number
  column: number
}
```

**示例:**

```typescript
// 查找 CDS 视图中字段的位置
const location = await client.fragmentMappings(
  "/sap/bc/adt/ddic/ddlx/sources/z_my_view",
  "element",  // 类型
  "FIELD_NAME" // 名称
)

console.log(`字段位置: 行 ${location.line}, 列 ${location.column}`)
console.log(`URI: ${location.uri}`)
```

## 代码格式化

### prettyPrinterSetting

获取当前格式化设置。

```typescript
const settings = await client.prettyPrinterSetting(): Promise<PrettyPrinterSettings>
```

**PrettyPrinterSettings 结构:**

```typescript
interface PrettyPrinterSettings {
  "abapformatter:indentation": boolean
  "abapformatter:style": PrettyPrinterStyle
}

type PrettyPrinterStyle =
  | "toLower"       // 全小写
  | "toUpper"       // 全大写
  | "keywordUpper"  // 关键字大写
  | "keywordLower"  // 关键字小写
  | "keywordAuto"   // 关键字自动
  | "none"          // 不修改大小写
```

**示例:**

```typescript
const settings = await client.prettyPrinterSetting()

console.log("缩进:", settings["abapformatter:indentation"])
console.log("样式:", settings["abapformatter:style"])
```

### setPrettyPrinterSetting

设置格式化选项。

```typescript
await client.setPrettyPrinterSetting(
  indent: boolean,
  style: PrettyPrinterStyle
): Promise<string>
```

**示例:**

```typescript
// 设置为关键字大写，并启用缩进
await client.setPrettyPrinterSetting(true, "keywordUpper")

console.log("格式化设置已更新")
```

###

### prettyPrinter

格式化 ABAP 代码。

```typescript
const formatted = await client.prettyPrinter(source: string): Promise<string>
```

**示例:**

```typescript
const uglyCode = `
DATA:lv_value TYPE i.
DATA:lv_text TYPE string.
lv_value=10.
write:lv_value.`

const formatted = await client.prettyPrinter(uglyCode)
console.log("格式化后的代码:")
console.log(formatted)
```

## 完整示例：智能代码助手

```typescript
import { ADTClient } from "abap-adt-api"

class ABAPCodeAssistant {
  constructor(private client: ADTClient) {}

  async getCodeSuggestions(
    url: string,
    source: string,
    line: number,
    column: number
  ) {
    const suggestions = {
      completions: [] as any[],
      definition: null,
      references: [] as any[]
    }

    // 1. 获取代码补全
    const proposals = await this.client.codeCompletion(url, source, line, column)
    suggestions.completions = proposals.map(p => ({
      label: p.IDENTIFIER,
      insertText: p.IDENTIFIER,
      detail: `匹配长度: ${p.PREFIXLENGTH}`
    }))

    // 2. 尝试查找定义（选中当前词）
    const word = this.getWordAtPosition(source, line, column)
    if (word) {
      try {
        const definition = await this.client.findDefinition(
          url,
          source,
          line,
          word.start,
          word.end,
          false  // implementation: false
        )
        suggestions.definition = {
          url: definition.url,
          line: definition.line,
          column: definition.column
        }
      } catch (e) {
        // 可能找不到定义
      }
    }

    // 3. 查找使用引用
    try {
      const refs = await this.client.usageReferences(url, line, column)
      suggestions.references = refs.map(r => ({
        uri: r.uri,
        name: r["adtcore:name"],
        type: r["adtcore:type"]
      }))
    } catch (e) {
      // 可能没有引用
    }

    return suggestions
  }

  private getWordAtPosition(source: string, line: number, column: number) {
    const lines = source.split("\n")
    const lineText = lines[line - 1] || ""

    const before = lineText.substring(0, column - 1)
    const after = lineText.substring(column - 1)

    const startMatch = before.match(/[a-zA-Z0-9_][a-zA-Z0-9_]*$/)
    const endMatch = after.match(/^[a-zA-Z0-9_]*/)

    if (!startMatch || !endMatch) {
      return null
    }

    return {
      word: startMatch[0] + endMatch[0],
      start: column - startMatch[0].length,
      end: column + endMatch[0].length
    }
  }
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const assistant = new ABAPCodeAssistant(client)

const url = "/sap/bc/adt/oo/classes/zclass/source/main"
const source = `
CLASS zclass DEFINITION PUBLIC.

  METHODS get_data RETURNING VALUE(rv_data) TYPE string.

ENDCLASS.
`

const suggestions = await assistant.getCodeSuggestions(
  url,
  source,
  4,
  15  // get_data 位置
)

console.log("代码建议:")
console.log(JSON.stringify(suggestions, null, 2))
```

## 性能优化建议

1. **批量获取补全建议**，不要频繁调用
2. **缓存使用引用结果**，避免重复查询
3. **使用代码元素信息**而不是多次查找定义
4. **限制返回的结果数量**，提高响应速度
