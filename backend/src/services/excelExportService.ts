/**
 * ExcelExportService - Excel 导出服务
 * 负责将订单数据导出为 Excel 文件
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import ExcelJS from 'exceljs';
import DatabaseManager from '../database/DatabaseManager';
import OrderDAO from '../dao/OrderDAO';
import { FieldMapper } from '../utils/fieldMapper';
import { Order } from '../types';

/**
 * Excel 表头列名（按照导出顺序）
 */
const EXCEL_HEADERS = [
  '新老客户',
  '国家',
  '大洲',
  '来源',
  '线索编号',
  '到款日期',
  '公司名',
  '客户名',
  '邮箱',
  '发票金额',
  '到款金额',
  '成单产品',
  '客户背调',
  '联系方式',
  '建档日期',
  '客户性质',
  '发票号',
  '请购单号',
  '发货日期'
];

export class ExcelExportService {
  private dbManager: DatabaseManager;
  private orderDAO: OrderDAO;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    const db = this.dbManager.getDatabase();
    this.orderDAO = new OrderDAO(db);
  }

  /**
   * 导出所有订单为 Excel 文件
   * @returns Excel 文件的 Buffer
   */
  async exportOrders(): Promise<Buffer> {
    // 1. 查询所有订单
    const allOrders = this.queryAllOrders();

    // 2. 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('订单数据');

    // 3. 添加表头行
    worksheet.addRow(EXCEL_HEADERS);

    // 4. 将订单数据转换为 Excel 行并添加
    for (const order of allOrders) {
      const row = this.mapOrderToRow(order);
      worksheet.addRow(row);
    }

    // 5. 生成 Excel 文件 Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 查询所有订单
   * @returns 订单数组
   */
  private queryAllOrders(): Order[] {
    // 使用 query 方法查询所有订单，不设置分页限制
    const result = this.orderDAO.query({
      page: 1,
      pageSize: 999999 // 设置一个很大的数字以获取所有订单
    });

    return result.orders;
  }

  /**
   * 将订单对象转换为 Excel 行数据
   * @param order 订单对象
   * @returns Excel 行数据数组
   */
  private mapOrderToRow(order: Order): any[] {
    return FieldMapper.mapOrderToExcelRow(order);
  }

  /**
   * 生成导出文件名
   * 格式：订单数据_YYYYMMDD_HHMMSS.xlsx
   * @returns 文件名
   */
  static generateFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `订单数据_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
  }
}

export default ExcelExportService;
