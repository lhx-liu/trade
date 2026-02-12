/**
 * Integration tests for order routes
 * 
 * Tests the import API endpoint
 */

import request from 'supertest';
import express, { Express } from 'express';
import orderRoutes from './orderRoutes';
import ExcelJS from 'exceljs';
import DatabaseManager from '../database/DatabaseManager';

describe('Order Routes - Import API', () => {
  let app: Express;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    // Initialize database
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);
  });

  afterAll(() => {
    // Close database connection
    dbManager.close();
  });

  /**
   * Helper function to create a test Excel file
   */
  async function createTestExcelFile(rows: any[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('订单数据');

    // Add header row
    worksheet.addRow([
      '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期',
      '公司名', '客户名', '邮箱', '发票金额', '到款金额', '成单产品',
      '客户背调', '联系方式', '建档日期', '客户性质', '发票号', '请购单号',
      '发货日期', '提单/快递单号', '到款截图'
    ]);

    // Add data rows
    rows.forEach(row => worksheet.addRow(row));

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  describe('POST /api/orders/import', () => {
    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/orders/import')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('请上传文件');
    });

    it('should reject non-Excel file types', async () => {
      const response = await request(app)
        .post('/api/orders/import')
        .attach('file', Buffer.from('not an excel file'), 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的文件格式');
    });

    it('should accept valid .xlsx file and return import result', async () => {
      // Create a test Excel file with one valid order
      const testData = [
        [
          '新客户', // 新老客户
          '美国', // 国家
          '北美洲', // 大洲
          '网站', // 来源
          'LEAD-001', // 线索编号
          '2024-01-15', // 到款日期
          'Test Company', // 公司名
          'John Doe', // 客户名
          'john@test.com', // 邮箱
          10000, // 发票金额
          10000, // 到款金额
          'Product A', // 成单产品
          '已完成', // 客户背调
          '+1234567890', // 联系方式
          '2024-01-10', // 建档日期
          '企业', // 客户性质
          '', // 发票号
          'PO-001', // 请购单号
          '', // 发货日期
          '', // 提单/快递单号
          '' // 到款截图
        ]
      ];

      const excelBuffer = await createTestExcelFile(testData);

      const response = await request(app)
        .post('/api/orders/import')
        .attach('file', excelBuffer, 'test.xlsx')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('successCount');
      expect(response.body.data).toHaveProperty('failureCount');
      expect(response.body.data).toHaveProperty('errors');
    });

    it('should handle Excel file with validation errors', async () => {
      // Create a test Excel file with invalid data
      const testData = [
        [
          '新客户', // 新老客户
          '美国', // 国家
          '北美洲', // 大洲
          '网站', // 来源
          '', // 线索编号 - MISSING (required)
          '2024-01-15', // 到款日期
          '', // 公司名 - MISSING (required)
          'John Doe', // 客户名
          'invalid-email', // 邮箱 - INVALID
          -1000, // 发票金额 - NEGATIVE (invalid)
          10000, // 到款金额
          '', // 成单产品 - MISSING (required)
          '已完成', // 客户背调
          '+1234567890', // 联系方式
          '2024-01-10', // 建档日期
          '企业', // 客户性质
          '', // 发票号
          'PO-001', // 请购单号
          '', // 发货日期
          '', // 提单/快递单号
          '' // 到款截图
        ]
      ];

      const excelBuffer = await createTestExcelFile(testData);

      const response = await request(app)
        .post('/api/orders/import')
        .attach('file', excelBuffer, 'test.xlsx')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.failureCount).toBeGreaterThan(0);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });

    it('should skip empty rows', async () => {
      // Create a test Excel file with empty rows
      const testData = [
        [
          '新客户', '美国', '北美洲', '网站', 'LEAD-001', '2024-01-15',
          'Test Company', 'John Doe', 'john@test.com', 10000, 10000, 'Product A',
          '已完成', '+1234567890', '2024-01-10', '企业', '', 'PO-001',
          '', '', ''
        ],
        // Empty row
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        [
          '老客户', '中国', '亚洲', '推荐', 'LEAD-002', '2024-01-16',
          'Test Company 2', 'Jane Doe', 'jane@test.com', 20000, 20000, 'Product B',
          '已完成', '+0987654321', '2024-01-11', '企业', '', 'PO-002',
          '', '', ''
        ]
      ];

      const excelBuffer = await createTestExcelFile(testData);

      const response = await request(app)
        .post('/api/orders/import')
        .attach('file', excelBuffer, 'test.xlsx')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should process 2 valid rows, skipping the empty row
      expect(response.body.data.successCount).toBe(2);
    });
  });

  describe('GET /api/orders/export', () => {
    it('should export orders as Excel file', async () => {
      const response = await request(app)
        .get('/api/orders/export')
        .buffer(true)
        .parse((res, callback) => {
          res.setEncoding('binary');
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, Buffer.from(data, 'binary'));
          });
        });

      // Log error if any
      if (response.status !== 200) {
        console.error('Export error status:', response.status);
        console.error('Export error body:', response.body);
        console.error('Export error text:', response.text);
      }

      expect(response.status).toBe(200);

      // Check response headers
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // The filename is URL-encoded and uses RFC 5987 format
      expect(response.headers['content-disposition']).toMatch(/^attachment; filename\*=UTF-8''%E8%AE%A2%E5%8D%95%E6%95%B0%E6%8D%AE_\d{8}_\d{6}\.xlsx$/);

      // Check that response body is a buffer
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    it('should generate valid Excel file with correct structure', async () => {
      const response = await request(app)
        .get('/api/orders/export')
        .buffer(true)
        .parse((res, callback) => {
          res.setEncoding('binary');
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, Buffer.from(data, 'binary'));
          });
        });

      expect(response.status).toBe(200);

      // Parse the Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(response.body);

      // Check worksheet exists
      const worksheet = workbook.getWorksheet('订单数据');
      expect(worksheet).toBeDefined();

      if (!worksheet) {
        throw new Error('Worksheet not found');
      }

      // Check header row
      const headerRow = worksheet.getRow(1);
      const expectedHeaders = [
        '新老客户', '国家', '大洲', '来源', '线索编号', '到款日期',
        '公司名', '客户名', '邮箱', '发票金额', '到款金额', '成单产品',
        '客户背调', '联系方式', '建档日期', '客户性质', '发票号', '请购单号', '发货日期'
      ];

      expectedHeaders.forEach((header, index) => {
        expect(headerRow.getCell(index + 1).value).toBe(header);
      });
    });
  });
});
