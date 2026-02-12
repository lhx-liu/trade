import DatabaseManager from '../database/DatabaseManager';
import ProductRankingDAO from '../dao/ProductRankingDAO';
import { ProductRankingQuery, ProductRankingResponse } from '../types';

/**
 * ProductRankingService - 产品排行榜业务逻辑服务
 */
class ProductRankingService {
  private dbManager: DatabaseManager;
  private dao: ProductRankingDAO;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    const db = this.dbManager.getDatabase();
    this.dao = new ProductRankingDAO(db);
  }

  /**
   * 获取产品销售排行榜
   * @param query 查询参数
   * @returns 产品排行榜响应
   */
  async getProductRanking(query: ProductRankingQuery): Promise<ProductRankingResponse> {
    // 调用 DAO 层获取数据
    const products = this.dao.getProductRanking(query);

    // 数据已经在 DAO 层按销售数量降序排序
    // 这里只需要返回结果
    return {
      products,
      total: products.length,
    };
  }
}

export default ProductRankingService;
