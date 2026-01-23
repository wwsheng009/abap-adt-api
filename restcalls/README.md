# REST Calls - Package API 使用指南

本文件夹包含用于测试 SAP ADT Package API 的 HTTP 请求文件。

---

## 🚀 快速开始

### 1. 安装 REST Client

推荐使用以下 IDE 扩展之一：

**VS Code**:
- REST Client (by Huachao Mao)
- Thunder Client

**IntelliJ IDEA**:
- 内置 REST Client (Tools → HTTP Client → Test RESTful Web Services)

### 2. 配置环境变量

项目根目录的 `.env` 文件已配置好所有必需的变量：

```env
# SAP 连接信息
SAP_URL=http://host
SAP_USER=
SAP_PASSWORD=
SAP_CLIENT=300

# Package API 设置
PACKAGE_NAME=ZMY_PACKAGE
PACKAGE_DESCRIPTION=My Package Description
PACKAGE_TYPE=development
SOFTWARE_COMPONENT=HOME
APPLICATION_COMPONENT=HOME
TRANSPORT_LAYER=ZSAP
RESPONSIBLE=
TRANSPORT_REQUEST=S4HK901712

# 值帮助设置
NAME_PATTERN=*
MAX_ITEM_COUNT=50
```

**重要**: 根据你的实际环境修改 `.env` 文件中的值！

---

## 📋 可用的 API 操作

### 1. Get Package - 读取包信息

**操作**: `### Get Package`

**说明**: 读取指定包的完整信息

**变量**:
- `PACKAGE_NAME` - 包名

**预期响应**: XML 格式的包信息

---

### 2. Get Package with Cache - 使用缓存读取

**操作**: `### Get Package with Cache`

**说明**: 使用 ETag 缓存机制读取包（如果未改变则返回 304）

**变量**:
- `PACKAGE_NAME` - 包名
- `etag` - ETag 值（从之前的响应中获取）

**预期响应**:
- `200 OK` - 内容已改变，返回新数据
- `304 Not Modified` - 内容未改变

---

### 3. Get Package Properties - 获取对象属性

**操作**: `### Get Package Properties`

**说明**: 获取包在信息系统中的详细属性

**变量**:
- `PACKAGE_NAME` - 包名

**预期响应**: 对象属性列表

---

### 4. Validate Package (Basic) - 基本验证

**操作**: `### Validate Package (Basic)`

**说明**: 快速验证包配置（基本检查）

**变量**:
- `PACKAGE_NAME` - 包名
- `PACKAGE_DESCRIPTION` - 包描述
- `PACKAGE_TYPE` - 包类型
- `SOFTWARE_COMPONENT` - 软件组件

**预期响应**: 验证结果（状态消息）

**响应时间**: ~17-20 ms

---

### 5. Validate Package (Full) - 完整验证

**操作**: `### Validate Package (Full)`

**说明**: 完整验证包配置（包含所有检查）

**变量**:
- `PACKAGE_NAME` - 包名
- `PACKAGE_DESCRIPTION` - 包描述
- `PACKAGE_TYPE` - 包类型
- `SOFTWARE_COMPONENT` - 软件组件
- `APPLICATION_COMPONENT` - 应用组件

**预期响应**: 详细的验证结果

**响应时间**: ~18-24 ms

---

### 6. Get Transport Layers - 获取传输层列表

**操作**: `### Get Transport Layers`

**说明**: 获取可用的传输层列表（值帮助）

**变量**:
- `NAME_PATTERN` - 搜索模式（支持通配符）

**示例值**: `*`, `Z*`

**预期响应**: 传输层列表（XML）

---

### 7. Get Software Components - 获取软件组件列表

**操作**: `### Get Software Components`

**说明**: 获取可用的软件组件列表（值帮助）

**变量**:
- `NAME_PATTERN` - 搜索模式（支持通配符）

**示例值**: `*`, `HOME*`

**预期响应**: 软件组件列表（XML）

---

### 8. Get Translation Relevances - 获取翻译相关性

**操作**: `### Get Translation Relevances`

**说明**: 获取翻译相关性选项列表（值帮助）

