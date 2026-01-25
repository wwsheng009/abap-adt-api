# abap-adt-api API 文档索引

abap-adt-api 是一个用于访问 ABAP 开发者工具 (ADT) REST 接口的 JavaScript/TypeScript 库。

## 📚 完整文档目录

### 🚀 快速开始
- [快速开始指南](quickstart.md) - 5分钟快速上手
- [项目概述](README.md) - 项目介绍和特性
- [本文档](index.md) - 文档索引

### 🎯 核心功能
- [ADTClient 主客户端](../core/adt-client.md) - 核心客户端类完整参考
- [对象操作](../core/object-operations.md) - 对象浏览、读取、编辑

### 💻 开发工具
- [对象创建](../development/object-creation.md) - 创建20+种ABAP对象
- [语法检查](../development/syntax-check.md) - ABAP和CDS语法验证
- [代码补全与导航](../development/code-completion.md) - 智能代码补全
- [对象搜索](../development/search.md) - 搜索ABAP对象
- [重构操作](../development/refactoring.md) - 重命名、提取方法等
- [激活对象](../development/activation.md) - 对象激活管理
- [CDS 开发](../development/cds-development.md) - CDS视图和服务开发
- [表格数据操作](../development/table-operations.md) - 数据查询和操作

### 🧪 测试与质量
- [单元测试](../testing-quality/unit-testing.md) - 运行ABAP单元测试
- [ATC 检查](../testing-quality/atc.md) - ABAP Test Cockpit代码审查
- [调试功能](../testing-quality/debugging.md) - 完整调试器支持
- [追踪与日志](../testing-quality/traces.md) - 性能追踪和分析

### 📡 API 文档
- [对象类型参考](../apis/object-types.md) - 完整对象类型列表

### 🔗 集成与传输
- [传输管理](../integration/transport-management.md) - 传输请求管理
- [abapGit 集成](../integration/abapgit.md) - Git版本控制集成
- [服务绑定管理](../integration/service-bindings.md) - OData服务发布

---

## 概述

该库简化了与 SAP ABAP ADT REST 接口的交互，支持 Eclipse 可以完成的大部分操作，提供简洁的 JS/TS 接口。

## 主要特性

### 核心功能
- ✅ **对象浏览** - 浏览包结构，获取对象信息
- ✅ **对象操作** - 读取、编辑、删除 ABAP 对象
- ✅ **对象创建** - 创建类、接口、程序、包等 20+ 种对象类型
- ✅ **激活管理** - 激活 ABAP 对象并处理不活跃对象

### 开发工具
- ✅ **语法检查** - ABAP 和 CDS 语法验证
- ✅ **代码补全** - 智能代码补全建议
- ✅ **导航功能** - 查找定义、查找引用
- ✅ **代码格式化** - Pretty Printer 支持
- ✅ **重构操作** - 重命名、提取方法、快速修复
- ✅ **类型层次** - 查看类和接口层次结构

### 测试与质量
- ✅ **单元测试** - 运行 ABAP 单元测试
- ✅ **ATC 检查** - ABAP Test Cockpit 代码审查
- ✅ **调试功能** - 完整的调试器支持（断点、变量、堆栈）
- ✅ **性能追踪** - SQL 追踪、性能分析
- ✅ **运行时分析** - 运行时错误和系统消息

### 数据操作
- ✅ **表格内容** - 读取表格数据
- ✅ **SQL 查询** - 执行自定义查询
- ✅ **CDS 开发** - CDS 视图、注释、服务绑定

### 集成与传输
- ✅ **传输管理** - 创建、释放、管理传输请求
- ✅ **abapGit** - Git 版本控制集成
- ✅ **服务绑定** - OData 服务发布和管理

### 系统功能
- ✅ **用户管理** - 系统用户查询
- ✅ **版本控制** - 对象版本历史
- ✅ **系统发现** - ADT 服务发现
- ✅ **文档访问** - ABAP 文档查询

## 安装

```bash
npm install abap-adt-api
```

## 基本使用

```typescript
import { ADTClient } from "abap-adt-api"

const client = new ADTClient(
  "http://vhcalnplci.bti.local:8000",
  "developer",
  "mypassword"
)

await client.login()

const nodes = await client.nodeContents("DEVC/K", "$TMP")
console.log(nodes)
```

## 支持的对象类型

### 程序与类
- **PROG/P** - ABAP 程序
- **PROG/I** - ABAP 包含文件
- **CLAS/OC** - ABAP 类
- **INTF/OI** - ABAP 接口

### 函数模块
- **FUGR/F** - 函数组
- **FUGR/FF** - 函数模块
- **FUGR/I** - 函数组包含文件

### 数据字典
- **TABL/DT** - 数据库表
- **TABL/INT** - 结构体
- **VIEW/D** - 数据库视图
- **DTEL/DE** - 数据元素
- **DOMA/D** - 定义域

### CDS 对象
- **DDLS/DF** - CDS 数据定义
- **DCLS/DL** - CDS 访问控制
- **DDLX/EX** - CDS 元数据扩展
- **DDLA/AS** - CDS 访问策略

### 开发组织
- **DEVC/K** - 开发包

### 服务与授权
- **SRVD/SRV** - 服务定义
- **SRVB/SVB** - 服务绑定
- **SUSO/B** - 授权对象
- **AUTH** - 授权类
- **MSAG/N** - 消息类
- **SOBJ** - 对象类型
- **TRAN** - 事务代码

### 其他对象
- **XSLT** - XSLT 转换
- **SSFO** - Smart Forms
- **SSST** - Smart Styles
- **QUEU** - 队列对象
- **SICF** - ICF 服务
- **PINF** - 包接口
- **PINFD** - 包接口描述

## 会话类型

支持两种会话类型：

- **stateful**：保持会话状态，适合需要连续操作的场景
- **stateless**：无状态会话，适合高并发场景

```typescript
const client = new ADTClient("http://...", "user", "pass")
client.stateful = "stateful" // 启用有状态会话
```

## 推荐阅读路径

### 新手用户
1. [快速开始指南](quickstart.md)
2. [ADTClient 主客户端](../core/adt-client.md)
3. [对象操作](../core/object-operations.md)

### 开发者
1. [对象创建](../development/object-creation.md)
2. [语法检查](../development/syntax-check.md)
3. [代码补全与导航](../development/code-completion.md)
4. [重构操作](../development/refactoring.md)

### 测试人员
1. [单元测试](../testing-quality/unit-testing.md)
2. [ATC 检查](../testing-quality/atc.md)
3. [调试功能](../testing-quality/debugging.md)

### API 集成者
1. [对象类型参考](../apis/object-types.md)
2. [传输管理](../integration/transport-management.md)
3. [服务绑定管理](../integration/service-bindings.md)

## 更多信息

- [GitHub 仓库](https://github.com/marcellourbani/abap-adt-api)
- [NPM 包](https://www.npmjs.com/package/abap-adt-api)
- [VSCode ABAP Remote FS](https://github.com/marcellourbani/vscode_abap_remote_fs)
- [完整文档](../README.md)
