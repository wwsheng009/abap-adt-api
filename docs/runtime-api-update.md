# ADT Runtime API 更新总结

## 📋 更新概述

基于 SAP ADT REST API 拦截系统的真实数据分析，我们增强了 `abap-adt-api` 客户端的 Runtime API 功能。

**数据来源**: http://HOST:PORT/debug/adt?sap-client=300

---

## ✨ 新增功能

### 1. 🆕 Runtime Dumps API

**文件**: `src/api/runtime.ts`

#### 功能

- ✅ 获取运行时 dumps 列表
- ✅ 按用户/责任人过滤
- ✅ 时间范围查询
- ✅ 分页支持（$top, $skip）
- ✅ 内联计数（$inlinecount）
- ✅ 获取单个 dump 详情
- ✅ 查询构建器（AdtQueryBuilder）

#### API 示例

```typescript
import { getDumps, AdtQueryBuilder } from 'abap-adt-api';

// 基本查询
const result = await getDumps(client.http, {
  user: '',
  top: 50,
  inlineCount: true
});

// 自定义查询
const builder = new AdtQueryBuilder();
const query = builder.and(
  builder.equals('responsible', ''),
  builder.equals('user', '')
).build();

const result = await getDumps(client.http, {
  query,
  top: 100
});

// 时间范围
import { formatAdtTimestamp } from 'abap-adt-api';
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const result = await getDumps(client.http, {
  from: formatAdtTimestamp(yesterday)
});
```

---

### 2. 🆕 System Messages API

#### 功能

- ✅ 获取系统消息列表
- ✅ Atom XML Feed 解析
- ✅ 完整的类型定义

#### API 示例

```typescript
import { getSystemMessages } from 'abap-adt-api';

const messages = await getSystemMessages(client.http);
console.log(`系统消息: ${messages.messages.length}`);
```

---

### 3. 🆕 Query Builder

#### 功能

- ✅ 构建复杂的 ADT 查询表达式
- ✅ 支持 equals, and, or, not 操作符
- ✅ 链式调用支持

#### API 示例

```typescript
import { AdtQueryBuilder } from 'abap-adt-api';

const builder = new AdtQueryBuilder();

// 单条件
const q1 = builder.equals('field', 'value');

// AND 条件
const q2 = builder.and(
  builder.equals('user', ''),
  builder.equals('responsible', '')
);

// OR 条件
const q3 = builder.or(
  builder.equals('status', 'ACTIVE'),
  builder.equals('status', 'PENDING')
);

// NOT 条件
const q4 = builder.not(builder.equals('deleted', 'true'));

// 链式调用
const q5 = builder
  .where(builder.equals('user', ''))
  .where(builder.equals('responsible', ''))
  .build();
```

---

### 4. 🆕 时间戳工具函数

#### 功能

- ✅ `formatAdtTimestamp()` - 格式化日期为 ADT 时间戳
- ✅ `parseAdtTimestamp()` - 解析 ADT 时间戳

#### API 示例

```typescript
import { formatAdtTimestamp, parseAdtTimestamp } from 'abap-adt-api';

// 格式化
const date = new Date();
const timestamp = formatAdtTimestamp(date);
// 输出: "20260123143022"

// 解析
const parsed = parseAdtTimestamp("20260123143022");
// 输出: Date 对象
```

---

## 📚 文档

### 新增文档

1. **API 分析报告** (`docs/adt-api-analysis.md`)
   - 完整的 ADT API 端点分析
   - 请求/响应格式说明
   - 查询语法详解
   - 性能优化建议

2. **使用指南** (`docs/runtime-api-usage.md`)
   - 完整的使用示例
   - 类型定义说明
   - 错误处理指南
   - TypeScript 支持

3. **测试文件** (`src/test/runtime.test.ts`)
   - Query Builder 单元测试
   - 时间戳函数测试
   - 完整的测试覆盖

---

## 🏗️ 文件结构

```
abap-adt-api/
├── src/
│   ├── api/
│   │   ├── runtime.ts          # ✨ 新增 - Runtime API
│   │   ├── feeds.ts            # 已存在 - Dumps 基础实现
│   │   └── index.ts            # ✏️ 更新 - 导出 runtime
│   ├── test/
│   │   └── runtime.test.ts     # ✨ 新增 - Runtime API 测试
│   └── ...
├── docs/
│   ├── adt-api-analysis.md     # ✨ 新增 - API 分析
│   └── runtime-api-usage.md    # ✨ 新增 - 使用指南
└── runtime-api-update.md       # ✨ 新增 - 本文档
```

---

## 📊 类型定义

### DumpsQueryOptions

```typescript
interface DumpsQueryOptions {
  query?: string;           // 查询表达式
  top?: number;             // 最大返回数量
  skip?: number;            // 跳过记录数
  inlineCount?: boolean;    // 包含总数
  from?: string;            // 开始时间 (YYYYMMDDHHmmss)
  responsible?: string;     // 按责任人过滤
  user?: string;            // 按用户过滤
}
```

### DumpEntry

```typescript
interface DumpEntry {
  id: string;
  author: string;
  categories: Array<{
    term: string;      // 错误代码
    label: string;     // 标签
  }>;
  title: string;        // 错误标题
  summary: string;      // HTML 详情
  published: Date;
  updated: Date;
  links: Array<{
    href: string;
    rel: string;
    type?: string;
  }>;
}
```

