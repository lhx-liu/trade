# 设计文档 - 外贸订单管理系统

## 概述

外贸订单管理系统是一个全栈Web应用，采用前后端分离架构。系统以订单管理为核心，通过公司名关联客户信息，提供订单录入、查询、统计等功能。

### 核心功能
- 订单CRUD操作（创建、读取、更新、删除）
- 客户信息自动管理（通过公司名关联）
- 高级查询界面（9个查询条件）
- 数据统计与报表
- 数据持久化（SQLite）

### 技术栈选择理由
- **前端**: React 18 + TypeScript - 提供类型安全和组件化开发
- **UI框架**: Ant Design - 提供丰富的企业级组件（表单、表格、日期选择器等）
- **状态管理**: React Context API - 适合中小型应用，避免Redux的复杂性
- **HTTP客户端**: Axios - 简化API调用和错误处理
- **后端**: Node.js + Express - 轻量级、高性能的RESTful API框架
- **数据库**: SQLite3 - 无需独立服务器，适合单机部署
- **ORM**: better-sqlite3 - 同步API，性能优于异步sqlite3

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  订单管理页  │  │  客户查询页  │  │  统计报表页  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │  Context Store  │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │   Axios Client  │                         │
│                  └────────┬────────┘                         │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────▼──────────────────────────────────┐
│                    后端层 (Express)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  路由层      │  │  控制器层    │  │  服务层      │      │
│  │  (Routes)    │─▶│ (Controllers)│─▶│  (Services)  │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                              │              │
│                                       ┌──────▼───────┐        │
│                                       │  数据访问层  │        │
│                                       │    (DAO)     │        │
│                                       └──────┬───────┘        │
└───────────────────────────────────────────────┼──────────────┘
                                                │
┌───────────────────────────────────────────────▼──────────────┐
│                    数据层 (SQLite)                           │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  orders表    │  │  customers表 │                         │
│  └──────────────┘  └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### 分层职责

**前端层**:
- 用户界面渲染和交互
- 表单验证和数据格式化
- 状态管理（Context API）
- API调用和错误处理

**后端层**:
- RESTful API端点
- 业务逻辑处理
- 数据验证
- 数据库操作
- 错误处理和日志记录

**数据层**:
- 数据持久化
- 事务管理
- 数据完整性约束

## 数据模型设计

### 数据库表结构

#### orders表（订单表）

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_date TEXT NOT NULL,              -- 订单日期 (ISO 8601格式)
  company_name TEXT NOT NULL,            -- 公司名（外键关联customers表）
  contact_info TEXT NOT NULL,            -- 客户信息JSON数组
  lead_number TEXT NOT NULL,             -- 线索编号
  new_or_old TEXT,                       -- 新老客户 (新客户/老客户)
  customer_level TEXT,                   -- 客户等级 (A/B/C)
  country TEXT,                          -- 国家
  continent TEXT,                        -- 大洲
  source TEXT,                           -- 来源
  customer_nature TEXT,                  -- 客户性质
  invoice_amount REAL,                   -- 发票金额
  payment_amount REAL,                   -- 到款金额
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_name) REFERENCES customers(company_name) ON DELETE CASCADE
);

