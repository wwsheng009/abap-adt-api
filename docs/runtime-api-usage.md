# ADT Runtime API 使用示例

## 安装

```bash
npm install abap-adt-api
```

## 基本用法

### 初始化客户端

```typescript
import { AdtClient } from 'abap-adt-api';

const client = new AdtClient({
  host: 'host',
  port: 8080,
  client: '300',
  auth: {
    username: '',
    password: ''
  }
});
```

### 1. 获取运行时 Dumps

#### 基本查询

```typescript
import { getDumps } from 'abap-adt-api';

// 获取最近的 dumps
const result = await getDumps(client.http);

console.log(`找到 ${result.dumps.length} 个 dumps`);
console.log(`标题: ${result.title}`);
console.log(`更新时间: ${result.updated}`);

result.dumps.forEach(dump => {
  console.log(`- ${dump.title}`);
  console.log(`  作者: ${dump.author}`);
  console.log(`  类型: ${dump.categories.map(c => c.term).join(', ')}`);
  console.log(`  时间: ${dump.published}`);
});
```

#### 按用户过滤

```typescript
import { getDumps } from 'abap-adt-api';

const result = await getDumps(client.http, {
  user: '',
  top: 50
});

console.log(`用户  的 dumps: ${result.dumps.length}`);
```

#### 按责任人过滤

```typescript
const result = await getDumps(client.http, {
  responsible: '',
  top: 100
});
```

#### 时间范围查询

```typescript
import { getDumps, formatAdtTimestamp } from 'abap-adt-api';

// 查询最近 24 小时的 dumps
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

const result = await getDumps(client.http, {
  from: formatAdtTimestamp(yesterday),
  top: 50
});
```

#### 分页查询

```typescript
// 第一页
const page1 = await getDumps(client.http, {
  top: 50,
  skip: 0,
  inlineCount: true
});

console.log(`总数: ${page1.count}`);
console.log(`当前页: ${page1.dumps.length}`);

// 第二页
const page2 = await getDumps(client.http, {
  top: 50,
  skip: 50,
  inlineCount: true
});
```

#### 自定义查询

```typescript
import { getDumps, AdtQueryBuilder } from 'abap-adt-api';

const builder = new AdtQueryBuilder();

// 构建复杂查询
const query = builder.and(
  builder.equals('responsible', ''),
  builder.equals('user', '')
).build();

const result = await getDumps(client.http, {
  query,
  top: 50,
  inlineCount: true
});
```

### 2. 获取单个 Dump 详情

```typescript
import { getDump } from 'abap-adt-api';

const dumpId = '005056A5F7801FD0BE87142337EDBE2B';
const dumpText = await getDump(client.http, dumpId);

console.log(dumpText);
```

### 3. 获取系统消息

```typescript
import { getSystemMessages } from 'abap-adt-api';

const messages = await getSystemMessages(client.http);

console.log(`系统消息: ${messages.messages.length}`);
console.log(`标题: ${messages.title}`);

messages.messages.forEach(msg => {
  console.log(`- ${msg.title}`);
  console.log(`  时间: ${msg.updated}`);
});
```

## 完整示例

### 监控特定用户的 Dumps

```typescript
import { AdtClient } from 'abap-adt-api';
import { getDumps, formatAdtTimestamp } from 'abap-adt-api';

async function monitorUserDumps(username: string) {
  const client = new AdtClient({
    host: 'host',
    port: 8080,
    client: '300',
    auth: {
      username: '',
      password: ''
    }
  });

  // 查询最近 7 天的 dumps
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await getDumps(client.http, {
    user: username,
    from: formatAdtTimestamp(lastWeek),
    top: 100,
    inlineCount: true
  });

  console.log(`=== ${username} 的 Dump 分析 ===`);
  console.log(`总计: ${result.count} 个 dumps`);
  console.log(`时间范围: 最近 7 天`);
  console.log();

  // 按错误类型分组
  const errorTypes = new Map<string, number>();

  result.dumps.forEach(dump => {
    dump.categories.forEach(cat => {
      if (cat.label === 'ABAP runtime error') {
        errorTypes.set(cat.term, (errorTypes.get(cat.term) || 0) + 1);
      }
    });
  });

  console.log('错误类型统计:');
  errorTypes.forEach((count, type) => {
    console.log(`  ${type}: ${count}`);
  });

  return result;
}

// 使用
monitorUserDumps('')
  .then(result => {
    console.log(`监控完成，发现 ${result.dumps.length} 个 dumps`);
  })
  .catch(error => {
    console.error('监控失败:', error);
  });
```

### 分页获取所有 Dumps