### DumpsResponse

```typescript
interface DumpsResponse {
  dumps: DumpEntry[];
  count?: number;
  title: string;
  updated: Date;
  href: string;
}
```

---

## 🚀 快速开始

### 安装

```bash
npm install abap-adt-api
```

### 基本使用

```typescript
import { AdtClient } from 'abap-adt-api';
import { getDumps, formatAdtTimestamp } from 'abap-adt-api';

const client = new AdtClient({
  host: 'host',
  port: 8080,
  client: '300',
  auth: {
    username: '',
    password: ''
  }
});

// 获取最近的 dumps
const result = await getDumps(client.http, {
  user: '',
  top: 50,
  inlineCount: true
});

console.log(`找到 ${result.count} 个 dumps`);
result.dumps.forEach(dump => {
  console.log(`- ${dump.title}`);
});
```

---

## 🎯 实际应用场景

### 1. 监控特定用户的错误

```typescript
async function monitorUserErrors(username: string) {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await getDumps(client.http, {
    user: username,
    from: formatAdtTimestamp(lastWeek),
    top: 100,
    inlineCount: true
  });

  // 统计错误类型
  const errorTypes = new Map<string, number>();
  result.dumps.forEach(dump => {
    dump.categories.forEach(cat => {
      if (cat.label === 'ABAP runtime error') {
        errorTypes.set(cat.term, (errorTypes.get(cat.term) || 0) + 1);
      }
    });
  });

  return { result, errorTypes };
}
```

### 2. 分页获取所有数据

```typescript
async function getAllDumps(username: string) {
  let allDumps = [];
  let skip = 0;
  const pageSize = 50;

  while (true) {
    const result = await getDumps(client.http, {
      user: username,
      top: pageSize,
      skip,
      inlineCount: true
    });

    allDumps.push(...result.dumps);

    if (result.count && allDumps.length >= result.count) break;
    if (result.dumps.length < pageSize) break;

    skip += pageSize;
  }

  return allDumps;
}
```

### 3. 定期检查系统消息

```typescript
async function checkSystemMessages() {
  const messages = await getSystemMessages(client.http);

  messages.messages.forEach(msg => {
    if (msg.title.includes('IMPORTANT')) {
      console.log(`⚠️  ${msg.title}`);
      // 发送通知
    }
  });
}
```

---

## 🔧 与现有代码的兼容性

### feeds.ts 的变化

现有的 `feeds.ts` 中的 `dumps()` 函数仍然可用：

```typescript
import { dumps } from 'abap-adt-api';

// 旧代码仍然工作
const result = await dumps(client.http, "query string");
```

**新增功能在 `runtime.ts` 中，不影响现有代码。**

---

## 📈 性能特性

### 1. 服务器性能分析

```typescript
const result = await getDumps(client.http, {
  user: ''
});

// 响应头包含: X-sap-adt-profiling: server-time=72062
// 表示服务器处理时间: 72.062 ms
```

### 2. 分页优化

```typescript
// ✅ 推荐 - 分页查询
const page1 = await getDumps(client.http, { top: 50, skip: 0 });
const page2 = await getDumps(client.http, { top: 50, skip: 50 });

// ❌ 避免 - 一次性获取大量数据
const all = await getDumps(client.http, { top: 10000 });
```

### 3. 时间范围过滤

```typescript
// ✅ 推荐 - 限制时间范围
const recent = await getDumps(client.http, {
  from: formatAdtTimestamp(new Date(Date.now() - 24 * 60 * 60 * 1000))
});
```

---

## 🧪 测试

运行测试：

```bash
npm test -- runtime.test.ts
```

测试覆盖：

- ✅ Query Builder 所有操作符
- ✅ 时间戳格式化和解析
- ✅ 复杂查询构建
- ✅ 边界条件处理

---

## 📝 后续计划

### 短期

- [ ] 添加 Package Operations API 完整实现
- [ ] 添加 Transport Checks API
- [ ] 添加 Object Properties Query API

### 中期

- [ ] 支持更多查询操作符（contains, startsWith 等）
- [ ] 添加缓存机制
- [ ] 添加重试逻辑

### 长期

- [ ] WebSocket 支持（实时消息）
- [ ] 批量操作 API
- [ ] 完整的 CTS API

---

## 🔗 相关链接

- [API 分析报告](./adt-api-analysis.md)
- [使用指南](./runtime-api-usage.md)
- [SAP ADT 文档](https://help.sap.com/viewer/p/SAP_ADT)
- [拦截系统实现](../abap-ai/docs/http-interception/)

---

## 🎉 总结

基于真实 ADT API 拦截数据，我们：

1. ✅ **新增** Runtime Dumps API（完整的查询和过滤）
2. ✅ **新增** System Messages API
3. ✅ **新增** Query Builder（构建复杂查询）
4. ✅ **新增** 时间戳工具函数
5. ✅ **完善** 类型定义和文档
6. ✅ **添加** 完整的测试覆盖

**所有功能都是基于真实 API 调用分析得出，确保准确性和实用性。** 🚀
