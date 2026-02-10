/**
 * 客户行为分析相关类型定义
 */

// 客户关键指标
export interface CustomerMetrics {
  companyName: string;           // 公司名称
  totalOrders: number;           // 订单总数
  monthlyOrderFrequency: number; // 月均订单数
  averageOrderAmount: number;    // 平均订单金额
  lastOrderDate: string;         // 最近订单日期 (YYYY-MM-DD)
  firstOrderDate: string;        // 首次订单日期 (YYYY-MM-DD)
  country: string;               // 国家
  customerLevel: string;         // 客户等级
  customerType: string;          // 新老客户
}

// 筛选条件
export interface FilterCriteria {
  country?: string;
  customerLevel?: string;
  customerType?: string;
}

// 分页配置
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
}

// 客户详细分析数据
export interface CustomerDetailAnalysis {
  basicInfo: {
    companyName: string;
    country: string;
    customerLevel: string;
    customerType: string;
    businessOpportunity: string;
  };
  orderFrequency: OrderFrequencyMetrics;
  purchasePattern: PurchasePatternMetrics;
  orderTimeline: OrderTimelineItem[];
}

// 下单频率指标
export interface OrderFrequencyMetrics {
  totalOrders: number;
  monthlyAverage: number;        // 月均订单数
  averageInterval: number | null; // 平均订单间隔天数
  monthlyTrend: MonthlyOrderCount[]; // 月度订单趋势
}

// 采购习惯指标
export interface PurchasePatternMetrics {
  amountRange: {
    min: number;
    max: number;
    average: number;
  };
  amountTrend: AmountTrendItem[];  // 金额趋势
  cyclePattern: string;            // 采购周期描述
}

// 订单时间线项
export interface OrderTimelineItem {
  id: number;
  orderDate: string;
  invoiceAmount: number;
  paymentAmount: number;
  leadNumber: string;
}

// 月度订单统计
export interface MonthlyOrderCount {
  month: string;  // YYYY-MM
  count: number;
}

// 金额趋势项
export interface AmountTrendItem {
  date: string;   // YYYY-MM-DD
  amount: number;
}
