/**
 * 类型定义文件
 */

// 联系人信息
export interface ContactInfo {
  name: string;      // 客户名
  email: string;     // 邮箱
  phone: string;     // 联系方式
}

// 订单实体
export interface Order {
  id?: number;
  orderDate: string;              // YYYY-MM-DD
  companyName: string;
  contactInfo: ContactInfo[];
  leadNumber: string;
  newOrOld?: string;              // "新客户" | "老客户"
  customerLevel?: string;         // "A" | "B" | "C"
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  businessOpportunity?: string;   // 客户商机（仅用于API传输，不存储在订单表）
  createdAt?: string;
  updatedAt?: string;
}

// 客户实体
export interface Customer {
  companyName: string;
  businessOpportunity?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 查询参数
export interface QueryParams {
  startDate?: string;
  endDate?: string;
  companyName?: string;
  customerName?: string;
  newOrOld?: string;
  customerLevel?: string;
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  page?: number;
  pageSize?: number;
}

// 统计数据
export interface Statistics {
  totalOrders: number;
  totalCustomers: number;
  totalInvoiceAmount: number;
  totalPaymentAmount: number;
  byCountry: Record<string, number>;
  byContinent: Record<string, number>;
  byCustomerLevel: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    orderCount: number;
    invoiceAmount: number;
    paymentAmount: number;
  }>;
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============ 客户行为分析相关类型 ============

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

// 客户分析查询参数
export interface CustomerAnalysisQuery extends FilterCriteria {
  page?: number;           // 页码，默认1
  pageSize?: number;       // 每页数量，默认20
  sortBy?: string;         // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
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

// 数据库查询结果（原始数据）
export interface CustomerRawData {
  company_name: string;
  total_orders: number;
  first_order_date: string;
  last_order_date: string;
  total_invoice_amount: number;
  country: string;
  customer_level: string;
  new_or_old: string;
}
