# CDS 开发

abap-adt-api 提供了完整的 Core Data Services (CDS) 开发支持，包括 CDS 视图、注释、访问控制、扩展等。

## CDS 语法检查

### syntaxCheckCDS

检查 CDS 数据定义的语法。

```typescript
public async syntaxCheckCDS(cdsUrl: string): Promise<SyntaxCheckResult[]>
```

**示例:**

```typescript
const cdsUrl = "/sap/bc/adt/ddic/ddl/sources/zmy_view"
const errors = await client.syntaxCheckCDS(cdsUrl)

if (errors.length === 0) {
  console.log("CDS 语法正确")
} else {
  errors.forEach(err => {
    console.error(`行 ${err.line}: ${err.message}`)
  })
}
```

## CDS 注释定义

### annotationDefinitions

获取 CDS 注释定义和文档。

```typescript
public async annotationDefinitions(): Promise<string>
```

**返回内容:**
- XML 格式的注释定义

**示例:**

```typescript
const annotations = await client.annotationDefinitions()
console.log("注释定义:", annotations)
```

## DDIC 元素访问

### ddicElement

获取 DDIC 元素的详细信息。

```typescript
public async ddicElement(
  path: string | string[],
  getTargetForAssociation?: boolean,
  getExtensionViews?: boolean,
  getSecondaryObjects?: boolean
): Promise<DdicElement>
```

**参数:**
- `path` - 元素路径 (字符串或数组)
- `getTargetForAssociation` - 是否获取关联目标 (默认: false)
- `getExtensionViews` - 是否获取扩展视图 (默认: true)
- `getSecondaryObjects` - 是否获取次要对象 (默认: true)

**返回信息:**
- 元素类型和名称
- 元素属性 (包括 DDIC 相关信息)
- 注释
- 子元素

**示例:**

```typescript
const element = await client.ddicElement(["tables", "SFLIGHT"])
console.log("类型:", element.type)
console.log("名称:", element.name)
console.log("属性:", element.properties)
```

### ddicRepositoryAccess

访问 DDIC 仓库信息。

```typescript
public async ddicRepositoryAccess(
  path: string | string[]
): Promise<any>
```

**示例:**

```typescript
// 获取表定义
const tableDef = await client.ddicRepositoryAccess(["tables", "SFLIGHT"])

// 获取视图信息
const viewInfo = await client.ddicRepositoryAccess(["views", "ZMY_VIEW"])
```

## 服务绑定管理

### publishServiceBinding

发布 OData 服务绑定。

```typescript
public async publishServiceBinding(
  name: string,
  version: string
): Promise<BindingServiceResult>
```

**参数:**
- `name` - 服务绑定名称
- `version` - 服务版本

**示例:**

```typescript
const result = await client.publishServiceBinding(
  "ZMY_SERVICE_BINDING",
  "0001"
)

console.log("服务已发布:", result.serviceDefinitions)
console.log("URL:", result.serviceUrl)
```

### unpublishServiceBinding

取消发布服务绑定。

```typescript
public async unpublishServiceBinding(
  name: string,
  version: string
): Promise<void>
```

**示例:** 

```typescript
await client.unpublishServiceBinding(
  "ZMY_SERVICE_BINDING",
  "0001"
)
console.log("服务已取消发布")
```

## 创建 CDS 数据定义

### 基本视图

```typescript
const cdsSource = `
@EndUserText.label: '航班视图'
@AccessControl.authorizationCheck: #CHECK
define view ZMY_FLIGHT_VIEW
  as select from sflight {
  key carrid   as 航空公司,
  key connid   as 航班连接,
  key fldate   as 飞行日期,
      price    as 票价,
      currency as 货币,
      planetype as 飞机类型
}
`

// 创建 CDS 对象
const cdsMeta = await client.createObject({
  name: "ZMY_FLIGHT_VIEW",
  type: "DDLS/DF",
  package: "$TMP",
  description: "航班视图"
})

// 获取结构并设置源代码
const structure = await client.objectStructure(cdsMeta.objectUrl)
const lock = await client.lock(cdsMeta.objectUrl, "MODIFY")

try {
  const mainLink = structure.links.find(l => l.type === "text/plain")
  await client.setObjectSource(
    mainLink.href,
    cdsSource,
    lock.handle,
    lock.transport
  )

  // 语法检查
  const errors = await client.syntaxCheckCDS(cdsMeta.objectUrl)
  if (errors.length === 0) {
    await client.activate("ZMY_FLIGHT_VIEW", cdsMeta.objectUrl)
    console.log("CDS 视图创建成功")
  }
} finally {
  await client.unLock(cdsMeta.objectUrl, lock.handle)
}
```

