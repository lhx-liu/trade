# 设计文档

## 概述

本设计为订单管理系统添加"请购单号"（Purchase Order Number）字段。该字段将作为可选文本字段集成到现有的订单数据模型、数据库模式和前端表单中。设计遵循现有的代码架构模式，确保与当前系统的一致性。

## 架构

该功能涉及三个主要层次：

1. **数据层**：在 SQLite 数据库的 orders 表中添加新列
2. **类型层**：更新 TypeScript 类型定义以包含新字段
3. **表示层**：在 React 表单组件中添加输入字段

这种分层架构确保了数据的一致性和类型安全。

## 组件和接口

### 1. 数据库模式更新

**文件**: `backend/src/database/DatabaseManager.ts`

在 `createTables()` 方法的 CREATE TABLE 语句中添加 `purchase_order_number` 字段：

```typescript
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_date TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  lead_number TEXT NOT NULL,
  new_or_old TEXT,
  customer_level TEXT,
  country TEXT,
  continent TEXT,
  source TEXT,
  customer_nature TEXT,
  invoice_amount REAL,
  payment_amount REAL,
  customer_background_check TEXT,
  closed_product TEXT,
  payment_date TEXT,
  exw_value REAL,
  purchase_order_number TEXT,  -- 新增字段
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_name) REFERENCES customers(company_name) ON DELETE CASCADE
)
```

**字段规格**：
- 列名：`purchase_order_number`
- 数据类型：`TEXT`
- 约束：可为空（NULL）
- 位置：在 `exw_value` 之后，`created_at` 之前
- 索引：不需要（该字段不用于频繁查询）

### 2. 类型定义更新

**文件**: `backend/src/types/index.ts`

在 `Order` 接口中添加新属性：

```typescript
export interface Order {
  // ... 现有字段 ...
  exwValue?: number;                // EXW货值
  purchaseOrderNumber?: string;     // 请购单号
  createdAt?: string;
  updatedAt?: string;
}
```

**属性规格**：
- 属性名：`purchaseOrderNumber`（遵循 camelCase 命名约定）
- 类型：`string | undefined`
- 可选性：可选（使用 `?` 标记）

### 3. 前端表单更新

**文件**: `frontend/src/components/OrderForm/OrderForm.tsx`

在表单中添加新的输入字段，位置建议在"客户背调"字段之后、"成单产品"字段之前：

```typescript
<Form.Item
  label="请购单号"
  name="purchaseOrderNumber"
>
  <Input placeholder="请输入请购单号" />
</Form.Item>
```

**表单字段规格**：
- 标签：`请购单号`
- 字段名：`purchaseOrderNumber`
- 组件：`Input`（单行文本输入）
- 验证：无（可选字段）
- 占位符：`请输入请购单号`

### 4. 数据转换

由于数据库使用 snake_case（`purchase_order_number`）而 TypeScript 使用 camelCase（`purchaseOrderNumber`），需要确保现有的数据转换逻辑能够处理新字段。

根据现有代码模式，后端的数据库访问层应该已经实现了自动的命名转换。新字段将自动遵循这一模式。

## 数据模型

### Order 实体

```typescript
interface Order {
  // 核心字段
  id?: number;
  orderDate: string;
  companyName: string;
  contactInfo: ContactInfo[];
  leadNumber: string;
  closedProduct: string;
  
  // 可选字段
  newOrOld?: string;
  customerLevel?: string;
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  customerBackgroundCheck?: string;
  paymentDate?: string;
  exwValue?: number;
  purchaseOrderNumber?: string;  // 新增字段
  
  // 系统字段
  createdAt?: string;
  updatedAt?: string;
}
```

## 正确性属性

*属性是应该在系统所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性反思

在预分析中识别出以下可测试属性：
- 1.3: 文本存储属性
- 3.2: 文本输入接受属性
- 3.4: 表单提交包含属性
- 3.5: 编辑显示属性
- 4.1: 数据持久化往返属性

