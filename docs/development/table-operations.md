# 表格数据操作

abap-adt-api 提供了强大的表格数据操作功能，包括读取表格内容、执行 SQL 查询等。

## 表格内容查询

### tableContents

读取数据库表或 CDS 视图的数据。

```typescript
public async tableContents(
  ddicEntityName: string,
  rowNumber: number = 100,
  decode = true,
  sqlQuery = ""
): Promise<QueryResult>
```

**参数:**
- `ddicEntityName` - 表名或 CDS 视图名
- `rowNumber` - 返回的最大行数 (默认 100)
- `decode` - 是否解码字段值 (默认 true)
- `sqlQuery` - 自定义 WHERE 子句 (可选)

**返回结果:**
- `columns` - 列定义数组
- `rows` - 数据行数组
- `totalRows` - 总行数

**示例:**

```typescript
// 读取表格数据
const result = await client.tableContents("SFLIGHT", 50)

console.log("总行数:", result.totalRows)
console.log("列数:", result.columns.length)

// 显示列信息
result.columns.forEach(col => {
  console.log(`列: ${col.name}, 类型: ${col.type}`)
})

// 显示数据
result.rows.forEach(row => {
  console.log("数据行:", row.values)
})
```

### 带条件的查询

```typescript
// 使用 WHERE 子句
const result = await client.tableContents(
  "SFLIGHT",
  100,
  true,
  "carrid = 'LH' AND fldate >= '20250101'"
)

// 或者构建完整查询
const result2 = await client.tableContents(
  "SFLIGHT",
  100,
  true,
  "WHERE carrid = 'LH' AND price > 500"
)
```

### CDS 视图查询

```typescript
// 查询 CDS 视图
const viewResult = await client.tableContents(
  "ZMY_FLIGHT_VIEW",
  200,
  true,
  "carrid = 'AA'"
)

console.log("视图数据:", viewResult.rows)
```

## SQL 查询执行

### runQuery

执行自定义 SQL 查询。

```typescript
public async runQuery(
  sqlQuery: string,
  rowNumber: number = 100,
  decode = true
): Promise<QueryResult>
```

**参数:**
- `sqlQuery` - 完整的 SQL SELECT 语句
- `rowNumber` - 最大返回行数
- `decode` - 是否解码字段值

**示例:**

```typescript
// 基本 SELECT 查询
const result = await client.runQuery(`
  SELECT carrid, connid, fldate, price
  FROM sflight
  WHERE carrid = 'LH'
    AND fldate >= '20250101'
  ORDER BY price DESC
`, 50)

// 聚合查询
const aggResult = await client.runQuery(`
  SELECT
    carrid,
    COUNT(*) as flight_count,
    SUM(price) as total_price,
    AVG(price) as avg_price
  FROM sflight
  WHERE fldate >= '20250101'
  GROUP BY carrid
  ORDER BY total_price DESC
`, 100)

// JOIN 查询
const joinResult = await client.runQuery(`
  SELECT
    f.carrid,
    f.connid,
    f.fldate,
    f.price,
    c.carrname as airline_name
  FROM sflight as f
  INNER JOIN scarr as c ON f.carrid = c.carrid
  WHERE f.price > 1000
  ORDER BY f.price DESC
`, 200)
```

### 复杂查询

```typescript
// 子查询
const subQuery = await client.runQuery(`
  SELECT *
  FROM sflight
  WHERE (carrid, connid, fldate) IN (
    SELECT carrid, connid, MAX(fldate)
    FROM sflight
    GROUP BY carrid, connid
  )
`, 100)

// CASE 表达式
const caseQuery = await client.runQuery(`
  SELECT
    carrid,
    connid,
    price,
    CASE
      WHEN price < 500 THEN 'Economy'
      WHEN price < 1500 THEN 'Business'
      ELSE 'First Class'
    END as price_class
  FROM sflight
  WHERE fldate >= '20250101'
`, 100)

// 使用函数
const funcQuery = await client.runQuery(`
  SELECT
    carrid,
    UPPER(carrid) as carrier_upper,
    LENGTH(carrname) as name_length,
    SUBSTRING(carrname, 1, 10) as short_name
  FROM scarr
`, 100)
```

## 数据处理

### 结果集遍历

```typescript
const result = await client.tableContents("SFLIGHT", 100)

// 遍历所有行
result.rows.forEach((row, rowIndex) => {
  console.log(`行 ${rowIndex}:`)

  // 按列名访问
  result.columns.forEach((col, colIndex) => {
    const value = row.values[colIndex]
    console.log(`  ${col.name}: ${value}`)
  })
})
```

