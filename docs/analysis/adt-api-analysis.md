# ADT REST API 分析报告

## 📊 数据来源

从 SAP ADT REST API 拦截系统获取的真实调用记录
- 系统：SAP ECC (S4H)
- 客户端：300
- 拦截时间：2026-01-23

---

## 🔍 发现的 ADT 端点

### 1. Runtime Dumps (运行时错误)

**端点**: `/sap/bc/adt/runtime/dumps`

**方法**: GET

**查询参数**:
```
$query=and( equals( responsible,  ) )
$inlinecount=allpages
$top=50
from=20260123074038
```

**请求头**:
```
X-sap-adt-feed: (空值)
Accept: application/atom+xml;type=feed
User-Agent: Eclipse/4.34.0.v20241120-1800 (win32; x86_64; Java 21.0.6) ADT/3.48.1 (devedition)
X-sap-adt-profiling: server-time
```

**响应格式**: Atom XML Feed

**用途**:
- 获取 ABAP 运行时错误（Short Dumps）
- 支持按责任人、用户过滤
- 支持时间范围查询
- 支持分页（$top, $inlinecount）

**查询语法示例**:
```javascript
// 按责任人查询
$query=and( equals( responsible,  ) )

// 按用户查询
$query=and( equals( user,  ) )

// 时间范围
from=20260123074038  // YYYYMMDDHHmmss

// 分页
$top=50
$inlinecount=allpages
```

---

### 2. System Messages (系统消息)

**端点**: `/sap/bc/adt/runtime/systemmessages`

**方法**: GET

**请求头**:
```
X-sap-adt-feed:
Accept: application/atom+xml;type=feed
User-Agent: Eclipse/4.34.0.v20241120-1800 (win32; x86_64; Java 21.0.6) ADT/3.48.1 (devedition)
X-sap-adt-profiling: server-time
```

**响应格式**: Atom XML Feed

**用途**:
- 获取系统消息
- 通常包括系统级别的通知和警告

---

### 3. Package Operations (包操作)

#### 3.1 读取包信息

**端点**: `/sap/bc/adt/packages/{package_name}`

**方法**: GET

**示例**:
```
/sap/bc/adt/packages/zpk1_create1
```

#### 3.2 创建包

**端点**: `/sap/bc/adt/packages`

**方法**: POST

**查询参数**:
```
corrNr=S4HK901712  // 传输请求号
```

#### 3.3 包验证

**端点**: `/sap/bc/adt/packages/validation`

**方法**: GET

**查询参数**:
```
objname=ZPK1_CREATE1
description=CREATE+SAP+PACKAGE
packagetype=development
swcomp=HOME
checkmode=basic  // 或 full
```

#### 3.4 传输层值帮助

**端点**: `/sap/bc/adt/packages/valuehelps/transportlayers`

**方法**: GET

**查询参数**:
```
name=*  // 通配符搜索
```

---

### 4. CTS (Change and Transport System)

#### 4.1 Transport Checks (传输检查)

**端点**: `/sap/bc/adt/cts/transportchecks`

**方法**: GET

**用途**: 检查传输请求的状态和一致性

#### 4.2 Check Runs

**端点**:
- `/sap/bc/adt/checkruns`
- `/sap/bc/adt/solutionmanager/cm/checkruns`

**方法**: GET

**用途**: ATC (ABAP Test Cockpit) 检查运行

---

### 5. Repository Information System

#### 5.1 Object Properties Values

**端点**: `/sap/bc/adt/repository/informationsystem/objectproperties/values`

**方法**: GET

**查询参数**:
```
uri=%2Fsap%2Fbc%2Fadt%2Fpackages%2Fzpk1_create1
```

**解码后的 URI**:
```
uri=/sap/bc/adt/packages/zpk1_create1
```

**用途**:
- 获取对象的属性值
- 用于信息系统的对象查询

---

## 📋 标准请求头模式

### 必需的请求头

```typescript
{
  "Accept": "application/atom+xml;type=feed",  // 对于 Feed 类型响应
  "Accept": "application/json",                 // 对于 JSON 响应
  "Accept": "text/plain",                      // 对于文本响应
  "User-Agent": "Eclipse/4.34.0.v20241120-1800 (win32; x86_64; Java 21.0.6) ADT/3.48.1"
}
```

