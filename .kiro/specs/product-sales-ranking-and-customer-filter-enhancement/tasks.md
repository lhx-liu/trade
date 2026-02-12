# 实施计划: 产品销售排行榜和客户筛选增强

## 概述

本实施计划将功能分为两个主要部分：
1. 客户分析界面查询优化（国家输入框已实现，增加公司名称模糊查询）
2. 成单产品排行榜新功能

实施将采用增量方式，每个任务都在前一个任务的基础上构建，确保代码始终处于可工作状态。

## 任务

- [x] 1. 实现客户分析公司名称模糊查询
  - [x] 1.1 更新后端类型定义，添加 companyName 查询参数
    - 修改 `backend/src/types/index.ts` 中的 `CustomerAnalysisQuery` 接口
    - 添加 `companyName?: string` 字段
    - _需求: 2.1, 2.2_

  - [x] 1.2 修改 DAO 层实现模糊查询
    - 更新 `backend/src/dao/CustomerAnalysisDAO.ts` 的 `getCustomersWithMetrics` 方法
    - 在 SQL 查询中添加 `LIKE` 条件实现不区分大小写的模糊匹配
    - 使用 `LOWER()` 函数确保不区分大小写
    - _需求: 2.2_

  - [ ]* 1.3 编写公司名称模糊查询的属性测试
    - **属性 3: 公司名称模糊查询**
    - **验证: 需求 2.2**
    - 使用 fast-check 生成随机查询字符串和公司数据
    - 验证所有返回结果都包含查询字符串（不区分大小写）

  - [x] 1.4 修改服务层传递 companyName 参数
    - 更新 `backend/src/services/CustomerAnalysisService.ts` 的 `getCustomerMetrics` 方法
    - 将 `companyName` 添加到 filters 对象并传递给 DAO 层
    - _需求: 2.2_

  - [x] 1.5 更新控制器接收 companyName 参数
    - 修改 `backend/src/controllers/CustomerAnalysisController.ts` 的 `getCustomers` 方法
    - 从 query 参数中提取 `companyName`
    - 添加到查询对象中
    - _需求: 2.1, 2.2_

  - [ ]* 1.6 编写单元测试验证空查询和错误处理
    - 测试公司名称为空时返回所有数据
    - 测试查询结果为空时的提示信息
    - _需求: 2.3, 2.4_

  - [x] 1.7 更新前端 QueryForm 组件提示文本
    - 修改 `frontend/src/components/OrderList/QueryForm.tsx`
    - 更新公司名称输入框的 placeholder 为"请输入公司名称（支持模糊搜索）"
    - 确保 onChange 事件正确触发查询
    - _需求: 2.1, 2.2_

- [ ] 2. 检查点 - 验证公司名称模糊查询功能
  - 确保所有测试通过，如有问题请询问用户

