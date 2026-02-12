# Implementation Plan: Excel Import/Export

## Overview

实现订单管理系统的 Excel 导入导出功能。前端使用 Ant Design 的 Upload 组件处理文件上传，后端使用 ExcelJS 库解析和生成 Excel 文件。采用简单直接的一次性导入方式，返回导入结果摘要。

## Tasks

- [ ] 1. 后端：创建 Excel 导入导出的工具类
  - [x] 1.1 实现 FieldMapper 工具类
    - 创建 `backend/src/utils/fieldMapper.ts`
    - 实现 Excel 列到订单字段的映射逻辑
    - 实现订单字段到 Excel 列的映射逻辑
    - 实现必填字段默认值获取逻辑
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 1.2 编写 FieldMapper 的属性测试
    - **Property 2: 列顺序正确性**
    - **Property 6: 必填字段默认值**
    - **Property 7: 非必填字段空值处理**
    - **Validates: Requirements 2.1, 3.1, 3.2, 3.3, 3.4**

  - [x] 1.3 实现 DataValidator 工具类
    - 创建 `backend/src/utils/dataValidator.ts`
    - 实现邮箱格式验证
    - 实现日期格式验证（YYYY-MM-DD，不晚于当前日期）
    - 实现金额非负验证
    - 实现订单数据完整性验证
    - _Requirements: 3.5, 3.6, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 1.4 编写 DataValidator 的属性测试
    - **Property 8: 日期格式验证**
    - **Property 9: 金额非负验证**
    - **Property 12: 邮箱格式验证**
    - **Property 14: 类型不匹配拒绝**
    - **Validates: Requirements 3.5, 3.6, 6.1, 6.2, 6.3, 6.5**

- [ ] 2. 后端：实现 Excel 导入服务
  - [x] 2.1 创建 ExcelImportService 类
    - 创建 `backend/src/services/excelImportService.ts`
    - 实现 Excel 文件解析（使用 ExcelJS）
    - 实现表头跳过逻辑（从第二行开始读取）
    - 实现空行跳过逻辑
    - 实现忽略"提单/快递单号"和"到款截图"列
    - 实现逐行数据映射和验证
    - 实现批量订单插入
    - 返回导入结果（成功数量、失败数量、错误列表）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.2 编写 ExcelImportService 的属性测试
    - **Property 3: 忽略列处理**
    - **Property 4: 空行跳过**
    - **Property 5: 表头跳过**
    - **Property 10: 批量导入完整性**
    - **Property 11: 错误记录完整性**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4**

  - [ ]* 2.3 编写单元测试
    - 测试空文件处理
    - 测试单行数据导入
    - 测试错误累积
    - _Requirements: 2.4, 4.2_

- [ ] 3. 后端：实现 Excel 导出服务
  - [x] 3.1 创建 ExcelExportService 类
    - 创建 `backend/src/services/excelExportService.ts`
    - 实现查询所有订单
    - 实现订单数据到 Excel 行的转换
    - 实现 Excel 文件生成（使用 ExcelJS）
    - 添加表头行
    - 按照指定列顺序排列数据
    - 生成文件名（格式：订单数据_YYYYMMDD_HHMMSS.xlsx）
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.2 编写 ExcelExportService 的属性测试
    - **Property 15: 导出完整性**
    - **Property 16: 导出列顺序**
    - **Property 17: 导出文件格式**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 3.3 编写单元测试
    - 测试空数据导出
    - 测试单条订单导出
    - 测试文件名生成
    - _Requirements: 5.1, 5.5_

- [ ] 4. 后端：创建 API 路由
  - [x] 4.1 添加导入 API 端点
    - 在 `backend/src/routes/orderRoutes.ts` 添加 POST /api/orders/import
    - 使用 multer 中间件处理文件上传
    - 验证文件类型（.xlsx, .xls）
    - 验证文件大小（<= 10MB）
    - 调用 ExcelImportService 处理导入
    - 返回导入结果
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.3, 4.4_

  - [x] 4.2 添加导出 API 端点
    - 在 `backend/src/routes/orderRoutes.ts` 添加 GET /api/orders/export
    - 调用 ExcelExportService 生成文件
    - 设置响应头（Content-Type, Content-Disposition）
    - 返回文件流
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ]* 4.3 编写 API 集成测试
    - 测试完整导入流程
    - 测试完整导出流程
    - 测试文件类型验证
    - 测试文件大小验证
    - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [ ] 5. 前端：创建 Excel 导入组件
  - [x] 5.1 创建 ExcelImportButton 组件
    - 创建 `frontend/src/components/ExcelImport/ExcelImportButton.tsx`
    - 使用 Ant Design Upload 组件
    - 实现文件选择和上传
    - 显示上传进度
    - 调用后端导入 API
    - 处理上传成功和失败
    - _Requirements: 1.1, 1.4_

  - [x] 5.2 创建 ImportResultModal 组件
    - 创建 `frontend/src/components/ExcelImport/ImportResultModal.tsx`
    - 显示导入结果摘要（成功数量、失败数量）
    - 显示错误列表（行号和错误信息）
    - 提供关闭按钮
    - _Requirements: 4.3, 4.4, 7.4, 7.5_

  - [x] 5.3 创建 ExcelService
    - 创建 `frontend/src/services/excelService.ts`
    - 实现 importOrders 方法（调用 POST /api/orders/import）
    - 实现 exportOrders 方法（调用 GET /api/orders/export）
    - 处理文件下载
    - _Requirements: 1.1, 5.1_

- [ ] 6. 前端：创建 Excel 导出组件
  - [x] 6.1 创建 ExcelExportButton 组件
    - 创建 `frontend/src/components/ExcelExport/ExcelExportButton.tsx`
    - 使用 Ant Design Button 组件
    - 调用 ExcelService.exportOrders
    - 触发浏览器下载
    - 显示加载状态
    - 处理导出错误
    - _Requirements: 5.1, 5.5_

- [ ] 7. 前端：集成到订单管理页面
  - [x] 7.1 在订单列表页面添加导入导出按钮
    - 修改订单列表页面组件
    - 在页面顶部添加 ExcelImportButton
    - 在页面顶部添加 ExcelExportButton
    - 导入成功后刷新订单列表
    - _Requirements: 1.1, 5.1_

- [ ] 8. 测试和验证
  - [ ]* 8.1 编写端到端属性测试
    - **Property 18: 导入导出往返一致性**
    - 生成随机订单数据
    - 导出为 Excel
    - 重新导入
    - 验证数据等价性
    - **Validates: Requirements 2.1, 5.2**

  - [ ]* 8.2 编写性能测试
    - 测试 1000 行数据导入
    - 测试 1000 条订单导出
    - 监控内存使用
    - _Requirements: 1.3, 4.1, 5.1_

- [ ] 9. Checkpoint - 确保所有测试通过
  - 运行所有单元测试和属性测试
  - 验证导入导出功能正常工作
  - 如有问题请向用户反馈

## Notes

- 任务标记 `*` 的为可选测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号以便追溯
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
- 导入和导出功能相对独立，可以并行开发
