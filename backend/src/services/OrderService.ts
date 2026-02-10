import DatabaseManager from '../database/DatabaseManager';
import OrderDAO from '../dao/OrderDAO';
import CustomerDAO from '../dao/CustomerDAO';
import { Order, QueryParams } from '../types';
import { validateEmail, validateRequired, validateNumber, validateDate } from '../utils/validation';

/**
 * OrderService - 订单业务逻辑服务
 */
class OrderService {
  private dbManager: DatabaseManager;
  private orderDAO: OrderDAO;
  private customerDAO: CustomerDAO;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    const db = this.dbManager.getDatabase();
    this.orderDAO = new OrderDAO(db);
    this.customerDAO = new CustomerDAO(db);
  }

  /**
   * 创建订单
   * 需求: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2
   */
  async createOrder(orderData: Order): Promise<Order> {
    // 验证必填字段
    if (!validateRequired(orderData.orderDate)) {
      throw new Error('订单日期为必填字段');
    }
    if (!validateRequired(orderData.companyName)) {
      throw new Error('公司名为必填字段');
    }
    if (!validateRequired(orderData.contactInfo) || orderData.contactInfo.length === 0) {
      throw new Error('客户信息为必填字段');
    }
    if (!validateRequired(orderData.leadNumber)) {
      throw new Error('线索编号为必填字段');
    }

    // 验证日期格式
    if (!validateDate(orderData.orderDate)) {
      throw new Error('订单日期格式无效，应为YYYY-MM-DD');
    }

    // 验证联系人信息
    for (const contact of orderData.contactInfo) {
      if (!validateRequired(contact.name)) {
        throw new Error('客户名为必填字段');
      }
      if (!validateRequired(contact.email)) {
        throw new Error('邮箱为必填字段');
      }
      if (!validateEmail(contact.email)) {
        throw new Error(`邮箱格式无效: ${contact.email}`);
      }
      if (!validateRequired(contact.phone)) {
        throw new Error('联系方式为必填字段');
      }
    }

    // 验证数字字段
    if (orderData.invoiceAmount !== undefined && !validateNumber(orderData.invoiceAmount)) {
      throw new Error('发票金额必须是有效数字');
    }
    if (orderData.paymentAmount !== undefined && !validateNumber(orderData.paymentAmount)) {
      throw new Error('到款金额必须是有效数字');
    }

    // 验证商机字段长度
    if (orderData.businessOpportunity && orderData.businessOpportunity.length > 500) {
      throw new Error('客户商机不能超过500个字符');
    }

    // 使用事务创建订单和客户
    return this.dbManager.transaction(() => {
      // 提取商机信息
      const { businessOpportunity, ...orderFields } = orderData;

      // 检查客户是否存在
      const customerExists = this.customerDAO.exists(orderData.companyName);

      if (!customerExists) {
        // 创建新客户，包含商机信息
        this.customerDAO.insert({
          companyName: orderData.companyName,
          businessOpportunity: businessOpportunity || '',
        });
      } else {
        // 更新现有客户的商机信息
        this.customerDAO.update(orderData.companyName, {
          businessOpportunity: businessOpportunity || '',
        });
      }

      // 创建订单（不包含businessOpportunity字段）
      const orderId = this.orderDAO.insert(orderFields);

      // 查询并返回创建的订单
      const createdOrder = this.orderDAO.findById(orderId);
      if (!createdOrder) {
        throw new Error('订单创建失败');
      }

      return createdOrder;
    });
  }

  /**
   * 更新订单
   * 需求: 2.1, 2.2, 3.3, 3.4
   */
  async updateOrder(id: number, orderData: Order): Promise<Order> {
    // 验证必填字段（同创建订单）
    if (!validateRequired(orderData.orderDate)) {
      throw new Error('订单日期为必填字段');
    }
    if (!validateRequired(orderData.companyName)) {
      throw new Error('公司名为必填字段');
    }
    if (!validateRequired(orderData.contactInfo) || orderData.contactInfo.length === 0) {
      throw new Error('客户信息为必填字段');
    }
    if (!validateRequired(orderData.leadNumber)) {
      throw new Error('线索编号为必填字段');
    }

    // 验证日期格式
    if (!validateDate(orderData.orderDate)) {
      throw new Error('订单日期格式无效，应为YYYY-MM-DD');
    }

    // 验证联系人信息
    for (const contact of orderData.contactInfo) {
      if (!validateRequired(contact.name)) {
        throw new Error('客户名为必填字段');
      }
      if (!validateRequired(contact.email)) {
        throw new Error('邮箱为必填字段');
      }
      if (!validateEmail(contact.email)) {
        throw new Error(`邮箱格式无效: ${contact.email}`);
      }
      if (!validateRequired(contact.phone)) {
        throw new Error('联系方式为必填字段');
      }
    }

    // 验证数字字段
    if (orderData.invoiceAmount !== undefined && !validateNumber(orderData.invoiceAmount)) {
      throw new Error('发票金额必须是有效数字');
    }
    if (orderData.paymentAmount !== undefined && !validateNumber(orderData.paymentAmount)) {
      throw new Error('到款金额必须是有效数字');
    }

    // 验证商机字段长度
    if (orderData.businessOpportunity && orderData.businessOpportunity.length > 500) {
      throw new Error('客户商机不能超过500个字符');
    }

    // 检查订单是否存在
    const existingOrder = this.orderDAO.findById(id);
    if (!existingOrder) {
      throw new Error('订单不存在');
    }

    // 使用事务更新订单
    return this.dbManager.transaction(() => {
      // 提取商机信息
      const { businessOpportunity, ...orderFields } = orderData;

      // 更新客户商机信息
      this.customerDAO.update(orderData.companyName, {
        businessOpportunity: businessOpportunity || '',
      });

      // 更新订单（不包含businessOpportunity字段）
      this.orderDAO.update(id, orderFields);

      // 查询并返回更新后的订单
      const updatedOrder = this.orderDAO.findById(id);
      if (!updatedOrder) {
        throw new Error('订单更新失败');
      }

      return updatedOrder;
    });
  }

  /**
   * 删除订单
   * 需求: 2.3, 2.4, 2.5
   */
  async deleteOrder(id: number): Promise<boolean> {
    // 检查订单是否存在
    const order = this.orderDAO.findById(id);
    if (!order) {
      throw new Error('订单不存在');
    }

    const companyName = order.companyName;

    // 使用事务删除订单
    return this.dbManager.transaction(() => {
      // 删除订单
      this.orderDAO.delete(id);

      // 检查该客户是否还有其他订单
      const { total } = this.orderDAO.findByCompanyName(companyName, 1, 1);

      // 如果没有其他订单，删除客户记录
      if (total === 0) {
        this.customerDAO.delete(companyName);
      }

      return true;
    });
  }

  /**
   * 查询订单
   * 需求: 4.1, 4.2, 4.3-4.10, 4.12, 4.13, 4.15
   */
  async queryOrders(params: QueryParams): Promise<{ orders: Order[]; total: number }> {
    const result = this.orderDAO.query(params);
    
    // 为每个订单附加客户商机信息
    const ordersWithOpportunity = result.orders.map(order => {
      const customer = this.customerDAO.findByCompanyName(order.companyName);
      return {
        ...order,
        businessOpportunity: customer?.businessOpportunity || '',
      };
    });
    
    return {
      orders: ordersWithOpportunity,
      total: result.total,
    };
  }

  /**
   * 获取单个订单
   * 需求: 2.1
   */
  async getOrderById(id: number): Promise<Order | null> {
    return this.orderDAO.findById(id);
  }
}

export default OrderService;
