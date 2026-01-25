# ABAP 对象类型参考

abap-adt-api 支持广泛的 ABAP 对象类型。本文档列出了所有支持的对象类型及其用途。

## 对象类型标识符

ABAP 对象类型使用 `<类型>/<子类型>` 的格式标识，例如：
- `CLAS/OC` - ABAP 类
- `PROG/P` - ABAP 程序
- `TABL/DT` - 数据库表

## 程序与类

### CLAS/OC - ABAP 类

**描述:** ABAP 对象类

**用途:** 定义类、方法、属性

**示例:**
```typescript
await client.createObject({
  name: "ZMY_CLASS",
  type: "CLAS/OC",
  package: "$TMP",
  description: "我的类"
})
```

### INTF/OI - ABAP 接口

**描述:** ABAP 接口定义

**用途:** 定义接口契约

**示例:**
```typescript
await client.createObject({
  name: "ZMY_INTERFACE",
  type: "INTF/OI",
  package: "$TMP"
})
```

### PROG/P - ABAP 程序

**描述:** 可执行 ABAP 程序

**用途:** 报表、独立程序

**示例:**
```typescript
await client.createObject({
  name: "ZMY_REPORT",
  type: "PROG/P",
  package: "$TMP"
})
```

### PROG/I - ABAP 包含文件

**描述:** ABAP 包含文件

**用途:** 可重用的代码片段

## 函数模块

### FUGR/F - 函数组

**描述:** 函数组

**用途:** 组织相关的函数模块

**示例:**
```typescript
await client.createObject({
  name: "ZMY_FUNC_GROUP",
  type: "FUGR/F",
  package: "$TMP"
})
```

### FUGR/FF - 函数模块

**描述:** 函数模块

**用途:** 可调用的函数

### FUGR/I - 函数组包含

**描述:** 函数组包含文件

**用途:** 函数组的源代码

## 数据字典

### TABL/DT - 透明表

**描述:** 数据库表

**用途:** 存储数据

**示例:**
```typescript
await client.createObject({
  name: "ZMY_TABLE",
  type: "TABL/DT",
  package: "$TMP",
  description: "我的表"
})
```

### TABL/INT - 结构体

**描述:** 结构体

**用途:** 定义数据结构

**示例:**
```typescript
await client.createObject({
  name: "ZMY_STRUCTURE",
  type: "TABL/INT",
  package: "$TMP"
})
```

### VIEW/D - 数据库视图

**描述:** 数据库视图

**用途:** 从一个或多个表读取数据

**示例:**
```typescript
await client.createObject({
  name: "ZMY_VIEW",
  type: "VIEW/D",
  package: "$TMP"
})
```

### DTEL/DE - 数据元素

**描述:** 数据元素

**用途:** 定义字段类型和描述

**示例:**
```typescript
await client.createObject({
  name: "ZMY_DATA_ELEMENT",
  type: "DTEL/DE",
  package: "$TMP"
})
```

### DOMA/D - 定义域

**描述:** 域

**用途:** 定义值范围和转换例程

**示例:**
```typescript
await client.createObject({
  name: "ZMY_DOMAIN",
  type: "DOMA/D",
  package: "$TMP"
})
```

## CDS 对象

### DDLS/DF - CDS 数据定义

**描述:** Core Data Services 数据定义

**用途:** 定义数据模型和视图

**示例:**
```typescript
await client.createObject({
  name: "ZMY_CDS_VIEW",
  type: "DDLS/DF",
  package: "$TMP",
  description: "CDS 视图"
})
```

### DCLS/DL - CDS 访问控制

**描述:** CDS 访问控制

**用途:** 定义 CDS 视图的角色和权限

**示例:**
```typescript
await client.createObject({
  name: "ZMY_CDS_ACCESS",
  type: "DCLS/DL",
  package: "$TMP"
})
```

### DDLX/EX - CDS 元数据扩展

**描述:** CDS 扩展

**用途:** 扩展现有 CDS 视图

**示例:**
```typescript
await client.createObject({
  name: "ZMY_CDS_EXTENSION",
  type: "DDLX/EX",
  package: "$TMP"
})
```

### DDLA/AS - CDS 访问策略

**描述:** CDS 访问策略

**用途:** 定义数据访问规则

## 开发组织

### DEVC/K - 开发包

**描述:** 开发包

**用途:** 组织开发对象

**示例:**
```typescript
await client.createObject({
  name: "ZMY_PACKAGE",
  type: "DEVC/K",
  package: "$TMP",
  description: "我的包"
})
```

## 服务与授权

### SRVD/SRV - 服务定义

**描述:** OData 服务定义

**用途:** 定义 OData 服务

**示例:**
```typescript
await client.createObject({
  name: "ZMY_SERVICE_DEF",
  type: "SRVD/SRV",
  package: "$TMP"
})
```

### SRVB/SVB - 服务绑定

**描述:** OData 服务绑定

**用途:** 将服务定义绑定到端点