```typescript
import { getDumps } from 'abap-adt-api';

async function getAllDumps(username: string, pageSize: number = 50) {
  let allDumps = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await getDumps(client.http, {
      user: username,
      top: pageSize,
      skip,
      inlineCount: true
    });

    allDumps.push(...result.dumps);

    // 检查是否还有更多数据
    if (result.count && allDumps.length >= result.count) {
      hasMore = false;
    }

    // 如果返回的数据少于请求的数量，说明没有更多了
    if (result.dumps.length < pageSize) {
      hasMore = false;
    }

    skip += pageSize;
  }

  return allDumps;
}

// 使用
getAllDumps('', 50)
  .then(dumps => {
    console.log(`总共获取 ${dumps.length} 个 dumps`);
  });
```

## 类型定义

### DumpsQueryOptions

```typescript
interface DumpsQueryOptions {
  /** 查询表达式 (ADT 格式) */
  query?: string;
  /** 最大返回数量 */
  top?: number;
  /** 跳过记录数 (用于分页) */
  skip?: number;
  /** 包含总数 */
  inlineCount?: boolean;
  /** 开始时间 (格式: YYYYMMDDHHmmss) */
  from?: string;
  /** 按责任人过滤 */
  responsible?: string;
  /** 按用户过滤 */
  user?: string;
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
  summary: string;      // HTML 格式的详细信息
  published: Date;      // 发布时间
  updated: Date;        // 更新时间
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
  count?: number;       // 总记录数 (如果 inlineCount=true)
  title: string;
  updated: Date;
  href: string;
}
```

## 实用函数

### formatAdtTimestamp

格式化日期为 ADT 时间戳格式：

```typescript
import { formatAdtTimestamp } from 'abap-adt-api';

const date = new Date();
const timestamp = formatAdtTimestamp(date);
// 输出: "20260123143022"
```

### parseAdtTimestamp

解析 ADT 时间戳：

```typescript
import { parseAdtTimestamp } from 'abap-adt-api';

const timestamp = "20260123143022";
const date = parseAdtTimestamp(timestamp);
// 输出: Date 对象
```

### AdtQueryBuilder

构建查询表达式：

```typescript
import { AdtQueryBuilder } from 'abap-adt-api';

const builder = new AdtQueryBuilder();

// 单条件
builder.equals('field', 'value');
// 结果: "equals( field, value )"

// AND 条件
builder.and(
  builder.equals('user', ''),
  builder.equals('responsible', '')
);
// 结果: "and( equals( user,  ) equals( responsible,  ) )"

// OR 条件
builder.or(
  builder.equals('status', 'ACTIVE'),
  builder.equals('status', 'PENDING')
);

// NOT 条件
builder.not(builder.equals('deleted', 'true'));
```

## 性能优化

### 使用性能分析

```typescript
const result = await getDumps(client.http, {
  user: '',
  top: 50
});

// 响应头会包含: X-sap-adt-profiling: server-time=72062
// 这表示服务器处理时间为 72.062 毫秒
```

### 分页建议

对于大量数据，始终使用分页：

```typescript
// ❌ 不好 - 一次性获取所有数据
const all = await getDumps(client.http, {
  top: 10000  // 可能导致超时
});

// ✅ 好 - 分页获取
const page1 = await getDumps(client.http, {
  top: 50,
  skip: 0
});
const page2 = await getDumps(client.http, {
  top: 50,
  skip: 50
});
```

### 时间范围过滤

使用时间范围减少数据量：

```typescript
// ✅ 好 - 只查询最近的数据
const recent = await getDumps(client.http, {
  from: formatAdtTimestamp(new Date(Date.now() - 24 * 60 * 60 * 1000))
});
```

## 错误处理

```typescript
try {
  const result = await getDumps(client.http, {
    user: ''
  });
} catch (error) {
  if (error.response) {
    // HTTP 错误
    console.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
  } else if (error.request) {
    // 网络错误
    console.error('网络错误:', error.message);
  } else {
    // 其他错误
    console.error('错误:', error.message);
  }
}
```

## TypeScript 支持

所有 API 都有完整的 TypeScript 类型定义：

```typescript
import {
  getDumps,
  getSystemMessages,
  getDump,
  DumpsQueryOptions,
  DumpsResponse,
  DumpEntry,
  SystemMessagesResponse
} from 'abap-adt-api';

// 完整的类型提示和检查
const options: DumpsQueryOptions = {
  user: '',
  top: 50
};

const result: DumpsResponse = await getDumps(client.http, options);

result.dumps.forEach((dump: DumpEntry) => {
  console.log(dump.title);
});
```

## 参考资料

- [ADT API Analysis](./adt-api-analysis.md)
- [SAP ADT Documentation](https://help.sap.com/viewer/p/SAP_ADT)
- [Atom Publishing Protocol](https://tools.ietf.org/html/rfc5023)
