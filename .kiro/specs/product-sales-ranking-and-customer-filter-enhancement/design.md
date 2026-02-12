# 设计文档

## 概述

本设计文档描述了两个功能增强的技术实现方案：
1. **客户分析界面查询优化**：将国家字段改为输入框，增加公司名称模糊查询
2. **成单产品排行榜**：新增产品销售统计界面，支持时段筛选

这些功能将提升用户查询体验，并为业务决策提供数据支持。

## 架构

### 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  客户分析界面优化     │  │  成单产品排行榜界面           │ │
│  │  - QueryForm 组件    │  │  - ProductRanking 组件       │ │
│  │  - 国家输入框        │  │  - 时段筛选器                │ │
│  │  - 公司名称模糊搜索  │  │  - 排行榜列表                │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端层 (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ CustomerAnalysis     │  │  ProductRanking              │ │
│  │ Controller           │  │  Controller                  │ │
│  │  - 处理查询参数      │  │  - 处理时段筛选              │ │
│  │  - 参数验证          │  │  - 返回排行榜数据            │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│              │                          │                    │
│              ▼                          ▼                    │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ CustomerAnalysis     │  │  ProductRanking              │ │
│  │ Service              │  │  Service                     │ │
│  │  - 模糊查询逻辑      │  │  - 销售数据聚合              │ │
│  │  - 精确匹配逻辑      │  │  - 排序逻辑                  │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│              │                          │                    │
│              ▼                          ▼                    │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ CustomerAnalysis     │  │  ProductRanking              │ │
│  │ DAO                  │  │  DAO                         │ │
│  │  - SQL查询构建       │  │  - SQL聚合查询               │ │
│  │  - LIKE查询          │  │  - 时段过滤                  │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   SQLite 数据库   │
                    │   orders 表      │
                    └──────────────────┘
```

### 技术栈

- **前端**: React 18, TypeScript, Ant Design, dayjs
- **后端**: Node.js, Express, TypeScript
- **数据库**: SQLite (sql.js)
- **HTTP客户端**: Axios

## 组件和接口

### 1. 客户分析界面优化

#### 1.1 前端组件修改

**组件**: `frontend/src/components/OrderList/QueryForm.tsx`

**修改内容**:
- 国家字段已经是输入框（当前代码已实现）
- 修改公司名称字段，添加模糊查询支持

**关键代码结构**:
```typescript
// 公司名称输入框（已存在，需确保支持模糊查询）
<Form.Item label="公司名称" name="companyName">
  <Input
    placeholder="请输入公司名称（支持模糊搜索）"
    allowClear
    onChange={(e) => handleTextChange('companyName', e.target.value)}
  />
</Form.Item>
```

#### 1.2 后端API修改

**控制器**: `backend/src/controllers/CustomerAnalysisController.ts`

**修改内容**:
- 添加 `companyName` 查询参数支持
- 参数验证和传递

**新增查询参数**:
```typescript
interface CustomerAnalysisQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  country?: string;
  customerLevel?: string;
  customerType?: string;
  companyName?: string;  // 新增：公司名称模糊查询
}
```

**服务层**: `backend/src/services/CustomerAnalysisService.ts`

**修改内容**:
- 在 `getCustomerMetrics` 方法中添加 `companyName` 过滤逻辑
- 将 `companyName` 传递给 DAO 层

**DAO层**: `backend/src/dao/CustomerAnalysisDAO.ts`

**修改内容**:
- 在 `getCustomersWithMetrics` 方法中添加 SQL LIKE 查询
- 实现不区分大小写的模糊匹配

**SQL查询示例**:
```sql
SELECT 
  company_name,
  COUNT(*) as total_orders,
  ...
FROM orders
WHERE company_name IS NOT NULL 
  AND company_name LIKE '%' || ? || '%'  -- 模糊查询
  AND country = ?  -- 精确匹配
GROUP BY company_name
```

### 2. 成单产品排行榜

#### 2.1 前端新增组件

**新组件**: `frontend/src/components/ProductRanking/ProductRanking.tsx`

**组件结构**:
```typescript
interface ProductRankingItem {
  rank: number;           // 排名
  productName: string;    // 产品名称
  salesCount: number;     // 销售数量
  salesAmount: number;    // 销售金额
}

interface ProductRankingState {
  data: ProductRankingItem[];
  loading: boolean;
  error: string | null;
  startDate: string | null;
  endDate: string | null;
}
```

**UI组件**:
- 时段筛选器：使用 Ant Design 的 `RangePicker`
- 数据表格：使用 Ant Design 的 `Table` 组件
- 加载状态：使用 `Spin` 组件
- 错误提示：使用 `Alert` 组件

#### 2.2 后端新增API

**路由**: `backend/src/routes/productRankingRoutes.ts`

```typescript
GET /api/product-ranking
Query Parameters:
  - startDate?: string (YYYY-MM-DD)
  - endDate?: string (YYYY-MM-DD)

