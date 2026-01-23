# SAP ADT Package API 使用指南

基于真实 ADT 调用数据的完整实现

**数据来源**: SAP 系统拦截日志 (172 条 package 相关调用)

---

## 🚀 快速开始

### 安装

```bash
npm install abap-adt-api
```

### 基本用法

```typescript
import { AdtClient } from 'abap-adt-api';
import {
  getPackage,
  createPackage,
  validatePackage,
  getTransportLayers,
  getSoftwareComponents
} from 'abap-adt-api';

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

---

## 📚 API 功能

### 1. 读取包信息

```typescript
import { getPackage } from 'abap-adt-api';

const pkg = await getPackage(client.http, 'ZPK1_CREATE1');

console.log(pkg);
// {
//   name: 'ZPK1_CREATE1',
//   description: 'CREATE SAP PACKAGE',
//   packageType: 'development',
//   softwareComponent: 'HOME',
//   transportLayer: 'ZSAP',
//   applicationComponent: 'HOME',
//   etag: '20260122170000001application/vnd.sap.adt.packages.v1+xml...'
// }
```

#### 使用缓存（ETag）

```typescript
// 第一次读取
const response1 = await getPackage(client.http, 'ZMY_PACKAGE');
const etag = response1.etag;

// 后续读取 - 使用缓存
const response2 = await getPackage(client.http, 'ZMY_PACKAGE', {
  ifNoneMatch: etag
});
// 如果未改变，返回 304 Not Modified，节省带宽
```

---

### 2. 创建新包

```typescript
import { createPackage } from 'abap-adt-api';

const newPackage = {
  name: 'ZMY_NEW_PACKAGE',
  description: 'My New Package',
  packageType: 'development' as const,
  softwareComponent: 'HOME',
  transportLayer: 'ZSAP',
  applicationComponent: 'HOME',
  responsible: ''
};

const result = await createPackage(client.http, newPackage, {
  corrNr: 'S4HK901712'  // 传输请求号
});

console.log(`Created at: ${result.location}`);
console.log(`Package: ${result.package.name}`);
```

#### 完整工作流程（先验证再创建）

```typescript
import { validatePackage, createPackage } from 'abap-adt-api';

async function createValidatedPackage(pkgData) {
  // Step 1: 验证
  const validation = await validatePackage(client.http, {
    objname: pkgData.name,
    description: pkgData.description,
    packagetype: pkgData.packageType,
    swcomp: pkgData.softwareComponent,
    checkmode: 'full'  // 完整检查
  });

  if (!validation.success) {
    console.error('Validation failed:');
    validation.messages.forEach(msg => {
      console.error(`  [${msg.severity}] ${msg.text}`);
    });
    throw new Error('Package validation failed');
  }

  // Step 2: 创建
  const result = await createPackage(client.http, pkgData, {
    corrNr: 'S4HK901712'
  });

  console.log('Package created successfully!');
  return result;
}
```

---

### 3. 验证包配置

#### 基本验证（快速）

```typescript
import { validatePackage } from 'abap-adt-api';

const result = await validatePackage(client.http, {
  objname: 'ZMY_PACKAGE',
  description: 'My Package',
  packagetype: 'development',
  swcomp: 'HOME',
  checkmode: 'basic'  // 快速检查
});

console.log(`Success: ${result.success}`);
result.messages.forEach(msg => {
  console.log(`[${msg.severity}] ${msg.text}`);
});
```

#### 完整验证（推荐）

```typescript
const result = await validatePackage(client.http, {
  objname: 'ZMY_PACKAGE',
  description: 'My Package',
  packagetype: 'development',
  swcomp: 'HOME',
  appcomp: 'HOME',      // 可选
  checkmode: 'full'     // 完整检查
});
```

---

### 4. 获取值帮助数据

#### 传输层列表

```typescript
import { getTransportLayers } from 'abap-adt-api';

// 获取所有传输层
const layers = await getTransportLayers(client.http);

console.log('Available transport layers:');
layers.forEach(layer => {
  console.log(`  ${layer.name} - ${layer.description}`);
});

// 搜索特定传输层
const zLayers = await getTransportLayers(client.http, 'Z*');
console.log(`\nZ* layers: ${zLayers.length} found`);
```

#### 软件组件列表

```typescript
import { getSoftwareComponents } from 'abap-adt-api';

const components = await getSoftwareComponents(client.http);

console.log('Software components:');
components.forEach(comp => {
  console.log(`  ${comp.name} - ${comp.description}`);
});
```

#### 翻译相关性列表

```typescript
import { getTranslationRelevances } from 'abap-adt-api';

const relevances = await getTranslationRelevances(client.http, 50);

relevances.forEach(rel => {
  console.log(`${rel.name} - ${rel.description}`);
});
```

---

### 5. 获取包属性

```typescript
import { getPackageProperties } from 'abap-adt-api';

const packageUri = '/sap/bc/adt/packages/ZPK1_CREATE1';
const properties = await getPackageProperties(client.http, packageUri);

