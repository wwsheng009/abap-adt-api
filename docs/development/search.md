# 搜索

本文档介绍如何使用 abap-adt-api 搜索 ABAP 对象。

## 概述

搜索功能包括：

- 按名称和类型搜索对象
- 查找对象路径
- 获取 ABAP 文档
- 包值帮助

## 基本搜索

### searchObject

按名称模式搜索对象。

```typescript
const results = await client.searchObject(
  query: string,
  objType?: string,
  maxResults: number = 100
): Promise<SearchResult[]>
```

**SearchResult 结构:**

```typescript
interface SearchResult {
  "adtcore:description"?: string    // 描述
  "adtcore:name": string            // 名称
  "adtcore:packageName"?: string    // 包名
  "adtcore:type": string            // 类型
  "adtcore:uri": string             // URI
}
```

**参数说明:**

- `query` - 搜索字符串（区分大小写，在旧系统中）
- `objType` - 对象类型，只使用第一部分（如 "PROG/P" 用 "PROG"）
- `maxResults` - 最大结果数，默认 100

**示例:**

```typescript
// 搜索所有以 Z 开头的程序
const programs = await client.searchObject("Z*", "PROG", 50)

console.log(`找到 ${programs.length} 个程序:`)
programs.forEach(prog => {
  console.log(`\n  名称: ${prog["adtcore:name"]}`)
  console.log(`  包: ${prog["adtcore:packageName"]}`)
  console.log(`  描述: ${prog["adtcore:description"]}`)
  console.log(`  URI: ${prog["adtcore:uri"]}`)
})
```

## 按类型搜索

### 搜索程序

```typescript
const programs = await client.searchObject("ZPROG*", "PROG/P")
```

### 搜索类

```typescript
const classes = await client.searchObject("ZCL_*", "CLAS/OC")

classes.forEach(clas => {
  console.log(`类: ${clas["adtcore:name"]}`)
  console.log(`包: ${clas["adtcore:packageName"]}`)
})
```

### 搜索接口

```typescript
const interfaces = await client.searchObject("ZIF_*", "INTF/OI")
```

### 搜索函数组

```typescript
const funcGroups = await client.searchObject("ZFG_*", "FUGR/F")
```

### 搜索 CDS 视图

```typescript
const cdsViews = await client.searchObject("Z_*", "DDLS/DF", 100)
```

### 搜索包

```typescript
const packages = await client.searchObject("Z*", "DEVC/K")
```

## 查找对象路径

### findObjectPath

查找对象在包层次结构中的完整路径。

```typescript
const path = await client.findObjectPath(
  objectUrl: string
): Promise<PathStep[]>
```

**PathStep 结构:**

```typescript
interface PathStep {
  "adtcore:name": string                    // 名称
  "adtcore:type": string                    // 类型
  "adtcore:uri": string                     // URI
  "projectexplorer:category": string        // 分类
}
```

**示例:**

```typescript
const path = await client.findObjectPath(
  "/sap/bc/adt/oo/classes/zcl_myclass"
)

console.log("对象路径:")
path.forEach((step, index) => {
  console.log(`${"  ".repeat(index)}├─ ${step["adtcore:name"]}`)
  console.log(`${"  ".repeat(index + 1)}  类型: ${step["adtcore:type"]}`)
  console.log(`${"  ".repeat(index + 1)}  分类: ${step["projectexplorer:category"]}`)
})
```

**输出示例:**

```
对象路径:
├─ Local Objects
    类型: DEVC/K
    分类: package
    ├─ $TMP
        类型: DEVC/K
        分类: package
        ├─ ZCL_MYCLASS
            类型: CLAS/OC
            分类: object
```

## ABAP 文档

### abapDocumentation

获取 ABAP 关键字或元素的文档。

```typescript
const documentation = await client.abapDocumentation(
  objectUri: string,
  body: string,
  line: number,
  column: number,
  language = "EN"
): Promise<string>
```

**参数说明:**

- `objectUri` - 对象 URI
- `body` - 源代码内容
- `line` - 行号
- `column` - 列号
- `language` - 语言代码，默认 "EN"

**示例:**

```typescript
// 获取 DATA 关键字的文档
const source = "DATA lv_value TYPE i."

const docs = await client.abapDocumentation(
  "/sap/bc/adt/programs/programs/zprog/source/main",
  source,
  1,
  7,  // DATA 的位置
  "EN"
)

console.log("ABAP 文档:")
console.log(docs)
```

### 获取方法的文档

```typescript
const classSource = `
METHODS get_data
  RETURNING
    value(rv_result) TYPE string.
