# Design Document: Excel Import/Export

## Overview

本设计文档描述订单管理系统的 Excel 导入导出功能的技术实现方案。该功能允许用户通过 Excel 文件批量导入订单数据，以及将系统订单数据导出为 Excel 文件。

核心设计原则：
- 使用 ExcelJS 库处理 Excel 文件的读写操作
- 前端负责文件上传和下载的用户交互
- 后端负责数据解析和批量处理
- 简单直接的一次性导入，无需复杂的进度跟踪
- 导入完成后返回结果摘要

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Upload Button   │         │  Export Button   │         │
│  │  + File Picker   │         │  + Download      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
│           v                             v                    │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Import Service   │         │ Export Service   │         │
│  │ - Upload file    │         │ - Trigger export │         │
│  │ - Show progress  │         │ - Download file  │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │ HTTP POST /api/orders/import │
            │ HTTP GET /api/orders/export  │
            │                              │
┌───────────┼──────────────────────────────┼──────────────────┐
│           v                              v        Backend    │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Express Router                       │      │
│  │  - POST /api/orders/import                       │      │
│  │  - GET  /api/orders/export                       │      │
│  └────────┬─────────────────────────┬────────────────┘      │
│           │                         │                        │
│           v                         v                        │
│  ┌──────────────────┐     ┌──────────────────┐            │
│  │ Import Service   │     │ Export Service   │            │
│  │ - Parse Excel    │     │ - Query orders   │            │
│  │ - Validate data  │     │ - Generate Excel │            │
│  │ - Map fields     │     │ - Format data    │            │
│  │ - Batch insert   │     └──────────────────┘            │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           v                                                  │
│  ┌──────────────────────────────────────────────┐          │
│  │           Database (SQLite)                   │          │
│  │  - orders table                               │          │
│  │  - customers table                            │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

**导入流程：**
1. 用户在前端选择 Excel 文件
2. 前端验证文件类型和大小
3. 前端通过 multipart/form-data 上传文件到后端
4. 后端接收文件并使用 ExcelJS 解析
5. 后端逐行验证和映射数据
6. 后端批量插入有效订单到数据库
7. 后端返回导入结果（成功数量、失败详情）
8. 前端显示导入结果摘要

**导出流程：**
1. 用户点击导出按钮
2. 前端发送导出请求到后端
3. 后端查询所有订单数据
4. 后端使用 ExcelJS 生成 Excel 文件
5. 后端将文件作为二进制流返回
6. 前端触发浏览器下载

## Components and Interfaces

### Frontend Components

#### 1. ExcelImportButton 组件

```typescript
interface ExcelImportButtonProps {
  onImportSuccess: () => void;
  onImportError: (error: string) => void;
}

// 功能：
// - 渲染上传按钮
// - 处理文件选择
// - 显示上传进度
// - 显示导入结果
```

#### 2. ExcelExportButton 组件

```typescript
interface ExcelExportButtonProps {
  disabled?: boolean;
}

// 功能：
// - 渲染导出按钮
// - 触发导出请求
// - 处理文件下载
```

#### 3. ImportResultModal 组件

```typescript
interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

interface ImportResultModalProps {
  visible: boolean;
  result: ImportResult;
  onClose: () => void;
}

// 功能：
// - 显示导入结果摘要
// - 显示错误列表（如果有）
```

### Frontend Services

#### ExcelService

```typescript
class ExcelService {
  /**
   * 上传 Excel 文件并导入订单
   */
  async importOrders(file: File): Promise<ImportResult>;

  /**
   * 导出订单数据为 Excel 文件
   */
  async exportOrders(): Promise<void>;
}
```

### Backend API Endpoints

#### POST /api/orders/import

```typescript
// Request:
// Content-Type: multipart/form-data
// Body: { file: File }

// Response:
interface ImportResponse {
  success: boolean;
  message: string;
  data: {
    successCount: number;
    failureCount: number;
    errors: Array<{
      row: number;
      field: string;
      message: string;
      value?: any;
    }>;
  };
}
```

#### GET /api/orders/export

```typescript
// Response:
// Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// Content-Disposition: attachment; filename="订单数据_20240101_120000.xlsx"
// Body: Binary Excel file
```

### Backend Services