CREATE INDEX idx_orders_company_name ON orders(company_name);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_country ON orders(country);
CREATE INDEX idx_orders_continent ON orders(continent);
```

**字段说明**:
- `contact_info`: 存储为JSON字符串，格式为 `[{"name":"张三","email":"zhang@example.com","phone":"123456"}]`
- `order_date`: 使用ISO 8601格式 (YYYY-MM-DD)
- 金额字段使用REAL类型，支持小数

#### customers表（客户表）

```sql
CREATE TABLE customers (
  company_name TEXT PRIMARY KEY,         -- 公司名（唯一标识）
  business_opportunity TEXT,             -- 客户商机
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**设计说明**:
- `company_name`作为主键，确保客户唯一性
- `business_opportunity`字段在任何订单更新时同步更新
- 当客户的最后一个订单被删除时，客户记录也被删除

### TypeScript类型定义

```typescript
// 联系人信息
interface ContactInfo {
  name: string;      // 客户名
  email: string;     // 邮箱
  phone: string;     // 联系方式
}

// 订单实体
interface Order {
  id?: number;
  orderDate: string;              // YYYY-MM-DD
  companyName: string;
  contactInfo: ContactInfo[];
  leadNumber: string;
  newOrOld?: string;              // "新客户" | "老客户"
  customerLevel?: string;         // "A" | "B" | "C"
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 客户实体
interface Customer {
  companyName: string;
  businessOpportunity?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 查询参数
interface QueryParams {
  startDate?: string;
  endDate?: string;
  companyName?: string;
  customerName?: string;
  newOrOld?: string;
  customerLevel?: string;
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  page?: number;
  pageSize?: number;
}

// 统计数据
interface Statistics {
  totalOrders: number;
  totalCustomers: number;
  totalInvoiceAmount: number;
  totalPaymentAmount: number;
  byCountry: Record<string, number>;
  byContinent: Record<string, number>;
  byCustomerLevel: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    orderCount: number;
    invoiceAmount: number;
    paymentAmount: number;
  }>;
}
```

## 组件与接口设计

### 前端组件结构

```
src/
├── components/
│   ├── OrderList/              # 订单列表组件
│   │   ├── OrderList.tsx
│   │   ├── OrderTable.tsx
│   │   └── QueryForm.tsx       # 查询表单（9个条件）
│   ├── OrderForm/              # 订单表单组件
│   │   ├── OrderForm.tsx
│   │   └── ContactInfoInput.tsx # 动态联系人输入
│   ├── CustomerModal/          # 客户订单弹窗
│   │   └── CustomerModal.tsx
│   └── Statistics/             # 统计报表组件
│       ├── StatisticsPanel.tsx
│       └── Charts.tsx
├── context/
│   └── AppContext.tsx          # 全局状态管理
├── services/
│   └── api.ts                  # API调用封装
├── utils/
│   ├── validation.ts           # 表单验证
│   └── formatters.ts           # 数据格式化
└── types/
    └── index.ts                # TypeScript类型定义
```

### 核心组件设计

#### QueryForm组件（查询表单）

**职责**: 提供9个查询条件的输入界面

**状态**:
```typescript
interface QueryFormState {
  dateRange: [string, string];    // 默认：当年1月1日 - 12月31日
  companyName: string;
  customerName: string;
  newOrOld: string;
  customerLevel: string;
  country: string;
  continent: string;
  source: string;
  customerNature: string;
}
```

**交互逻辑**:
- 文本输入框（6个）：使用500ms防抖优化性能
- 下拉选择器（2个）：新老客户、客户等级
- 日期范围选择器：自动触发查询
- 搜索按钮：手动触发查询
- 重置按钮：清空条件并恢复默认日期

#### OrderForm组件（订单表单）

**职责**: 订单创建和编辑

**功能**:
- 必填字段验证（订单日期、公司名、客户信息、线索编号）
- 邮箱格式验证
- 数字字段验证（发票金额、到款金额）
- 动态添加/删除联系人信息

#### ContactInfoInput组件（联系人输入）

**职责**: 动态管理多条联系人记录

**功能**:
- 添加新联系人
- 删除联系人
- 实时验证（姓名、邮箱、电话）

### API接口规范

#### 基础响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
```

#### 订单相关接口

**1. 创建订单**
```
POST /api/orders
Content-Type: application/json

Request Body:
{
  "orderDate": "2024-01-15",
  "companyName": "ABC公司",
  "contactInfo": [
    {"name": "张三", "email": "zhang@example.com", "phone": "13800138000"}
  ],
  "leadNumber": "LEAD-001",
  "newOrOld": "新客户",
  "customerLevel": "A",
  "country": "美国",
  "continent": "北美洲",
  "source": "展会",
  "customerNature": "贸易商",
  "invoiceAmount": 10000.50,
  "paymentAmount": 5000.00
}

Response: ApiResponse<Order>
```

**2. 查询订单列表**
```
GET /api/orders?startDate=2024-01-01&endDate=2024-12-31&companyName=ABC&page=1&pageSize=20

Response: ApiResponse<{
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}>
```

**3. 获取单个订单**
```
GET /api/orders/:id

Response: ApiResponse<Order>
```

**4. 更新订单**
```
PUT /api/orders/:id
Content-Type: application/json

Request Body: (同创建订单)

Response: ApiResponse<Order>
```

**5. 删除订单**
```
DELETE /api/orders/:id

Response: ApiResponse<{ deleted: boolean }>
```

#### 客户相关接口

**1. 查询客户列表**
```
GET /api/customers?page=1&pageSize=20

Response: ApiResponse<{
  customers: Customer[];
  total: number;
}>
```

**2. 获取客户的所有订单**
```
GET /api/customers/:companyName/orders?page=1&pageSize=10

Response: ApiResponse<{
  customer: Customer;
  orders: Order[];
  total: number;
}>
```

**3. 更新客户商机**
```
PUT /api/customers/:companyName
Content-Type: application/json

Request Body:
{
  "businessOpportunity": "高潜力客户，计划扩大合作"
}

Response: ApiResponse<Customer>
```

#### 统计相关接口

**1. 获取统计数据**
```
GET /api/statistics?startDate=2024-01-01&endDate=2024-12-31

Response: ApiResponse<Statistics>
```

**2. 导出报表**
```
GET /api/export?startDate=2024-01-01&endDate=2024-12-31&format=excel

Response: Excel文件流
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### 后端服务层设计

#### OrderService（订单服务）

**职责**: 订单业务逻辑处理

**核心方法**:
```typescript
class OrderService {
  // 创建订单（自动创建或关联客户）
  async createOrder(orderData: Order): Promise<Order>
  
  // 更新订单（同步更新客户商机）
  async updateOrder(id: number, orderData: Order): Promise<Order>
  
  // 删除订单（级联处理客户记录）
  async deleteOrder(id: number): Promise<boolean>
  
  // 查询订单（支持多条件筛选）
  async queryOrders(params: QueryParams): Promise<{ orders: Order[], total: number }>
  
  // 获取单个订单
  async getOrderById(id: number): Promise<Order | null>
}
```

**业务逻辑**:

1. **创建订单时的客户处理**:
   - 检查`company_name`是否存在于customers表
   - 如果不存在，创建新客户记录
   - 如果存在，关联到现有客户
   - 使用事务确保原子性

2. **更新订单时的客户商机同步**:
   - 如果订单的`businessOpportunity`字段被更新
   - 更新customers表中对应的记录
   - 该公司名下所有订单的商机信息保持一致

3. **删除订单时的客户清理**:
   - 删除订单记录
   - 查询该客户是否还有其他订单
   - 如果没有其他订单，删除客户记录
   - 使用事务确保数据一致性

#### CustomerService（客户服务）

**职责**: 客户信息管理

**核心方法**:
```typescript
class CustomerService {
  // 获取客户列表（按公司名去重）
  async getCustomers(page: number, pageSize: number): Promise<{ customers: Customer[], total: number }>
  
  // 获取客户的所有订单
  async getCustomerOrders(companyName: string, page: number, pageSize: number): Promise<{ customer: Customer, orders: Order[], total: number }>
  
  // 更新客户商机
  async updateBusinessOpportunity(companyName: string, opportunity: string): Promise<Customer>
}
```

#### StatisticsService（统计服务）

**职责**: 数据统计和报表生成

**核心方法**:
```typescript
class StatisticsService {
  // 计算统计数据
  async calculateStatistics(startDate: string, endDate: string): Promise<Statistics>
  
  // 生成Excel报表
  async generateExcelReport(startDate: string, endDate: string): Promise<Buffer>
}
```

**统计逻辑**:
- 订单总数：COUNT(*)
- 客户总数：COUNT(DISTINCT company_name)
- 金额总计：SUM(invoice_amount), SUM(payment_amount)
- 按维度分组：GROUP BY country/continent/customer_level
- 月度趋势：GROUP BY strftime('%Y-%m', order_date)

## 数据流设计

### 订单创建流程

```
用户填写表单
    ↓
前端验证（必填字段、邮箱格式、数字格式）
    ↓
POST /api/orders
    ↓
后端验证
    ↓
开始事务
    ↓
检查客户是否存在
    ├─ 不存在 → 创建客户记录
    └─ 存在 → 获取客户信息
    ↓
插入订单记录
    ↓
提交事务
    ↓
返回订单数据
    ↓
前端更新状态并刷新列表
```

### 查询流程（带防抖优化）

```
用户输入查询条件
    ↓
文本输入 → 500ms防抖
日期选择 → 立即触发
    ↓
构建查询参数
    ↓
GET /api/orders?params
    ↓
后端构建SQL查询
    ↓
WHERE子句组合（AND逻辑）
  - order_date BETWEEN ? AND ?
  - company_name LIKE ?
  - contact_info LIKE ? (JSON搜索)
  - new_or_old = ?
  - customer_level = ?
  - country LIKE ?
  - continent LIKE ?
  - source LIKE ?
  - customer_nature LIKE ?
    ↓
执行查询（带分页）
    ↓
返回结果
    ↓
前端渲染表格
```

### 客户订单查看流程

```
用户点击公司名
    ↓
打开Modal弹窗
    ↓
GET /api/customers/:companyName/orders
    ↓
查询客户信息
    ↓
查询该客户的所有订单（分页）
    ↓
返回数据
    ↓
弹窗显示：
  - 客户商机信息
  - 订单列表（支持分页）
  - 订单编辑功能
    ↓
用户编辑订单 → PUT /api/orders/:id
    ↓
关闭弹窗 → 刷新主列表
```

## 状态管理设计

### Context结构

```typescript
interface AppState {
  orders: Order[];
  customers: Customer[];
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  queryParams: QueryParams;
}

interface AppContextValue {
  state: AppState;
  actions: {
    fetchOrders: (params: QueryParams) => Promise<void>;
    createOrder: (order: Order) => Promise<void>;
    updateOrder: (id: number, order: Order) => Promise<void>;
    deleteOrder: (id: number) => Promise<void>;
    fetchCustomers: () => Promise<void>;
    fetchCustomerOrders: (companyName: string) => Promise<void>;
    fetchStatistics: (startDate: string, endDate: string) => Promise<void>;
    setQueryParams: (params: QueryParams) => void;
  };
}
```

**设计原则**:
- 使用Context API避免prop drilling
- 状态更新通过actions统一管理
- API调用封装在actions中
- 错误处理统一在Context层


## 正确性属性

正确性属性是关于系统行为的形式化陈述，应该在所有有效执行中保持为真。属性是人类可读规范和机器可验证正确性保证之间的桥梁。每个属性都将通过基于属性的测试（Property-Based Testing）来验证，通过生成大量随机输入来确保系统在各种情况下的正确性。

### 订单管理属性

**属性1: 必填字段验证**
*对于任意*订单数据，如果缺少必填字段（订单日期、公司名、客户信息、线索编号），则创建或更新操作应该失败并返回验证错误；如果包含所有必填字段，则操作应该成功
**验证需求: 1.1, 2.2**

**属性2: 联系人信息完整性**
*对于任意*包含N条联系人记录的订单，保存后检索该订单应该返回完全相同的N条联系人记录（包括姓名、邮箱、电话）
**验证需求: 1.2**

**属性3: 邮箱格式验证**
*对于任意*邮箱字符串，如果格式无效（不符合email正则表达式），则包含该邮箱的订单创建应该失败；如果格式有效，则应该成功
**验证需求: 1.3**

**属性4: 数字字段验证**
*对于任意*发票金额或到款金额输入，如果不是有效数字（包含非数字字符或格式错误），则订单创建应该失败；如果是有效数字（包括整数和小数），则应该成功
**验证需求: 1.4**

**属性5: 时间戳自动生成**
*对于任意*新创建的订单，系统应该自动设置created_at和updated_at字段为当前时间戳；当订单被更新时，updated_at应该更新为新的时间戳，而created_at保持不变
**验证需求: 1.5**

**属性6: 订单更新保持性**
*对于任意*已存在的订单和任意字段修改，更新操作后重新查询该订单应该返回更新后的值
**验证需求: 2.1**

**属性7: 订单删除后不可见**
*对于任意*订单，删除操作成功后，通过ID查询该订单应该返回null或404错误
**验证需求: 2.3**

### 客户管理属性

**属性8: 客户自动创建**
*对于任意*使用新公司名（数据库中不存在）的订单，创建订单后应该自动创建对应的客户记录，且客户的company_name与订单的company_name一致
**验证需求: 3.1**

**属性9: 客户关联复用**
*对于任意*两个使用相同公司名的订单，它们应该关联到同一个客户记录（通过查询customers表验证只有一条记录）
**验证需求: 3.2**

**属性10: 客户级联删除 - 保留情况**
*对于任意*拥有多个订单的客户，删除其中一个订单后，客户记录应该仍然存在，且剩余订单仍能正常查询
**验证需求: 2.4**

**属性11: 客户级联删除 - 清理情况**
*对于任意*只有一个订单的客户，删除该订单后，客户记录也应该被自动删除（查询该公司名应返回null）
**验证需求: 2.5**

**属性12: 客户商机同步**
*对于任意*订单，更新其客户商机字段后，查询该公司名对应的客户记录应该显示更新后的商机信息
**验证需求: 3.3**

**属性13: 客户商机一致性**
*对于任意*同一公司名的多个订单，更新任一订单的客户商机后，查询所有这些订单关联的客户记录应该返回相同的商机信息
**验证需求: 3.4**

**属性14: 客户列表去重**
*对于任意*订单集合，查询客户列表时，每个公司名应该只出现一次，且客户总数应该等于不同公司名的数量
**验证需求: 3.5**

### 查询与筛选属性

**属性15: 分页正确性**
*对于任意*订单集合和分页参数（page, pageSize），返回的订单数量应该不超过pageSize，且返回的订单应该是完整结果集的正确子集（基于偏移量计算）
**验证需求: 4.1, 5.2**

**属性16: 日期范围筛选**
*对于任意*日期范围[startDate, endDate]，查询结果中所有订单的order_date应该在该范围内（包含边界）
**验证需求: 4.3-4.10**

**属性17: 模糊搜索正确性**
*对于任意*文本查询条件（公司名称、客户名称、国家、大洲、来源、客户性质），返回的所有订单应该在对应字段中包含该查询字符串（不区分大小写）
**验证需求: 4.3-4.10**

**属性18: 精确匹配筛选**
*对于任意*下拉选择条件（新老客户、客户等级），返回的所有订单应该在对应字段中精确匹配该值
**验证需求: 4.5, 4.6**

**属性19: 多条件AND组合**
*对于任意*多个非空查询条件的组合，返回的所有订单应该同时满足所有条件（AND逻辑）
**验证需求: 4.15**

**属性20: 空条件忽略**
*对于任意*查询，如果某个条件为空或未提供，该条件不应该影响查询结果（等同于不使用该条件）
**验证需求: 4.15**

**属性21: 客户订单完整查询**
*对于任意*公司名，查询该客户的所有订单应该返回数据库中所有company_name等于该值的订单，且不包含其他公司的订单
**验证需求: 4.14, 5.1**

### 统计与报表属性

**属性22: 订单计数准确性**
*对于任意*日期范围，统计的订单总数应该等于该日期范围内实际订单记录的数量
**验证需求: 6.1**

**属性23: 客户计数去重**
*对于任意*日期范围，统计的客户总数应该等于该日期范围内订单的不同公司名数量
**验证需求: 6.1**

**属性24: 金额求和准确性**
*对于任意*日期范围，发票金额总计应该等于该范围内所有订单的invoice_amount之和；到款金额总计应该等于所有payment_amount之和
**验证需求: 6.2**

**属性25: 分组统计正确性**
*对于任意*日期范围和分组维度（国家、大洲、客户等级），每个分组的订单数量之和应该等于总订单数，且每个分组的计数应该等于该维度值对应的实际订单数
**验证需求: 6.3**

**属性26: 月度趋势连续性**
*对于任意*日期范围，月度趋势统计应该包含该范围内所有有订单的月份，且每个月的订单数和金额应该与该月实际数据一致
**验证需求: 6.4**

### 数据持久化属性

**属性27: 写入持久性**
*对于任意*订单，创建后关闭数据库连接再重新打开，通过ID查询应该能检索到相同的订单数据
**验证需求: 7.1**

**属性28: 事务原子性**
*对于任意*需要多步操作的事务（如创建订单+创建客户），如果任一步骤失败，所有操作应该回滚，数据库状态应该保持不变
**验证需求: 7.4**

### API接口属性

**属性29: 响应格式一致性**
*对于任意*API端点和请求，响应应该始终包含标准字段（success, message, data/error），且success为true时包含data，success为false时包含error
**验证需求: 8.1, 8.2**

**属性30: 错误状态码正确性**
*对于任意*导致错误的API请求，响应状态码应该与错误类型匹配：参数验证错误返回400，资源不存在返回404，服务器错误返回500
**验证需求: 8.3**

**属性31: 参数验证完整性**
*对于任意*API端点，发送无效参数（缺少必填参数、类型错误、格式错误）应该返回400状态码和具体的验证错误信息
**验证需求: 8.4**

### 前端验证属性

**属性32: 前端验证一致性**
*对于任意*表单输入，前端验证规则应该与后端验证规则一致（邮箱格式、必填字段、数字格式），确保前端拒绝的输入后端也会拒绝
**验证需求: 9.2**

## 错误处理

### 错误分类

**验证错误 (400 Bad Request)**:
- 缺少必填字段
- 邮箱格式无效
- 数字格式无效
- 日期格式无效
- 参数类型错误

**资源不存在错误 (404 Not Found)**:
- 订单ID不存在
- 客户公司名不存在

**数据库错误 (500 Internal Server Error)**:
- 数据库连接失败
- SQL执行错误
- 事务回滚失败
- 外键约束违反

**业务逻辑错误 (400 Bad Request)**:
- 尝试删除不存在的订单
- 尝试更新不存在的客户

### 错误处理策略

**后端错误处理**:
```typescript
// 全局错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // 根据错误类型返回适当的响应
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      error: err.message
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: '资源不存在',
      error: err.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});
```

**前端错误处理**:
```typescript
// Axios拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // 服务器返回错误响应
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          message.error(`验证错误: ${data.error}`);
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          message.error('请求失败');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络连接失败，请检查网络');
    } else {
      // 请求配置错误
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);
```

### 数据库错误处理

**连接失败处理**:
```typescript
try {
  const db = new Database('orders.db');
  db.pragma('journal_mode = WAL'); // 启用WAL模式提高并发性能
} catch (error) {
  logger.error('数据库连接失败', error);
  throw new DatabaseConnectionError('无法连接到数据库');
}
```

**事务错误处理**:
```typescript
const transaction = db.transaction((orderData, customerData) => {
  try {
    // 创建或更新客户
    const customer = db.prepare('INSERT OR REPLACE INTO customers ...').run(customerData);
    
    // 创建订单
    const order = db.prepare('INSERT INTO orders ...').run(orderData);
    
    return { customer, order };
  } catch (error) {
    // 事务会自动回滚
    throw error;
  }
});

try {
  const result = transaction(orderData, customerData);
} catch (error) {
  logger.error('事务执行失败', error);
  throw new TransactionError('订单创建失败，请重试');
}
```

## 测试策略

### 双重测试方法

系统采用**单元测试**和**基于属性的测试**相结合的方法，确保全面的代码覆盖和正确性验证。

**单元测试**:
- 验证特定示例和边界情况
- 测试错误条件和异常处理
- 测试组件集成点
- 使用Jest作为测试框架

**基于属性的测试**:
- 验证通用属性在所有输入下成立
- 通过随机生成大量测试用例
- 使用fast-check库（JavaScript/TypeScript的PBT库）
- 每个属性测试至少运行100次迭代

### 测试配置

**fast-check配置**:
```typescript
import fc from 'fast-check';

// 配置全局测试参数
const testConfig = {
  numRuns: 100,        // 每个属性至少100次迭代
  verbose: true,       // 显示详细输出
  seed: Date.now(),    // 使用时间戳作为随机种子
};

// 示例：测试属性1 - 必填字段验证
describe('Feature: foreign-trade-tracking-system, Property 1: 必填字段验证', () => {
  it('should reject orders missing required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          orderDate: fc.option(fc.date()),
          companyName: fc.option(fc.string()),
          contactInfo: fc.option(fc.array(contactInfoArbitrary)),
          leadNumber: fc.option(fc.string()),
        }),
        (orderData) => {
          const hasAllRequired = 
            orderData.orderDate && 
            orderData.companyName && 
            orderData.contactInfo && 
            orderData.leadNumber;
          
          const result = createOrder(orderData);
          
          if (hasAllRequired) {
            expect(result.success).toBe(true);
          } else {
            expect(result.success).toBe(false);
            expect(result.error).toContain('必填字段');
          }
        }
      ),
      testConfig
    );
  });
});
```

### 测试数据生成器

**Arbitrary定义**（用于fast-check）:
```typescript
// 联系人信息生成器
const contactInfoArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 8, maxLength: 20 })
});

// 订单生成器
const orderArbitrary = fc.record({
  orderDate: fc.date().map(d => d.toISOString().split('T')[0]),
  companyName: fc.string({ minLength: 1, maxLength: 100 }),
  contactInfo: fc.array(contactInfoArbitrary, { minLength: 1, maxLength: 5 }),
  leadNumber: fc.string({ minLength: 1, maxLength: 50 }),
  newOrOld: fc.option(fc.constantFrom('新客户', '老客户')),
  customerLevel: fc.option(fc.constantFrom('A', 'B', 'C')),
  country: fc.option(fc.string({ maxLength: 50 })),
  continent: fc.option(fc.string({ maxLength: 50 })),
  source: fc.option(fc.string({ maxLength: 50 })),
  customerNature: fc.option(fc.string({ maxLength: 50 })),
  invoiceAmount: fc.option(fc.double({ min: 0, max: 1000000, noNaN: true })),
  paymentAmount: fc.option(fc.double({ min: 0, max: 1000000, noNaN: true }))
});

// 查询参数生成器
const queryParamsArbitrary = fc.record({
  startDate: fc.option(fc.date().map(d => d.toISOString().split('T')[0])),
  endDate: fc.option(fc.date().map(d => d.toISOString().split('T')[0])),
  companyName: fc.option(fc.string()),
  customerName: fc.option(fc.string()),
  newOrOld: fc.option(fc.constantFrom('新客户', '老客户')),
  customerLevel: fc.option(fc.constantFrom('A', 'B', 'C')),
  country: fc.option(fc.string()),
  continent: fc.option(fc.string()),
  source: fc.option(fc.string()),
  customerNature: fc.option(fc.string()),
  page: fc.integer({ min: 1, max: 100 }),
  pageSize: fc.integer({ min: 1, max: 100 })
});
```

### 单元测试示例

**订单创建测试**:
```typescript
describe('OrderService.createOrder', () => {
  it('should create order with valid data', async () => {
    const orderData = {
      orderDate: '2024-01-15',
      companyName: 'Test Company',
      contactInfo: [{ name: '张三', email: 'test@example.com', phone: '13800138000' }],
      leadNumber: 'LEAD-001'
    };
    
    const result = await orderService.createOrder(orderData);
    
    expect(result.id).toBeDefined();
    expect(result.companyName).toBe('Test Company');
  });

  it('should reject order with invalid email', async () => {
    const orderData = {
      orderDate: '2024-01-15',
      companyName: 'Test Company',
      contactInfo: [{ name: '张三', email: 'invalid-email', phone: '13800138000' }],
      leadNumber: 'LEAD-001'
    };
    
    await expect(orderService.createOrder(orderData)).rejects.toThrow('邮箱格式无效');
  });

  it('should create customer when company name is new', async () => {
    const orderData = {
      orderDate: '2024-01-15',
      companyName: 'New Company',
      contactInfo: [{ name: '李四', email: 'li@example.com', phone: '13900139000' }],
      leadNumber: 'LEAD-002'
    };
    
    await orderService.createOrder(orderData);
    
    const customer = await customerService.getCustomer('New Company');
    expect(customer).toBeDefined();
    expect(customer.companyName).toBe('New Company');
  });
});
```

**查询测试**:
```typescript
describe('OrderService.queryOrders', () => {
  beforeEach(async () => {
    // 准备测试数据
    await orderService.createOrder({
      orderDate: '2024-01-15',
      companyName: 'Company A',
      contactInfo: [{ name: '张三', email: 'zhang@a.com', phone: '111' }],
      leadNumber: 'LEAD-001',
      country: '美国'
    });
    
    await orderService.createOrder({
      orderDate: '2024-02-20',
      companyName: 'Company B',
      contactInfo: [{ name: '李四', email: 'li@b.com', phone: '222' }],
      leadNumber: 'LEAD-002',
      country: '中国'
    });
  });

  it('should filter by date range', async () => {
    const result = await orderService.queryOrders({
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
    
    expect(result.orders.length).toBe(1);
    expect(result.orders[0].companyName).toBe('Company A');
  });

  it('should filter by country', async () => {
    const result = await orderService.queryOrders({
      country: '中国'
    });
    
    expect(result.orders.length).toBe(1);
    expect(result.orders[0].country).toBe('中国');
  });

  it('should combine multiple filters with AND logic', async () => {
    const result = await orderService.queryOrders({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      country: '美国'
    });
    
    expect(result.orders.length).toBe(1);
    expect(result.orders[0].companyName).toBe('Company A');
  });
});
```

### 集成测试

**API端到端测试**:
```typescript
describe('Orders API Integration', () => {
  it('should create, update, and delete order', async () => {
    // 创建订单
    const createResponse = await request(app)
      .post('/api/orders')
      .send({
        orderDate: '2024-01-15',
        companyName: 'Integration Test Co',
        contactInfo: [{ name: '测试', email: 'test@test.com', phone: '123' }],
        leadNumber: 'LEAD-INT-001'
      });
    
    expect(createResponse.status).toBe(200);
    expect(createResponse.body.success).toBe(true);
    const orderId = createResponse.body.data.id;
    
    // 更新订单
    const updateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        orderDate: '2024-01-15',
        companyName: 'Integration Test Co',
        contactInfo: [{ name: '测试2', email: 'test2@test.com', phone: '456' }],
        leadNumber: 'LEAD-INT-001-UPDATED'
      });
    
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.leadNumber).toBe('LEAD-INT-001-UPDATED');
    
    // 删除订单
    const deleteResponse = await request(app)
      .delete(`/api/orders/${orderId}`);
    
    expect(deleteResponse.status).toBe(200);
    
    // 验证删除
    const getResponse = await request(app)
      .get(`/api/orders/${orderId}`);
    
    expect(getResponse.status).toBe(404);
  });
});
```

### 测试覆盖率目标

- **代码覆盖率**: 至少80%
- **分支覆盖率**: 至少75%
- **属性测试**: 每个正确性属性至少100次迭代
- **单元测试**: 覆盖所有边界情况和错误条件
- **集成测试**: 覆盖所有API端点的主要流程

### 持续集成

**测试执行流程**:
1. 代码提交触发CI流程
2. 运行代码检查（ESLint, TypeScript编译）
3. 运行单元测试
4. 运行基于属性的测试
5. 运行集成测试
6. 生成覆盖率报告
7. 如果所有测试通过且覆盖率达标，允许合并

## 性能优化

### 数据库优化

**索引策略**:
- `company_name`: 频繁用于JOIN和WHERE子句
- `order_date`: 用于日期范围查询
- `country`, `continent`: 用于分组统计

**查询优化**:
```sql
-- 使用索引的高效查询
SELECT * FROM orders 
WHERE company_name = ? 
  AND order_date BETWEEN ? AND ?
ORDER BY order_date DESC
LIMIT ? OFFSET ?;

-- 避免全表扫描的统计查询
SELECT 
  country,
  COUNT(*) as count
FROM orders
WHERE order_date BETWEEN ? AND ?
GROUP BY country;
```

**连接池配置**:
```typescript
// better-sqlite3是同步的，不需要连接池
// 但需要确保单例模式避免多次打开数据库
class DatabaseManager {
  private static instance: Database;
  
  static getInstance(): Database {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new Database('orders.db');
      DatabaseManager.instance.pragma('journal_mode = WAL');
    }
    return DatabaseManager.instance;
  }
}
```

### 前端优化

**防抖实现**:
```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce((value: string) => {
  fetchOrders({ companyName: value });
}, 500);
```

**虚拟滚动**（大数据量表格）:
```typescript
import { Table } from 'antd';

<Table
  dataSource={orders}
  pagination={{
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条记录`
  }}
  scroll={{ y: 600 }}
