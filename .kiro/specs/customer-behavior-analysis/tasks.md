# Implementation Plan: Customer Behavior Analysis

## Overview

本实施计划将客户行为分析功能分解为一系列增量式的开发任务。实施顺序遵循"后端优先"原则，先建立数据层和 API，再构建前端界面。每个任务都是独立可测试的，确保功能逐步集成到现有系统中。

## Tasks

- [x] 1. 创建后端类型定义和数据模型
  - 在 `backend/src/types/index.ts` 中添加客户分析相关的 TypeScript 接口
  - 定义 `CustomerMetrics`, `CustomerDetailAnalysis`, `OrderFrequencyMetrics`, `PurchasePatternMetrics` 等类型
  - 定义 API 查询参数和响应类型
  - _Requirements: 所有需求的数据结构基础_

- [x] 2. 实现 CustomerAnalysisDAO 数据访问层
  - [x] 2.1 创建 `backend/src/dao/CustomerAnalysisDAO.ts`
    - 实现 `getCustomersWithMetrics()` 方法：查询所有客户及其基础指标
    - 实现 `getCustomerOrders()` 方法：查询单个客户的所有订单
    - 实现 `getCustomerCount()` 方法：获取符合筛选条件的客户总数
    - 使用现有的 DatabaseManager 和 SQL 查询
    - _Requirements: 6.1, 6.3_
  
  - [ ]* 2.2 编写 DAO 层单元测试
    - 测试数据库查询错误处理
    - 测试空结果集处理
    - _Requirements: 6.6_
  
  - [ ]* 2.3 编写属性测试：客户列表过滤无订单客户
    - **Property 14: 对于任意客户列表查询结果，返回的所有客户都应至少拥有一个订单**
    - **Validates: Requirements 6.3**

- [x] 3. 实现 CustomerAnalysisService 业务逻辑层
  - [x] 3.1 创建 `backend/src/services/CustomerAnalysisService.ts`
    - 实现 `getCustomerMetrics()` 方法：获取客户列表及指标
    - 实现 `getCustomerDetail()` 方法：获取单个客户详细分析
    - 实现 `calculateOrderFrequency()` 私有方法：计算下单频率指标
    - 实现 `analyzePurchasePattern()` 私有方法：分析采购习惯
    - 实现 `calculateOrderIntervals()` 私有方法：计算订单间隔
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 4.1, 4.2_
  
  - [ ]* 3.2 编写属性测试：客户指标计算正确性
    - **Property 1: 对于任意客户及其订单集合，系统计算的订单总数、月均下单频率、平均订单金额、最近订单日期应正确**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
  
  - [ ]* 3.3 编写属性测试：月均订单数计算公式
    - **Property 5: 对于任意客户的订单集合，月均订单数的计算应使用正确的公式**
    - **Validates: Requirements 3.1**
  
  - [ ]* 3.4 编写属性测试：订单间隔天数计算
    - **Property 6: 对于任意包含至少两个订单的客户，平均订单间隔天数应正确计算**
    - **Validates: Requirements 3.2, 6.5**
  
  - [ ]* 3.5 编写单元测试：单订单客户的边界条件
    - 测试客户仅有一个订单时，订单间隔为 null
    - _Requirements: 3.3_
  
  - [ ]* 3.6 编写属性测试：月度订单趋势统计
    - **Property 7: 对于任意客户的订单集合，按月统计的订单数量应正确**
    - **Validates: Requirements 3.6**
  
  - [ ]* 3.7 编写属性测试：采购金额范围计算
    - **Property 8: 对于任意客户的订单集合，计算的金额范围应正确**
    - **Validates: Requirements 4.1**
  
  - [ ]* 3.8 编写属性测试：采购周期规律识别
    - **Property 9: 对于任意包含至少3个订单的客户，系统应正确识别采购周期规律**
    - **Validates: Requirements 4.2**
  
  - [ ]* 3.9 编写单元测试：订单数不足3个的边界条件
    - 测试客户订单数少于3个时，采购周期规律标记为"数据不足"
    - _Requirements: 4.4_
  
  - [ ]* 3.10 编写属性测试：金额趋势数据生成
    - **Property 10: 对于任意客户的订单集合，生成的金额趋势数据应正确**
    - **Validates: Requirements 4.3**

