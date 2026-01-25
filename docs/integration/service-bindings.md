# 服务绑定管理

abap-adt-api 提供了完整的 OData 服务绑定管理功能，包括服务定义、绑定创建、发布和管理。

## 服务绑定概述

服务绑定是将 CDS 数据定义暴露为 OData 服务的机制。abap-adt-api 支持以下操作：

- 发布和取消发布服务绑定
- 查询服务绑定详情
- 获取服务定义和端点信息
- 管理服务绑定状态

## 发布服务绑定

### publishServiceBinding

发布 OData 服务绑定到系统。

```typescript
public async publishServiceBinding(
  name: string,
  version: string
): Promise<BindingServiceResult>
```

**参数:**
- `name` - 服务绑定名称
- `version` - 服务版本号 (如 "0001", "0002")

**返回信息:**
- `serviceDefinitions` - 服务定义列表
- `serviceUrl` - 服务端点 URL
- `bindingType` - 绑定类型
- `status` - 发布状态

**示例:**

```typescript
const result = await client.publishServiceBinding(
  "ZMY_SERVICE_BINDING",
  "0001"
)

console.log("服务已发布:")
console.log("  URL:", result.serviceUrl)
console.log("  类型:", result.bindingType)
console.log("  定义:", result.serviceDefinitions)
```

### 发布 CDS 服务

```typescript
// 1. 创建 CDS 数据定义
const cdsSource = `
@EndUserText.label: '航班服务'
@OData.publish: true
define view ZMY_FLIGHT_SERVICE as select from sflight {
  key carrid   as Airline,
  key connid   as Connection,
  key fldate   as FlightDate,
      price    as Price,
      currency as Currency
}
`

const cdsMeta = await client.createObject({
  name: "ZMY_FLIGHT_SERVICE",
  type: "DDLS/DF",
  package: "$TMP",
  description: "航班服务"
})

// 2. 发布服务绑定
const bindingResult = await client.publishServiceBinding(
  "ZMY_FLIGHT_BINDING",
  "0001"
)

console.log("OData 服务端点:", bindingResult.serviceUrl)
// 输出: /sap/opu/odata/sap/zmy_flight_service_srv
```

## 取消发布服务

### unpublishServiceBinding

取消发布服务绑定。

```typescript
public async unPublishServiceBinding(
  name: string,
  version: string
): Promise<void>
```

**示例:**

```typescript
await client.unPublishServiceBinding(
  "ZMY_SERVICE_BINDING",
  "0001"
)

console.log("服务已取消发布")
```

## 获取服务绑定详情

### bindingDetails

获取服务绑定的详细信息。

```typescript
public async bindingDetails(
  binding: ServiceBinding,
  index = 0
): Promise<BindingServiceResult>
```

**参数:**
- `binding` - 服务绑定对象
  - `binding.name` - 绑定名称
  - `binding.version` - 绑定版本
- `index` - 绑定索引 (默认 0)

**返回信息:**
- 服务定义列表
- 绑定类型 (OData V2, OData V4, InA, etc.)
- 端点 URL
- 绑定状态

**示例:**

```typescript
const binding = {
  name: "ZMY_SERVICE_BINDING",
  version: "0001"
}

const details = await client.bindingDetails(binding)

console.log("绑定详情:")
console.log("  类型:", details.bindingType)
console.log("  URL:", details.serviceUrl)
console.log("  服务定义:")
details.serviceDefinitions.forEach(def => {
  console.log(`    - ${def.name}`)
  console.log(`      类型: ${def.type}`)
  console.log(`      URL: ${def.url}`)
})
```

### 查询所有绑定

```typescript
async function getAllBindings(packageName: string) {
  const bindings = []

  // 搜索服务绑定对象
  const results = await client.searchObject("Z*", "SRVB/SVB")

  for (const result of results) {
    try {
      const structure = await client.objectStructure(result.uri)
      const bindingName = structure.metaData["adtcore:name"]

      const details = await client.bindingDetails({
        name: bindingName,
        version: "0001"
      })

      bindings.push({
        name: bindingName,
        url: details.serviceUrl,
        type: details.bindingType,
        status: "active"
      })
    } catch (error) {
      console.error("获取绑定详情失败:", result.name, error.message)
    }
  }

  return bindings
}

// 使用
const bindings = await getAllBindings("$TMP")
bindings.forEach(b => {
  console.log(`${b.name}: ${b.url}`)
})
```

## 服务绑定类型

### OData V2 绑定