`

const docs = await client.abapDocumentation(
  "/sap/bc/adt/oo/classes/zclass/source/main",
  classSource,
  3,
  10  // get_data 的位置
)
```

## 包值帮助

### packageSearchHelp

查找包属性的值帮助。

```typescript
const results = await client.packageSearchHelp(
  type: PackageValueHelpType,
  name = "*"
): Promise<PackageValueHelpResult[]>
```

**PackageValueHelpType 类型:**

- `"applicationcomponents"` - 应用组件
- `"softwarecomponents"` - 软件组件
- `"transportlayers"` - 传输层
- `"translationrelevances"` - 翻译相关性

**PackageValueHelpResult 结构:**

```typescript
interface PackageValueHelpResult {
  name: string        // 名称
  description: string // 描述
  data: string        // 数据
}
```

**示例:**

```typescript
// 查找应用组件
const appComps = await client.packageSearchHelp("applicationcomponents", "*")

console.log("应用组件:")
appComps.forEach(comp => {
  console.log(`  ${comp.name}: ${comp.description}`)
  console.log(`    数据: ${comp.data}`)
})
```

**查找软件组件:**

```typescript
const swComps = await client.packageSearchHelp("softwarecomponents", "HANA*")

swComps.forEach(comp => {
  console.log(`${comp.name}: ${comp.description}`)
})
```

**查找传输层:**

```typescript
const layers = await client.packageSearchHelp("transportlayers")

layers.forEach(layer => {
  console.log(`${layer.name}: ${layer.description}`)
})
```

## 高级搜索技巧

### 模糊搜索

```typescript
// 使用通配符
const results1 = await client.searchObject("Z*CLASS*")

// 使用 ? 匹配单个字符
const results2 = await client.searchObject("ZPROG??")

// 组合使用
const results3 = await client.searchObject("ZCL_*_BASE")
```

### 组合搜索类型和名称

```typescript
// 搜索特定包中的类
const results = await client.searchObject("ZCL*", "CLAS")

// 根据包筛选
const inPackage = results.filter(r =>
  r["adtcore:packageName"]?.startsWith("Z")
)
```

### 按描述搜索

```typescript
const results = await client.searchObject("TEST", "PROG")

// 按描述筛选
const withTest = results.filter(r =>
  r["adtcore:description"]?.toLowerCase().includes("test")
)

withTest.forEach(r => {
  console.log(`${r["adtcore:name"]}: ${r["adtcore:description"]}`)
})
```

## 完整示例: 智能搜索助手

```typescript
import { ADTClient } from "abap-adt-api"

class SmartSearch {
  constructor(private client: ADTClient) {}

  async searchByNameAndType(
    namePattern: string,
    type?: string,
    options?: {
      package?: string
      description?: string
      maxResults?: number
    }
  ) {
    // 执行基本搜索
    const results = await this.client.searchObject(
      namePattern,
      type,
      options?.maxResults || 100
    )

    // 应用筛选条件
    let filtered = results

    if (options?.package) {
      filtered = filtered.filter(r =>
        r["adtcore:packageName"] === options.package
      )
    }

    if (options?.description) {
      const descLower = options.description.toLowerCase()
      filtered = filtered.filter(r =>
        r["adtcore:description"]?.toLowerCase().includes(descLower)
      )
    }

    return filtered
  }

  async findObjectHierarchy(objectUrl: string) {
    const path = await this.client.findObjectPath(objectUrl)

    // 构建层次结构树
    const tree: any = {}

    path.forEach(step => {
      const parts = step["adtcore:uri"].split("/").filter(Boolean)

      let current = tree
      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1

        if (isLast) {
          current[parts[i]] = {
            name: step["adtcore:name"],
            type: step["adtcore:type"],
            uri: step["adtcore:uri"],
            category: step["projectexplorer:category"],
            children: {}
          }
        } else {
          if (!current[parts[i]]) {
            current[parts[i]] = { children: {} }
          }
          current = current[parts[i]].children
        }
      }
    })

    return tree
  }

  async searchWithDocumentation(
    pattern: string,
    type: string
  ) {
    const results = await this.client.searchObject(pattern, type, 10)

    // 为每个结果获取文档
    const withDocs = []

    for (const result of results.slice(0, 3)) { // 限制数量避免太多请求
      try {
        const docs = await this.client.abapDocumentation(
          result["adtcore:uri"],
          "",
          1,
          1
        )

        withDocs.push({
          ...result,
          documentation: docs.substring(0, 500) // 限制长度
        })
      } catch (e) {
        // 可能没有文档
        withDocs.push({
          ...result,
          documentation: "无文档"
        })
      }
    }

    return withDocs
  }

  formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return "未找到匹配的对象"
    }

    const lines = [`找到 ${results.length} 个结果:\n`]

    results.forEach((r, i) => {
      lines.push(`${i + 1}. ${r["adtcore:name"]} (${r["adtcore:type"]})`)
      if (r["adtcore:packageName"]) {
        lines.push(`   包: ${r["adtcore:packageName"]}`)
      }
      if (r["adtcore:description"]) {
        lines.push(`   描述: ${r["adtcore:description"]}`)
      }
      lines.push(`   URI: ${r["adtcore:uri"]}\n`)
    })

    return lines.join("\n")
  }
}

// 使用示例
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const searcher = new SmartSearch(client)

// 1. 基本搜索
console.log("=== 基本搜索 ===")
const basicResults = await searcher.searchByNameAndType(
  "ZCL*",
  "CLAS/OC",
  {
    package: "$TMP",
    description: "base",
    maxResults: 20
  }
)

console.log(searcher.formatSearchResults(basicResults))

// 2. 查找对象层次
console.log("\n=== 对象层次 ===")
if (basicResults.length > 0) {
  const hierarchy = await searcher.findObjectHierarchy(basicResults[0].uri)
  console.log(JSON.stringify(hierarchy, null, 2))
}

// 3. 带文档的搜索
console.log("\n=== 带文档的搜索 ===")
const withDocs = await searcher.searchWithDocumentation("Z*", "PROG/P")

withDocs.forEach(r => {
  console.log(`\n${r["adtcore:name"]}:`)
  console.log(`  ${r["adtcore:description"]}`)
  console.log(`  文档:\n  ${r.documentation.substring(0, 200)}...`)
})
```

