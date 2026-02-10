# 设计文档

## 概述

本设计文档描述了外贸订单管理系统三个UI改进功能的技术实现方案。这些改进包括：

1. **订单表单中添加客户商机录入** - 在OrderForm组件中添加商机输入字段，并在提交时更新客户记录
2. **查询条件展开/收起功能** - 在QueryForm组件中实现条件折叠，默认显示常用字段
3. **修复统计报表路由导航** - 修复React Router导航问题，确保菜单点击正确切换页面

这些改进将提升用户体验，简化操作流程，并修复现有的导航问题。

## 架构

### 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App.tsx    │  │ OrderForm    │  │  QueryForm   │      │
│  │  (路由修复)   │  │ (商机录入)    │  │ (展开/收起)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  AppContext     │                        │
│                   │  (状态管理)      │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │   API Service   │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────┐
│                      后端层 (Express)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Order Routes │  │Order Service │  │Customer DAO  │      │
│  │  (新增API)    │  │  (业务逻辑)   │  │ (数据访问)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            │                  │              │
│                            └──────────────────┘              │
│                                    │                         │
│                            ┌───────▼────────┐                │
│                            │   SQLite DB    │                │
│                            │ (customers表)   │                │
│                            └────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 组件关系

- **OrderForm**: 订单表单组件，新增商机输入字段
- **QueryForm**: 查询表单组件，实现条件展开/收起
- **App**: 应用主组件，修复路由导航逻辑
- **AppContext**: 全局状态管理，处理API调用
- **OrderService**: 订单业务逻辑层，处理商机更新
- **CustomerDAO**: 客户数据访问层，更新商机字段

## 组件和接口

### 1. 订单表单商机录入功能

#### 前端组件修改

**OrderForm.tsx**

```typescript
// 在表单字段中添加商机输入
<Form.Item
  label="客户商机"
  name="businessOpportunity"
  rules={[
    { max: 500, message: '客户商机不能超过500个字符' }
  ]}
>
  <Input.TextArea
    placeholder="请输入客户商机信息"
    rows={3}
    maxLength={500}
    showCount
  />
</Form.Item>
```

**表单提交逻辑**

```typescript
const handleSubmit = async () => {
  const values = await form.validateFields();
  
  const orderData: Order & { businessOpportunity?: string } = {
    ...values,
    orderDate: values.orderDate ? dayjs(values.orderDate).format('YYYY-MM-DD') : '',
  };

  if (isEditing && editingOrder?.id) {
    await actions.updateOrder(editingOrder.id, orderData);
  } else {
    await actions.createOrder(orderData);
  }
  
  // 表单提交后的处理...
};
```

#### 后端API修改

**Order接口扩展 (types/index.ts)**

```typescript
export interface Order {
  // ... 现有字段
  businessOpportunity?: string;  // 新增：客户商机
}
```

**OrderService.createOrder 修改**

```typescript
async createOrder(orderData: Order & { businessOpportunity?: string }): Promise<Order> {
  // ... 现有验证逻辑
  
  return this.dbManager.transaction(() => {
    const customerExists = this.customerDAO.exists(orderData.companyName);

    if (!customerExists) {
      // 创建新客户，包含商机信息
      this.customerDAO.insert({
        companyName: orderData.companyName,
        businessOpportunity: orderData.businessOpportunity || '',
      });
    } else {
      // 更新现有客户的商机信息
      this.customerDAO.update(orderData.companyName, {
        businessOpportunity: orderData.businessOpportunity || '',
      });
    }

    // 创建订单（不包含businessOpportunity字段）
    const { businessOpportunity, ...orderFields } = orderData;
    const orderId = this.orderDAO.insert(orderFields);
    
    const createdOrder = this.orderDAO.findById(orderId);
    if (!createdOrder) {
      throw new Error('订单创建失败');
    }

    return createdOrder;
  });
}
```

**OrderService.updateOrder 修改**

```typescript
async updateOrder(id: number, orderData: Order & { businessOpportunity?: string }): Promise<Order> {
  // ... 现有验证逻辑
  
  return this.dbManager.transaction(() => {
    // 更新客户商机信息
    this.customerDAO.update(orderData.companyName, {
      businessOpportunity: orderData.businessOpportunity || '',
    });

    // 更新订单（不包含businessOpportunity字段）
    const { businessOpportunity, ...orderFields } = orderData;
    this.orderDAO.update(id, orderFields);

    const updatedOrder = this.orderDAO.findById(id);
    if (!updatedOrder) {
      throw new Error('订单更新失败');
    }

    return updatedOrder;
  });
}
```