```typescript
// OData V2 是最常见的绑定类型
const result = await client.publishServiceBinding(
  "ZMY_ODATA_V2_BINDING",
  "0001"
)

if (result.bindingType === "ODATA_V2") {
  console.log("这是 OData V2 服务")
  console.log("元数据 URL:", result.serviceUrl + "/$metadata")
  console.log("服务文档:", result.serviceUrl)
}
```

### OData V4 绑定

```typescript
// OData V4 提供更现代的功能
const result = await client.publishServiceBinding(
  "ZMY_ODATA_V4_BINDING",
  "0001"
)

if (result.bindingType === "ODATA_V4") {
  console.log("这是 OData V4 服务")
}
```

### InA (Analytics) 绑定

```typescript
// InA 用于 SAP Analytics Cloud 集成
const result = await client.publishServiceBinding(
  "ZMY_ANALYTICS_BINDING",
  "0001"
)

if (result.bindingType === "INA") {
  console.log("这是 InA 分析服务")
}
```

## 完整工作流程

### 创建和发布服务

```typescript
async function createAndPublishService() {
  // 1. 创建 CDS 数据定义
  const cdsSource = `
@EndUserText.label: '客户服务'
@OData.publish: true
@AccessControl.authorizationCheck: #CHECK
define view ZMY_CUSTOMER_SERVICE as select from kna1 {
  key kunnr as CustomerId,
      name1 as FirstName,
      name2 as LastName,
      ort01 as City,
      land1 as Country,
      pstlz as PostalCode
}
where loevm = ''  // 只返回未删除的客户
`

  const cdsMeta = await client.createObject({
    name: "ZMY_CUSTOMER_SERVICE",
    type: "DDLS/DF",
    package: "$TMP",
    description: "客户数据服务"
  })

  const structure = await client.objectStructure(cdsMeta.objectUrl)
  const lock = await client.lock(cdsMeta.objectUrl, "MODIFY")

  try {
    // 2. 设置源代码
    const mainLink = structure.links.find(l => l.type === "text/plain")
    await client.setObjectSource(
      mainLink.href,
      cdsSource,
      lock.handle,
      lock.transport
    )

    // 3. 激活 CDS
    const activateResult = await client.activate(
      "ZMY_CUSTOMER_SERVICE",
      cdsMeta.objectUrl
    )

    if (activateResult.success) {
      console.log("CDS 已激活")

      // 4. 发布服务绑定
      const bindingResult = await client.publishServiceBinding(
        "ZMY_CUSTOMER_SRV",
        "0001"
      )

      console.log("服务已发布!")
      console.log("服务 URL:", bindingResult.serviceUrl)
      console.log("元数据:", bindingResult.serviceUrl + "/$metadata")

      return bindingResult
    }
  } finally {
    await client.unLock(cdsMeta.objectUrl, lock.handle)
  }
}
```

### 管理服务生命周期

```typescript
async function manageServiceLifecycle(bindingName: string) {
  // 检查服务状态
  const binding = {
    name: bindingName,
    version: "0001"
  }

  try {
    const details = await client.bindingDetails(binding)
    console.log("服务状态: 活动中")
    console.log("URL:", details.serviceUrl)

    // 如果需要更新，先取消发布
    await client.unPublishServiceBinding(bindingName, "0001")
    console.log("服务已取消发布")

    // 进行更新...

    // 重新发布
    const updated = await client.publishServiceBinding(bindingName, "0001")
    console.log("服务已重新发布")

    return updated
  } catch (error) {
    if (error.message.includes("404")) {
      console.log("服务不存在，需要首次发布")
      const result = await client.publishServiceBinding(bindingName, "0001")
      return result
    } else {
      throw error
    }
  }
}
```

## 测试服务绑定

### 测试 OData 服务

```typescript
async function testODataService(serviceUrl: string) {
  const axios = require('axios')
  const baseURL = `https://your-server.com:443${serviceUrl}`

  // 1. 获取元数据
  const metadataResponse = await axios.get(`${baseURL}/$metadata`)
  console.log("元数据获取成功")

  // 2. 获取实体集合
  const collectionResponse = await axios.get(`${baseURL}/Customer`)
  console.log("实体集合:", collectionResponse.data.d.results)

  // 3. 获取单个实体
  const singleResponse = await axios.get(
    `${baseURL}/Customer('0000000001')`
  )
  console.log("单个实体:", singleResponse.data.d)

  // 4. 使用 $filter
  const filterResponse = await axios.get(
    `${baseURL}/Customer?$filter=Country eq 'US'`
  )
  console.log("过滤结果:", filterResponse.data.d.results)
}
```

### 使用 Postman 测试

```bash
# 获取服务文档
GET https://your-server.com/sap/opu/odata/sap/zmy_service_srv/

