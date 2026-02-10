import { Database } from 'sql.js';
import { Customer } from '../types';

/**
 * CustomerDAO - 客户数据访问对象
 * 负责客户表的CRUD操作
 */
class CustomerDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 插入客户
   */
  insert(customer: Customer): boolean {
    const sql = `
      INSERT INTO customers (company_name, business_opportunity)
      VALUES (?, ?)
    `;

    const params = [
      customer.companyName,
      customer.businessOpportunity || null,
    ];

    this.db.run(sql, params);
    return true;
  }

  /**
   * 更新客户
   */
  update(companyName: string, customer: Partial<Customer>): boolean {
    const sql = `
      UPDATE customers SET
        business_opportunity = ?,
        updated_at = datetime('now')
      WHERE company_name = ?
    `;

    const params = [
      customer.businessOpportunity || null,
      companyName,
    ];

    this.db.run(sql, params);
    return true;
  }

  /**
   * 删除客户
   */
  delete(companyName: string): boolean {
    const sql = 'DELETE FROM customers WHERE company_name = ?';
    this.db.run(sql, [companyName]);
    return true;
  }

  /**
   * 根据公司名查找客户
   */
  findByCompanyName(companyName: string): Customer | null {
    const sql = 'SELECT * FROM customers WHERE company_name = ?';
    const result = this.db.exec(sql, [companyName]);

    if (!result.length || !result[0].values.length) {
      return null;
    }

    return this.mapRowToCustomer(result[0].columns, result[0].values[0]);
  }

  /**
   * 查询客户列表（分页）
   */
  list(page: number = 1, pageSize: number = 20): { customers: Customer[]; total: number } {
    // 查询总数
    const countSql = 'SELECT COUNT(*) as total FROM customers';
    const countResult = this.db.exec(countSql);
    const total = countResult[0]?.values[0][0] as number || 0;

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT * FROM customers
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataResult = this.db.exec(dataSql, [pageSize, offset]);

    const customers: Customer[] = [];
    if (dataResult.length && dataResult[0].values.length) {
      const columns = dataResult[0].columns;
      for (const row of dataResult[0].values) {
        customers.push(this.mapRowToCustomer(columns, row));
      }
    }

    return { customers, total };
  }

  /**
   * 检查客户是否存在
   */
  exists(companyName: string): boolean {
    const sql = 'SELECT COUNT(*) as count FROM customers WHERE company_name = ?';
    const result = this.db.exec(sql, [companyName]);
    const count = result[0]?.values[0][0] as number || 0;
    return count > 0;
  }

  /**
   * 将数据库行映射为Customer对象
   */
  private mapRowToCustomer(columns: string[], row: any[]): Customer {
    const customer: any = {};
    columns.forEach((col, index) => {
      const camelCaseCol = col.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      customer[camelCaseCol] = row[index];
    });

    return customer as Customer;
  }
}

export default CustomerDAO;
