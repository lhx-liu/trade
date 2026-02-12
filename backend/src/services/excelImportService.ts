/**
 * ExcelImportService - Excel 导入服务
 * 
 * 负责解析 Excel 文件并批量导入订单数据
 * 
 * 功能：
 * - 解析 Excel 文件（使用 ExcelJS）
 * - 跳过表头（从第二行开始读取）
 * - 跳过空行
 * - 忽略"提单/快递单号"和"到款截图"列
 * - 逐行数据映射和验证
 * - 批量订单插入
 * - 返回导入结果（成功数量、失败数量、错误列表）
 */

import ExcelJS from 'exceljs';
import { Order } from '../types';
import { FieldMapper } from '../utils/fieldMapper';
import { DataValidator } from '../utils/dataValidator';
import DatabaseManager from '../database/DatabaseManager';
import OrderDAO from '../dao/OrderDAO';
import CustomerDAO from '../dao/CustomerDAO';

/**
 * 导入结果接口
 */
export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value?: any;
  }>;
}

/**
 * 解析后的行数据
 */
interface ParsedRow {
  rowNumber: number;
  data: any[];
  isEmpty: boolean;
}

export class ExcelImportService {
  private dbManager: DatabaseManager;
  private orderDAO: OrderDAO;
  private customerDAO: CustomerDAO;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    const db = this.dbManager.getDatabase();
    this.orderDAO = new OrderDAO(db);
    this.customerDAO = new CustomerDAO(db);
  }

  /**
   * 导入 Excel 文件中的订单数据
   * 
   * @param buffer - Excel 文件的 Buffer
   * @returns 导入结果
   */
  async importOrders(buffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      failureCount: 0,
      errors: []
    };

    try {
      // 解析 Excel 文件
      const parsedRows = await this.parseExcelFile(buffer);

      // 逐行处理数据
      const validOrders: Order[] = [];

      for (const parsedRow of parsedRows) {
        // 跳过空行
        if (parsedRow.isEmpty) {
          continue;
        }

        // 映射并验证数据
        const { order, errors } = this.mapAndValidateRow(parsedRow.data, parsedRow.rowNumber);

        if (errors.length > 0) {
          // 记录错误
          result.failureCount++;
          result.errors.push(...errors);
        } else {
          // 添加到有效订单列表
          validOrders.push(order as Order);
        }
      }

      // 批量插入有效订单
      if (validOrders.length > 0) {
        try {
          const insertedCount = await this.batchInsertOrders(validOrders);
          result.successCount = insertedCount;
        } catch (error) {
          // 批量插入失败，记录错误
          result.errors.push({
            row: 0,
            field: 'batch',
            message: `批量导入失败: ${error instanceof Error ? error.message : '未知错误'}`
          });
          result.failureCount += validOrders.length;
        }
      }

    } catch (error) {
      // Excel 解析失败
      result.errors.push({
        row: 0,
        field: 'file',
        message: `Excel 文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }

    return result;
  }

  /**
   * 解析 Excel 文件
   * 
   * @param buffer - Excel 文件的 Buffer
   * @returns 解析后的行数据数组
   */
  private async parseExcelFile(buffer: Buffer): Promise<ParsedRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    // 获取第一个工作表
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel 文件中没有工作表');
    }

    const parsedRows: ParsedRow[] = [];

    // 从第二行开始读取（跳过表头）
    worksheet.eachRow((row, rowNumber) => {
      // 跳过第一行（表头）
      if (rowNumber === 1) {
        return;
      }

      // 提取行数据
      const rowData: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // 获取单元格值
        let value = cell.value;

        // 处理日期类型
        if (value instanceof Date) {
          value = this.formatDate(value);
        }

        rowData.push(value);
      });

      // 检查是否为空行
      const isEmpty = this.isEmptyRow(rowData);

      parsedRows.push({
        rowNumber,
        data: rowData,
        isEmpty
      });
    });

    return parsedRows;
  }

  /**
   * 映射并验证行数据
   * 
   * @param row - Excel 行数据
   * @param rowNumber - 行号
   * @returns 订单对象和错误列表
   */
  private mapAndValidateRow(row: any[], rowNumber: number): {
    order: Partial<Order>;
    errors: Array<{ row: number; field: string; message: string; value?: any }>;
  } {
    const errors: Array<{ row: number; field: string; message: string; value?: any }> = [];

    // 使用 FieldMapper 映射数据
    const order = FieldMapper.mapExcelRowToOrder(row);

    // 检查到款日期是否为空，如果为空则跳过该行
    if (!order.paymentDate || order.paymentDate === null || order.paymentDate === '') {
      errors.push({
        row: rowNumber,
        field: 'paymentDate',
        message: '到款日期为空，跳过该行',
        value: order.paymentDate
      });
      return { order, errors };
    }

    // 标准化到款日期格式：将 YYYY.MM.DD 转换为 YYYY-MM-DD
    if (order.paymentDate && typeof order.paymentDate === 'string') {
      order.paymentDate = order.paymentDate.replace(/\./g, '-');
    }

    // 将到款日期赋值给订单日期（建档日期）
    order.orderDate = order.paymentDate;

    // 标准化邮箱格式：如果是对象，提取 text 字段
    if (order.contactInfo && Array.isArray(order.contactInfo)) {
      order.contactInfo = order.contactInfo.map(contact => {
        const email = contact.email as any;
        if (email && typeof email === 'object' && 'text' in email) {
          return {
            ...contact,
            email: email.text || email
          };
        }
        return contact;
      });
    }

    // 验证订单数据
    const validationErrors = DataValidator.validateOrderData({
      email: order.contactInfo?.[0]?.email,
      paymentDate: order.paymentDate,
      orderDate: order.orderDate,
      invoiceAmount: order.invoiceAmount,
      paymentAmount: order.paymentAmount
    });

    // 将验证错误转换为导入错误格式
    for (const errorMsg of validationErrors) {
      errors.push({
        row: rowNumber,
        field: 'validation',
        message: errorMsg
      });
    }

    // 验证必填字段
    if (!order.leadNumber || order.leadNumber === '-') {
      errors.push({
        row: rowNumber,
        field: 'leadNumber',
        message: '线索编号为必填字段',
        value: order.leadNumber
      });
    }

    if (!order.companyName || order.companyName === '-') {
      errors.push({
        row: rowNumber,
        field: 'companyName',
        message: '公司名为必填字段',
        value: order.companyName
      });
    }

    if (!order.closedProduct || order.closedProduct === '-') {
      errors.push({
        row: rowNumber,
        field: 'closedProduct',
        message: '成单产品为必填字段',
        value: order.closedProduct
      });
    }

    if (!order.orderDate) {
      errors.push({
        row: rowNumber,
        field: 'orderDate',
        message: '建档日期为必填字段',
        value: order.orderDate
      });
    }

    return { order, errors };
  }

  /**
   * 批量插入订单
   * 
   * @param orders - 订单数组
   * @returns 成功插入的订单数量
   */
  private async batchInsertOrders(orders: Order[]): Promise<number> {
    let insertedCount = 0;

    // 使用事务批量插入
    this.dbManager.transaction(() => {
      for (const order of orders) {
        try {
          // 检查客户是否存在
          const customerExists = this.customerDAO.exists(order.companyName);

          if (!customerExists) {
            // 创建新客户
            this.customerDAO.insert({
              companyName: order.companyName,
              businessOpportunity: ''
            });
          }

          // 插入订单
          this.orderDAO.insert(order);
          insertedCount++;
        } catch (error) {
          // 单个订单插入失败，继续处理下一个
          console.error(`订单插入失败: ${order.leadNumber}`, error);
        }
      }
    });

    return insertedCount;
  }

  /**
   * 检查行是否为空
   * 
   * @param row - 行数据
   * @returns 是否为空行
   */
  private isEmptyRow(row: any[]): boolean {
    return row.every(cell => {
      if (cell === null || cell === undefined || cell === '') {
        return true;
      }
      if (typeof cell === 'string' && cell.trim() === '') {
        return true;
      }
      return false;
    });
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   * 
   * @param date - Date 对象
   * @returns 格式化后的日期字符串
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
