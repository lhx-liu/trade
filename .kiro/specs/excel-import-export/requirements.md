# Requirements Document

## Introduction

本文档定义订单管理系统的 Excel 导入导出功能需求。该功能允许用户通过 Excel 文件批量导入订单数据，以及将系统中的订单数据导出为 Excel 文件，提高数据管理效率。

## Glossary

- **System**: 订单管理系统
- **Excel_Importer**: Excel 文件导入处理模块
- **Excel_Exporter**: Excel 文件导出处理模块
- **Order**: 订单数据实体
- **Field_Mapper**: 字段映射处理器
- **File_Validator**: 文件验证器
- **Default_Value_Provider**: 默认值提供器

## Requirements

### Requirement 1: Excel 文件上传

**User Story:** 作为用户，我希望能够上传本地 Excel 文件，以便批量导入订单数据。

#### Acceptance Criteria

1. WHEN 用户选择 Excel 文件进行上传，THE System SHALL 接受 .xlsx 和 .xls 格式的文件
2. WHEN 用户上传非 Excel 格式文件，THE System SHALL 拒绝上传并显示错误提示
3. WHEN Excel 文件大小超过 10MB，THE System SHALL 拒绝上传并提示文件过大
4. WHEN Excel 文件上传成功，THE System SHALL 显示文件名和准备导入的提示

### Requirement 2: Excel 数据解析

**User Story:** 作为系统，我需要正确解析 Excel 文件内容，以便提取订单数据。

#### Acceptance Criteria

1. WHEN Excel_Importer 解析文件，THE System SHALL 按照指定的列顺序读取数据：新老客户、国家、大洲、来源、线索编号、到款日期、公司名、客户名、邮箱、发票金额、到款金额、成单产品、客户背调、联系方式、建档日期、客户性质、发票号、请购单号、发货日期、提单/快递单号、到款截图
2. WHEN Excel_Importer 读取到"提单/快递单号"列，THE System SHALL 跳过该列数据
3. WHEN Excel_Importer 读取到"到款截图"列，THE System SHALL 跳过该列数据
4. WHEN Excel 文件包含空行，THE System SHALL 跳过空行继续处理
5. WHEN Excel 文件第一行为表头，THE System SHALL 从第二行开始读取数据

### Requirement 3: 字段映射和默认值处理

**User Story:** 作为系统，我需要正确映射 Excel 列到系统字段，并处理缺失数据，以确保数据完整性。

#### Acceptance Criteria

1. WHEN Field_Mapper 处理必填字段且 Excel 单元格为空，THE System SHALL 使用默认值
2. WHEN 必填字段为输入框类型且 Excel 单元格为空，THE Default_Value_Provider SHALL 填充"-"
3. WHEN 必填字段为选择框类型且 Excel 单元格为空，THE Default_Value_Provider SHALL 选择第一个枚举值
4. WHEN Field_Mapper 处理非必填字段且 Excel 单元格为空，THE System SHALL 不录入该字段
5. WHEN Field_Mapper 处理日期字段，THE System SHALL 验证日期格式的有效性
6. WHEN Field_Mapper 处理金额字段，THE System SHALL 验证数值格式的有效性

### Requirement 4: 批量导入订单

**User Story:** 作为用户，我希望能够批量导入 Excel 中的所有订单数据，以提高工作效率。

#### Acceptance Criteria

1. WHEN 用户触发导入操作，THE System SHALL 批量创建所有有效的订单记录
2. WHEN 导入过程中遇到数据验证错误，THE System SHALL 记录错误行号和错误原因
3. WHEN 导入完成，THE System SHALL 显示成功导入的订单数量
4. WHEN 导入完成且存在错误，THE System SHALL 显示失败的订单数量和错误详情
5. WHEN 导入过程中发生系统错误，THE System SHALL 回滚所有导入操作并保持数据一致性

### Requirement 5: Excel 数据导出

**User Story:** 作为用户，我希望能够将订单数据导出为 Excel 文件，以便进行数据分析和备份。

#### Acceptance Criteria

1. WHEN 用户触发导出操作，THE Excel_Exporter SHALL 导出所有订单数据
2. WHEN Excel_Exporter 生成文件，THE System SHALL 按照指定列顺序排列：新老客户、国家、大洲、来源、线索编号、到款日期、公司名、客户名、邮箱、发票金额、到款金额、成单产品、客户背调、联系方式、建档日期、客户性质、发票号、请购单号、发货日期
3. WHEN Excel_Exporter 生成文件，THE System SHALL 在第一行添加列标题
4. WHEN 导出完成，THE System SHALL 生成 .xlsx 格式的文件
5. WHEN 导出完成，THE System SHALL 触发浏览器下载，文件名格式为"订单数据_YYYYMMDD_HHMMSS.xlsx"

### Requirement 6: 数据验证

**User Story:** 作为系统，我需要验证导入的数据质量，以确保数据的准确性和完整性。

#### Acceptance Criteria

1. WHEN File_Validator 验证邮箱字段，THE System SHALL 检查邮箱格式的有效性
2. WHEN File_Validator 验证金额字段，THE System SHALL 确保金额为非负数值
3. WHEN File_Validator 验证日期字段，THE System SHALL 确保日期格式正确且不晚于当前日期
4. WHEN File_Validator 检测到重复的线索编号，THE System SHALL 标记为警告但允许导入
5. WHEN File_Validator 检测到数据类型不匹配，THE System SHALL 拒绝该行数据并记录错误

### Requirement 7: 用户反馈

**User Story:** 作为用户，我希望在导入导出过程中获得清晰的进度反馈，以了解操作状态。

#### Acceptance Criteria

1. WHEN 导入操作开始，THE System SHALL 显示进度指示器
2. WHEN 导入操作进行中，THE System SHALL 实时更新已处理的行数
3. WHEN 导出操作开始，THE System SHALL 显示"正在生成文件"的提示
4. WHEN 操作完成，THE System SHALL 显示成功消息和操作摘要
5. WHEN 操作失败，THE System SHALL 显示错误消息和失败原因