/>
```

**数据缓存**:
```typescript
// 使用React Query缓存API响应
import { useQuery } from 'react-query';

const { data, isLoading } = useQuery(
  ['orders', queryParams],
  () => fetchOrders(queryParams),
  {
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    cacheTime: 10 * 60 * 1000, // 缓存10分钟
  }
);
```

## 部署架构

### 开发环境

```
前端: npm run dev (Vite开发服务器, 端口3000)
后端: npm run dev (nodemon, 端口5000)
数据库: orders.db (本地SQLite文件)
```

### 生产环境

```
前端: 静态文件部署到Nginx或CDN
后端: Node.js进程（使用PM2管理）
数据库: SQLite文件（定期备份）
反向代理: Nginx
```

**Nginx配置示例**:
```nginx
server {
  listen 80;
  server_name example.com;

  # 前端静态文件
  location / {
    root /var/www/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # API代理
  location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**PM2配置**:
```json
{
  "apps": [{
    "name": "foreign-trade-api",
    "script": "./dist/server.js",
    "instances": 2,
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": 5000
    }
  }]
}
```

## 安全考虑

### 输入验证

- 所有用户输入必须经过验证和清理
- 使用参数化查询防止SQL注入
- 验证邮箱格式防止XSS攻击
- 限制文件上传大小和类型

### CORS配置

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 数据备份

```bash
# 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp orders.db backups/orders_$DATE.db
# 保留最近30天的备份
find backups/ -name "orders_*.db" -mtime +30 -delete
```

## 监控与日志

### 日志策略

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 记录所有API请求
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});
```

### 性能监控

- 监控API响应时间
- 监控数据库查询性能
- 监控内存使用
- 设置告警阈值

## 总结

本设计文档详细描述了外贸订单管理系统的技术架构、数据模型、API接口、正确性属性和测试策略。系统采用前后端分离架构，使用React + Express + SQLite技术栈，通过基于属性的测试确保系统正确性，并考虑了性能优化、安全性和可维护性。