- [x] 4. 实现数据格式化工具函数
  - [x] 4.1 创建 `backend/src/utils/formatters.ts`
    - 实现 `formatDecimal()` 函数：格式化数值为两位小数
    - 实现 `formatDate()` 函数：格式化日期为 YYYY-MM-DD
    - 实现 `formatCurrency()` 函数：格式化金额（千分位分隔符）
    - _Requirements: 6.4, 7.4, 7.5_
  
  - [ ]* 4.2 编写属性测试：数值格式化精度
    - **Property 15: 对于任意需要显示的平均值，格式化后应保留两位小数**
    - **Validates: Requirements 6.4, 7.4**
  
  - [ ]* 4.3 编写属性测试：日期格式统一性
    - **Property 16: 对于任意需要显示的日期字段，格式化后应符合 YYYY-MM-DD 格式**
    - **Validates: Requirements 7.5**

- [x] 5. 实现 CustomerAnalysisController 控制器层
  - [x] 5.1 创建 `backend/src/controllers/CustomerAnalysisController.ts`
    - 实现 `getCustomers()` 方法：处理获取客户列表请求
    - 实现 `getCustomerDetail()` 方法：处理获取客户详情请求
    - 添加参数验证逻辑
    - 添加错误处理和日志记录
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ]* 5.2 编写属性测试：分页数据正确性
    - **Property 17: 对于任意分页参数，返回的数据应正确**
    - **Validates: Requirements 8.4**
  
  - [ ]* 5.3 编写属性测试：API 成功响应格式
    - **Property 18: 对于任意成功的 API 请求，响应格式应正确**
    - **Validates: Requirements 8.5**
  
  - [ ]* 5.4 编写单元测试：API 错误响应
    - 测试无效参数返回 400 错误
    - 测试服务器错误返回 500 错误
    - _Requirements: 8.6, 8.7, 6.6_

- [x] 6. 创建 API 路由
  - 创建 `backend/src/routes/customerAnalysisRoutes.ts`
  - 定义 `GET /api/customer-analysis/customers` 路由
  - 定义 `GET /api/customer-analysis/customers/:companyName` 路由
  - 在 `backend/src/server.ts` 中注册路由
  - _Requirements: 8.1, 8.2_

- [x] 7. Checkpoint - 后端功能验证
  - 确保所有后端测试通过
  - 使用 Postman 或 curl 测试 API 端点
  - 验证数据格式和响应状态码
  - 如有问题请询问用户

- [x] 8. 创建前端类型定义
  - 在 `frontend/src/types/` 中创建 `customerAnalysis.ts`
  - 定义前端使用的 TypeScript 接口（与后端类型对应）
  - 定义 `CustomerMetrics`, `CustomerDetailAnalysis`, `FilterCriteria`, `PaginationConfig` 等类型
  - _Requirements: 所有需求的前端数据结构_

- [x] 9. 实现前端 API Service
  - [x] 9.1 创建 `frontend/src/services/customerAnalysisService.ts`
    - 实现 `getCustomers()` 方法：调用获取客户列表 API
    - 实现 `getCustomerDetail()` 方法：调用获取客户详情 API
    - 使用 axios 发送 HTTP 请求
    - 添加错误处理
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 9.2 编写单元测试：API Service 错误处理
    - 测试网络错误处理
    - 测试 HTTP 错误状态码处理

- [x] 10. 实现 CustomerFilter 筛选组件
  - [x] 10.1 创建 `frontend/src/components/CustomerAnalysis/CustomerFilter.tsx`
    - 使用 Ant Design Form 组件
    - 实现国家、客户等级、新老客户筛选项
    - 实现筛选条件变更和重置功能
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ]* 10.2 编写属性测试：筛选清除往返一致性
    - **Property 4: 对于任意客户列表，应用筛选后再清除，应返回初始列表**
    - **Validates: Requirements 2.5**

- [x] 11. 实现 CustomerList 客户列表组件
  - [x] 11.1 创建 `frontend/src/components/CustomerAnalysis/CustomerList.tsx`
    - 使用 Ant Design Table 组件
    - 实现列定义（公司名称、订单总数、月均频率、平均金额、最近订单日期）
    - 实现列排序功能
    - 实现分页功能
    - 实现行点击事件（打开客户详情）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ]* 11.2 编写属性测试：列表排序正确性
    - **Property 2: 对于任意客户列表和任意排序字段，排序后的列表应正确**
    - **Validates: Requirements 1.6**
  
  - [ ]* 11.3 编写单元测试：分页边界条件
    - 测试客户列表超过20条时显示分页
    - 测试第一页、最后一页、超出范围的情况
    - _Requirements: 1.7_