- [x] 3. 实现成单产品排行榜后端
  - [x] 3.1 创建产品排行榜类型定义
    - 创建 `backend/src/types/index.ts` 中的新接口
    - 定义 `ProductRankingQuery`, `ProductRankingItem`, `ProductRankingResponse`
    - _需求: 3.1, 3.2, 3.3_

  - [x] 3.2 实现产品排行榜 DAO 层
    - 创建 `backend/src/dao/ProductRankingDAO.ts`
    - 实现 `getProductRanking` 方法，执行 SQL 聚合查询
    - 只统计 `order_status = '已成单'` 的订单
    - 支持时段筛选（startDate, endDate）
    - 按 `closed_product` 分组，计算销售数量和金额
    - _需求: 3.5, 5.1, 5.2_

  - [ ]* 3.3 编写 DAO 层属性测试
    - **属性 8: 仅统计已成单订单**
    - **验证: 需求 5.1**
    - **属性 9: 同产品销售数据累加**
    - **验证: 需求 5.2**
    - 使用 fast-check 生成随机订单数据
    - 验证统计逻辑正确性

  - [x] 3.4 实现产品排行榜服务层
    - 创建 `backend/src/services/ProductRankingService.ts`
    - 实现 `getProductRanking` 方法
    - 调用 DAO 层获取数据
    - 按销售数量降序排序
    - 添加排名字段
    - _需求: 3.2, 3.3_

  - [ ]* 3.5 编写服务层属性测试
    - **属性 4: 产品按销售数量降序排列**
    - **验证: 需求 3.2**
    - **属性 6: 时段筛选过滤订单**
    - **验证: 需求 3.5**
    - 验证排序逻辑和时段筛选

  - [x] 3.6 实现产品排行榜控制器
    - 创建 `backend/src/controllers/ProductRankingController.ts`
    - 实现 `getProductRanking` 方法
    - 验证查询参数（日期格式、日期范围有效性）
    - 调用服务层并返回响应
    - _需求: 3.1, 4.4_

  - [ ]* 3.7 编写控制器单元测试
    - 测试日期验证逻辑（开始日期晚于结束日期）
    - 测试错误处理和响应格式
    - _需求: 4.4, 5.5_

  - [x] 3.8 创建产品排行榜路由
    - 创建 `backend/src/routes/productRankingRoutes.ts`
    - 定义 `GET /api/product-ranking` 路由
    - 连接到控制器
    - _需求: 3.1_

  - [x] 3.9 在主服务器中注册产品排行榜路由
    - 修改 `backend/src/server.ts`
    - 导入并使用 productRankingRoutes
    - _需求: 3.1_

- [ ] 4. 检查点 - 验证后端 API 功能
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 实现成单产品排行榜前端
  - [x] 5.1 创建产品排行榜前端类型定义
    - 在 `frontend/src/types/index.ts` 中添加类型
    - 定义 `ProductRankingItem`, `ProductRankingState`
    - _需求: 3.1, 3.2, 3.3_

  - [x] 5.2 创建产品排行榜 API 服务
    - 创建 `frontend/src/services/productRankingService.ts`
    - 实现 `getProductRanking` 方法调用后端 API
    - 处理请求和响应
    - _需求: 3.1_

  - [x] 5.3 创建产品排行榜组件
    - 创建 `frontend/src/components/ProductRanking/ProductRanking.tsx`
    - 实现组件状态管理（data, loading, error, dateRange）
    - 添加时段筛选器（RangePicker）
    - 添加数据表格（Table）显示排行榜
    - 实现加载状态和错误提示
    - _需求: 3.1, 3.2, 3.3, 3.4, 4.1, 5.4, 5.5_

  - [x] 5.4 实现时段筛选逻辑
    - 在 ProductRanking 组件中实现日期范围变化处理
    - 验证日期范围有效性（开始日期不能晚于结束日期）
    - 触发 API 请求获取筛选后的数据
    - _需求: 3.5, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.5 编写前端属性测试
    - **属性 7: 无效日期范围验证**
    - **验证: 需求 4.4**
    - **属性 11: 查询结果更新UI**
    - **验证: 需求 6.3**
    - **属性 12: 查询条件变化清除结果**
    - **验证: 需求 6.4**

  - [x] 5.6 添加产品排行榜路由配置
    - 修改 `frontend/src/App.tsx` 或路由配置文件
    - 添加 `/product-ranking` 路由
    - 连接到 ProductRanking 组件
    - _需求: 3.1_

  - [x] 5.7 在导航菜单中添加产品排行榜入口
    - 修改主导航组件（如 `frontend/src/components/Layout/Navigation.tsx`）
    - 添加"成单产品排行榜"菜单项
    - 链接到 `/product-ranking` 路由
    - _需求: 3.1_

  - [ ]* 5.8 编写前端单元测试
    - 测试初始加载显示所有时段数据
    - 测试空结果显示提示信息
    - 测试错误处理和重试功能
    - _需求: 3.1, 4.2, 5.5_

- [ ] 6. 最终检查点 - 完整功能验证
  - 确保所有测试通过
  - 验证前后端集成正常
  - 如有问题请询问用户

## 注意事项

- 标记 `*` 的任务为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号以便追溯
- 检查点任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
