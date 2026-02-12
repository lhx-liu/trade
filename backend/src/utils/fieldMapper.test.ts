/**
 * FieldMapper 单元测试
 */

import { FieldMapper, EXCEL_COLUMNS, EXPORT_COLUMNS } from './fieldMapper';
import { Order } from '../types';

describe('FieldMapper', () => {
  describe('mapExcelRowToOrder', () => {
    it('should map all fields correctly from Excel row to Order', () => {
      const excelRow = [
        '新客户',           // 0: 新老客户
        '美国',             // 1: 国家
        '北美洲',           // 2: 大洲
        '网站',             // 3: 来源
        'LEAD-001',         // 4: 线索编号
        '2024-01-15',       // 5: 到款日期
        'ABC Company',      // 6: 公司名
        'John Doe',         // 7: 客户名
        'john@example.com', // 8: 邮箱
        10000,              // 9: 发票金额
        9500,               // 10: 到款金额
        'Product A',        // 11: 成单产品
        'Background OK',    // 12: 客户背调
        '+1234567890',      // 13: 联系方式
        '2024-01-10',       // 14: 建档日期
        '企业',             // 15: 客户性质
        'INV-001',          // 16: 发票号（跳过）
        'PO-001',           // 17: 请购单号
        '2024-01-20',       // 18: 发货日期（跳过）
        'TRACK-001',        // 19: 提单/快递单号（忽略）
        'screenshot.png'    // 20: 到款截图（忽略）
      ];

      const order = FieldMapper.mapExcelRowToOrder(excelRow);

      expect(order.newOrOld).toBe('新客户');
      expect(order.country).toBe('美国');
      expect(order.continent).toBe('北美洲');
      expect(order.source).toBe('网站');
      expect(order.leadNumber).toBe('LEAD-001');
      expect(order.paymentDate).toBe('2024-01-15');
      expect(order.companyName).toBe('ABC Company');
      expect(order.contactInfo).toHaveLength(1);
      expect(order.contactInfo![0].name).toBe('John Doe');
      expect(order.contactInfo![0].email).toBe('john@example.com');
      expect(order.contactInfo![0].phone).toBe('+1234567890');
      expect(order.invoiceAmount).toBe(10000);
      expect(order.paymentAmount).toBe(9500);
      expect(order.closedProduct).toBe('Product A');
      expect(order.customerBackgroundCheck).toBe('Background OK');
      expect(order.orderDate).toBe('2024-01-10');
      expect(order.customerNature).toBe('企业');
      expect(order.purchaseOrderNumber).toBe('PO-001');
    });

    it('should use default values for required empty fields', () => {
      const excelRow = new Array(21).fill('');
      
      const order = FieldMapper.mapExcelRowToOrder(excelRow);

      // 必填字段应该有默认值
      expect(order.leadNumber).toBe('-');
      expect(order.companyName).toBe('-');
      expect(order.closedProduct).toBe('-');
      expect(order.orderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // 当前日期格式
    });

    it('should return null/undefined for non-required empty fields', () => {
      const excelRow = new Array(21).fill('');
      
      const order = FieldMapper.mapExcelRowToOrder(excelRow);

      // 非必填字段应该为 null 或 undefined
      expect(order.paymentDate).toBeNull();
      expect(order.invoiceAmount).toBeNull();
      expect(order.paymentAmount).toBeNull();
      expect(order.customerBackgroundCheck).toBeUndefined();
      expect(order.purchaseOrderNumber).toBeUndefined();
    });

    it('should handle whitespace in cell values', () => {
      const excelRow = [
        '  新客户  ',       // 带空格
        '  美国  ',
        '',
        '',
        '  LEAD-001  ',
        '',
        '  ABC Company  ',
        '',
        '',
        '',
        '',
        '  Product A  ',
        '',
        '',
        '2024-01-10',
        '',
        '',
        '',
        '',
        '',
        ''
      ];

      const order = FieldMapper.mapExcelRowToOrder(excelRow);

      expect(order.newOrOld).toBe('新客户');
      expect(order.country).toBe('美国');
      expect(order.leadNumber).toBe('LEAD-001');
      expect(order.companyName).toBe('ABC Company');
      expect(order.closedProduct).toBe('Product A');
    });
  });

  describe('mapOrderToExcelRow', () => {
    it('should map Order to Excel row correctly', () => {
      const order: Order = {
        id: 1,
        newOrOld: '老客户',
        country: '中国',
        continent: '亚洲',
        source: '展会',
        leadNumber: 'LEAD-002',
        paymentDate: '2024-02-01',
        companyName: 'XYZ Corp',
        contactInfo: [{
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+9876543210'
        }],
        invoiceAmount: 20000,
        paymentAmount: 20000,
        closedProduct: 'Product B',
        customerBackgroundCheck: 'Verified',
        orderDate: '2024-01-25',
        customerNature: '个人',
        purchaseOrderNumber: 'PO-002'
      };

      const row = FieldMapper.mapOrderToExcelRow(order);

      expect(row[EXPORT_COLUMNS.NEW_OR_OLD]).toBe('老客户');
      expect(row[EXPORT_COLUMNS.COUNTRY]).toBe('中国');
      expect(row[EXPORT_COLUMNS.CONTINENT]).toBe('亚洲');
      expect(row[EXPORT_COLUMNS.SOURCE]).toBe('展会');
      expect(row[EXPORT_COLUMNS.LEAD_NUMBER]).toBe('LEAD-002');
      expect(row[EXPORT_COLUMNS.PAYMENT_DATE]).toBe('2024-02-01');
      expect(row[EXPORT_COLUMNS.COMPANY_NAME]).toBe('XYZ Corp');
      expect(row[EXPORT_COLUMNS.CUSTOMER_NAME]).toBe('Jane Smith');
      expect(row[EXPORT_COLUMNS.EMAIL]).toBe('jane@example.com');
      expect(row[EXPORT_COLUMNS.INVOICE_AMOUNT]).toBe(20000);
      expect(row[EXPORT_COLUMNS.PAYMENT_AMOUNT]).toBe(20000);
      expect(row[EXPORT_COLUMNS.CLOSED_PRODUCT]).toBe('Product B');
      expect(row[EXPORT_COLUMNS.CUSTOMER_BACKGROUND_CHECK]).toBe('Verified');
      expect(row[EXPORT_COLUMNS.PHONE]).toBe('+9876543210');
      expect(row[EXPORT_COLUMNS.ORDER_DATE]).toBe('2024-01-25');
      expect(row[EXPORT_COLUMNS.CUSTOMER_NATURE]).toBe('个人');
      expect(row[EXPORT_COLUMNS.INVOICE_NUMBER]).toBe(''); // 系统不存在
      expect(row[EXPORT_COLUMNS.PURCHASE_ORDER_NUMBER]).toBe('PO-002');
      expect(row[EXPORT_COLUMNS.SHIPPING_DATE]).toBe(''); // 系统不存在
    });

    it('should handle missing optional fields', () => {
      const order: Order = {
        leadNumber: 'LEAD-003',
        companyName: 'Test Company',
        closedProduct: 'Product C',
        orderDate: '2024-01-30',
        contactInfo: []
      };

      const row = FieldMapper.mapOrderToExcelRow(order);

      expect(row[EXPORT_COLUMNS.NEW_OR_OLD]).toBe('');
      expect(row[EXPORT_COLUMNS.COUNTRY]).toBe('');
      expect(row[EXPORT_COLUMNS.CUSTOMER_NAME]).toBe('');
      expect(row[EXPORT_COLUMNS.EMAIL]).toBe('');
      expect(row[EXPORT_COLUMNS.PHONE]).toBe('');
      expect(row[EXPORT_COLUMNS.INVOICE_AMOUNT]).toBe('');
      expect(row[EXPORT_COLUMNS.PAYMENT_AMOUNT]).toBe('');
    });
  });

  describe('getDefaultValue', () => {
    it('should return correct default values for required fields', () => {
      expect(FieldMapper.getDefaultValue('leadNumber')).toBe('-');
      expect(FieldMapper.getDefaultValue('companyName')).toBe('-');
      expect(FieldMapper.getDefaultValue('closedProduct')).toBe('-');
      
      const orderDate = FieldMapper.getDefaultValue('orderDate');
      expect(orderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return null for fields without default values', () => {
      expect(FieldMapper.getDefaultValue('invoiceAmount')).toBeNull();
      expect(FieldMapper.getDefaultValue('paymentDate')).toBeNull();
      expect(FieldMapper.getDefaultValue('unknownField')).toBeNull();
    });
  });

  describe('isRequired', () => {
    it('should correctly identify required fields', () => {
      expect(FieldMapper.isRequired('leadNumber')).toBe(true);
      expect(FieldMapper.isRequired('companyName')).toBe(true);
      expect(FieldMapper.isRequired('closedProduct')).toBe(true);
      expect(FieldMapper.isRequired('orderDate')).toBe(true);
    });

    it('should correctly identify non-required fields', () => {
      expect(FieldMapper.isRequired('country')).toBe(false);
      expect(FieldMapper.isRequired('invoiceAmount')).toBe(false);
      expect(FieldMapper.isRequired('paymentDate')).toBe(false);
    });
  });

  describe('getFieldType', () => {
    it('should return correct field types', () => {
      expect(FieldMapper.getFieldType('leadNumber')).toBe('input');
      expect(FieldMapper.getFieldType('newOrOld')).toBe('select');
      expect(FieldMapper.getFieldType('orderDate')).toBe('date');
      expect(FieldMapper.getFieldType('invoiceAmount')).toBe('number');
    });

    it('should return "input" for unknown fields', () => {
      expect(FieldMapper.getFieldType('unknownField')).toBe('input');
    });
  });
});