### 数据转换

```typescript
// 转换为对象数组
function transformToObject(result: QueryResult): any[] {
  return result.rows.map(row => {
    const obj: any = {}
    result.columns.forEach((col, index) => {
      obj[col.name] = row.values[index]
    })
    return obj
  })
}

const flights = transformToObject(
  await client.tableContents("SFLIGHT", 100)
)

// 使用对象
flights.forEach(flight => {
  console.log(`${flight.carrid} ${flight.connid}: ${flight.price}`)
})
```

### 数据过滤

```typescript
// 客户端过滤
const result = await client.tableContents("SFLIGHT", 1000)

// 过滤高价航班
const expensiveFlights = result.rows.filter(row => {
  const priceIndex = result.columns.findIndex(c => c.name === "PRICE")
  return parseFloat(row.values[priceIndex]) > 1000
})

console.log("高价航班:", expensiveFlights.length)
```

### 数据排序

```typescript
const result = await client.tableContents("SFLIGHT", 100)

// 按价格排序
const sortedRows = [...result.rows].sort((a, b) => {
  const priceIndex = result.columns.findIndex(c => c.name === "PRICE")
  const priceA = parseFloat(a.values[priceIndex])
  const priceB = parseFloat(b.values[priceIndex])
  return priceB - priceA // 降序
})

sortedRows.forEach(row => {
  console.log(row.values)
})
```

## 分页查询

### 实现分页

```typescript
async function getPaginatedData(
  table: string,
  pageSize: number,
  pageNumber: number
): Promise<QueryResult> {
  const offset = (pageNumber - 1) * pageSize

  const result = await client.runQuery(`
    SELECT *
    FROM ${table}
    ORDER BY carrid, connid, fldate
    OFFSET ${offset} ROWS
    FETCH NEXT ${pageSize} ROWS ONLY
  `, pageSize)

  return result
}

// 使用分页
const page1 = await getPaginatedData("SFLIGHT", 50, 1)
const page2 = await getPaginatedData("SFLIGHT", 50, 2)

console.log("第1页:", page1.rows.length, "行")
console.log("第2页:", page2.rows.length, "行")
```

### 滚动加载

```typescript
async function* scrollData(
  table: string,
  batchSize: number
): AsyncGenerator<any[], void, unknown> {
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const result = await client.runQuery(`
      SELECT *
      FROM ${table}
      ORDER BY carrid, connid, fldate
      OFFSET ${offset} ROWS
      FETCH NEXT ${batchSize} ROWS ONLY
    `, batchSize)

    if (result.rows.length === 0) {
      hasMore = false
    } else {
      yield result.rows
      offset += batchSize

      // 如果返回的行数少于批次大小，说明是最后一页
      if (result.rows.length < batchSize) {
        hasMore = false
      }
    }
  }
}

// 使用滚动加载
for await (const batch of scrollData("SFLIGHT", 100)) {
  console.log("加载批次:", batch.length, "行")
  // 处理数据
}
```

## 数据导出

### 导出到 CSV

```typescript
function exportToCSV(result: QueryResult, filename: string) {
  const fs = require('fs')

  // CSV 头部
  let csv = result.columns.map(c => c.name).join(',') + '\n'

  // 数据行
  result.rows.forEach(row => {
    csv += row.values.join(',') + '\n'
  })

  fs.writeFileSync(filename, csv, 'utf-8')
  console.log(`已导出到 ${filename}`)
}

// 使用
const result = await client.tableContents("SFLIGHT", 1000)
exportToCSV(result, 'flights.csv')
```

### 导出到 JSON

```typescript
function exportToJSON(result: QueryResult, filename: string) {
  const fs = require('fs')

  const data = result.rows.map(row => {
    const obj: any = {}
    result.columns.forEach((col, index) => {
      obj[col.name] = row.values[index]
    })
    return obj
  })

  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`已导出到 ${filename}`)
}

// 使用
const result = await client.tableContents("SFLIGHT", 1000)
exportToJSON(result, 'flights.json')
```

### 导出到 Excel (使用第三方库)

```typescript
const ExcelJS = require('exceljs')

async function exportToExcel(result: QueryResult, filename: string) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  // 添加标题行
  worksheet.columns = result.columns.map(col => ({
    header: col.name,
    key: col.name
  }))

  // 添加数据
  result.rows.forEach(row => {
    worksheet.addRow(row.values)
  })

  // 保存
  await workbook.xlsx.writeFile(filename)
  console.log(`已导出到 ${filename}`)
}

// 使用
const result = await client.tableContents("SFLIGHT", 1000)
await exportToExcel(result, 'flights.xlsx')
```