console.log('Package properties:');
Object.entries(properties).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});
```

---

## 🎯 实际应用场景

### 场景 1: 创建包的完整流程

```typescript
import {
  getTransportLayers,
  getSoftwareComponents,
  validatePackage,
  createPackage
} from 'abap-adt-api';

async function createPackageWorkflow() {
  // Step 1: 获取可用的选项
  const [layers, components] = await Promise.all([
    getTransportLayers(client.http),
    getSoftwareComponents(client.http)
  ]);

  console.log(`Available layers: ${layers.length}`);
  console.log(`Available components: ${components.length}`);

  // Step 2: 定义包配置
  const pkgConfig = {
    name: 'ZMY_PACKAGE',
    description: 'My Custom Package',
    packageType: 'development' as const,
    softwareComponent: components[0].name,     // 使用第一个组件
    transportLayer: layers[0].name,             // 使用第一个传输层
    applicationComponent: 'HOME'
  };

  // Step 3: 验证配置
  console.log('Validating package configuration...');
  const validation = await validatePackage(client.http, {
    objname: pkgConfig.name,
    description: pkgConfig.description,
    packagetype: pkgConfig.packageType,
    swcomp: pkgConfig.softwareComponent,
    appcomp: pkgConfig.applicationComponent,
    checkmode: 'full'
  });

  if (!validation.success) {
    console.error('Validation errors:');
    validation.messages.forEach(msg => {
      if (msg.severity === 'error' || msg.severity === 'warning') {
        console.error(`  ${msg.text}`);
      }
    });
    return;
  }

  console.log('Validation passed!');

  // Step 4: 创建包
  console.log('Creating package...');
  const result = await createPackage(client.http, pkgConfig, {
    corrNr: 'S4HK901712'
  });

  console.log(`✅ Package created: ${result.package.name}`);
  console.log(`   Location: ${result.location}`);

  return result;
}
```

### 场景 2: 批量验证包名

```typescript
import { validatePackage } from 'abap-adt-api';