#### ExcelImportService

```typescript
class ExcelImportService {
  /**
   * 解析并导入 Excel 文件
   */
  async importOrders(file: Buffer): Promise<ImportResult>;

  /**
   * 解析 Excel 文件
   */
  private parseExcelFile(buffer: Buffer): Promise<ParsedRow[]>;

  /**
   * 映射并验证数据
   */
  private mapAndValidateRow(row: any[], rowNumber: number): { order: Partial<Order>, errors: string[] };
}
```

#### ExcelExportService

```typescript
class ExcelExportService {
  /**
   * 导出所有订单为 Excel 文件
   */
  async exportOrders(): Promise<Buffer>;

  /**
   * 将订单数据转换为 Excel 行
   */
  private mapOrderToRow(order: Order): any[];
}
```

#### FieldMapper

```typescript
class FieldMapper {
  /**
   * 映射 Excel 行到订单对象
   */
  static mapExcelRowToOrder(row: any[]): Partial<Order>;

  /**
   * 映射订单对象到 Excel 行
   */
  static mapOrderToExcelRow(order: Order): any[];

  /**
   * 获取字段默认值
   */
  static getDefaultValue(fieldName: string): any;
}
```

#### DataValidator

```typescript
class DataValidator {
  /**
   * 验证邮箱格式
   */
  static validateEmail(email: string): boolean;

  /**
   * 验证日期格式
   */
  static validateDate(date: string): boolean;

  /**
   * 验证金额
   */
  static validateAmount(amount: any): boolean;

  /**
   * 验证订单数据并返回错误列表
   */
  static validateOrderData(order: Partial<Order>): string[];
}
```

## Data Models

### Excel 列映射

Excel 文件的列顺序（导入）：
```
0:  新老客户
1:  国家
2:  大洲
3:  来源
4:  线索编号
5:  到款日期
6:  公司名
7:  客户名
8:  邮箱
9:  发票金额
10: 到款金额
11: 成单产品
12: 客户背调
13: 联系方式
14: 建档日期
15: 客户性质
16: 发票号（系统中不存在此字段，跳过）
17: 请购单号
18: 发货日期（系统中不存在此字段，跳过）
19: 提单/快递单号（忽略）
20: 到款截图（忽略）
```

Excel 文件的列顺序（导出）：
```
0:  新老客户
1:  国家
2:  大洲
3:  来源
4:  线索编号
5:  到款日期
6:  公司名
7:  客户名
8:  邮箱
9:  发票金额
10: 到款金额
11: 成单产品
12: 客户背调
13: 联系方式
14: 建档日期
15: 客户性质
16: 发票号（导出时填充空值）
17: 请购单号
18: 发货日期（导出时填充空值）
```

### 字段映射表

| Excel 列名 | 系统字段名 | 类型 | 必填 | 默认值 | 说明 |
|-----------|-----------|------|------|--------|------|
| 新老客户 | newOrOld | select | 否 | "新客户" | 枚举：新客户/老客户 |
| 国家 | country | input | 否 | "-" | 文本 |
| 大洲 | continent | input | 否 | "-" | 文本 |
| 来源 | source | input | 否 | "-" | 文本 |
| 线索编号 | leadNumber | input | 是 | "-" | 文本 |
| 到款日期 | paymentDate | date | 否 | null | YYYY-MM-DD |
| 公司名 | companyName | input | 是 | "-" | 文本 |
| 客户名 | contactInfo[0].name | input | 否 | "-" | 联系人姓名 |
| 邮箱 | contactInfo[0].email | input | 否 | "-" | 邮箱地址 |
| 发票金额 | invoiceAmount | number | 否 | null | 数值 |
| 到款金额 | paymentAmount | number | 否 | null | 数值 |
| 成单产品 | closedProduct | input | 是 | "-" | 文本 |
| 客户背调 | customerBackgroundCheck | input | 否 | null | 文本 |
| 联系方式 | contactInfo[0].phone | input | 否 | "-" | 电话号码 |
| 建档日期 | orderDate | date | 是 | 当前日期 | YYYY-MM-DD |
| 客户性质 | customerNature | input | 否 | "-" | 文本 |
| 发票号 | - | - | - | - | 系统不存在，跳过 |
| 请购单号 | purchaseOrderNumber | input | 否 | null | 文本 |
| 发货日期 | - | - | - | - | 系统不存在，跳过 |
| 提单/快递单号 | - | - | - | - | 忽略 |
| 到款截图 | - | - | - | - | 忽略 |

