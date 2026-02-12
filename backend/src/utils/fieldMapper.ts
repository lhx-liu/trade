/**
 * FieldMapper 工具类
 * 负责 Excel 列与订单字段之间的映射转换
 */

import { Order, ContactInfo } from '../types';

/**
 * Excel 列索引常量
 */
export const EXCEL_COLUMNS = {
  NEW_OR_OLD: 0,           // 新老客户
  COUNTRY: 1,              // 国家
  CONTINENT: 2,            // 大洲
  SOURCE: 3,               // 来源
  LEAD_NUMBER: 4,          // 线索编号
  PAYMENT_DATE: 5,         // 到款日期
  COMPANY_NAME: 6,         // 公司名
  CUSTOMER_NAME: 7,        // 客户名
  EMAIL: 8,                // 邮箱
  INVOICE_AMOUNT: 9,       // 发票金额
  PAYMENT_AMOUNT: 10,      // 到款金额
  CLOSED_PRODUCT: 11,      // 成单产品
  CUSTOMER_BACKGROUND_CHECK: 12, // 客户背调
  PHONE: 13,               // 联系方式
  ORDER_DATE: 14,          // 建档日期
  CUSTOMER_NATURE: 15,     // 客户性质
  INVOICE_NUMBER: 16,      // 发票号（跳过）
  PURCHASE_ORDER_NUMBER: 17, // 请购单号
  SHIPPING_DATE: 18,       // 发货日期（跳过）
  TRACKING_NUMBER: 19,     // 提单/快递单号（忽略）
  PAYMENT_SCREENSHOT: 20   // 到款截图（忽略）
} as const;

/**
 * 导出列索引常量（不包含忽略的列）
 */
export const EXPORT_COLUMNS = {
  NEW_OR_OLD: 0,
  COUNTRY: 1,
  CONTINENT: 2,
  SOURCE: 3,
  LEAD_NUMBER: 4,
  PAYMENT_DATE: 5,
  COMPANY_NAME: 6,
  CUSTOMER_NAME: 7,
  EMAIL: 8,
  INVOICE_AMOUNT: 9,
  PAYMENT_AMOUNT: 10,
  CLOSED_PRODUCT: 11,
  CUSTOMER_BACKGROUND_CHECK: 12,
  PHONE: 13,
  ORDER_DATE: 14,
  CUSTOMER_NATURE: 15,
  INVOICE_NUMBER: 16,      // 导出时填充空值
  PURCHASE_ORDER_NUMBER: 17,
  SHIPPING_DATE: 18        // 导出时填充空值
} as const;

/**
 * 必填字段配置
 */
interface FieldConfig {
  required: boolean;
  type: 'input' | 'select' | 'date' | 'number';
  defaultValue?: any;
}

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  leadNumber: { required: true, type: 'input', defaultValue: '-' },
  companyName: { required: true, type: 'input', defaultValue: '-' },
  closedProduct: { required: true, type: 'input', defaultValue: '-' },
  orderDate: { required: true, type: 'date', defaultValue: () => new Date().toISOString().split('T')[0] },
  newOrOld: { required: false, type: 'select', defaultValue: '新客户' },
  country: { required: false, type: 'input', defaultValue: '-' },
  continent: { required: false, type: 'input', defaultValue: '-' },
  source: { required: false, type: 'input', defaultValue: '-' },
  customerName: { required: false, type: 'input', defaultValue: '-' },
  email: { required: false, type: 'input', defaultValue: '-' },
  phone: { required: false, type: 'input', defaultValue: '-' },
  customerNature: { required: false, type: 'input', defaultValue: '-' },
  paymentDate: { required: false, type: 'date' },
  invoiceAmount: { required: false, type: 'number' },
  paymentAmount: { required: false, type: 'number' },
  customerBackgroundCheck: { required: false, type: 'input' },
  purchaseOrderNumber: { required: false, type: 'input' }
};

