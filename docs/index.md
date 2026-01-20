# abap-adt-api API 文档

abap-adt-api 是一个用于访问 ABAP 开发者工具 (ADT) REST 接口的 JavaScript/TypeScript 库。

## 文档索引

- [快速开始](quickstart.md)
- [ADTClient 主客户端](adt-client.md)
- [对象操作](object-operations.md)
- [激活对象](activation.md)
- [语法检查](syntax-check.md)
- [代码补全与导航](code-completion.md)
- [传输管理](transport-management.md)
- [对象搜索](search.md)
- [重构操作](refactoring.md)
- [调试功能](debugging.md)
- [单元测试](unit-testing.md)
- [ATC 检查](atc.md)
- [abapGit 集成](abapgit.md)
- [追踪与日志](traces.md)

## 概述

该库简化了与 SAP ABAP ADT REST 接口的交互，支持 Eclipse 可以完成的大部分操作，提供简洁的 JS/TS 接口。

## 主要特性

- 对象浏览和结构分析
- 代码编辑和语法检查
- 传输管理
- 单元测试运行
- 调试功能
- ATC 检查
- abapGit 集成
- 重构操作

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