## 性能优化

### 只选择需要的列

```typescript
// 避免使用 SELECT *
const optimizedQuery = await client.runQuery(`
  SELECT carrid, connid, fldate, price
  FROM sflight
  WHERE carrid = 'LH'
`, 100)
```

### 使用索引字段

```typescript
// 在 WHERE 子句中使用索引字段
const indexedQuery = await client.runQuery(`
  SELECT *
  FROM sflight
  WHERE carrid = 'LH'          -- 索引字段
    AND connid = '0400'        -- 索引字段
    AND fldate >= '20250101'   -- 范围查询
`, 100)
```

### 限制返回行数

```typescript
// 始终限制返回的行数
const limitedResult = await client.tableContents(
  "SFLIGHT",
  100,  // 只返回 100 行
  true,
  "carrid = 'LH'"
)
```

### 使用适当的日期范围

```typescript
// 避免查询过大的日期范围
const recentData = await client.runQuery(`
  SELECT *
  FROM sflight
  WHERE fldate BETWEEN '20250101' AND '20251231'
  ORDER BY fldate DESC
`, 100)
```

## 错误处理

### 处理查询错误

```typescript
try {
  const result = await client.runQuery(`
    SELECT * FROM non_existent_table
  `, 100)
} catch (error) {
  if (error.message.includes("404")) {
    console.error("表不存在")
  } else if (error.message.includes("400")) {
    console.error("SQL 语法错误")
  } else if (error.message.includes("403")) {
    console.error("没有访问权限")
  } else {
    console.error("查询失败:", error.message)
  }
}
```

### 验证查询结果

```typescript
const result = await client.tableContents("SFLIGHT", 100)

// 检查结果
if (!result.columns || result.columns.length === 0) {
  console.warn("没有返回列")
}

if (!result.rows || result.rows.length === 0) {
  console.warn("没有返回数据")
}

// 检查总行数
if (result.totalRows > 10000) {
  console.warn("结果集很大，考虑使用分页")
}
```

## 实用示例

### 数据分析

```typescript
async function analyzeFlightPrices() {
  const result = await client.runQuery(`
    SELECT
      carrid,
      COUNT(*) as count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      AVG(price) as avg_price
    FROM sflight
    WHERE fldate >= '20250101'
    GROUP BY carrid
    ORDER BY avg_price DESC
  `, 100)

  console.log("航空公司票价分析:")
  result.rows.forEach(row => {
    const [carrid, count, min, max, avg] = row.values
    console.log(`${carrid}:`)
    console.log(`  航班数: ${count}`)
    console.log(`  价格范围: ${min} - ${max}`)
    console.log(`  平均价格: ${avg}`)
  })
}
```

### 数据对比

```typescript
async function comparePeriods() {
  const current = await client.runQuery(`
    SELECT carrid, AVG(price) as avg_price
    FROM sflight
    WHERE fldate >= '20250101'
    GROUP BY carrid
  `, 100)

  const previous = await client.runQuery(`
    SELECT carrid, AVG(price) as avg_price
    FROM sflight
    WHERE fldate >= '20240101' AND fldate < '20250101'
    GROUP BY carrid
  `, 100)

  // 对比数据
  console.log("价格对比:")
  current.rows.forEach(currRow => {
    const carrid = currRow.values[0]
    const currPrice = parseFloat(currRow.values[1])

    const prevRow = previous.rows.find(r => r.values[0] === carrid)
    if (prevRow) {
      const prevPrice = parseFloat(prevRow.values[1])
      const change = ((currPrice - prevPrice) / prevPrice * 100).toFixed(2)
      console.log(`${carrid}: ${change}%`)
    }
  })
}
```

### 数据同步

```typescript
async function syncData(sourceTable: string, targetTable: string) {
  const sourceData = await client.tableContents(sourceTable, 1000)

  for (const row of sourceData.rows) {
    // 构建插入语句
    const columns = sourceData.columns.map(c => c.name).join(', ')
    const values = row.values.map(v => `'${v}'`).join(', ')

    try {
      await client.runQuery(`
        INSERT INTO ${targetTable} (${columns})
        VALUES (${values})
      `, 1)
    } catch (error) {
      // 可能已存在，尝试更新
      console.log("可能需要更新:", row.values)
    }
  }

  console.log("同步完成")
}
```

## 相关文档

- [对象结构](core/object-operations.md)
- [CDS 开发](cds-development.md)
- [SQL 查询](search.md)
- [服务绑定](../integration/service-bindings.md)