**变量**:
- `MAX_ITEM_COUNT` - 最大返回数量

**示例值**: `50`

**预期响应**: 翻译相关性列表（XML）

---

### 9. Create Package - 创建新包

**操作**: `### Create Package`

**说明**: 创建新的 SAP 包

**变量**:
- `PACKAGE_NAME` - 包名（必需）
- `PACKAGE_DESCRIPTION` - 包描述（必需）
- `PACKAGE_TYPE` - 包类型（必需）
- `SOFTWARE_COMPONENT` - 软件组件（必需）
- `TRANSPORT_LAYER` - 传输层（必需）
- `APPLICATION_COMPONENT` - 应用组件（可选）
- `RESPONSIBLE` - 负责人（可选）
- `TRANSPORT_REQUEST` - 传输请求号（必需）

**预期响应**: `201 Created` + Location header

**响应时间**: ~209 ms

---

### 10. Create Package (Minimal) - 创建包（最小配置）

**操作**: `### Create Package (Minimal)`

**说明**: 使用最小配置创建包（只填必需字段）

**变量**:
- `PACKAGE_NAME` - 包名
- `PACKAGE_DESCRIPTION` - 包描述

**其他字段**:
- `packageType`: 自动设为 `development`
- `softwareComponent`: 自动设为 `HOME`
- `transportLayer`: 自动设为 `ZSAP`

---

## 🔧 使用步骤

### 步骤 1: 配置环境变量

编辑项目根目录的 `.env` 文件：

```env
# 修改这些值为你的实际环境
SAP_URL=http://your-sap-server:8080
SAP_USER=your_username
SAP_PASSWORD=your_password
SAP_CLIENT=300

# 配置包信息
PACKAGE_NAME=ZYOUR_PACKAGE
PACKAGE_DESCRIPTION=Your Package Description
TRANSPORT_REQUEST=YOUR_TRANSPORT_REQUEST
```

### 步骤 2: 选择操作

在 `packages.http` 文件中，点击你想要的操作名称前面的 "Send Request" 链接。

**示例流程**:

1. **获取传输层** → 点击 `### Get Transport Layers`
2. **获取软件组件** → 点击 `### Get Software Components`
3. **基本验证** → 点击 `### Validate Package (Basic)`
4. **创建包** → 点击 `### Create Package`

### 步骤 3: 查看响应

- **Headers** - 查看 HTTP 响应头（包含 Location, ETag 等）
- **Body** - 查看响应体（XML 格式）
- **Timeline** - 查看请求耗时

---

## 💡 典型使用场景

### 场景 1: 创建新包的完整流程

```
1. 获取传输层 → Get Transport Layers
2. 获取软件组件 → Get Software Components
3. 基本验证 → Validate Package (Basic)
4. 完整验证 → Validate Package (Full)
5. 创建包 → Create Package
6. 读取创建的包 → Get Package
```

### 场景 2: 检查现有包

```
1. 读取包信息 → Get Package
2. 获取包属性 → Get Package Properties
```

### 场景 3: 批量验证包名

```
修改 PACKAGE_NAME 变量
运行 Validate Package (Basic)
重复测试多个包名
```

---

## ⚠️ 注意事项

### 1. 传输请求号 (TRANSPORT_REQUEST)

**必须提供有效的传输请求号**才能创建包。

获取方式：
- SE09 - 传输组织器
- SE10 - 传输请求管理

### 2. 包命名规范

**包名必须**:
- 以 `Z` 或 `Y` 开头
- 符合 SAP 命名规范
- 不使用保留字

**有效示例**:
- ✅ `ZMY_PACKAGE`
- ✅ `ZPK1_TEST`
- ❌ `MY_PACKAGE` （不以 Z/Y 开头）
- ❌ `Z123` （太短）

### 3. 包类型

**可选值**:
- `development` - 开发包
- `production` - 生产包
- `test` - 测试包

### 4. ETag 缓存

**第一次请求**:
```
GET /sap/bc/adt/packages/ZMY_PACKAGE

响应头包含:
ETag: "20260122170000001application/vnd.sap.adt.packages.v1+xml..."
```

