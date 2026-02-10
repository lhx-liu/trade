import DatabaseManager from '../database/DatabaseManager';
import { Statistics } from '../types';
import ExcelJS from 'exceljs';

/**
 * StatisticsService - 统计业务逻辑服务
 */
class StatisticsService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * 计算统计数据
   * 需求: 6.1, 6.2, 6.3, 6.4
   */
  async calculateStatistics(startDate: string, endDate: string): Promise<Statistics> {
    const db = this.dbManager.getDatabase();

    // 构建日期范围条件
    const dateCondition = 'WHERE order_date BETWEEN ? AND ?';
    const dateParams = [startDate, endDate];

    // 1. 订单总数
    const totalOrdersResult = db.exec(`SELECT COUNT(*) as total FROM orders ${dateCondition}`, dateParams);
    const totalOrders = totalOrdersResult[0]?.values[0][0] as number || 0;

    // 2. 客户总数（按公司名去重）
    const totalCustomersResult = db.exec(
      `SELECT COUNT(DISTINCT company_name) as total FROM orders ${dateCondition}`,
      dateParams
    );
    const totalCustomers = totalCustomersResult[0]?.values[0][0] as number || 0;

    // 3. 发票金额总计
    const totalInvoiceResult = db.exec(
      `SELECT COALESCE(SUM(invoice_amount), 0) as total FROM orders ${dateCondition}`,
      dateParams
    );
    const totalInvoiceAmount = totalInvoiceResult[0]?.values[0][0] as number || 0;

    // 4. 到款金额总计
    const totalPaymentResult = db.exec(
      `SELECT COALESCE(SUM(payment_amount), 0) as total FROM orders ${dateCondition}`,
      dateParams
    );
    const totalPaymentAmount = totalPaymentResult[0]?.values[0][0] as number || 0;

    // 5. 按国家分组统计
    const byCountryResult = db.exec(
      `SELECT country, COUNT(*) as count FROM orders ${dateCondition} AND country IS NOT NULL GROUP BY country`,
      dateParams
    );
    const byCountry: Record<string, number> = {};
    if (byCountryResult.length && byCountryResult[0].values.length) {
      for (const row of byCountryResult[0].values) {
        byCountry[row[0] as string] = row[1] as number;
      }
    }

    // 6. 按大洲分组统计
    const byContinentResult = db.exec(
      `SELECT continent, COUNT(*) as count FROM orders ${dateCondition} AND continent IS NOT NULL GROUP BY continent`,
      dateParams
    );
    const byContinent: Record<string, number> = {};
    if (byContinentResult.length && byContinentResult[0].values.length) {
      for (const row of byContinentResult[0].values) {
        byContinent[row[0] as string] = row[1] as number;
      }
    }

    // 7. 按客户等级分组统计
    const byCustomerLevelResult = db.exec(
      `SELECT customer_level, COUNT(*) as count FROM orders ${dateCondition} AND customer_level IS NOT NULL GROUP BY customer_level`,
      dateParams
    );
    const byCustomerLevel: Record<string, number> = {};
    if (byCustomerLevelResult.length && byCustomerLevelResult[0].values.length) {
      for (const row of byCustomerLevelResult[0].values) {
        byCustomerLevel[row[0] as string] = row[1] as number;
      }
    }

    // 8. 月度趋势
    const monthlyTrendResult = db.exec(
      `SELECT 
        strftime('%Y-%m', order_date) as month,
        COUNT(*) as orderCount,
        COALESCE(SUM(invoice_amount), 0) as invoiceAmount,
        COALESCE(SUM(payment_amount), 0) as paymentAmount
      FROM orders ${dateCondition}
      GROUP BY strftime('%Y-%m', order_date)
      ORDER BY month`,
      dateParams
    );

    const monthlyTrend: Array<{
      month: string;
      orderCount: number;
      invoiceAmount: number;
      paymentAmount: number;
    }> = [];

    if (monthlyTrendResult.length && monthlyTrendResult[0].values.length) {
      for (const row of monthlyTrendResult[0].values) {
        monthlyTrend.push({
          month: row[0] as string,
          orderCount: row[1] as number,
          invoiceAmount: row[2] as number,
          paymentAmount: row[3] as number,
        });
      }
    }

    return {
      totalOrders,
      totalCustomers,
      totalInvoiceAmount,
      totalPaymentAmount,
      byCountry,
      byContinent,
      byCustomerLevel,
      monthlyTrend,
    };
  }

  /**
   * 生成Excel报表
   * 需求: 6.5
   */
  async generateExcelReport(startDate: string, endDate: string): Promise<Buffer> {
    const db = this.dbManager.getDatabase();

    // 查询订单数据
    const ordersResult = db.exec(
      `SELECT * FROM orders WHERE order_date BETWEEN ? AND ? ORDER BY order_date DESC`,
      [startDate, endDate]
    );

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('订单明细');

    // 设置列
    worksheet.columns = [
      { header: '订单ID', key: 'id', width: 10 },
      { header: '订单日期', key: 'order_date', width: 15 },
      { header: '公司名', key: 'company_name', width: 30 },
      { header: '线索编号', key: 'lead_number', width: 20 },
      { header: '新老客户', key: 'new_or_old', width: 12 },
      { header: '客户等级', key: 'customer_level', width: 12 },
      { header: '国家', key: 'country', width: 15 },
      { header: '大洲', key: 'continent', width: 15 },
      { header: '来源', key: 'source', width: 15 },
      { header: '客户性质', key: 'customer_nature', width: 15 },
      { header: '发票金额', key: 'invoice_amount', width: 15 },
      { header: '到款金额', key: 'payment_amount', width: 15 },
      { header: '创建时间', key: 'created_at', width: 20 },
    ];

    // 添加数据
    if (ordersResult.length && ordersResult[0].values.length) {
      const columns = ordersResult[0].columns;
      for (const row of ordersResult[0].values) {
        const rowData: any = {};
        columns.forEach((col: string, index: number) => {
          rowData[col] = row[index];
        });
        worksheet.addRow(rowData);
      }
    }

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 生成Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export default StatisticsService;