export class FieldMapper {
  /**
   * 将 Excel 行数据映射为订单对象
   * @param row Excel 行数据数组
   * @returns 部分订单对象
   */
  static mapExcelRowToOrder(row: any[]): Partial<Order> {
    // 辅助函数：获取单元格值，处理空值
    const getCellValue = (index: number): any => {
      const value = row[index];
      // 处理 null, undefined, 空字符串
      if (value === null || value === undefined || value === '') {
        return null;
      }
      // 处理字符串类型，去除首尾空格
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };

    // 辅助函数：获取字段值，如果为空则使用默认值
    const getFieldValue = (index: number, fieldName: string): any => {
      const cellValue = getCellValue(index);
      const config = FIELD_CONFIGS[fieldName];
      
      if (cellValue === null) {
        // 必填字段使用默认值
        if (config?.required && config.defaultValue !== undefined) {
          return typeof config.defaultValue === 'function' 
            ? config.defaultValue() 
            : config.defaultValue;
        }
        // 非必填字段返回 null 或 undefined
        return config?.type === 'number' || config?.type === 'date' ? null : undefined;
      }
      
      return cellValue;
    };

    // 构建联系人信息
    const contactInfo: ContactInfo[] = [{
      name: getFieldValue(EXCEL_COLUMNS.CUSTOMER_NAME, 'customerName') || '-',
      email: getFieldValue(EXCEL_COLUMNS.EMAIL, 'email') || '-',
      phone: getFieldValue(EXCEL_COLUMNS.PHONE, 'phone') || '-'
    }];

    // 构建订单对象
    const order: Partial<Order> = {
      newOrOld: getFieldValue(EXCEL_COLUMNS.NEW_OR_OLD, 'newOrOld'),
      country: getFieldValue(EXCEL_COLUMNS.COUNTRY, 'country'),
      continent: getFieldValue(EXCEL_COLUMNS.CONTINENT, 'continent'),
      source: getFieldValue(EXCEL_COLUMNS.SOURCE, 'source'),
      leadNumber: getFieldValue(EXCEL_COLUMNS.LEAD_NUMBER, 'leadNumber'),
      paymentDate: getFieldValue(EXCEL_COLUMNS.PAYMENT_DATE, 'paymentDate'),
      companyName: getFieldValue(EXCEL_COLUMNS.COMPANY_NAME, 'companyName'),
      contactInfo,
      invoiceAmount: getFieldValue(EXCEL_COLUMNS.INVOICE_AMOUNT, 'invoiceAmount'),
      paymentAmount: getFieldValue(EXCEL_COLUMNS.PAYMENT_AMOUNT, 'paymentAmount'),
      closedProduct: getFieldValue(EXCEL_COLUMNS.CLOSED_PRODUCT, 'closedProduct'),
      customerBackgroundCheck: getFieldValue(EXCEL_COLUMNS.CUSTOMER_BACKGROUND_CHECK, 'customerBackgroundCheck'),
      orderDate: getFieldValue(EXCEL_COLUMNS.ORDER_DATE, 'orderDate'),
      customerNature: getFieldValue(EXCEL_COLUMNS.CUSTOMER_NATURE, 'customerNature'),
      purchaseOrderNumber: getFieldValue(EXCEL_COLUMNS.PURCHASE_ORDER_NUMBER, 'purchaseOrderNumber')
    };

    return order;
  }

  /**
   * 将订单对象映射为 Excel 行数据
   * @param order 订单对象
   * @returns Excel 行数据数组
   */
  static mapOrderToExcelRow(order: Order): any[] {
    const row: any[] = new Array(19); // 导出19列（不包含忽略的列）

    // 获取第一个联系人信息（如果存在）
    const contact = order.contactInfo && order.contactInfo.length > 0 
      ? order.contactInfo[0] 
      : { name: '', email: '', phone: '' };

    row[EXPORT_COLUMNS.NEW_OR_OLD] = order.newOrOld || '';
    row[EXPORT_COLUMNS.COUNTRY] = order.country || '';
    row[EXPORT_COLUMNS.CONTINENT] = order.continent || '';
    row[EXPORT_COLUMNS.SOURCE] = order.source || '';
    row[EXPORT_COLUMNS.LEAD_NUMBER] = order.leadNumber || '';
    row[EXPORT_COLUMNS.PAYMENT_DATE] = order.paymentDate || '';
    row[EXPORT_COLUMNS.COMPANY_NAME] = order.companyName || '';
    row[EXPORT_COLUMNS.CUSTOMER_NAME] = contact.name || '';
    row[EXPORT_COLUMNS.EMAIL] = contact.email || '';
    row[EXPORT_COLUMNS.INVOICE_AMOUNT] = order.invoiceAmount ?? '';
    row[EXPORT_COLUMNS.PAYMENT_AMOUNT] = order.paymentAmount ?? '';
    row[EXPORT_COLUMNS.CLOSED_PRODUCT] = order.closedProduct || '';
    row[EXPORT_COLUMNS.CUSTOMER_BACKGROUND_CHECK] = order.customerBackgroundCheck || '';
    row[EXPORT_COLUMNS.PHONE] = contact.phone || '';
    row[EXPORT_COLUMNS.ORDER_DATE] = order.orderDate || '';
    row[EXPORT_COLUMNS.CUSTOMER_NATURE] = order.customerNature || '';
    row[EXPORT_COLUMNS.INVOICE_NUMBER] = ''; // 系统不存在，填充空值
    row[EXPORT_COLUMNS.PURCHASE_ORDER_NUMBER] = order.purchaseOrderNumber || '';
    row[EXPORT_COLUMNS.SHIPPING_DATE] = ''; // 系统不存在，填充空值

    return row;
  }

  /**
   * 获取字段的默认值
   * @param fieldName 字段名称
   * @returns 默认值
   */
  static getDefaultValue(fieldName: string): any {
    const config = FIELD_CONFIGS[fieldName];
    
    if (!config || config.defaultValue === undefined) {
      return null;
    }

    // 如果默认值是函数，执行它
    if (typeof config.defaultValue === 'function') {
      return config.defaultValue();
    }

    return config.defaultValue;
  }

  /**
   * 检查字段是否为必填
   * @param fieldName 字段名称
   * @returns 是否必填
   */
  static isRequired(fieldName: string): boolean {
    return FIELD_CONFIGS[fieldName]?.required || false;
  }

  /**
   * 获取字段类型
   * @param fieldName 字段名称
   * @returns 字段类型
   */
  static getFieldType(fieldName: string): string {
    return FIELD_CONFIGS[fieldName]?.type || 'input';
  }
}
