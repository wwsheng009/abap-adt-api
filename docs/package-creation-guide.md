# 如何创建 SAP Package - 完整指南

基于 ADT REST API 拦截系统的真实数据分析

---

## ✅ 是的！我找到了完整的创建 Package 功能

从拦截系统中发现了完整的 package 创建流程。

---

## 📋 创建 Package 的 API 端点

### 端点信息

**端点**: `POST /sap/bc/adt/packages`

**查询参数**:
- `corrNr` - 传输请求号（必需）

**请求头**:
```http
Content-Type: application/vnd.sap.adt.packages.v1+xml
Accept: application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml
User-Agent: Eclipse/4.34.0.v20241120-1800 (win32; x86_64; Java 21.0.6) ADT/3.48.1 (devedition)
X-sap-adt-profiling: server-time
```

**请求体格式**: XML

**响应**: `201 Created`

**响应头**:
```http
Content-Type: application/vnd.sap.adt.packages.v1+xml; charset=utf-8
Location: /sap/bc/adt/packages/zpk1_create1
X-sap-adt-profiling: server-time=209555
```

---

## 🔄 完整的创建流程

### 步骤 1: 获取可用的传输层

```bash
GET /sap/bc/adt/packages/valuehelps/transportlayers?name=*
Accept: application/xml, application/vnd.sap.adt.nameditems.v1+xml
```

**响应示例**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<namedItems:namedItems xmlns:namedItems="http://www.sap.com/adt/nameditems">
  <namedItems:item>
    <namedItems:name>ZSAP</namedItems:name>
    <namedItems:description>SAP Transport Layer</namedItems:description>
  </namedItems:item>
  <namedItems:item>
    <namedItems:name>$TMP</namedItems:name>
    <namedItems:description>Local Objects</namedItems:description>
  </namedItems:item>
</namedItems:namedItems>
```

### 步骤 2: 获取可用的软件组件

```bash
GET /sap/bc/adt/packages/valuehelps/softwarecomponents?name=*
Accept: application/xml, application/vnd.sap.adt.nameditems.v1+xml
```

**响应大小**: 11,421 bytes（包含大量组件）

**常见组件**:
- `HOME` - 本地开发
- `SAP` - SAP 标准
- `LOCAL` - 本地对象

### 步骤 3: 基本验证（快速检查）

```bash
POST /sap/bc/adt/packages/validation?objname=ZPK1_CREATE1&description=CREATE+SAP+PACKAGE&packagetype=development&swcomp=HOME&checkmode=basic
Accept: application/vnd.sap.as+xml
```

**响应**: `200 OK`

**响应格式**: Status messages
```xml
<?xml version="1.0" encoding="UTF-8"?>
<statusMessages:statusMessages xmlns:statusMessages="http://www.sap.com/adt/as">
  <statusMessages:message>
    <statusMessages:severity>info</statusMessages:severity>
    <statusMessages:text>No issues found</statusMessages:text>
  </statusMessages:message>
</statusMessages:statusMessages>
```

### 步骤 4: 完整验证（详细检查）

```bash
POST /sap/bc/adt/packages/validation?objname=ZPK1_CREATE1&description=CREATE+SAP+PACKAGE&packagetype=development&swcomp=HOME&checkmode=full
```

**检查内容**:
- 包名命名规范
- 包类型有效性
- 软件组件存在性
- 传输层有效性
- 应用组件配置

### 步骤 5: 创建包

```bash
POST /sap/bc/adt/packages?corrNr=S4HK901712
Content-Type: application/vnd.sap.adt.packages.v1+xml
```

**请求体**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<package:package xmlns:package="http://www.sap.com/adt/packages">
  <package:name>zpk1_create1</package:name>
  <package:description>CREATE SAP PACKAGE</package:description>
  <package:packageType>development</package:packageType>
  <package:softwareComponent>HOME</package:softwareComponent>
  <package:transportLayer>ZSAP</package:transportLayer>
  <package:applicationComponent>HOME</package:applicationComponent>
  <!-- 可选字段 -->
  <package:responsible></package:responsible>
</package:package>
```

**响应**: `201 Created`

**Location header**: `/sap/bc/adt/packages/zpk1_create1`

### 步骤 6: 读取创建的包（验证）

```bash
GET /sap/bc/adt/packages/zpk1_create1
Accept: application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml
```

**响应**: `200 OK` + 包详细信息

---

## 📦 请求体 XML 结构

### 完整的包定义

