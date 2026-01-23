# abap-adt-api API 文档

abap-adt-api 是一个用于访问 ABAP 开发者工具 (ADT) REST 接口的 JavaScript/TypeScript 库。

## 📚 文档导航

### 🚀 快速开始
- [快速开始指南](getting-started/quickstart.md)
- [项目概述](getting-started/README.md)
- [文档索引](getting-started/index.md)

### 🎯 核心功能
- [ADTClient 主客户端](core/adt-client.md)
- [对象操作](core/object-operations.md)

### 💻 开发工具
- [代码补全与导航](development/code-completion.md)
- [语法检查](development/syntax-check.md)
- [对象搜索](development/search.md)
- [重构操作](development/refactoring.md)
- [激活对象](development/activation.md)

### 🧪 测试与质量
- [调试功能](testing-quality/debugging.md)
- [单元测试](testing-quality/unit-testing.md)
- [ATC 检查](testing-quality/atc.md)
- [追踪与日志](testing-quality/traces.md)

### 📡 API 文档
- [Package API](apis/package-api-usage.md)
- [Package 创建指南](apis/package-creation-guide.md)
- [Package API 分析](apis/package-api-analysis.md)
- [Runtime API](apis/runtime-api-usage.md)
- [Runtime API 更新](apis/runtime-api-update.md)

### 🔗 集成与传输
- [传输管理](integration/transport-management.md)
- [abapGit 集成](integration/abapgit.md)

### 📊 分析与报告
- [调试日志分析总结](analysis/DEBUG_LOG_SUMMARY.md)
- [调试日志分析](analysis/debug-log-analysis.md)
- [ADT API 分析](analysis/adt-api-analysis.md)

---

## 概述

该库简化了与 SAP ABAP ADT REST 接口的交互，支持 Eclipse 可以完成的大部分操作，提供简洁的 JS/TS 接口。

## 主要特性

- ✅ 对象浏览和结构分析
- ✅ 代码编辑和语法检查
- ✅ 传输管理
- ✅ 单元测试运行
- ✅ 调试功能
- ✅ ATC 检查
- ✅ abapGit 集成
- ✅ 重构操作

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

- 程序 (PROG/P, PROG/I)
- 类 (CLAS/OC)
- 接口 (INTF/OI)
- 函数组 (FUGR/F, FUGR/FF, FUGR/I)
- 包 (DEVC/K)
- CDS 数据定义 (DDLS/DF)
- CDS 访问控制 (DCLS/DL)
- 表 (TABL/DT)
- 服务定义 (SRVD/SRV)
- 服务绑定 (SRVB/SVB)
- 授权对象 (SUSO/B, AUTH)
- 数据元素 (DTEL/DE)
- 消息类 (MSAG/N)

## 会话类型

支持两种会话类型：

- **stateful**：保持会话状态，适合需要连续操作的场景
- **stateless**：无状态会话，适合高并发场景

```typescript
const client = new ADTClient("http://...", "user", "pass")
client.stateful = "stateful" // 启用有状态会话
```

## 更多信息

- [GitHub 仓库](https://github.com/marcellourbani/abap-adt-api)
- [NPM 包](https://www.npmjs.com/package/abap-adt-api)
- [VSCode ABAP Remote FS](https://github.com/marcellourbani/vscode_abap_remote_fs)

---

## 📂 文档分类

文档已按主题组织到以下子目录：

- **getting-started/** - 快速开始和概述
- **core/** - 核心客户端和基础功能
- **development/** - 开发工具和功能
- **testing-quality/** - 测试和质量保证
- **apis/** - API 详细文档
- **integration/** - 集成和传输管理
- **analysis/** - 分析报告和技术文档