Response:
{
  success: boolean;
  data: {
    products: ProductRankingItem[];
    total: number;
  }
}
```

**控制器**: `backend/src/controllers/ProductRankingController.ts`

**职责**:
- 接收和验证查询参数
- 验证日期范围有效性（开始日期不能晚于结束日期）
- 调用服务层获取数据
- 返回格式化的响应

**服务层**: `backend/src/services/ProductRankingService.ts`

**职责**:
- 调用 DAO 层获取原始数据
- 计算排名
- 按销售数量降序排序
- 处理业务逻辑

**DAO层**: `backend/src/dao/ProductRankingDAO.ts`

**职责**:
- 执行 SQL 聚合查询
- 根据时段筛选订单
- 只统计"已成单"状态的订单
- 按产品分组并累加销售数据

**SQL查询示例**:
```sql
SELECT 
  closed_product as product_name,
  COUNT(*) as sales_count,
  SUM(invoice_amount) as sales_amount
FROM orders
WHERE 
  closed_product IS NOT NULL 
  AND closed_product != ''
  AND order_status = '已成单'
  AND (? IS NULL OR order_date >= ?)
  AND (? IS NULL OR order_date <= ?)
GROUP BY closed_product
ORDER BY sales_count DESC
```

#### 2.3 前端路由配置

**文件**: `frontend/src/App.tsx` 或路由配置文件

**新增路由**:
```typescript
{
  path: '/product-ranking',
  element: <ProductRanking />
}
```

**导航菜单**: 在主导航中添加"成单产品排行榜"菜单项

## 数据模型

### 现有数据模型

**Orders 表** (已存在):
```typescript
interface Order {
  id?: number;
  orderDate: string;
  companyName: string;
  country?: string;
  customerLevel?: string;
  newOrOld?: string;
  closedProduct?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  orderStatus?: string;
  // ... 其他字段
}
```

### 新增数据模型

**ProductRankingItem** (前端):
```typescript
interface ProductRankingItem {
  rank: number;
  productName: string;
  salesCount: number;
  salesAmount: number;
}
```

**ProductRankingQuery** (后端):
```typescript
interface ProductRankingQuery {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
}
```

**ProductRankingResponse** (后端):
```typescript
interface ProductRankingResponse {
  products: Array<{
    productName: string;
    salesCount: number;
    salesAmount: number;
  }>;
  total: number;
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 文本输入框接受任意输入

*对于任意* 文本字符串，当输入到国家或公司名称输入框时，系统应接受该输入而不显示验证错误

**验证**: 需求 1.2, 2.1

### 属性 2: 国家精确匹配查询

*对于任意* 国家名称和客户数据集，当使用该国家名称查询时，返回的所有结果的国家字段应精确等于查询的国家名称

**验证**: 需求 1.3

### 属性 3: 公司名称模糊查询

*对于任意* 查询字符串和公司数据集，当使用该字符串进行公司名称查询时，返回的所有结果的公司名称应包含该查询字符串（不区分大小写）

**验证**: 需求 2.2

### 属性 4: 产品按销售数量降序排列

*对于任意* 产品销售数据集，排行榜中的产品列表应按销售数量严格降序排列（即对于任意相邻的两个产品，前一个的销售数量应大于或等于后一个）

**验证**: 需求 3.2

### 属性 5: 产品显示必需字段

*对于任意* 产品排行榜项，其渲染结果应包含产品名称、销售数量和销售金额这三个字段

**验证**: 需求 3.3

### 属性 6: 时段筛选过滤订单

*对于任意* 开始日期、结束日期和订单数据集，当应用时段筛选时，返回的所有订单的订单日期应在 [开始日期, 结束日期] 范围内（包含边界）

**验证**: 需求 3.5

### 属性 7: 无效日期范围验证

*对于任意* 开始日期晚于结束日期的日期对，系统应拒绝该查询并返回错误提示

**验证**: 需求 4.4

### 属性 8: 仅统计已成单订单

*对于任意* 订单数据集，产品排行榜统计中应仅包含订单状态为"已成单"的订单，其他状态的订单应被排除

**验证**: 需求 5.1

### 属性 9: 同产品销售数据累加

*对于任意* 产品和其对应的多个订单，该产品的总销售数量应等于所有订单数量之和，总销售金额应等于所有订单金额之和

**验证**: 需求 5.2

### 属性 10: 无成单记录产品不显示

*对于任意* 产品和时段，如果该产品在该时段内没有任何成单记录，则该产品不应出现在排行榜中

**验证**: 需求 5.3

### 属性 11: 查询结果更新UI

*对于任意* 查询操作，当查询结果返回后，UI 应立即反映新的数据状态（即显示的数据应与最新查询结果一致）

**验证**: 需求 6.3

### 属性 12: 查询条件变化清除结果

*对于任意* 查询条件变化，在新查询执行前，系统应清除之前的查询结果（避免显示过时数据）

**验证**: 需求 6.4

## 错误处理

### 1. 输入验证错误

**场景**: 用户输入无效的查询参数

**处理策略**:
- 前端：实时验证，显示错误提示
- 后端：返回 400 Bad Request，包含详细错误信息

**示例**:
```typescript
// 日期范围验证
if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  return {
    success: false,
    message: '开始日期不能晚于结束日期'
  };
}
```

### 2. 数据库查询错误

**场景**: SQL 查询执行失败

**处理策略**:
- 捕获异常
- 记录错误日志
- 返回 500 Internal Server Error
- 前端显示友好错误信息和重试按钮

**示例**:
```typescript
try {
  const result = await dao.getProductRanking(query);
  return result;
} catch (error) {
  console.error('数据库查询失败:', error);
  throw new Error('获取产品排行榜失败');
}
```

### 3. 空结果处理

**场景**: 查询返回空结果

**处理策略**:
- 返回成功响应，但数据为空数组
- 前端显示"暂无数据"提示
- 不视为错误

**示例**:
```typescript
if (products.length === 0) {
  return {
    success: true,
    data: {
      products: [],
      total: 0
    },
    message: '未找到匹配的产品'
  };
}
```

### 4. 网络请求失败

**场景**: 前端请求后端 API 失败

**处理策略**:
- 使用 try-catch 捕获异常
- 显示错误提示
- 提供重试按钮
- 保持 UI 可用状态

**示例**:
```typescript
try {
  setLoading(true);
  const response = await api.getProductRanking(params);
  setData(response.data);
  setError(null);
} catch (error) {
  setError('加载失败，请重试');
  console.error('API请求失败:', error);
} finally {
  setLoading(false);
}
```

## 测试策略

### 双重测试方法

本项目采用**单元测试**和**属性测试**相结合的方法：

- **单元测试**: 验证特定示例、边界情况和错误条件
- **属性测试**: 通过随机化输入验证通用属性

两者互补，共同确保全面覆盖：
- 单元测试捕获具体的错误
- 属性测试验证通用正确性

### 单元测试

**重点领域**:
- 特定示例（如：空查询返回所有数据）
- 边界情况（如：日期范围边界）
- 错误条件（如：无效日期格式）
- 组件集成点

**工具**: Jest, React Testing Library

**示例测试**:
```typescript
describe('ProductRanking', () => {
  it('应在初始加载时显示所有时段的数据', async () => {
    // 测试默认行为
  });

  it('应在查询结果为空时显示提示信息', async () => {
    // 测试空结果处理
  });

  it('应在日期无效时显示错误提示', async () => {
    // 测试错误处理
  });
});
```

### 属性测试

**配置**:
- 库: fast-check (JavaScript/TypeScript)
- 最小迭代次数: 100次（由于随机化）
- 每个测试必须引用设计文档中的属性

**标签格式**:
```typescript
// Feature: product-sales-ranking-and-customer-filter-enhancement, Property 3: 公司名称模糊查询
```

**避免过多单元测试**:
- 单元测试应专注于特定示例和边界情况
- 属性测试处理大量输入覆盖
- 平衡：每个功能 3-5 个单元测试 + 对应的属性测试

**示例属性测试**:
```typescript
import fc from 'fast-check';

// Feature: product-sales-ranking-and-customer-filter-enhancement, Property 3: 公司名称模糊查询
describe('Property: 公司名称模糊查询', () => {
  it('返回的所有结果应包含查询字符串', () => {
    fc.assert(
      fc.property(
        fc.string(), // 随机查询字符串
        fc.array(fc.record({ companyName: fc.string() })), // 随机公司数据
        (query, companies) => {
          const results = fuzzySearchCompany(query, companies);
          return results.every(r => 
            r.companyName.toLowerCase().includes(query.toLowerCase())
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 测试覆盖目标

- **单元测试覆盖率**: > 80%
- **属性测试**: 每个正确性属性至少一个测试
- **集成测试**: 关键用户流程的端到端测试

### 测试数据

**生成策略**:
- 使用 fast-check 生成随机测试数据
- 包含边界值（空字符串、极大数值、特殊字符）
- 模拟真实业务场景

**示例生成器**:
```typescript
const productArbitrary = fc.record({
  productName: fc.string({ minLength: 1 }),
  salesCount: fc.integer({ min: 0, max: 10000 }),
  salesAmount: fc.float({ min: 0, max: 1000000 })
});

const orderArbitrary = fc.record({
  orderDate: fc.date(),
  companyName: fc.string(),
  closedProduct: fc.string(),
  orderStatus: fc.constantFrom('已成单', '进行中', '已取消'),
  invoiceAmount: fc.float({ min: 0 })
});
```