```xml
<?xml version="1.0" encoding="UTF-8"?>
<package:package xmlns:package="http://www.sap.com/adt/packages">
  <!-- 必需字段 -->
  <package:name>zmy_package</package:name>
  <package:description>My Package Description</package:description>
  <package:packageType>development</package:packageType>
  <package:softwareComponent>HOME</package:softwareComponent>
  <package:transportLayer>ZSAP</package:transportLayer>

  <!-- 可选字段 -->
  <package:applicationComponent>HOME</package:applicationComponent>
  <package:responsible></package:responsible>
  <package:translationRelevance>selectable</package:translationRelevance>
</package:package>
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 | 可能的值 |
|------|------|------|------|----------|
| `name` | String | ✅ | 包名 | `Z*` 或 `Y*` 开头 |
| `description` | String | ✅ | 包描述 | 任意文本 |
| `packageType` | Enum | ✅ | 包类型 | `development`, `production`, `test` |
| `softwareComponent` | String | ✅ | 软件组件 | `HOME`, `SAP`, `LOCAL` 等 |
| `transportLayer` | String | ✅ | 传输层 | `ZSAP`, `$TMP` 等 |
| `applicationComponent` | String | ❓ | 应用组件 | `HOME` 等 |
| `responsible` | String | ❌ | 负责人 | 用户名 |
| `translationRelevance` | Enum | ❌ | 翻译相关性 | `selectable`, `notTranslatable` 等 |

---

## 🎯 使用 TypeScript 实现

### 基本用法

```typescript
import { createPackage } from 'abap-adt-api';