**后续请求**:
```
GET /sap/bc/adt/packages/ZMY_PACKAGE
If-None-Match: "20260122170000001application/vnd.sap.adt.packages.v1+xml..."

响应: 304 Not Modified (节省带宽和时间)
```

---

## 🧪 测试示例

### 测试 1: 读取现有包

```http
### Get Package
GET {{SAP_URL}}/sap/bc/adt/packages/ZPK1_CREATE1?sap-client={{SAP_CLIENT}}
```

**点击发送** → 查看包信息

### 测试 2: 验证包名

```http
### Validate Package (Basic)
POST {{SAP_URL}}/sap/bc/adt/packages/validation?sap-client={{SAP_CLIENT}}
objname=ZTEST_PACKAGE&description=Test&packagetype=development&swcomp=HOME&checkmode=basic
```

**点击发送** → 查看验证结果

### 测试 3: 创建包

**先更新 .env 文件**:
```env
PACKAGE_NAME=ZTEST_001
PACKAGE_DESCRIPTION=Test Package
TRANSPORT_REQUEST=S4HK901712
```

**然后点击**: `### Create Package`

---

## 📊 响应状态码

| 状态码 | 说明 | 操作 |
|--------|------|------|
| `200 OK` | 成功 | 包信息读取成功 |
| `201 Created` | 已创建 | 包创建成功，检查 Location header |
| `304 Not Modified` | 未修改 | 使用缓存，内容未改变 |
| `400 Bad Request` | 请求错误 | 检查 XML 格式或参数 |
| `401 Unauthorized` | 未授权 | 检查用户名/密码 |
| `403 Forbidden` | 禁止 | 检查权限 |
| `404 Not Found` | 未找到 | 包不存在 |

---

## 🐛 常见问题

### 问题 1: 变量未定义

**错误**: `Request failed: variable "PACKAGE_NAME" is not defined`

**解决**:
- 检查 `.env` 文件是否存在
- 确认 REST Client 插件已安装并启用
- 重启 IDE

### 问题 2: 401 Unauthorized

**错误**: HTTP/1.1 401 Unauthorized

**解决**:
- 检查 `.env` 中的用户名密码
- 确认用户有创建包的权限

### 问题 3: 创建失败

**错误**: 400 Bad Request 或验证错误

**解决**:
1. 先运行 `Validate Package (Full)`
2. 检查验证消息中的错误
3. 修复配置后再创建

### 问题 4: 找不到传输请求号

**解决**:
- T-Code: SE09 或 SE10
- 查找或创建传输请求
- 复制传输请求号到 `.env`

---

## 📚 相关文档

- [Package API 分析](../docs/package-api-analysis.md) - 完整的 API 分析
- [Package API 使用指南](../docs/package-api-usage.md) - TypeScript 使用示例
- [Package 创建指南](../docs/package-creation-guide.md) - 创建包详细流程

---

## ✅ 快速测试命令

### 在浏览器中直接测试

```bash
# 读取包
http://HOST:PORT/sap/bc/adt/packages/ZPK1_CREATE1?sap-client=300

# 获取传输层
http://HOST:PORT/sap/bc/adt/packages/valuehelps/transportlayers?name=*&sap-client=300
```

### 使用 curl

```bash
# 获取包（需认证）
curl -u username:password \
  "http://HOST:PORT/sap/bc/adt/packages/ZPK1_CREATE1?sap-client=300"

# 创建包（需认证 + XML body）
curl -u username:password \
  -H "Content-Type: application/vnd.sap.adt.packages.v1+xml" \
  -d @package.xml \
  "http://HOST:PORT/sap/bc/adt/packages?corrNr=S4HK901712&sap-client=300"
```

---

## 🎯 总结

本 `packages.http` 文件提供了完整的 Package API 测试集合：

✅ **10 个操作** - 覆盖所有 Package API 功能
✅ **即用型** - 配置 .env 后直接使用
✅ **完整流程** - 从验证到创建的完整示例
✅ **基于真实数据** - 所有端点都来自真实系统拦截

**现在可以直接在 REST Client 中测试所有 Package API 功能！** 🚀