### 带参数的视图

```typescript
const parameterizedCDS = `
@EndUserText.label: '带参数的航班视图'
define view ZMY_FLIGHT_PARAM_VIEW with parameters
  p_carrier : s_carr_id
  as select from sflight {
  key carrid,
  key connid,
  key fldate,
      price,
      currency
}
where carrid = :p_carrier
`
```

### 视图关联

```typescript
const joinCDS = `
@EndUserText.label: '航班-订单关联视图'
define view ZMY_FLIGHT_BOOKING_VIEW
  as select from sflight as f
    inner join sbook as b on f.fldate = b.fldate
                               and f.carrid = b.carrid
                               and f.connid = b.connid {
  key f.carrid      as 航空公司,
  key f.connid      as 航班号,
  key f.fldate      as 飞行日期,
  key b.bookid      as 订单ID,
      b.customid    as 客户ID,
      b.luggweight  as 行李重量,
      f.price       as 票价
}
`
```

### 聚合视图

```typescript
const aggregateCDS = `
@EndUserText.label: '航班统计视图'
@Analytics.query: true
define view ZMY_FLIGHT_STATS
  as select from sflight {
  key carrid                     as 航空公司,
      sum(price)                 as 总票价,
      count(*)                   as 航班数,
      avg(price)                 as 平均票价,
      max(price)                 as 最高票价,
      min(price)                 as 最低票价
}
group by carrid
`
```

## CDS 访问控制

### 创建访问控制

```typescript
const acSource = `
@EndUserText.label: '航班访问控制'
define role roles {
  grant select on ZMY_FLIGHT_VIEW
    where (carrid) =
      aspect pfcg_auths(
        S_CARRID,
        ACTVT = '03',
        CARRID = carrid
      );
}
`

const acMeta = await client.createObject({
  name: "ZMY_FLIGHT_ACCESS",
  type: "DCLS/DL",
  package: "$TMP",
  description: "航班访问控制"
})

const structure = await client.objectStructure(acMeta.objectUrl)
const lock = await client.lock(acMeta.objectUrl, "MODIFY")

try {
  const mainLink = structure.links.find(l => l.type === "text/plain")
  await client.setObjectSource(
    mainLink.href,
    acSource,
    lock.handle,
    lock.transport
  )

  await client.activate("ZMY_FLIGHT_ACCESS", acMeta.objectUrl)
} finally {
  await client.unLock(acMeta.objectUrl, lock.handle)
}
```

## CDS 扩展

### 扩展现有视图

```typescript
const extensionSource = `
@EndUserText.label: '航班视图扩展'
extend view ZMY_FLIGHT_VIEW with {
  // 添加新字段
  @EndUserText.label: '是否国际'
  cast( case when carrid <> 'LH' then 'X' else '' end as abap_boolean ) as is_international
}
`

const extMeta = await client.createObject({
  name: "ZMY_FLIGHT_EXT",
  type: "DDLX/EX",
  package: "$TMP",
  description: "航班视图扩展"
})
```

## CDS 最佳实践

### 1. 使用注释提供元数据

