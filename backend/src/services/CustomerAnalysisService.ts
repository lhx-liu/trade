import DatabaseManager from '../database/DatabaseManager';
import CustomerAnalysisDAO from '../dao/CustomerAnalysisDAO';
import {
  CustomerMetrics,
  CustomerDetailAnalysis,
  CustomerAnalysisQuery,
  OrderFrequencyMetrics,
  PurchasePatternMetrics,
  Order,
  MonthlyOrderCount,
  AmountTrendItem,
  OrderTimelineItem,
  TopProduct,
  TopProductsResponse,
} from '../types';

/**
 * CustomerAnalysisService - 客户行为分析业务逻辑服务
 */
class CustomerAnalysisService {
  private dbManager: DatabaseManager;
  private dao: CustomerAnalysisDAO;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    const db = this.dbManager.getDatabase();
    this.dao = new CustomerAnalysisDAO(db);
  }

  /**
   * 获取客户列表及指标
   */
  async getCustomerMetrics(query: CustomerAnalysisQuery): Promise<{
    customers: CustomerMetrics[];
    total: number;
  }> {
    // 获取筛选条件
    const filters = {
      country: query.country,
      customerLevel: query.customerLevel,
      customerType: query.customerType,
    };

    // 查询客户数据
    let customers = this.dao.getCustomersWithMetrics(filters);

    // 排序
    if (query.sortBy) {
      customers = this.sortCustomers(customers, query.sortBy, query.sortOrder || 'desc');
    }

    // 总数
    const total = customers.length;

    // 分页
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    customers = customers.slice(start, end);

    return { customers, total };
  }

  /**
   * 获取单个客户详细分析
   */
  async getCustomerDetail(companyName: string): Promise<CustomerDetailAnalysis> {
    // 查询客户的所有订单
    const orders = this.dao.getCustomerOrders(companyName);

    if (orders.length === 0) {
      throw new Error('客户不存在或没有订单');
    }

    // 获取客户基本信息
    const firstOrder = orders[orders.length - 1];
    const basicInfo = {
      companyName,
      country: firstOrder.country || '',
      customerLevel: firstOrder.customerLevel || '',
      customerType: firstOrder.newOrOld || '',
      businessOpportunity: firstOrder.businessOpportunity || '',
    };

    // 计算下单频率指标
    const orderFrequency = this.calculateOrderFrequency(orders);

    // 分析采购习惯
    const purchasePattern = this.analyzePurchasePattern(orders);

    // 生成订单时间线
    const orderTimeline: OrderTimelineItem[] = orders.map(order => ({
      id: order.id!,
      orderDate: order.orderDate,
      invoiceAmount: order.invoiceAmount || 0,
      paymentAmount: order.paymentAmount || 0,
      leadNumber: order.leadNumber,
    }));

    return {
      basicInfo,
      orderFrequency,
      purchasePattern,
      orderTimeline,
    };
  }

  /**
   * 获取客户的Top N成单产品
   * @param companyName 公司名称
   * @param limit 返回数量限制，默认5
   * @returns Top产品响应
   */
  async getTopProducts(companyName: string, limit: number = 5): Promise<TopProductsResponse> {
    // 查询客户的所有订单（用于获取总订单数）
    const orders = this.dao.getCustomerOrders(companyName);

    if (orders.length === 0) {
      // 客户不存在或没有订单，返回空结果
      return {
        products: [],
        totalCount: 0,
      };
    }

    // 查询Top产品
    const topProducts = this.dao.getTopClosedProducts(companyName, limit);

    // 添加排名
    const products: TopProduct[] = topProducts.map((product, index) => ({
      productName: product.productName,
      count: product.count,
      rank: index + 1,
    }));

    return {
      products,
      totalCount: orders.length,
    };
  }

  /**
   * 计算客户下单频率
   */
  private calculateOrderFrequency(orders: Order[]): OrderFrequencyMetrics {
    const totalOrders = orders.length;

    // 计算月均订单数
    const firstDate = new Date(orders[orders.length - 1].orderDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - firstDate.getFullYear()) * 12 
      + (now.getMonth() - firstDate.getMonth()) + 1;
    const monthlyAverage = Number((totalOrders / monthsDiff).toFixed(2));

    // 计算平均订单间隔天数
    const averageInterval = this.calculateAverageInterval(orders);

    // 生成月度订单趋势
    const monthlyTrend = this.calculateMonthlyTrend(orders);

    return {
      totalOrders,
      monthlyAverage,
      averageInterval,
      monthlyTrend,
    };
  }

  /**
   * 分析客户采购习惯
   */
  private analyzePurchasePattern(orders: Order[]): PurchasePatternMetrics {
    // 计算金额范围
    const amounts = orders
      .map(o => o.invoiceAmount || 0)
      .filter(a => a > 0);

    const amountRange = {
      min: amounts.length > 0 ? Math.min(...amounts) : 0,
      max: amounts.length > 0 ? Math.max(...amounts) : 0,
      average: amounts.length > 0 
        ? Number((amounts.reduce((sum, a) => sum + a, 0) / amounts.length).toFixed(2))
        : 0,
    };

    // 生成金额趋势
    const amountTrend: AmountTrendItem[] = orders.map(order => ({
      date: order.orderDate,
      amount: order.invoiceAmount || 0,
    }));

    // 识别采购周期规律
    const cyclePattern = this.identifyCyclePattern(orders);

    return {
      amountRange,
      amountTrend,
      cyclePattern,
    };
  }

  /**
   * 计算订单间隔天数
   */
  private calculateOrderIntervals(orders: Order[]): number[] {
    if (orders.length < 2) {
      return [];
    }

    const intervals: number[] = [];
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    );

    for (let i = 1; i < sortedOrders.length; i++) {
      const prevDate = new Date(sortedOrders[i - 1].orderDate);
      const currDate = new Date(sortedOrders[i].orderDate);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(daysDiff);
    }

    return intervals;
  }

  /**
   * 计算平均订单间隔
   */
  private calculateAverageInterval(orders: Order[]): number | null {
    const intervals = this.calculateOrderIntervals(orders);
    
    if (intervals.length === 0) {
      return null;
    }

    const sum = intervals.reduce((acc, val) => acc + val, 0);
    return Number((sum / intervals.length).toFixed(2));
  }

  /**
   * 计算月度订单趋势
   */
  private calculateMonthlyTrend(orders: Order[]): MonthlyOrderCount[] {
    const monthlyMap = new Map<string, number>();

    for (const order of orders) {
      const month = order.orderDate.substring(0, 7); // YYYY-MM
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    }

    const trend: MonthlyOrderCount[] = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trend;
  }

  /**
   * 识别采购周期规律
   */
  private identifyCyclePattern(orders: Order[]): string {
    if (orders.length < 3) {
      return '数据不足';
    }

    const intervals = this.calculateOrderIntervals(orders);
    
    if (intervals.length === 0) {
      return '数据不足';
    }

    // 计算平均间隔和标准差
    const avg = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // 如果标准差小于平均值的30%，认为是规律采购
    if (stdDev < avg * 0.3) {
      return `规律采购（约每${Math.round(avg)}天）`;
    } else {
      return '不规律采购';
    }
  }

  /**
   * 排序客户列表
   */
  private sortCustomers(
    customers: CustomerMetrics[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): CustomerMetrics[] {
    return customers.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'totalOrders':
          aVal = a.totalOrders;
          bVal = b.totalOrders;
          break;
        case 'monthlyOrderFrequency':
          aVal = a.monthlyOrderFrequency;
          bVal = b.monthlyOrderFrequency;
          break;
        case 'averageOrderAmount':
          aVal = a.averageOrderAmount;
          bVal = b.averageOrderAmount;
          break;
        case 'lastOrderDate':
          aVal = new Date(a.lastOrderDate).getTime();
          bVal = new Date(b.lastOrderDate).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }
}

export default CustomerAnalysisService;