### 可选的请求头

```typescript
{
  "X-sap-adt-feed": "",                        // 触发 Feed 响应
  "X-sap-adt-profiling": "server-time"         // 启用服务器性能分析
}
```

### 标准响应头

```typescript
{
  "~server_protocol": "HTTP/1.1",
  "Content-Type": "application/atom+xml;type=feed",
  "X-sap-adt-profiling": "server-time=72062"   // 服务器处理时间（微秒）
}
```

---

## 🔧 查询语法分析

### OData 风格的查询参数

ADT 使用类似 OData 的查询语法：

#### 1. $query - 查询表达式

**语法**: `and( equals( field, value ) )`

**示例**:
```
// 单条件
$query=equals( responsible,  )

// 多条件 AND
$query=and( equals( responsible,  ), equals( user,  ) )

// 可能还支持 OR, not 等操作符
```

#### 2. $inlinecount - 包含计数

**值**: `allpages` 或 `none`

```
$inlinecount=allpages  // 在响应中包含总记录数
```

#### 3. $top - 限制返回数量

**值**: 数字

```
$top=50  // 只返回前 50 条记录
```

#### 4. $skip - 跳过记录

**值**: 数字

```
$skip=10  // 跳过前 10 条记录（用于分页）
```

#### 5. from - 时间范围起点

**格式**: `YYYYMMDDHHmmss`

```
from=20260123074038  // 2026-01-23 07:40:38
```

---

## 📦 响应格式分析

### Atom XML Feed 格式

```xml
<?xml version="1.0" encoding="utf-8"?>
<atom:feed xmlns:atom="http://www.w3.org/2005/Atom">
  <atom:author>
    <atom:name>SAP AG</atom:name>
  </atom:author>
  <atom:contributor>
    <atom:name>S4H</atom:name>
  </atom:contributor>
  <atom:icon>adt://S4H/sap/bc/adt/feeds/icons/...</atom:icon>
  <atom:link href="/sap/bc/adt/runtime/dumps?..." rel="self" type="application/atom+xml"/>
  <atom:title>ABAP Short Dump Analysis: Selected ABAP Runtime Errors</atom:title>
  <atom:updated>2026-01-23T09:49:14Z</atom:updated>

  <atom:entry>
    <atom:author>
      <atom:name></atom:name>
    </atom:author>
    <atom:category term="LOAD_PROGRAM_TABLE_MISMATCH" label="ABAP runtime error"/>
    <atom:category term="SAPLZJG_LOG_REST_COMM" label="Terminated ABAP program"/>
    <atom:id>/sap/bc/adt/vit/runtime/dumps/...</atom:id>
    <atom:link href="..." rel="self" type="text/plain"/>
    <atom:published>2026-01-23T07:40:38Z</atom:published>
    <atom:summary type="html">
      <!-- HTML 格式的详细信息 -->
    </atom:summary>
    <atom:title>The runtime object of a database table has been changed.</atom:title>
    <atom:updated>2026-01-23T07:40:38Z</atom:updated>
  </atom:entry>
</atom:feed>
```

### 关键 XML 元素

| 元素 | 说明 | 示例 |
|------|------|------|
| `atom:feed` | Feed 容器 | - |
| `atom:entry` | 单个条目 | - |
| `atom:author` | 作者 | 用户名 |
| `atom:category` | 分类 | 错误类型、程序名 |
| `atom:id` | 唯一标识 | ADT URI |
| `atom:link` | 链接 | self, alternate 等 |
| `atom:published` | 发布时间 | ISO 8601 |
| `atom:summary` | 摘要 | HTML 格式的详细信息 |
| `atom:title` | 标题 | 错误标题 |
| `atom:updated` | 更新时间 | ISO 8601 |

---

## 🎯 客户端实现建议

### 1. Runtime Dumps API