```typescript
const wellDocumentedCDS = `
@EndUserText.label: '销售订单视图'
@EndUserText.description: '用于报表的销售订单主数据'
@VDM.viewType: #COMPOSITE
@AccessControl.authorizationCheck: #CHECK
@Metadata.ignorePropagatedAnnotations: true
define view ZMY_SALES_ORDER_VIEW
  as select from vbak as sales_order
  inner join kna1 as customer on sales_order.kunnr = customer.kunnr {
  key sales_order.vbeln   as 订单ID,
      sales_order.ernam   as 创建人,
      sales_order.erdat   as 创建日期,
      customer.name1      as 客户名称,
      customer.name2      as 客户名称2,
      customer.ort01      as 城市
}
where sales_order.vbtyp = 'C'
`
```

### 2. 使用计算字段

```typescript
const calculatedFields = `
define view ZMY_CALC_VIEW
  as select from sflight {
  key carrid,
  key connid,
  key fldate,
      price,
      currency,
      // 计算字段
      @EndUserText.label: '含税价格'
      cast( price * 1.19 as abap.curr(15,2) ) as price_with_tax,
      // 字符串操作
      @EndUserText.label: '完整航班号'
      carrid && connid as full_flight_id,
      // 日期计算
      @EndUserText.label: '距离今天的天数'
      days_between(fldate, syst_date) as days_from_now
}
`
```

### 3. 条件逻辑

```typescript
const conditionalLogic = `
define view ZMY_CONDITION_VIEW
  as select from sflight {
  key carrid,
  key connid,
      price,
      planetype,
      // CASE 表达式
      @EndUserText.label: '航班类型'
      case planetype
        when 'A330-300' then '宽体机'
        when 'B747-400' then '巨型机'
        when 'A320'     then '窄体机'
        else '其他'
      end as aircraft_type,
      // 条件价格
      @EndUserText.label: '价格等级'
      case
        when price < 500 then '经济'
        when price < 1500 then '商务'
        else '头等'
      end as price_class
}
`
```

### 4. 使用 CDS 函数

```typescript
const cdsFunctions = `
define view ZMY_FUNCTION_VIEW
  as select from sflight {
  key carrid,
      connid,
      fldate,
      // 字符串函数
      upper(carrid)               as carrier_upper,
      substring(carrid,1,2)       as carrier_prefix,
      length(carrid)              as carrier_length,
      // 数值函数
      round(price, 2)             as rounded_price,
      division(price, 10, 2)      as price_div_10,
      // 日期函数
      datd( fldate )             as 年,
      month( fldate )             as 月,
      day( fldate )               as 日
}
`
```

## CDS 性能优化

### 1. 使用索引提示

```typescript
@EndUserText.label: '优化查询视图'
@Environment.systemField: #CLIENT
define view ZMY_OPTIMIZED_VIEW
  as select from sflight {
  key carrid,
  key connid,
  key fldate,
      price
}
// 在 Where 子句中使用索引字段
where carrid = :p_carrier
  and fldate >= :p_from_date
```

### 2. 选择性字段

```typescript
// 只选择需要的字段
define view ZMY_SELECTIVE_VIEW
  as select from sflight {
  key carrid,
      price  // 只选择必要字段
}
```

### 3. 使用联合视图

```typescript
@EndUserText.label: '联合视图'
define view ZMY_UNION_VIEW
  as select from sflight {
  key carrid, connid, fldate, price
}
union all
select from sflight_history {
  key carrid, connid, fldate, price
}
```

## CDS 调试

### 检查生成的 SQL

```typescript
// 运行查询查看执行计划
const result = await client.runQuery(`
  SELECT * FROM zmy_flight_view
  WHERE carrid = 'LH'
  AND fldate >= '20250101'
`, 100)

// 分析结果集
console.log("返回行数:", result.rows.length)
```

### 性能追踪

```typescript
// 启用追踪
const traceConfig = await client.tracesCreateConfiguration({
  name: "CDS 性能追踪",
  type: "SAT_TRACE"
})

// 运行查询
await client.runQuery("SELECT * FROM zmy_flight_view", 100)

// 查看追踪结果
const traceResults = await client.tracesHitList(traceConfig.id)
console.log("SQL 语句:", traceResults.statements)
```

## 相关文档

- [语法检查](syntax-check.md)
- [对象创建](object-creation.md)
- [服务绑定](../integration/service-bindings.md)
- [表格操作](table-operations.md)