#### 表单初始化逻辑

```typescript
useEffect(() => {
  if (visible && editingOrder) {
    // 加载客户商机信息
    const loadCustomerInfo = async () => {
      try {
        const customer = await customerApi.getCustomer(editingOrder.companyName);
        form.setFieldsValue({
          ...editingOrder,
          orderDate: editingOrder.orderDate ? dayjs(editingOrder.orderDate) : null,
          businessOpportunity: customer?.businessOpportunity || '',
        });
      } catch (error) {
        console.error('Failed to load customer info:', error);
        form.setFieldsValue({
          ...editingOrder,
          orderDate: editingOrder.orderDate ? dayjs(editingOrder.orderDate) : null,
        });
      }
    };
    loadCustomerInfo();
  } else if (visible) {
    form.resetFields();
  }
}, [visible, editingOrder, form]);
```

### 2. 查询条件展开/收起功能

#### 状态管理

```typescript
const [expanded, setExpanded] = useState(false);

const toggleExpanded = () => {
  setExpanded(!expanded);
};
```

#### UI布局

```typescript
<Card style={{ marginBottom: 16 }}>
  <Form form={form} layout="vertical">
    {/* 始终显示的字段 */}
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="日期范围" name="dateRange">
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="公司名称" name="companyName">
          <Input
            placeholder="请输入公司名称"
            allowClear
            onChange={(e) => handleTextChange('companyName', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button
              type="link"
              icon={expanded ? <UpOutlined /> : <DownOutlined />}
              onClick={toggleExpanded}
            >
              {expanded ? '收起条件' : '更多条件'}
            </Button>
          </Space>
        </Form.Item>
      </Col>
    </Row>

    {/* 可展开的字段 */}
    {expanded && (
      <>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="客户名称" name="customerName">
              <Input
                placeholder="请输入客户名称"
                allowClear
                onChange={(e) => handleTextChange('customerName', e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="新老客户" name="newOrOld">
              <Select placeholder="请选择新老客户" allowClear>
                <Option value="新客户">新客户</Option>
                <Option value="老客户">老客户</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="客户等级" name="customerLevel">
              <Select placeholder="请选择客户等级" allowClear>
                <Option value="A">A</Option>
                <Option value="B">B</Option>
                <Option value="C">C</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="国家" name="country">
              <Input
                placeholder="请输入国家"
                allowClear
                onChange={(e) => handleTextChange('country', e.target.value)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="大洲" name="continent">
              <Input
                placeholder="请输入大洲"
                allowClear
                onChange={(e) => handleTextChange('continent', e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="来源" name="source">
              <Input
                placeholder="请输入来源"
                allowClear
                onChange={(e) => handleTextChange('source', e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="客户性质" name="customerNature">
              <Input
                placeholder="请输入客户性质"
                allowClear
                onChange={(e) => handleTextChange('customerNature', e.target.value)}
              />
            </Form.Item>
          </Col>
        </Row>
      </>
    )}
  </Form>
</Card>
```

### 3. 修复统计报表路由导航

#### 问题分析

当前App.tsx中使用了自定义的hash路由处理，与React Router的声明式路由冲突：