### ParsedRow 接口

```typescript
interface ParsedRow {
  rowNumber: number;
  data: {
    newOrOld?: string;
    country?: string;
    continent?: string;
    source?: string;
    leadNumber?: string;
    paymentDate?: string;
    companyName?: string;
    customerName?: string;
    email?: string;
    invoiceAmount?: number;
    paymentAmount?: number;
    closedProduct?: string;
    customerBackgroundCheck?: string;
    phone?: string;
    orderDate?: string;
    customerNature?: string;
    purchaseOrderNumber?: string;
  };
}
```

### ValidationError 接口

```typescript
interface ValidationError {
  row: number;
  message: string;
}
```

### ImportResult 接口

```typescript
interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: ValidationError[];
}
```

## Correctness Properties

*属性是一种特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### Property 1: 文件类型验证

*对于任意*上传的文件，只有扩展名为 .xlsx 或 .xls 的文件应该被接受，其他格式应该被拒绝并返回错误

**Validates: Requirements 1.1, 1.2**

### Property 2: 列顺序正确性

*对于任意*包含订单数据的 Excel 文件，解析后的订单对象中的字段值应该与 Excel 中对应列位置的值一致

**Validates: Requirements 2.1**

### Property 3: 忽略列处理

*对于任意*Excel 文件，"提单/快递单号"（第 19 列）和"到款截图"（第 20 列）的数据应该被跳过，不出现在导入的订单中

**Validates: Requirements 2.2, 2.3**

### Property 4: 空行跳过

*对于任意*包含空行的 Excel 文件，空行应该被跳过，且其他有效行应该正常导入

**Validates: Requirements 2.4**

### Property 5: 表头跳过

*对于任意*Excel 文件，第一行应该被视为表头并跳过，数据从第二行开始读取

**Validates: Requirements 2.5**

### Property 6: 必填字段默认值

*对于任意*必填字段，当 Excel 单元格为空时，应该填充默认值：输入框类型填充"-"，选择框类型选择第一个枚举值，日期类型使用当前日期

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: 非必填字段空值处理

*对于任意*非必填字段，当 Excel 单元格为空时，导入的订单中该字段应该为 null 或 undefined，不应填充默认值

**Validates: Requirements 3.4**

### Property 8: 日期格式验证

*对于任意*日期字段，只有符合 YYYY-MM-DD 格式且不晚于当前日期的值应该被接受，无效格式或未来日期应该被拒绝

**Validates: Requirements 3.5, 6.3**

### Property 9: 金额非负验证

*对于任意*金额字段（发票金额、到款金额），只有非负数值应该被接受，负数或非数字值应该被拒绝

**Validates: Requirements 3.6, 6.2**

### Property 10: 批量导入完整性

*对于任意*包含 N 条有效订单数据的 Excel 文件，导入后数据库中应该新增 N 条订单记录

**Validates: Requirements 4.1, 4.3**

### Property 11: 错误记录完整性

*对于任意*包含 M 条无效数据的 Excel 文件，导入结果应该包含 M 条错误记录，每条错误记录包含行号和错误原因

**Validates: Requirements 4.2, 4.4**

### Property 12: 邮箱格式验证

*对于任意*邮箱字段，只有符合标准邮箱格式（包含 @ 和域名）的值应该被接受，无效格式应该被拒绝

**Validates: Requirements 6.1**

### Property 13: 重复线索编号处理

*对于任意*包含重复线索编号的 Excel 文件，所有订单应该都被导入，但应该在结果中包含重复警告信息

**Validates: Requirements 6.4**

### Property 14: 类型不匹配拒绝

*对于任意*数据行，如果字段值的类型与预期不匹配（例如在数值字段中填入文本），该行应该被拒绝并记录错误

**Validates: Requirements 6.5**

### Property 15: 导出完整性

*对于任意*包含 N 条订单的数据库，导出的 Excel 文件应该包含 N+1 行（N 行数据 + 1 行表头）

**Validates: Requirements 5.1, 5.3**