**冗余分析**：
- 属性 3.4（表单提交包含值）和属性 4.1（数据持久化）可以合并为一个往返属性，因为 4.1 已经验证了从表单到数据库再回到表单的完整流程
- 属性 3.2（输入接受文本）和属性 1.3（存储文本）可以合并为一个端到端属性，验证从输入到存储的完整流程
- 属性 3.5（编辑显示）实际上是往返属性的一部分

**最终属性集**：
1. 往返一致性属性（合并 3.4, 3.5, 4.1）
2. 文本处理属性（合并 1.3, 3.2）

### 正确性属性列表

**属性 1：请购单号往返一致性**

*对于任意*订单数据和任意请购单号文本值，如果创建包含该请购单号的订单，保存到数据库，然后检索该订单，返回的订单数据应该包含相同的请购单号值。

**验证：需求 3.4, 3.5, 4.1**

**属性 2：请购单号文本处理**

*对于任意*文本字符串（包括空字符串、特殊字符、多字节字符），系统应该能够接受该值作为请购单号输入，存储到数据库，并在检索时返回相同的值。

**验证：需求 1.3, 3.2**

## 错误处理

### 数据库层错误

- **表创建**：使用 `CREATE TABLE IF NOT EXISTS` 确保表创建的幂等性
- **数据类型错误**：TEXT 类型可以接受任何字符串值，不会产生类型错误

### 应用层错误

- **空值处理**：系统应该正确处理 `undefined`、`null` 和空字符串
- **数据转换**：确保 snake_case 和 camelCase 之间的转换正确处理新字段

### 前端错误

- **表单验证**：由于字段是可选的，不需要特殊的验证逻辑
- **显示错误**：如果订单数据中缺少该字段，应该显示空值而不是错误

## 测试策略

### 双重测试方法

本功能将采用单元测试和基于属性的测试相结合的方法：

- **单元测试**：验证具体示例、边缘情况和错误条件
- **属性测试**：验证跨所有输入的通用属性

### 单元测试

单元测试应该关注：

1. **数据库模式验证**
   - 验证 `purchase_order_number` 字段存在于 orders 表中
   - 验证字段类型为 TEXT
   - 验证字段允许 NULL 值

2. **边缘情况**
   - 空值处理：创建不包含请购单号的订单
   - 空字符串：创建请购单号为空字符串的订单
   - 向后兼容：处理旧数据（没有该字段的订单）

3. **UI 组件**
   - 验证表单包含"请购单号"字段
   - 验证字段没有必填验证
   - 验证字段在正确的位置显示

### 基于属性的测试

**测试库选择**：
- 后端：使用 `fast-check`（TypeScript/JavaScript 的属性测试库）
- 前端：使用 `@testing-library/react` 结合 `fast-check`

**测试配置**：
- 每个属性测试最少运行 100 次迭代
- 每个测试必须引用设计文档中的属性
- 标签格式：`Feature: purchase-order-number-field, Property {number}: {property_text}`

**属性测试实现**：

1. **属性 1：往返一致性**
   ```typescript
   // Feature: purchase-order-number-field, Property 1: 请购单号往返一致性
   // 对于任意订单数据和任意请购单号文本值，
   // 创建、保存、检索后应该返回相同的请购单号值
   ```

2. **属性 2：文本处理**
   ```typescript
   // Feature: purchase-order-number-field, Property 2: 请购单号文本处理
   // 对于任意文本字符串，系统应该能够接受、存储并返回相同的值
   ```

**测试覆盖范围**

- 数据库层：表结构创建、字段约束
- 类型层：TypeScript 编译时检查
- API 层：创建、更新、检索订单
- UI 层：表单渲染、输入处理、数据绑定

### 集成测试

虽然不是本功能的重点，但应该验证：
- 端到端流程：从 UI 输入到数据库存储再到 UI 显示
- 与现有功能的兼容性：确保新字段不影响现有订单操作
