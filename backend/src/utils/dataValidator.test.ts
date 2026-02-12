/**
 * DataValidator 单元测试
 */

import { DataValidator } from './dataValidator';

describe('DataValidator', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(DataValidator.validateEmail('user@example.com')).toBe(true);
      expect(DataValidator.validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(DataValidator.validateEmail('name+tag@company.org')).toBe(true);
      expect(DataValidator.validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(DataValidator.validateEmail('invalid')).toBe(false);
      expect(DataValidator.validateEmail('missing@domain')).toBe(false);
      expect(DataValidator.validateEmail('@nodomain.com')).toBe(false);
      expect(DataValidator.validateEmail('noat.com')).toBe(false);
      expect(DataValidator.validateEmail('double@@domain.com')).toBe(false);
      expect(DataValidator.validateEmail('spaces in@email.com')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(DataValidator.validateEmail('')).toBe(false);
      expect(DataValidator.validateEmail('   ')).toBe(false);
      expect(DataValidator.validateEmail(null as any)).toBe(false);
      expect(DataValidator.validateEmail(undefined as any)).toBe(false);
    });

    it('should handle emails with whitespace', () => {
      expect(DataValidator.validateEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates in YYYY-MM-DD format', () => {
      expect(DataValidator.validateDate('2024-01-01')).toBe(true);
      expect(DataValidator.validateDate('2023-12-31')).toBe(true);
      expect(DataValidator.validateDate('2020-02-29')).toBe(true); // Leap year
    });

    it('should accept today\'s date', () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      expect(DataValidator.validateDate(dateStr)).toBe(true);
    });

    it('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      expect(DataValidator.validateDate(dateStr)).toBe(false);

      expect(DataValidator.validateDate('2099-12-31')).toBe(false);
    });

    it('should reject invalid date formats', () => {
      expect(DataValidator.validateDate('01-01-2024')).toBe(false);
      expect(DataValidator.validateDate('2024/01/01')).toBe(false);
      expect(DataValidator.validateDate('2024-1-1')).toBe(false);
      expect(DataValidator.validateDate('24-01-01')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(DataValidator.validateDate('2024-02-30')).toBe(false);
      expect(DataValidator.validateDate('2024-13-01')).toBe(false);
      expect(DataValidator.validateDate('2024-00-01')).toBe(false);
      expect(DataValidator.validateDate('2024-01-32')).toBe(false);
      expect(DataValidator.validateDate('2023-02-29')).toBe(false); // Not a leap year
    });

    it('should reject empty or invalid input', () => {
      expect(DataValidator.validateDate('')).toBe(false);
      expect(DataValidator.validateDate('   ')).toBe(false);
      expect(DataValidator.validateDate(null as any)).toBe(false);
      expect(DataValidator.validateDate(undefined as any)).toBe(false);
      expect(DataValidator.validateDate('not-a-date')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should accept valid non-negative numbers', () => {
      expect(DataValidator.validateAmount(0)).toBe(true);
      expect(DataValidator.validateAmount(100)).toBe(true);
      expect(DataValidator.validateAmount(99.99)).toBe(true);
      expect(DataValidator.validateAmount(1000000)).toBe(true);
    });

    it('should accept numeric strings', () => {
      expect(DataValidator.validateAmount('0')).toBe(true);
      expect(DataValidator.validateAmount('100')).toBe(true);
      expect(DataValidator.validateAmount('99.99')).toBe(true);
    });

    it('should accept null, undefined, or empty string', () => {
      expect(DataValidator.validateAmount(null)).toBe(true);
      expect(DataValidator.validateAmount(undefined)).toBe(true);
      expect(DataValidator.validateAmount('')).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(DataValidator.validateAmount(-1)).toBe(false);
      expect(DataValidator.validateAmount(-100.5)).toBe(false);
      expect(DataValidator.validateAmount('-50')).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(DataValidator.validateAmount('abc')).toBe(false);
      expect(DataValidator.validateAmount('12.34.56')).toBe(false);
      expect(DataValidator.validateAmount(NaN)).toBe(false);
      expect(DataValidator.validateAmount(Infinity)).toBe(false);
      expect(DataValidator.validateAmount(-Infinity)).toBe(false);
    });
  });

  describe('validateOrderData', () => {
    it('should return empty array for valid order data', () => {
      const validOrder = {
        email: 'user@example.com',
        paymentDate: '2024-01-01',
        orderDate: '2024-01-15',
        invoiceAmount: 1000,
        paymentAmount: 1000,
      };
      expect(DataValidator.validateOrderData(validOrder)).toEqual([]);
    });

    it('should detect invalid email', () => {
      const order = { email: 'invalid-email' };
      const errors = DataValidator.validateOrderData(order);
      expect(errors).toContain('邮箱格式无效');
    });

    it('should detect invalid payment date', () => {
      const order = { paymentDate: '2099-12-31' };
      const errors = DataValidator.validateOrderData(order);
      expect(errors).toContain('到款日期格式无效或晚于当前日期');
    });

    it('should detect invalid order date', () => {
      const order = { orderDate: 'invalid-date' };
      const errors = DataValidator.validateOrderData(order);
      expect(errors).toContain('建档日期格式无效或晚于当前日期');
    });

    it('should detect negative invoice amount', () => {
      const order = { invoiceAmount: -100 };
      const errors = DataValidator.validateOrderData(order);
      expect(errors).toContain('发票金额必须为非负数值');
    });

    it('should detect negative payment amount', () => {
      const order = { paymentAmount: -50 };
      const errors = DataValidator.validateOrderData(order);
      expect(errors).toContain('到款金额必须为非负数值');
    });

    it('should detect multiple errors', () => {
      const order = {
        email: 'bad-email',
        paymentDate: '2099-01-01',
        invoiceAmount: -100,
        paymentAmount: 'not-a-number',
      };
      const errors = DataValidator.validateOrderData(order);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('邮箱格式无效');
      expect(errors).toContain('到款日期格式无效或晚于当前日期');
      expect(errors).toContain('发票金额必须为非负数值');
      expect(errors).toContain('到款金额必须为非负数值');
    });

    it('should allow missing optional fields', () => {
      const order = {
        email: null,
        paymentDate: null,
        invoiceAmount: null,
        paymentAmount: undefined,
      };
      expect(DataValidator.validateOrderData(order)).toEqual([]);
    });

    it('should handle empty order object', () => {
      expect(DataValidator.validateOrderData({})).toEqual([]);
    });
  });
});