```typescript
// 问题代码
const handleMenuClick = ({ key }: { key: string }) => {
  setSelectedKey(key);
  window.location.hash = `#/${key}`;  // 手动修改hash，但不触发路由切换
};
```

#### 解决方案

使用React Router的`useNavigate` hook进行编程式导航：

```typescript
import { useNavigate, useLocation } from 'react-router-dom';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = React.useState('orders');

  // 监听路由变化，更新选中的菜单项
  React.useEffect(() => {
    const path = location.pathname.slice(1) || 'orders';
    setSelectedKey(path);
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/${key}`);
  };

  // ... 其余代码
};
```

#### 完整修复代码

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu } from 'antd';
import { ShoppingOutlined, BarChartOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider } from './context/AppContext';
import OrderList from './components/OrderList/OrderList';
import Statistics from './components/Statistics/Statistics';
import './App.css';

const { Header, Content } = Layout;

// 内部组件，可以使用路由hooks
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = React.useState('orders');

  const menuItems = [
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '统计报表',
    },
  ];

  // 监听路由变化，同步菜单选中状态
  React.useEffect(() => {
    const path = location.pathname.slice(1) || 'orders';
    setSelectedKey(path);
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/${key}`);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '20px', marginRight: '40px' }}>
          外贸订单管理系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AppProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App;
```

## 数据模型

### 前端类型扩展

```typescript
// Order类型扩展（仅用于表单提交）
export interface OrderFormData extends Order {
  businessOpportunity?: string;  // 客户商机（不存储在订单表）
}

// QueryForm状态
export interface QueryFormState {
  expanded: boolean;  // 查询条件是否展开
}
```

### 后端数据模型

**Customer表** (已存在，无需修改)

```sql
CREATE TABLE customers (
  company_name TEXT PRIMARY KEY,
  business_opportunity TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Order表** (无需修改)

```sql
CREATE TABLE orders (
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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 商机输入字符限制

*对于任意* 输入到商机字段的字符串，如果字符串长度不超过500个字符，则应该被接受；如果超过500个字符，则应该被拒绝并显示验证错误。

**验证需求: 1.2**

### 属性 2: 商机信息持久化和更新

*对于任意* 订单提交（包含商机信息），提交后查询对应客户记录应该返回该商机信息；当同一客户提交多个订单时，客户记录应该包含最新提交的商机信息。

**验证需求: 1.3, 1.5**

### 属性 3: 编辑时加载现有商机

*对于任意* 已存在的客户和订单，当打开订单编辑表单时，表单中的商机字段应该显示该客户当前的商机信息。

**验证需求: 1.4**

### 属性 4: 查询条件值保持

*对于任意* 在查询表单中填写的字段值，当用户收起查询条件后再展开时，所有字段的值应该保持不变（不被清空）。

**验证需求: 2.6**

### 属性 5: 展开状态下的完整查询

*对于任意* 查询参数组合（包括可见和隐藏的字段），当用户触发搜索时，系统应该使用所有非空字段的值执行查询，无论这些字段当前是否可见。

**验证需求: 2.7**

### 属性 6: 浏览器历史记录同步

*对于任意* 页面导航序列，使用浏览器的前进/后退按钮应该正确切换页面内容，并且URL、页面组件和菜单高亮状态应该保持同步。

**验证需求: 3.5, 3.6**

### 属性 7: 客户商机数据库持久化

*对于任意* 包含商机信息的订单提交，无论客户记录是否已存在，提交后数据库中的customers表应该包含该客户的商机信息（新客户创建记录，已存在客户更新记录）。

**验证需求: 4.1, 4.2, 4.3**



## 错误处理

### 1. 商机录入错误处理

**前端验证错误**
- 字符长度超过500：显示表单验证错误"客户商机不能超过500个字符"
- 处理方式：Ant Design Form的内置验证，阻止表单提交

**后端错误**
- 数据库写入失败：返回500错误和错误消息
- 处理方式：事务回滚，前端显示错误提示

**错误恢复**
- 前端：保留用户输入，允许修改后重新提交
- 后端：事务机制确保数据一致性

### 2. 查询条件展开/收起错误处理

**状态管理错误**
- React状态更新失败：极少发生，通常是内存问题
- 处理方式：使用React的错误边界捕获

**表单值丢失**
- 防御性编程：使用Ant Design Form的持久化机制
- 处理方式：表单值存储在Form实例中，不依赖组件状态

### 3. 路由导航错误处理

**路由不匹配**
- 访问不存在的路由：重定向到默认页面（/orders）
- 处理方式：使用Navigate组件进行重定向

**组件加载失败**
- 组件渲染错误：显示错误边界
- 处理方式：React错误边界捕获并显示友好提示

**浏览器兼容性**
- 不支持History API：降级到hash路由
- 处理方式：React Router自动处理

### 4. 数据持久化错误处理

**网络错误**
- API请求失败：显示错误提示，保留用户输入
- 处理方式：try-catch捕获，显示message.error

**数据验证错误**
- 后端验证失败：返回400错误和具体错误信息
- 处理方式：前端显示具体的验证错误

**并发冲突**
- 多个订单同时更新同一客户：最后写入胜出
- 处理方式：使用数据库事务确保原子性

## 测试策略

### 双重测试方法

本项目采用单元测试和属性测试相结合的方法：

- **单元测试**: 验证特定示例、边缘情况和错误条件
- **属性测试**: 验证跨所有输入的通用属性
- 两者互补，共同确保全面覆盖

### 单元测试

单元测试专注于：
- 特定UI交互示例（按钮点击、表单提交）
- 组件渲染的边缘情况（空数据、长文本）
- 错误条件（网络失败、验证错误）
- 组件之间的集成点

**测试工具**: Jest + React Testing Library

**示例单元测试**:

```typescript
// 测试商机字段是否显示
test('OrderForm displays business opportunity field', () => {
  render(<OrderForm visible={true} onCancel={jest.fn()} />);
  expect(screen.getByLabelText('客户商机')).toBeInTheDocument();
});

// 测试查询条件初始状态
test('QueryForm shows only date and company name initially', () => {
  render(<QueryForm />);
  expect(screen.getByLabelText('日期范围')).toBeVisible();
  expect(screen.getByLabelText('公司名称')).toBeVisible();
  expect(screen.queryByLabelText('客户名称')).not.toBeInTheDocument();
});

// 测试路由导航
test('clicking statistics menu navigates to statistics page', () => {
  render(<App />);
  fireEvent.click(screen.getByText('统计报表'));
  expect(screen.getByText(/统计数据/)).toBeInTheDocument();
});
```

### 属性测试

属性测试专注于：
- 跨所有输入的通用属性
- 通过随机化实现全面的输入覆盖
- 数据持久化和一致性保证

**测试工具**: fast-check (JavaScript属性测试库)

**配置**: 每个属性测试最少运行100次迭代

**标签格式**: `Feature: ui-improvements, Property {number}: {property_text}`

**示例属性测试**:

```typescript
// 属性 1: 商机输入字符限制
test('Property 1: Business opportunity character limit', () => {
  fc.assert(
    fc.property(fc.string(), (text) => {
      const form = createForm();
      form.setFieldsValue({ businessOpportunity: text });
      
      const errors = form.getFieldError('businessOpportunity');
      
      if (text.length <= 500) {
        expect(errors).toHaveLength(0);
      } else {
        expect(errors.length).toBeGreaterThan(0);
      }
    }),
    { numRuns: 100 }
  );
  // Feature: ui-improvements, Property 1: 商机输入字符限制
});

// 属性 2: 商机信息持久化和更新
test('Property 2: Business opportunity persistence', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        companyName: fc.string({ minLength: 1, maxLength: 100 }),
        businessOpportunity: fc.string({ maxLength: 500 }),
      }),
      async (orderData) => {
        await orderService.createOrder(orderData);
        const customer = await customerDAO.findByCompanyName(orderData.companyName);
        
        expect(customer?.businessOpportunity).toBe(orderData.businessOpportunity);
      }
    ),
    { numRuns: 100 }
  );
  // Feature: ui-improvements, Property 2: 商机信息持久化和更新
});

// 属性 4: 查询条件值保持
test('Property 4: Query form value persistence', () => {
  fc.assert(
    fc.property(
      fc.record({
        customerName: fc.string(),
        country: fc.string(),
        source: fc.string(),
      }),
      (formValues) => {
        const { result } = renderHook(() => useQueryForm());
        
        // 填写表单
        act(() => {
          result.current.form.setFieldsValue(formValues);
        });
        
        // 收起条件
        act(() => {
          result.current.setExpanded(false);
        });
        
        // 展开条件
        act(() => {
          result.current.setExpanded(true);
        });
        
        // 验证值保持不变
        const currentValues = result.current.form.getFieldsValue();
        expect(currentValues).toEqual(formValues);
      }
    ),
    { numRuns: 100 }
  );
  // Feature: ui-improvements, Property 4: 查询条件值保持
});
```

### 测试覆盖目标

- **单元测试覆盖率**: 80%以上
- **属性测试**: 每个正确性属性至少一个测试
- **集成测试**: 关键用户流程的端到端测试

### 测试执行

```bash
# 运行所有测试
npm test

# 运行属性测试
npm test -- --testNamePattern="Property"

# 查看覆盖率
npm test -- --coverage
```

## 实现注意事项

### 1. 商机录入功能

- 商机字段仅在前端表单中存在，不存储在orders表中
- 提交订单时，商机信息单独更新到customers表
- 编辑订单时，需要额外查询客户信息以加载商机
- 使用数据库事务确保订单和客户更新的原子性

### 2. 查询条件展开/收起

- 使用React状态管理展开/收起状态
- 表单值由Ant Design Form管理，不受展开状态影响
- 使用CSS或条件渲染控制字段可见性
- 确保隐藏字段的值仍然参与查询

### 3. 路由导航修复

- 移除手动hash操作，使用React Router的声明式导航
- 使用useNavigate hook进行编程式导航
- 使用useLocation hook监听路由变化
- 确保菜单选中状态与路由同步

### 4. 性能考虑

- 商机字段加载：仅在编辑时异步加载，不影响列表性能
- 查询条件：展开/收起使用CSS而非重新渲染，性能更好
- 路由切换：React Router的懒加载可进一步优化

### 5. 用户体验

- 商机字段提供字符计数器，实时显示剩余字符
- 查询条件展开/收起有平滑动画过渡
- 路由切换时显示加载状态
- 所有操作提供即时反馈（成功/失败提示）