# 获取元数据
GET https://your-server.com/sap/opu/odata/sap/zmy_service_srv/$metadata

# 获取所有实体
GET https://your-server.com/sap/opu/odata/sap/zmy_service_srv/EntitySet

# 获取单个实体
GET https://your-server.com/sap/opu/odata/sap/zmy_service_srv/EntitySet('key')

# 创建实体
POST https://your-server.com/sap/opu/odata/sap/zmy_service_srv/EntitySet
Content-Type: application/json

{
  "Field1": "Value1",
  "Field2": "Value2"
}

# 更新实体
PUT https://your-server.com/sap/opu/odata/sap/zmy_service_srv/EntitySet('key')
Content-Type: application/json

{
  "Field1": "NewValue"
}

# 删除实体
DELETE https://your-server.com/sap/opu/odata/sap/zmy_service_srv/EntitySet('key')
```

## 服务安全配置

### 添加访问控制

```typescript
const securedCDS = `
@EndUserText.label: '安全服务'
@OData.publish: true
@AccessControl.authorizationCheck: #CHECK
define view ZMY_SECURED_SERVICE with parameters
  p_user : abap.char(12)
  as select from kna1 {
  key kunnr as CustomerId,
      name1 as Name,
      ort01 as City
}
where ernam = :p_user  // 只返回当前用户创建的数据
`
```

### CORS 配置

```typescript
// 在 SAP Gateway 中配置 CORS
// 事务: /IWFND/CORS

const corsConfig = {
  allowedOrigins: ["https://myapp.com"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600
}
```

## 性能优化

### 使用 $select 减少数据

```typescript
// 在服务端添加注释支持选择性字段
@OData.publish: true
define view ZMY_OPTIMIZED_SERVICE as select from kna1 {
  key kunnr as CustomerId,
      name1 as Name,
      ort01 as City
  // 只选择需要的字段
}
```

### 使用 $top 和 $skip 实现分页

```typescript
// 客户端分页
async function getCustomers(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize
  const url = `${serviceUrl}/Customer?$top=${pageSize}&$skip=${skip}`

  const response = await axios.get(url)
  return response.data.d.results
}
```

### 添加缓存头

```typescript
// 在服务定义中添加缓存注释
@EndUserText.label: '缓存服务'
@OData.publish: true
@Metadata.ignorePropagatedAnnotations: true
define view ZMY_CACHED_SERVICE as select from kna1 {
  key kunnr,
      name1,
      @Consumption.filter: { selectionType: #SINGLE, multiple: false }
      ort01
}
```

## 故障排除

### 常见错误

```typescript
// 1. 服务未找到
// 错误: 404 Not Found
// 解决: 确保服务已发布

try {
  await client.bindingDetails({ name: "ZMY_SERVICE", version: "0001" })
} catch (error) {
  if (error.message.includes("404")) {
    console.log("服务未发布，正在发布...")
    await client.publishServiceBinding("ZMY_SERVICE", "0001")
  }
}

// 2. 权限错误
// 错误: 403 Forbidden
// 解决: 检查用户权限

// 3. 激活失败
// 错误: 语法错误或依赖问题
// 解决: 检查 CDS 语法

const errors = await client.syntaxCheckCDS(cdsObjectUrl)
if (errors.length > 0) {
  console.error("语法错误:")
  errors.forEach(e => console.error(`  ${e.message}`))
}
```

### 调试技巧

```typescript
// 1. 检查服务绑定状态
async function checkBindingStatus(bindingName: string) {
  try {
    const details = await client.bindingDetails({
      name: bindingName,
      version: "0001"
    })

    console.log("状态: 活动")
    console.log("URL:", details.serviceUrl)
    return true
  } catch (error) {
    console.error("状态: 非活动或不存在")
    return false
  }
}

// 2. 测试服务端点
async function testServiceEndpoint(serviceUrl: string) {
  const axios = require('axios')

  try {
    const response = await axios.get(serviceUrl)
    console.log("服务响应正常")
    return true
  } catch (error) {
    console.error("服务无响应:", error.message)
    return false
  }
}
```

## 相关文档

- [CDS 开发](../development/cds-development.md)
- [对象创建](../development/object-creation.md)
- [激活对象](../development/activation.md)
- [语法检查](../development/syntax-check.md)
