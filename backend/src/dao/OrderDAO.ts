import { Database } from 'sql.js';
import { Order, QueryParams } from '../types';

/**
 * OrderDAO - 订单数据访问对象
 * 负责订单表的CRUD操作
 */
class OrderDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 插入订单
   */
  insert(order: Order): number {
    const sql = `
      INSERT INTO orders (
        order_date, company_name, contact_info, lead_number,
        new_or_old, customer_level, country, continent,
        source, customer_nature, invoice_amount, payment_amount,
        customer_background_check, closed_product, payment_date, exw_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      order.orderDate,
      order.companyName,
      JSON.stringify(order.contactInfo),
      order.leadNumber,
      order.newOrOld || null,
      order.customerLevel || null,
      order.country || null,
      order.continent || null,
      order.source || null,
      order.customerNature || null,
      order.invoiceAmount || null,
      order.paymentAmount || null,
      order.customerBackgroundCheck || null,
      order.closedProduct,
      order.paymentDate || null,
      order.exwValue || null,
    ];

    this.db.run(sql, params);

    // 获取最后插入的ID
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0] as number;
  }

  /**
   * 更新订单
   */
  update(id: number, order: Order): boolean {
    const sql = `
      UPDATE orders SET
        order_date = ?,
        company_name = ?,
        contact_info = ?,
        lead_number = ?,
        new_or_old = ?,
        customer_level = ?,
        country = ?,
        continent = ?,
        source = ?,
        customer_nature = ?,
        invoice_amount = ?,
        payment_amount = ?,
        customer_background_check = ?,
        closed_product = ?,
        payment_date = ?,
        exw_value = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `;

    const params = [
      order.orderDate,
      order.companyName,
      JSON.stringify(order.contactInfo),
      order.leadNumber,
      order.newOrOld || null,
      order.customerLevel || null,
      order.country || null,
      order.continent || null,
      order.source || null,
      order.customerNature || null,
      order.invoiceAmount || null,
      order.paymentAmount || null,
      order.customerBackgroundCheck || null,
      order.closedProduct,
      order.paymentDate || null,
      order.exwValue || null,
      id,
    ];

    this.db.run(sql, params);
    return true;
  }

  /**
   * 删除订单
   */
  delete(id: number): boolean {
    const sql = 'DELETE FROM orders WHERE id = ?';
    this.db.run(sql, [id]);
    return true;
  }

  /**
   * 根据ID查找订单
   */
  findById(id: number): Order | null {
    const sql = 'SELECT * FROM orders WHERE id = ?';
    const result = this.db.exec(sql, [id]);

    if (!result.length || !result[0].values.length) {
      return null;
    }

    return this.mapRowToOrder(result[0].columns, result[0].values[0]);
  }

  /**
   * 查询订单（支持多条件筛选和分页）
   */
  query(params: QueryParams): { orders: Order[]; total: number } {
    const conditions: string[] = [];
    const values: any[] = [];

    // 构建WHERE子句
    if (params.startDate && params.endDate) {
      conditions.push('order_date BETWEEN ? AND ?');
      values.push(params.startDate, params.endDate);
    }

    if (params.companyName) {
      conditions.push('company_name LIKE ?');
      values.push(`%${params.companyName}%`);
    }

    if (params.customerName) {
      conditions.push('contact_info LIKE ?');
      values.push(`%${params.customerName}%`);
    }

    if (params.newOrOld) {
      conditions.push('new_or_old = ?');
      values.push(params.newOrOld);
    }

    if (params.customerLevel) {
      conditions.push('customer_level = ?');
      values.push(params.customerLevel);
    }

    if (params.country) {
      conditions.push('country LIKE ?');
      values.push(`%${params.country}%`);
    }

    if (params.continent) {
      conditions.push('continent LIKE ?');
      values.push(`%${params.continent}%`);
    }

    if (params.source) {
      conditions.push('source LIKE ?');
      values.push(`%${params.source}%`);
    }

    if (params.customerNature) {
      conditions.push('customer_nature LIKE ?');
      values.push(`%${params.customerNature}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
    const countResult = this.db.exec(countSql, values);
    const total = countResult[0]?.values[0][0] as number || 0;

    // 查询数据（带分页）
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const dataSql = `
      SELECT * FROM orders ${whereClause}
      ORDER BY order_date DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    const dataResult = this.db.exec(dataSql, [...values, pageSize, offset]);

    const orders: Order[] = [];
    if (dataResult.length && dataResult[0].values.length) {
      const columns = dataResult[0].columns;
      for (const row of dataResult[0].values) {
        orders.push(this.mapRowToOrder(columns, row));
      }
    }

    return { orders, total };
  }

  /**
   * 根据公司名查询订单
   */
  findByCompanyName(companyName: string, page: number = 1, pageSize: number = 10): { orders: Order[]; total: number } {
    // 查询总数
    const countSql = 'SELECT COUNT(*) as total FROM orders WHERE company_name = ?';
    const countResult = this.db.exec(countSql, [companyName]);
    const total = countResult[0]?.values[0][0] as number || 0;

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT * FROM orders WHERE company_name = ?
      ORDER BY order_date DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    const dataResult = this.db.exec(dataSql, [companyName, pageSize, offset]);

    const orders: Order[] = [];
    if (dataResult.length && dataResult[0].values.length) {
      const columns = dataResult[0].columns;
      for (const row of dataResult[0].values) {
        orders.push(this.mapRowToOrder(columns, row));
      }
    }

    return { orders, total };
  }

  /**
   * 将数据库行映射为Order对象
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
}

export default OrderDAO;