## 批量搜索

```typescript
async function batchSearch(
  client: ADTClient,
  patterns: Array<{ pattern: string; type?: string }>
) {
  const results: {
    pattern: string
    type?: string
    count: number
    items: SearchResult[]
  }[] = []

  for (const { pattern, type } of patterns) {
    console.log(`搜索: ${pattern}`)

    try {
      const items = await client.searchObject(pattern, type, 50)

      results.push({
        pattern,
        type,
        count: items.length,
        items
      })

    } catch (error) {
      console.error(`搜索 ${pattern} 失败:`, error.message)

      results.push({
        pattern,
        type,
        count: 0,
        items: []
      })
    }
  }

  // 生成汇总报告
  console.log("\n=== 搜索汇总 ===")
  results.forEach(r => {
    console.log(
      `${r.pattern} (${r.type || "所有类型"}): ${r.count} 个结果`
    )
  })

  return results
}

// 使用
const patterns = [
  { pattern: "Z*", type: "CLAS" },
  { pattern: "Z*", type: "PROG" },
  { pattern: "Z*", type: "TABL" }
]

const results = await batchSearch(client, patterns)
```

## 搜索结果排序

```typescript
function sortSearchResults(
  results: SearchResult[],
  sortBy: "name" | "type" | "package" = "name"
) {
  return [...results].sort((a, b) => {
    const aValue = a[`adtcore:${sortBy}`] || ""
    const bValue = b[`adtcore:${sortBy}`] || ""
    return aValue.localeCompare(bValue)
  })
}

// 使用
const results = await client.searchObject("Z*", "CLAS")
const sorted = sortSearchResults(results, "name")

sorted.forEach(r => {
  console.log(r["adtcore:name"])
})
```

## 性能建议

1. **限制结果数量**，避免返回过多数据
   ```typescript
   const results = await client.searchObject("Z*", "CLAS", 20)
   ```

2. **使用具体的类型**提高搜索效率
   ```typescript
   // 好：指定类型
   const good = await client.searchObject("ZCL*", "CLAS")

   // 差：可能返回很多结果
   const bad = await client.searchObject("Z*")
   ```

3. **缓存搜索结果**，避免重复查询
   ```typescript
   const cache = new Map<string, SearchResult[]>()

   async function cachedSearch(pattern: string, type?: string) {
     const key = `${pattern}:${type || "all"}`

     if (cache.has(key)) {
       return cache.get(key)!
     }

     const results = await client.searchObject(pattern, type)
     cache.set(key, results)

     setTimeout(() => cache.delete(key), 300000) // 5分钟后清除

     return results
   }
   ```

4. **使用包前缀**缩小搜索范围
   ```typescript
   const results = await client.searchObject("ZCL*", "CLAS")
   const inPackage = results.filter(r =>
     r["adtcore:packageName"]?.startsWith("Z")
   )
   ```
