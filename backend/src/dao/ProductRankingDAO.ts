import { Database } from 'sql.js';
import { ProductRankingQuery, ProductRankingItem } from '../types';

/**
 * ProductRankingDAO - 产品排行榜数据访问对象
 * 负责产品销售排行榜相关的数据查询
 */
class ProductRankingDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 获取产品销售排行榜
   * @param query 查询参数（时段筛选）
   * @returns 产品排行榜列表
   */
  getProductRanking(query: ProductRankingQuery): ProductRankingItem[] {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      // 产品名称不为空（有成单产品即表示已成单）
      conditions.push('closed_product IS NOT NULL');
      conditions.push("closed_product != ''");

      // 时段筛选
      if (query.startDate) {
        conditions.push('order_date >= ?');
        values.push(query.startDate);
      }

      if (query.endDate) {
        conditions.push('order_date <= ?');
        values.push(query.endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // SQL 聚合查询
      const sql = `
        SELECT 
          closed_product as product_name,
          COUNT(*) as sales_count,
          COALESCE(SUM(invoice_amount), 0) as sales_amount
        FROM orders
        ${whereClause}
        GROUP BY closed_product
        ORDER BY sales_count DESC
      `;

      const result = this.db.exec(sql, values);

      if (!result.length || !result[0].values.length) {
        return [];
      }

      const products: ProductRankingItem[] = [];
      for (const row of result[0].values) {
        products.push({
          productName: row[0] as string,
          salesCount: row[1] as number,
          salesAmount: row[2] as number,
        });
      }

      return products;
    } catch (error) {
      console.error('查询产品排行榜失败:', error);
      throw new Error('查询产品排行榜失败');
    }
  }
}

export default ProductRankingDAO;