```typescript
interface DumpsQueryOptions {
  query?: string;           // $query 参数
  top?: number;             // $top 参数
  skip?: number;            // $skip 参数
  inlineCount?: boolean;    // $inlinecount 参数
  from?: string;            // from 参数 (YYYYMMDDHHmmss)
}

interface DumpEntry {
  id: string;
  author: string;
  categories: Array<{
    term: string;
    label: string;
  }>;
  title: string;
  summary: string;  // HTML 格式
  published: Date;
  updated: Date;
  links: Array<{
    href: string;
    rel: string;
    type: string;
  }>;
}

async function getDumps(options: DumpsQueryOptions): Promise<{
  dumps: DumpEntry[];
  count?: number;
  title: string;
  updated: Date;
}>
```

### 2. System Messages API

```typescript
async function getSystemMessages(): Promise<{
  messages: MessageEntry[];
  title: string;
  updated: Date;
}>
```

### 3. Package Operations API

```typescript
interface PackageValidationOptions {
  objname: string;
  description: string;
  packagetype: 'development' | 'production' | 'test';
  swcomp: string;
  checkmode: 'basic' | 'full';
}

async function validatePackage(options: PackageValidationOptions): Promise<ValidationResult>

async function getTransportLayers(nameFilter: string = "*"): Promise<TransportLayer[]>
```

### 4. Query Builder

```typescript
class AdtQueryBuilder {
  equals(field: string, value: string): string;
  and(...conditions: string[]): string;
  or(...conditions: string[]): string;
  not(condition: string): string;

  build(): string;
}

// 使用示例
const query = new AdtQueryBuilder()
  .and(
    this.equals('responsible', ''),
    this.equals('user', '')
  )
  .build();
```

---

## 📝 URL 编码注意事项

查询参数必须正确编码：

```
// 原始查询
$query=and( equals( responsible,  ) )

// URL 编码后
$query=and%28%20equals%28%20responsible%2c%20%20%29%20%29

// 编码映射
空格 -> %20
( -> %28
) -> %29
, -> %2c
```

---

## 🚀 性能优化建议

### 1. 使用 X-sap-adt-profiling

启用性能分析以监控 API 响应时间：

```typescript
headers: {
  'X-sap-adt-profiling': 'server-time'
}
```

响应头会包含：
```
X-sap-adt-profiling: server-time=72062  // 72.062 ms
```

### 2. 分页查询

对于大数据集，使用 `$top` 和 `$skip` 分页：

```typescript
// 第一页
getDumps({ top: 50, skip: 0, inlineCount: true })

// 第二页
getDumps({ top: 50, skip: 50, inlineCount: true })
```

### 3. 时间范围过滤

使用 `from` 参数减少数据量：

```typescript
// 只查询最近的 dumps
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const from = formatTimestamp(yesterday);  // YYYYMMDDHHmmss

getDumps({ from })
```

---

## 🔍 发现的客户端特性

### Eclipse ADT 特征

```
User-Agent: Eclipse/4.34.0.v20241120-1800 (win32; x86_64; Java 21.0.6) ADT/3.48.1 (devedition)
```

**信息**:
- Eclipse 版本: 4.34.0
- ADT 版本: 3.48.1
- 版本类型: devedition (开发者版本)
- 操作系统: Windows 64-bit
- Java 版本: 21.0.6

### 建议的自定义 User-Agent

```typescript
const USER_AGENT = 'ABAP-ADT-API/1.0.0 (TypeScript; Node.js) ADT-Compatible';

headers: {
  'User-Agent': USER_AGENT
}
```

---

## 📌 总结

### 关键发现

1. **Feed 是主要响应格式**: 大多数端点返回 Atom XML Feed
2. **OData 风格查询**: 使用 $query, $top, $skip 等参数
3. **性能分析支持**: 通过 X-sap-adt-profiling 头
4. **丰富的包操作**: 创建、验证、查询包
5. **CTS 集成**: 传输请求检查和验证

### 需要实现的功能

- [x] Runtime Dumps API
- [x] System Messages API
- [ ] Package Operations (完整实现)
- [ ] Query Builder
- [ ] Transport Checks API
- [ ] Object Properties Query

### 兼容性

所有 API 都与现有的 `feeds.ts` 实现兼容，可以扩展现有功能。
