/**
 * ExcelExportService 单元测试
 */

import ExcelJS from 'exceljs';
import { ExcelExportService } from './excelExportService';
import DatabaseManager from '../database/DatabaseManager';
import OrderDAO from '../dao/OrderDAO';
import { Order } from '../types';

describe('ExcelExportService', () => {
  let service: ExcelExportService;
  let orderDAO: OrderDAO;
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    // 初始化数据库
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    const db = dbManager.getDatabase();
    
    // 清空订单表
    db.run('DELETE FROM orders');
    
    orderDAO = new OrderDAO(db);
    service = new ExcelExportService();
  });

  afterEach(() => {
    // 清空订单表
    const db = dbManager.getDatabase();
    db.run('DELETE FROM orders');
    
    // 保存数据库
    dbManager.saveDatabase();
  });

  describe('exportOrders', () => {
    it('应该导出空数据（只有表头）', async () => {
      // 不插入任何订单数据
      const buffer = await service.exportOrders();

      // 解析生成的 Excel 文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.getWorksheet('订单数据');
      expect(worksheet).toBeDefined();

      // 应该只有表头行
      expect(worksheet!.rowCount).toBe(1);

      // 验证表头
      const headerRow = worksheet!.getRow(1);
      expect(headerRow.getCell(1).value).toBe('新老客户');
      expect(headerRow.getCell(5).value).toBe('线索编号');
      expect(headerRow.getCell(7).value).toBe('公司名');
    });

    it('应该导出单条订单数据', async () => {
      // 插入一条测试订单
      const testOrder: Order = {
        orderDate: '2024-01-10',
        companyName: 'ABC公司',
        contactInfo: [{
          name: '张三',
          email: 'zhang@example.com',
          phone: '13800138000'
        }],
        leadNumber: 'LEAD001',
        newOrOld: '新客户',
        country: '美国',
        continent: '北美洲',
        source: '网站',
        invoiceAmount: 10000,
        paymentAmount: 10000,
        closedProduct: '产品A',
        customerBackgroundCheck: '已完成',
        paymentDate: '2024-01-15',
        customerNature: '企业',
        purchaseOrderNumber: 'PO001'
      };

      orderDAO.insert(testOrder);

      // 导出
      const buffer = await service.exportOrders();

      // 解析生成的 Excel 文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.getWorksheet('订单数据');
      expect(worksheet).toBeDefined();

      // 应该有表头 + 1条数据
      expect(worksheet!.rowCount).toBe(2);

      // 验证数据行
      const dataRow = worksheet!.getRow(2);
      expect(dataRow.getCell(1).value).toBe('新客户');
      expect(dataRow.getCell(2).value).toBe('美国');
      expect(dataRow.getCell(5).value).toBe('LEAD001');
      expect(dataRow.getCell(7).value).toBe('ABC公司');
      expect(dataRow.getCell(8).value).toBe('张三');
      expect(dataRow.getCell(9).value).toBe('zhang@example.com');
    });

    it('应该按照指定列顺序导出数据', async () => {
      // 插入测试订单
      const testOrder: Order = {
        orderDate: '2024-01-10',
        companyName: 'Test公司',
        contactInfo: [{
          name: '测试',
          email: 'test@example.com',
          phone: '13900139000'
        }],
        leadNumber: 'LEAD002',
        closedProduct: '产品B'
      };

      orderDAO.insert(testOrder);

      // 导出
      const buffer = await service.exportOrders();

      // 解析生成的 Excel 文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.getWorksheet('订单数据');
      
      // 验证列顺序
      const headerRow = worksheet!.getRow(1);
      const expectedHeaders = [
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期', '公司名',
        '客户名', '邮箱', '发票金额', '到款金额', '成单产品', '客户背调',
        '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期'
      ];

      expectedHeaders.forEach((header, index) => {
        expect(headerRow.getCell(index + 1).value).toBe(header);
      });
    });

    it('应该为系统不存在的字段填充空值', async () => {
      // 插入测试订单
      const testOrder: Order = {
        orderDate: '2024-01-10',
        companyName: 'Test公司',
        contactInfo: [{
          name: '测试',
          email: 'test@example.com',
          phone: '13900139000'
        }],
        leadNumber: 'LEAD003',
        closedProduct: '产品C'
      };

      orderDAO.insert(testOrder);

      // 导出
      const buffer = await service.exportOrders();

      // 解析生成的 Excel 文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.getWorksheet('订单数据');
      const dataRow = worksheet!.getRow(2);

      // 验证"发票号"（第17列）和"发货日期"（第19列）为空
      expect(dataRow.getCell(17).value).toBe('');
      expect(dataRow.getCell(19).value).toBe('');
    });

    it('应该导出多条订单数据', async () => {
      // 插入多条测试订单
      const orders: Order[] = [
        {
          orderDate: '2024-01-10',
          companyName: '公司A',
          contactInfo: [{ name: '张三', email: 'a@example.com', phone: '13800138000' }],
          leadNumber: 'LEAD001',
          closedProduct: '产品A'
        },
        {
          orderDate: '2024-01-11',
          companyName: '公司B',
          contactInfo: [{ name: '李四', email: 'b@example.com', phone: '13900139000' }],
          leadNumber: 'LEAD002',
          closedProduct: '产品B'
        },
        {
          orderDate: '2024-01-12',
          companyName: '公司C',
          contactInfo: [{ name: '王五', email: 'c@example.com', phone: '13700137000' }],
          leadNumber: 'LEAD003',
          closedProduct: '产品C'
        }
      ];

      orders.forEach(order => orderDAO.insert(order));

      // 导出
      const buffer = await service.exportOrders();

      // 解析生成的 Excel 文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.getWorksheet('订单数据');

      // 应该有表头 + 3条数据
      expect(worksheet!.rowCount).toBe(4);
    });
  });

  describe('generateFileName', () => {
    it('应该生成正确格式的文件名', () => {
      const fileName = ExcelExportService.generateFileName();

      // 验证文件名格式：订单数据_YYYYMMDD_HHMMSS.xlsx
      expect(fileName).toMatch(/^订单数据_\d{8}_\d{6}\.xlsx$/);
    });

    it('应该生成包含当前日期时间的文件名', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const fileName = ExcelExportService.generateFileName();

      // 验证文件名包含当前日期
      expect(fileName).toContain(`${year}${month}${day}`);
    });
  });
});