**示例:**
```typescript
await client.createObject({
  name: "ZMY_SERVICE_BINDING",
  type: "SRVB/SVB",
  package: "$TMP"
})
```

### SUSO/B - 授权对象

**描述:** 授权对象

**用途:** 定义权限检查

**示例:**
```typescript
await client.createObject({
  name: "ZMY_AUTH_OBJECT",
  type: "SUSO/B",
  package: "$TMP"
})
```

### AUTH - 授权类

**描述:** 授权类

**用途:** 授权对象的分类

### MSAG/N - 消息类

**描述:** 消息类

**用途:** 存储系统消息

**示例:**
```typescript
await client.createObject({
  name: "ZMY_MESSAGE_CLASS",
  type: "MSAG/N",
  package: "$TMP"
})
```

### SOBJ - 对象类型

**描述:** 对象类型

**用途:** 定义自定义对象类型

### TRAN - 事务代码

**描述:** 事务代码

**用途:** 定义可执行事务

**示例:**
```typescript
await client.createObject({
  name: "ZMY_TRANSACTION",
  type: "TRAN",
  package: "$TMP"
})
```

## 其他对象类型

### XSLT - XSLT 转换

**描述:** XSLT 转换程序

**用途:** XML 数据转换

### SSFO - Smart Forms

**描述:** Smart Form

**用途:** 表单打印和输出

### SSST - Smart Styles

**描述:** Smart Style

**用途:** Smart Forms 的样式定义

### QUEU - 队列对象

**描述:** 队列

**用途:** 数据队列管理

### SICF - ICF 服务

**描述:** Internet Communication Framework 服务

**用途:** HTTP 服务端点

### PINF - 包接口

**描述:** 包接口

**用途:** 定义包的可见性

### PINFD - 包接口描述

**描述:** 包接口描述

**用途:** 包接口的详细描述

## 对象类型组

### 组类型 (Group Types)

这些类型表示包含多个子对象的容器：

- `CLAS/OC` - 类（包含多个包含文件）
- `FUGR/F` - 函数组（包含函数模块）
- `DEVC/K` - 包（包含多个对象）

### 非组类型 (Non-Group Types)

这些类型表示单个对象：

- `PROG/P` - 程序
- `INTF/OI` - 接口
- `TABL/DT` - 表
- `DTEL/DE` - 数据元素

## 对象类型判断

### isCreatableTypeId

检查是否为可创建的对象类型。

```typescript
import { isCreatableTypeId } from "abap-adt-api"

if (isCreatableTypeId("CLAS/OC")) {
  console.log("可以创建此类型")
}
```

### isGroupType

检查是否为组类型。

```typescript
import { isGroupType } from "abap-adt-api"

if (isGroupType("DEVC/K")) {
  console.log("这是组类型")
}
```

### isPackageType

检查是否为包类型。

```typescript
import { isPackageType } from "abap-adt-api"

if (isPackageType("DEVC/K")) {
  console.log("这是包")
}
```

## 常用对象类型组合

### 创建完整的类结构

```typescript
// 创建类
const classMeta = await client.createObject({
  name: "ZMY_CLASS",
  type: "CLAS/OC",
  package: "$TMP"
})

// 创建接口
const interfaceMeta = await client.createObject({
  name: "ZMY_INTERFACE",
  type: "INTF/OI",
  package: "$TMP"
})

// 类实现接口
const classSource = `
CLASS zmy_class DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES: zmy_interface.
ENDCLASS.
`
```

### 创建数据字典对象

```typescript
// 创建域
await client.createObject({
  name: "ZMY_DOMAIN",
  type: "DOMA/D",
  package: "$TMP"
})

// 创建数据元素
await client.createObject({
  name: "ZMY_DATA_ELEMENT",
  type: "DTEL/DE",
  package: "$TMP"
})

// 创建表
await client.createObject({
  name: "ZMY_TABLE",
  type: "TABL/DT",
  package: "$TMP"
})
```

### 创建 CDS 服务

```typescript
// 创建 CDS 数据定义
await client.createObject({
  name: "ZMY_CDS_VIEW",
  type: "DDLS/DF",
  package: "$TMP"
})

// 创建访问控制
await client.createObject({
  name: "ZMY_CDS_ACCESS",
  type: "DCLS/DL",
  package: "$TMP"
})

// 发布服务绑定
await client.publishServiceBinding("ZMY_SERVICE_BINDING", "0001")
```

## 对象类型常量

```typescript
import {
  CreatableTypeIds,
  GroupTypeIds,
  NonGroupTypeIds,
  PackageTypeIds
} from "abap-adt-api"

// 所有可创建的类型
console.log(CreatableTypeIds)

// 组类型
console.log(GroupTypeIds)

// 非组类型
console.log(NonGroupTypeIds)

// 包类型
console.log(PackageTypeIds)
```

## 相关文档

- [对象创建](../development/object-creation.md)
- [对象操作](../core/object-operations.md)
- [CDS 开发](../development/cds-development.md)
- [Package API](package-api-usage.md)