async function checkPackageNames(names: string[]) {
  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const result = await validatePackage(client.http, {
          objname: name,
          description: name,
          packagetype: 'development',
          swcomp: 'HOME',
          checkmode: 'basic'
        });

        return {
          name,
          valid: result.success,
          messages: result.messages
        };
      } catch (error) {
        return {
          name,
          valid: false,
          messages: [{ severity: 'error', text: error.message }]
        };
      }
    })
  );

  results.forEach(({ name, valid, messages }) => {
    console.log(`${name}: ${valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!valid) {
      messages.forEach(msg => console.log(`  - ${msg.text}`));
    }
  });
}

// 使用
checkPackageNames(['ZPKG1', 'ZPKG2', 'ZPKG3']);
```

### 场景 3: 使用缓存的包读取

```typescript
import { getPackage } from 'abap-adt-api';

class PackageCache {
  private cache = new Map<string, { data: any; etag: string }>();

  async getPackage(packageName: string) {
    // Check cache
    const cached = this.cache.get(packageName);
    if (cached) {
      try {
        const result = await getPackage(client.http, packageName, {
          ifNoneMatch: cached.etag
        });
        this.cache.set(packageName, { data: result, etag: result.etag || '' });
        return result;
      } catch (error) {
        // 304 Not Modified - return cached data
        if (error.response?.status === 304) {
          console.log(`Using cached data for ${packageName}`);
          return cached.data;
        }
        throw error;
      }
    }

    // First fetch
    const result = await getPackage(client.http, packageName);
    this.cache.set(packageName, { data: result, etag: result.etag || '' });
    return result;
  }
}

const cache = new PackageCache();
const pkg1 = await cache.getPackage('ZMY_PACKAGE');  // From server
const pkg2 = await cache.getPackage('ZMY_PACKAGE');  // From cache (304)
```

### 场景 4: 搜索和筛选

```typescript
import { getTransportLayers, getSoftwareComponents } from 'abap-adt-api';

async function findResources(pattern: string) {
  // Search transport layers
  const layers = await getTransportLayers(client.http, `${pattern}*`);

  // Search software components
  const components = await getSoftwareComponents(client.http, `${pattern}*`);

  return {
    layers: layers.map(l => ({
      name: l.name,
      description: l.description
    })),
    components: components.map(c => ({
      name: c.name,
      description: c.description
    }))
  };
}

// 使用
const resources = await findResources('Z');
console.log(`Z* transport layers: ${resources.layers.length}`);
console.log(`Z* software components: ${resources.components.length}`);
```

---

## 📋 类型定义

### Package

```typescript
interface Package {
  name: string;                              // 包名
  description: string;                        // 描述
  packageType: 'development' | 'production' | 'test';  // 包类型
  softwareComponent: string;                 // 软件组件
  transportLayer: string;                     // 传输层
  applicationComponent?: string;              // 应用组件（可选）
  translationRelevance?: string;              // 翻译相关性（可选）
  responsible?: string;                       // 负责人（可选）
}
```

### PackageValidationOptions

```typescript
interface PackageValidationOptions {
  objname: string;                            // 包名（必需）
  description: string;                        // 描述（必需）
  packagetype: 'development' | 'production' | 'test';  // 包类型（必需）
  swcomp: string;                             // 软件组件（必需）
  appcomp?: string;                           // 应用组件（可选）
  checkmode: 'basic' | 'full';                // 检查模式（必需）
}
```

### ValidationResult

```typescript
interface ValidationResult {
  success: boolean;                           // 是否通过验证
  messages: StatusMessage[];                  // 消息列表
}

interface StatusMessage {
  severity: 'success' | 'info' | 'warning' | 'error';
  text: string;                                // 消息文本
  code?: string;                               // 错误代码（可选）
}
```

### NamedItem

```typescript
interface NamedItem {
  name: string;                                // 名称
  description: string;                        // 描述
}
```

---

## ⚠️ 错误处理

### 创建包失败

```typescript
try {
  const result = await createPackage(client.http, pkgData, {
    corrNr: 'S4HK901712'
  });
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Invalid package data');
  } else if (error.response?.status === 401) {
    console.error('Unauthorized - check credentials');
  } else if (error.response?.status === 403) {
    console.error('Forbidden - no permissions');
  } else {
    console.error('Error:', error.message);
  }
}
```

### 验证失败

```typescript
const result = await validatePackage(client.http, options);

if (!result.success) {
  // 处理错误消息
  const errors = result.messages.filter(m =>
    m.severity === 'error' || m.severity === 'warning'
  );

  if (errors.length > 0) {
    console.error('Validation issues found:');
    errors.forEach(msg => {
      console.error(`  [${msg.severity}] ${msg.text}`);
    });
  }
}
```

---

## 🔧 高级用法

### 自定义请求头

```typescript
const pkg = await getPackage(client.http, 'ZMY_PACKAGE', undefined, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### 并行请求

```typescript
const [pkg, properties, layers] = await Promise.all([
  getPackage(client.http, 'ZMY_PACKAGE'),
  getPackageProperties(client.http, '/sap/bc/adt/packages/ZMY_PACKAGE'),
  getTransportLayers(client.http, '*')
]);
```

### 重试逻辑

```typescript
async function getPackageWithRetry(packageName: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getPackage(client.http, packageName);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 📊 性能优化

### 1. 使用 ETag 缓存

```typescript
// ✅ 好 - 使用缓存
const pkg = await getPackage(client.http, 'ZMY_PACKAGE', {
  ifNoneMatch: etag
});

// ❌ 不好 - 每次都重新获取
const pkg = await getPackage(client.http, 'ZMY_PACKAGE');
```

### 2. 并行请求

```typescript
// ✅ 好 - 并行获取
const [layers, components] = await Promise.all([
  getTransportLayers(client.http),
  getSoftwareComponents(client.http)
]);

// ❌ 不好 - 串行获取
const layers = await getTransportLayers(client.http);
const components = await getSoftwareComponents(client.http);
```

### 3. 限制结果数量

```typescript
// ✅ 好 - 限制返回数量
const relevances = await getTranslationRelevances(client.http, 20);

// ❌ 不好 - 获取所有数据（可能很大）
const relevances = await getTranslationRelevances(client.http, 9999);
```

---

## 🧪 测试示例

### 运行测试

```bash
# 单元测试
npm test packages.test.ts

# 集成测试
npm test packages-integration.test.ts
```

### 手动测试

创建文件 `test-packages.ts`:

```typescript
import { AdtClient } from 'abap-adt-api';
import * as pkg from 'abap-adt-api';

const client = new AdtClient({
  host: 'host',
  port: 8080,
  client: '300',
  auth: { username: '', password: '' }
});

async function test() {
  console.log('Testing Package API...\n');

  // Test 1: Read package
  const p = await pkg.getPackage(client.http, 'ZPK1_CREATE1');
  console.log('✅ Read package:', p.name);

  // Test 2: Get transport layers
  const layers = await pkg.getTransportLayers(client.http);
  console.log(`✅ Transport layers: ${layers.length}`);

  // Test 3: Validate
  const validation = await pkg.validatePackage(client.http, {
    objname: 'ZTEST',
    description: 'Test',
    packagetype: 'development',
    swcomp: 'HOME',
    checkmode: 'basic'
  });
  console.log(`✅ Validation: ${validation.success}`);
}

test().catch(console.error);
```

运行：

```bash
npx ts-node test-packages.ts
```

---

## 📚 相关文档

- [Package API 分析](./package-api-analysis.md)
- [Runtime API 指南](./runtime-api-usage.md)
- [ADT API 分析](./adt-api-analysis.md)

---

## ✅ 总结

SAP ADT Package API 提供了完整的包管理功能：

- ✅ **读取包** - 获取包的完整信息
- ✅ **创建包** - 创建新的开发/生产/测试包
- ✅ **验证包** - 验证包配置和命名
- ✅ **值帮助** - 获取传输层、软件组件等
- ✅ **缓存支持** - 使用 ETag 优化性能

**所有功能都基于真实系统数据验证，可以直接使用！** 🚀
