import DatabaseManager from '../database/DatabaseManager';
import CustomerDAO from '../dao/CustomerDAO';
import OrderDAO from '../dao/OrderDAO';
import { Customer, Order } from '../types';

/**
 * CustomerService - 客户业务逻辑服务
 */
class CustomerService {
  private dbManager: DatabaseManager;
  private customerDAO: CustomerDAO;
  private orderDAO: OrderDAO;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    const db = this.dbManager.getDatabase();
    this.customerDAO = new CustomerDAO(db);
    this.orderDAO = new OrderDAO(db);
  }

  /**
   * 获取客户列表（按公司名去重，支持分页）
   * 需求: 3.5
   */
  async getCustomers(page: number = 1, pageSize: number = 20): Promise<{ customers: Customer[]; total: number }> {
    return this.customerDAO.list(page, pageSize);
  }

  /**
   * 获取某个客户的所有订单（支持分页）
   * 需求: 4.14, 5.1, 5.2
   */
  async getCustomerOrders(
    companyName: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ customer: Customer; orders: Order[]; total: number }> {
    // 获取客户信息
    const customer = this.customerDAO.findByCompanyName(companyName);
    if (!customer) {
      throw new Error('客户不存在');
    }

    // 获取该客户的所有订单
    const { orders, total } = this.orderDAO.findByCompanyName(companyName, page, pageSize);

    return {
      customer,
      orders,
      total,
    };
  }

  /**
   * 更新客户商机
   * 需求: 5.3
   */
  async updateBusinessOpportunity(companyName: string, opportunity: string): Promise<Customer> {
    // 检查客户是否存在
    const customer = this.customerDAO.findByCompanyName(companyName);
    if (!customer) {
      throw new Error('客户不存在');
    }

    // 更新客户商机
    this.dbManager.transaction(() => {
      this.customerDAO.update(companyName, { businessOpportunity: opportunity });
    });

    // 返回更新后的客户信息
    const updatedCustomer = this.customerDAO.findByCompanyName(companyName);
    if (!updatedCustomer) {
      throw new Error('客户更新失败');
    }

    return updatedCustomer;
  }
}

export default CustomerService;
