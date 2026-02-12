/**
 * ExcelImportService 单元测试
 */

import ExcelJS from 'exceljs';
import { ExcelImportService } from './excelImportService';
import DatabaseManager from '../database/DatabaseManager';

describe('ExcelImportService', () => {
  let service: ExcelImportService;

  beforeEach(async () => {
    // 初始化数据库
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    service = new ExcelImportService();
  });

  afterEach(() => {
    // 保存数据库
    const dbManager = DatabaseManager.getInstance();
    dbManager.saveDatabase();
  });

  describe('importOrders', () => {
    it('应该跳过空行并正常导入有效数据', async () => {
      // 创建测试 Excel 文件
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('订单');

      // 添加表头
      worksheet.addRow([
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期', '公司名', 
        '客户名', '邮箱', '发票金额', '到款金额', '成单产品', '客户背调', 
        '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期',
        '提单/快递单号', '到款截图'
      ]);

      // 添加有效数据行
      worksheet.addRow([
        '新客户', '美国', '北美洲', '网站', 'LEAD001', '2024-01-15', 'ABC公司',
        '张三', 'zhang@example.com', 10000, 10000, '产品A', '已完成',
        '13800138000', '2024-01-10', '企业', '', 'PO001', '',
        'TRACK001', 'screenshot.png'
      ]);

      // 添加空行
      worksheet.addRow([]);

      // 添加另一个有效数据行
      worksheet.addRow([
        '老客户', '英国', '欧洲', '推荐', 'LEAD002', '2024-01-20', 'XYZ公司',
        '李四', 'li@example.com', 20000, 20000, '产品B', '',
        '13900139000', '2024-01-18', '个人', '', 'PO002', '',
        '', ''
      ]);

      // 生成 Buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // 执行导入
      const result = await service.importOrders(Buffer.from(buffer));

      // 验证结果
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该跳过表头（第一行）', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('订单');

      // 添加表头
      worksheet.addRow([
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期', '公司名', 
        '客户名', '邮箱', '发票金额', '到款金额', '成单产品', '客户背调', 
        '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期',
        '提单/快递单号', '到款截图'
      ]);

      // 添加一行有效数据
      worksheet.addRow([
        '新客户', '美国', '北美洲', '网站', 'LEAD001', '2024-01-15', 'ABC公司',
        '张三', 'zhang@example.com', 10000, 10000, '产品A', '已完成',
        '13800138000', '2024-01-10', '企业', '', 'PO001', '',
        'TRACK001', 'screenshot.png'
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await service.importOrders(Buffer.from(buffer));

      // 应该只导入1条数据（表头被跳过）
      expect(result.successCount).toBe(1);
    });

    it('应该记录验证错误', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('订单');

      // 添加表头
      worksheet.addRow([
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期', '公司名', 
        '客户名', '邮箱', '发票金额', '到款金额', '成单产品', '客户背调', 
        '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期',
        '提单/快递单号', '到款截图'
      ]);

      // 添加包含错误的数据行（邮箱格式错误）
      worksheet.addRow([
        '新客户', '美国', '北美洲', '网站', 'LEAD001', '2024-01-15', 'ABC公司',
        '张三', 'invalid-email', 10000, 10000, '产品A', '已完成',
        '13800138000', '2024-01-10', '企业', '', 'PO001', '',
        '', ''
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await service.importOrders(Buffer.from(buffer));

      // 应该记录错误
      expect(result.failureCount).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('邮箱');
    });

    it('应该处理空文件', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('订单');

      // 只添加表头
      worksheet.addRow([
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期', '公司名', 
        '客户名', '邮箱', '发票金额', '到款金额', '成单产品', '客户背调', 
        '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期',
        '提单/快递单号', '到款截图'
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await service.importOrders(Buffer.from(buffer));

      // 应该没有导入任何数据
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });

    it('应该忽略"提单/快递单号"和"到款截图"列', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('订单');

      // 添加表头
      worksheet.addRow([
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期', '公司名', 
        '客户名', '邮箱', '发票金额', '到款金额', '成单产品', '客户背调', 
        '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期',
        '提单/快递单号', '到款截图'
      ]);

      // 添加数据，包含第19和第20列的值
      worksheet.addRow([
        '新客户', '美国', '北美洲', '网站', 'LEAD001', '2024-01-15', 'ABC公司',
        '张三', 'zhang@example.com', 10000, 10000, '产品A', '已完成',
        '13800138000', '2024-01-10', '企业', '', 'PO001', '',
        'SHOULD_BE_IGNORED', 'SHOULD_ALSO_BE_IGNORED'
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await service.importOrders(Buffer.from(buffer));

      // 应该成功导入（忽略的列不影响导入）
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(0);
    });
  });
});
