import { Database } from 'sql.js';
import { Order, CustomerMetrics, FilterCriteria, CustomerRawData } from '../types';

/**
 * CustomerAnalysisDAO - 客户分析数据访问对象
 * 负责客户行为分析相关的数据查询
 */
class CustomerAnalysisDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 查询客户及其订单统计
   * 返回所有客户的基础指标数据
   */
  getCustomersWithMetrics(filters: FilterCriteria): CustomerMetrics[] {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      // 构建筛选条件
      if (filters.country) {
        conditions.push('country = ?');
        values.push(filters.country);
      }

      if (filters.customerLevel) {
        conditions.push('customer_level = ?');
        values.push(filters.customerLevel);
      }

      if (filters.customerType) {
        conditions.push('new_or_old = ?');
        values.push(filters.customerType);
      }

      const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

      // 查询客户及其订单统计
      const sql = `
        SELECT 
          company_name,
          COUNT(*) as total_orders,
          MIN(order_date) as first_order_date,
          MAX(order_date) as last_order_date,
          COALESCE(SUM(invoice_amount), 0) as total_invoice_amount,
          MAX(country) as country,
          MAX(customer_level) as customer_level,
          MAX(new_or_old) as new_or_old
        FROM orders
        WHERE company_name IS NOT NULL ${whereClause}
        GROUP BY company_name
        HAVING total_orders > 0
      `;

      const result = this.db.exec(sql, values);

      if (!result.length || !result[0].values.length) {
        return [];
      }

      const customers: CustomerMetrics[] = [];
      const columns = result[0].columns;

      for (const row of result[0].values) {
        const rawData = this.mapRowToCustomerRawData(columns, row);
        customers.push(this.calculateCustomerMetrics(rawData));
      }

      return customers;
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw new Error('数据库查询失败');
    }
  }

  /**
   * 查询单个客户的所有订单
   */
  getCustomerOrders(companyName: string): Order[] {
    try {
      const sql = `
        SELECT * FROM orders 
        WHERE company_name = ?
        ORDER BY order_date DESC
      `;

      const result = this.db.exec(sql, [companyName]);

      if (!result.length || !result[0].values.length) {
        return [];
      }

      const orders: Order[] = [];
      const columns = result[0].columns;

      for (const row of result[0].values) {
        orders.push(this.mapRowToOrder(columns, row));
      }

      return orders;
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw new Error('数据库查询失败');
    }
  }

  /**
   * 获取符合筛选条件的客户总数
   */
  getCustomerCount(filters: FilterCriteria): number {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      if (filters.country) {
        conditions.push('country = ?');
        values.push(filters.country);
      }

      if (filters.customerLevel) {
        conditions.push('customer_level = ?');
        values.push(filters.customerLevel);
      }

      if (filters.customerType) {
        conditions.push('new_or_old = ?');
        values.push(filters.customerType);
      }

      const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

      const sql = `
        SELECT COUNT(DISTINCT company_name) as total
        FROM orders
        WHERE company_name IS NOT NULL ${whereClause}
      `;

      const result = this.db.exec(sql, values);
      return result[0]?.values[0][0] as number || 0;
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw new Error('数据库查询失败');
    }
  }

  /**
   * 将数据库行映射为 CustomerRawData 对象
   */
  private mapRowToCustomerRawData(columns: string[], row: any[]): CustomerRawData {
    const data: any = {};
    columns.forEach((col, index) => {
      data[col] = row[index];
    });
    return data as CustomerRawData;
  }

  /**
   * 将数据库行映射为 Order 对象
   */
  private mapRowToOrder(columns: string[], row: any[]): Order {
    const order: any = {};
    columns.forEach((col, index) => {
      const camelCaseCol = col.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      order[camelCaseCol] = row[index];
    });

    // 解析JSON字段
    if (order.contactInfo) {
      order.contactInfo = JSON.parse(order.contactInfo);
    }

    return order as Order;
  }

  /**
   * 计算客户指标
   */
  private calculateCustomerMetrics(rawData: CustomerRawData): CustomerMetrics {
    const totalOrders = rawData.total_orders;
    const averageOrderAmount = totalOrders > 0 
      ? Number((rawData.total_invoice_amount / totalOrders).toFixed(2))
      : 0;

    // 计算月均订单数
    const firstDate = new Date(rawData.first_order_date);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - firstDate.getFullYear()) * 12 
      + (now.getMonth() - firstDate.getMonth()) + 1;
    const monthlyOrderFrequency = Number((totalOrders / monthsDiff).toFixed(2));

    return {
      companyName: rawData.company_name,
      totalOrders,
      monthlyOrderFrequency,
      averageOrderAmount,
      lastOrderDate: rawData.last_order_date,
      firstOrderDate: rawData.first_order_date,
      country: rawData.country || '',
      customerLevel: rawData.customer_level || '',
      customerType: rawData.new_or_old || '',
    };
  }
}

export default CustomerAnalysisDAO;