### Property 16: 导出列顺序

*对于任意*导出的 Excel 文件，列的顺序应该严格按照指定顺序：新老客户、国家、大洲、来源、线索编号、到款日期、公司名、客户名、邮箱、发票金额、到款金额、成单产品、客户背调、联系方式、建档日期、客户性质、发票号、请购单号、发货日期

**Validates: Requirements 5.2**

### Property 17: 导出文件格式

*对于任意*导出操作，生成的文件应该是有效的 .xlsx 格式，且响应头中的 Content-Disposition 应该包含格式为"订单数据_YYYYMMDD_HHMMSS.xlsx"的文件名

**Validates: Requirements 5.4, 5.5**

### Property 18: 导入导出往返一致性（Round Trip）

*对于任意*订单数据集，导出为 Excel 后再导入，应该得到与原始数据等价的订单集合（忽略系统不存在的字段）

**Validates: Requirements 2.1, 5.2**

### Property 19: 操作结果反馈

*对于任意*导入或导出操作，API 响应应该包含操作状态（成功/失败）、消息和相关数据（成功数量、错误详情等）

**Validates: Requirements 7.4, 7.5**

## Error Handling

### 文件上传错误

1. **文件类型错误**
   - 错误码: `INVALID_FILE_TYPE`
   - 消息: "不支持的文件格式，请上传 .xlsx 或 .xls 文件"
   - HTTP 状态码: 400

2. **文件大小超限**
   - 错误码: `FILE_TOO_LARGE`
   - 消息: "文件大小超过 10MB 限制"
   - HTTP 状态码: 400

3. **文件解析失败**
   - 错误码: `PARSE_ERROR`
   - 消息: "Excel 文件解析失败，请检查文件格式"
   - HTTP 状态码: 400

### 数据验证错误

1. **必填字段缺失**
   - 错误码: `REQUIRED_FIELD_MISSING`
   - 消息: "第 {row} 行：{field} 为必填字段"
   - 处理: 使用默认值填充

2. **日期格式错误**
   - 错误码: `INVALID_DATE_FORMAT`
   - 消息: "第 {row} 行：{field} 日期格式无效，应为 YYYY-MM-DD"
   - 处理: 拒绝该行数据

3. **金额格式错误**
   - 错误码: `INVALID_AMOUNT_FORMAT`
   - 消息: "第 {row} 行：{field} 金额格式无效或为负数"
   - 处理: 拒绝该行数据

4. **邮箱格式错误**
   - 错误码: `INVALID_EMAIL_FORMAT`
   - 消息: "第 {row} 行：邮箱格式无效"
   - 处理: 拒绝该行数据

5. **数据类型不匹配**
   - 错误码: `TYPE_MISMATCH`
   - 消息: "第 {row} 行：{field} 数据类型不匹配"
   - 处理: 拒绝该行数据

### 数据库错误

1. **批量插入失败**
   - 错误码: `BATCH_INSERT_FAILED`
   - 消息: "批量导入失败，已回滚所有操作"
   - HTTP 状态码: 500
   - 处理: 回滚事务，返回错误

2. **查询失败**
   - 错误码: `QUERY_FAILED`
   - 消息: "查询订单数据失败"
   - HTTP 状态码: 500

### 导出错误

1. **无数据导出**
   - 错误码: `NO_DATA_TO_EXPORT`
   - 消息: "没有可导出的订单数据"
   - HTTP 状态码: 404

2. **文件生成失败**
   - 错误码: `EXPORT_FAILED`
   - 消息: "Excel 文件生成失败"
   - HTTP 状态码: 500

### 错误处理策略

1. **简单直接的导入**
   - 一次性处理所有数据
   - 有效数据全部导入，无效数据跳过
   - 返回成功和失败的数量及错误列表

2. **基本错误反馈**
   - 返回错误行号和简单的错误描述
   - 用户可以根据错误信息修正 Excel 后重新导入

3. **错误日志**
   - 所有错误记录到服务器日志
   - 便于问题追踪

## Testing Strategy

### 单元测试

单元测试用于验证特定示例、边界情况和错误条件：

1. **FieldMapper 测试**
   - 测试每个字段的映射正确性
   - 测试默认值填充逻辑
   - 测试空值处理