- [x] 12. 实现 CustomerDetail 客户详情组件
  - [x] 12.1 创建 `frontend/src/components/CustomerAnalysis/CustomerDetail.tsx`
    - 使用 Ant Design Drawer 组件
    - 实现基本信息展示区域
    - 实现订单时间线展示（使用 Timeline 组件）
    - 实现下单频率指标展示
    - 实现采购习惯指标展示
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 12.2 编写属性测试：客户详情数据完整性
    - **Property 11: 对于任意客户，获取的详细分析数据应包含所有必需字段**
    - **Validates: Requirements 3.4, 3.5, 4.5, 4.6, 5.2, 5.3, 5.4, 5.5**
  
  - [ ]* 12.3 编写属性测试：订单时间线排序
    - **Property 12: 对于任意客户的订单时间线，所有订单应按日期降序排列**
    - **Validates: Requirements 5.6**

- [x] 13. 实现数据可视化图表组件
  - [x] 13.1 创建 `frontend/src/components/CustomerAnalysis/AnalysisCharts.tsx`
    - 使用 @ant-design/charts 库
    - 实现月度订单趋势折线图（Line Chart）
    - 实现订单金额趋势折线图（Line Chart）
    - 配置图表样式和交互
    - _Requirements: 3.6, 4.3_
  
  - [ ]* 13.2 编写单元测试：图表数据格式
    - 测试图表组件接收正确的数据格式
    - 测试空数据时的显示

- [x] 14. 实现 CustomerAnalysis 主页面组件
  - [x] 14.1 创建 `frontend/src/components/CustomerAnalysis/CustomerAnalysis.tsx`
    - 实现页面布局（使用 Ant Design Layout）
    - 集成 CustomerFilter 和 CustomerList 组件
    - 管理页面状态（客户列表、筛选条件、分页、选中客户）
    - 实现数据加载逻辑（使用 useEffect）
    - 实现筛选和分页的交互逻辑
    - 添加加载状态和错误处理
    - _Requirements: 1.1, 2.4, 7.1_
  
  - [ ]* 14.2 编写属性测试：筛选条件正确性
    - **Property 3: 对于任意筛选条件及其组合，返回的客户列表应满足所有条件**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [ ]* 14.3 编写单元测试：页面状态管理
    - 测试加载状态显示
    - 测试错误状态显示
    - 测试空列表状态显示
    - _Requirements: 2.6, 7.1_

- [x] 15. 添加路由和导航
  - 在 `frontend/src/App.tsx` 中添加客户分析路由
  - 在顶部菜单中添加"客户分析"菜单项（使用 UserOutlined 图标）
  - 配置路由路径为 `/customer-analysis`
  - _Requirements: 1.1_

- [x] 16. 样式优化和响应式设计
  - 创建 `frontend/src/components/CustomerAnalysis/CustomerAnalysis.css`
  - 优化组件样式，确保与现有系统风格一致
  - 实现响应式布局（移动端适配）
  - 优化数据可视化图表的显示效果
  - _Requirements: 7.7_

- [ ] 17. 集成测试和端到端验证
  - [ ]* 17.1 编写 API 集成测试
    - 使用 supertest 测试完整的 HTTP 请求-响应流程
    - 测试筛选和分页的组合使用
    - _Requirements: 所有 API 相关需求_
  
  - [ ]* 17.2 编写属性测试：数据更新一致性
    - **Property 13: 对于任意客户，在添加新订单后再次查询，结果应反映新订单的影响**
    - **Validates: Requirements 6.2**

- [x] 18. Final Checkpoint - 完整功能验证
  - 确保所有测试通过（单元测试和属性测试）
  - 在浏览器中手动测试完整用户流程
  - 验证所有需求的实现
  - 检查代码质量和文档完整性
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- Checkpoint 任务用于阶段性验证，确保增量开发的质量
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
- 单元测试和属性测试是互补的，共同确保代码正确性