const newPackage = {
  name: 'ZMY_PACKAGE',
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
console.log(`Package name: ${result.package.name}`);
```

### 完整工作流程（先验证再创建）

```typescript
import {
  validatePackage,
  createPackage,
  getTransportLayers,
  getSoftwareComponents
} from 'abap-adt-api';

async function createValidatedPackage() {
  // 1. 获取选项
  const [layers, components] = await Promise.all([
    getTransportLayers(client.http),
    getSoftwareComponents(client.http)
  ]);

  console.log(`Available layers: ${layers.length}`);
  console.log(`Available components: ${components.length}`);

  // 2. 配置包
  const pkgConfig = {
    name: 'ZMY_NEW_PACKAGE',
    description: 'My Custom Package',
    packageType: 'development' as const,
    softwareComponent: components[0].name,  // 使用第一个组件
    transportLayer: layers[0].name,          // 使用第一个传输层
    applicationComponent: 'HOME',
    responsible: ''
  };

  // 3. 基本验证
  console.log('Running basic validation...');
  const basicValidation = await validatePackage(client.http, {
    objname: pkgConfig.name,
    description: pkgConfig.description,
    packagetype: pkgConfig.packageType,
    swcomp: pkgConfig.softwareComponent,
    checkmode: 'basic'
  });

  if (!basicValidation.success) {
    console.error('Basic validation failed!');
    basicValidation.messages.forEach(msg => {
      console.error(`  [${msg.severity}] ${msg.text}`);
    });
    return;
  }
  console.log('✅ Basic validation passed');

  // 4. 完整验证
  console.log('Running full validation...');
  const fullValidation = await validatePackage(client.http, {
    objname: pkgConfig.name,
    description: pkgConfig.description,
    packagetype: pkgConfig.packageType,
    swcomp: pkgConfig.softwareComponent,
    appcomp: pkgConfig.applicationComponent,
    checkmode: 'full'
  });

  if (!fullValidation.success) {
    console.error('Full validation failed!');
    fullValidation.messages.forEach(msg => {
      if (msg.severity === 'error' || msg.severity === 'warning') {
        console.error(`  [${msg.severity}] ${msg.text}`);
      }
    });
    return;
  }
  console.log('✅ Full validation passed');

  // 5. 创建包
  console.log('Creating package...');
  const result = await createPackage(client.http, pkgConfig, {
    corrNr: 'S4HK901712'
  });

  console.log(`✅ Package created successfully!`);
  console.log(`   Location: ${result.location}`);
  console.log(`   Name: ${result.package.name}`);

  return result;
}
```

---

## 🧪 测试创建 Package

### 方法 1: 使用 curl

```bash
# 准备请求体 XML
cat > package_create.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<package:package xmlns:package="http://www.sap.com/adt/packages">
  <package:name>ztest_package_001</package:name>
  <package:description>Test Package from REST API</package:description>
  <package:packageType>development</package:packageType>
  <package:softwareComponent>HOME</package:softwareComponent>
  <package:transportLayer>ZSAP</package:transportLayer>
</package:package>
EOF

# 发送创建请求
curl -u : \
  -H "Content-Type: application/vnd.sap.adt.packages.v1+xml" \
  -H "Accept: application/vnd.sap.adt.packages.v2+xml" \
  -d @package_create.xml \
  "http://HOST:PORT/sap/bc/adt/packages?corrNr=S4HK901712&sap-client=300"
```

### 方法 2: 使用 TypeScript

```typescript
import { AdtClient } from 'abap-adt-api';
import { createPackage } from 'abap-adt-api';

const client = new AdtClient({
  host: 'host',
  port: 8080,
  client: '300',
  auth: {
    username: '',
    password: ''
  }
});

async function testCreatePackage() {
  const result = await createPackage(client.http, {
    name: 'ZTEST_REST_API',
    description: 'Test Package from REST API',
    packageType: 'development',
    softwareComponent: 'HOME',
    transportLayer: 'ZSAP'
  }, {
    corrNr: 'S4HK901712'
  });

  console.log('Created:', result.location);
}

testCreatePackage().catch(console.error);
```

---

## ⚠️ 常见错误和解决方案

### 错误 1: 400 Bad Request

**原因**: 请求体 XML 格式错误

**解决**:
```xml
<!-- ❌ 错误 - 缺少命名空间 -->
<package>
  <name>zmy_package</name>
</package>

<!-- ✅ 正确 - 包含命名空间 -->
<package:package xmlns:package="http://www.sap.com/adt/packages">
  <package:name>zmy_package</package:name>
</package:package>
```

### 错误 2: 403 Forbidden

**原因**: 没有创建包的权限

**解决**:
- 检查用户权限
- 确认传输请求号有效
- 确认传输层可访问

### 错误 3: 验证失败

**原因**: 包配置无效

**解决**:
```typescript
const validation = await validatePackage(client.http, {
  objname: 'ZMY_PACKAGE',
  description: 'My Package',
  packagetype: 'development',
  swcomp: 'HOME',
  checkmode: 'full'
});

// 检查验证消息
validation.messages.forEach(msg => {
  if (msg.severity === 'error') {
    console.error(`Error: ${msg.text}`);
  }
});
```

### 错误 4: 包名已存在

**原因**: 包已经存在

**解决**:
```typescript
// 先检查包是否存在
try {
  const existing = await getPackage(client.http, 'ZMY_PACKAGE');
  console.log('Package already exists!');
} catch (error) {
  if (error.response?.status === 404) {
    // 包不存在，可以创建
    await createPackage(client.http, pkgData, options);
  }
}
```

---

## 📊 从拦截日志中发现的真实数据

### 真实的创建请求

**URI**:
```
POST /sap/bc/adt/packages?corrNr=S4HK901712
```

**请求头**:
```
Content-Type: application/vnd.sap.adt.packages.v1+xml
Accept: application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml
User-Agent: Eclipse/4.34.0.v20241120-1800 (win32; x86_64; Java 21.0.6) ADT/3.48.1 (devedition)
X-sap-adt-profiling: server-time
```

**请求体大小**: 768 bytes

**响应状态**: `201 Created`

**响应时间**: 209 ms (服务器处理时间)

**Location header**: `/sap/bc/adt/packages/zpk1_create1`

### 真实的验证请求

**基本验证**:
```
POST /sap/bc/adt/packages/validation?objname=ZPK1_CREATE1&description=CREATE+SAP+PACKAGE&packagetype=development&swcomp=HOME&checkmode=basic
```

**响应时间**: 17-20 ms

**完整验证**:
```
POST /sap/bc/adt/packages/validation?objname=ZPK1_CREATE1&description=CREATE+SAP+PACKAGE&packagetype=development&swcomp=HOME&checkmode=full
```

**响应时间**: 18-24 ms

---

## 🎉 总结

### ✅ 完整的创建 Package 功能

我已经实现了完整的 Package 创建功能：

1. ✅ **验证功能** - `validatePackage()`
   - 支持 `basic` 和 `full` 模式
   - 返回详细的验证消息

2. ✅ **创建功能** - `createPackage()`
   - 支持 XML 请求体
   - 支持传输请求号
   - 返回创建结果和 Location

3. ✅ **值帮助功能**
   - `getTransportLayers()` - 传输层列表
   - `getSoftwareComponents()` - 软件组件列表
   - `getTranslationRelevances()` - 翻译相关性

4. ✅ **读取功能** - `getPackage()`
   - 支持 ETag 缓存
   - 返回完整的包信息

### 📁 相关文件

- `src/api/packages.ts` - 完整实现
- `docs/package-api-analysis.md` - API 分析
- `docs/package-api-usage.md` - 使用指南

### 🚀 可以立即使用

所有功能都基于真实的 SAP 系统拦截数据，可以立即使用！

```typescript
import { createPackage, validatePackage } from 'abap-adt-api';

// 验证
const validation = await validatePackage(client.http, {
  objname: 'ZMY_PACKAGE',
  description: 'My Package',
  packagetype: 'development',
  swcomp: 'HOME',
  checkmode: 'full'
});

// 创建
if (validation.success) {
  const result = await createPackage(client.http, {
    name: 'ZMY_PACKAGE',
    description: 'My Package',
    packageType: 'development',
    softwareComponent: 'HOME',
    transportLayer: 'ZSAP'
  }, { corrNr: 'S4HK901712' });

  console.log('Created:', result.location);
}
```