2. **DataValidator 测试**
   - 测试邮箱验证（有效和无效示例）
   - 测试日期验证（边界日期、无效格式）
   - 测试金额验证（零、负数、非数字）

3. **ExcelImportService 测试**
   - 测试空文件处理
   - 测试单行数据导入
   - 测试错误累积

4. **ExcelExportService 测试**
   - 测试空数据导出
   - 测试单条订单导出
   - 测试文件名生成

### 属性测试

属性测试用于验证跨所有输入的通用属性，使用 fast-check 库：

**配置要求：**
- 每个属性测试最少运行 100 次迭代
- 每个测试必须引用设计文档中的属性
- 标签格式：`Feature: excel-import-export, Property {number}: {property_text}`

**测试用例：**

1. **Property 1: 文件类型验证**
   - 生成随机文件扩展名
   - 验证只有 .xlsx 和 .xls 被接受

2. **Property 2: 列顺序正确性**
   - 生成随机订单数据的 Excel
   - 验证解析后字段值与原始列值一致

3. **Property 3: 忽略列处理**
   - 生成包含所有列的 Excel
   - 验证第 19、20 列数据不出现在订单中

4. **Property 4: 空行跳过**
   - 生成包含随机位置空行的 Excel
   - 验证空行被跳过且其他行正常导入

5. **Property 6: 必填字段默认值**
   - 生成必填字段为空的 Excel
   - 验证默认值被正确填充

6. **Property 7: 非必填字段空值处理**
   - 生成非必填字段为空的 Excel
   - 验证字段为 null 而非默认值

7. **Property 8: 日期格式验证**
   - 生成各种日期格式和未来日期
   - 验证只有有效格式和过去日期被接受

8. **Property 9: 金额非负验证**
   - 生成正数、负数、零、非数字
   - 验证只有非负数值被接受

9. **Property 10: 批量导入完整性**
   - 生成 N 条有效订单
   - 验证导入后数据库新增 N 条记录

10. **Property 11: 错误记录完整性**
    - 生成包含 M 条错误的 Excel
    - 验证返回 M 条错误记录

11. **Property 12: 邮箱格式验证**
    - 生成各种邮箱格式
    - 验证只有有效格式被接受

12. **Property 15: 导出完整性**
    - 创建 N 条订单
    - 验证导出 Excel 包含 N+1 行

13. **Property 16: 导出列顺序**
    - 导出订单数据
    - 验证列顺序符合规范

14. **Property 18: 导入导出往返一致性**
    - 生成随机订单集合
    - 导出后再导入，验证数据等价

### 集成测试

1. **完整导入流程测试**
   - 上传真实 Excel 文件
   - 验证端到端流程
   - 检查数据库状态

2. **完整导出流程测试**
   - 创建测试订单
   - 触发导出
   - 验证文件内容

3. **错误恢复测试**
   - 模拟数据库错误
   - 验证事务回滚
   - 确认数据一致性

### 测试数据生成器

使用 fast-check 创建以下生成器：

```typescript
// 生成随机订单数据
const orderArbitrary = fc.record({
  newOrOld: fc.constantFrom('新客户', '老客户'),
  country: fc.string({ minLength: 1, maxLength: 50 }),
  continent: fc.string({ minLength: 1, maxLength: 50 }),
  // ... 其他字段
});

// 生成随机 Excel 行数据
const excelRowArbitrary = fc.array(fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double(),
  fc.constant(null)
), { minLength: 21, maxLength: 21 });

// 生成包含错误的数据
const invalidOrderArbitrary = fc.record({
  email: fc.string(), // 无效邮箱
  invoiceAmount: fc.integer({ max: -1 }), // 负数金额
  // ... 其他无效字段
});
```

### 性能测试

1. **大文件导入测试**
   - 测试 1000 行、5000 行、10000 行数据
   - 监控内存使用和处理时间
   - 确保不超过 10MB 限制

2. **批量导出测试**
   - 测试导出 1000+订单
   - 监控文件生成时间
   - 验证内存不溢出

### 测试覆盖率目标

- 代码覆盖率：>= 80%
- 分支覆盖率：>= 75%
- 所有属性测试通过 100 次迭代
- 所有边界情况有单元测试覆盖
