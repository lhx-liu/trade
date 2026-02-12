/**
 * DataValidator - 数据验证工具类
 * 
 * 提供订单数据的各种验证功能，包括：
 * - 邮箱格式验证
 * - 日期格式验证（YYYY-MM-DD，不晚于当前日期）
 * - 金额非负验证
 * - 订单数据完整性验证
 */

export class DataValidator {
  /**
   * 验证邮箱格式
   * 
   * @param email - 待验证的邮箱地址
   * @returns 如果邮箱格式有效返回 true，否则返回 false
   * 
   * 验证规则：
   * - 必须包含 @ 符号
   * - @ 前后都必须有内容
   * - 必须包含域名（至少一个点）
   * - 符合基本邮箱格式
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // 基本邮箱格式正则表达式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * 验证日期格式
   * 
   * @param date - 待验证的日期字符串
   * @returns 如果日期格式有效返回 true，否则返回 false
   * 
   * 验证规则：
   * - 支持 YYYY-MM-DD 或 YYYY.MM.DD 格式
   * - 必须是有效的日期（例如不能是 2024-02-30）
   */
  static validateDate(date: string): boolean {
    if (!date || typeof date !== 'string') {
      return false;
    }

    const trimmedDate = date.trim();

    // 验证 YYYY-MM-DD 或 YYYY.MM.DD 格式
    const dateRegex = /^\d{4}[-.]\d{2}[-.]\d{2}$/;
    if (!dateRegex.test(trimmedDate)) {
      return false;
    }

    // 统一转换为 YYYY-MM-DD 格式进行验证
    const normalizedDate = trimmedDate.replace(/\./g, '-');

    // 验证是否为有效日期
    const parsedDate = new Date(normalizedDate);
    if (isNaN(parsedDate.getTime())) {
      return false;
    }

    // 验证日期字符串解析后是否与原始字符串一致（防止 2024-02-30 这种情况）
    const [year, month, day] = normalizedDate.split('-').map(Number);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() + 1 !== month ||
      parsedDate.getDate() !== day
    ) {
      return false;
    }

    return true;
  }

  /**
   * 验证金额
   * 
   * @param amount - 待验证的金额
   * @returns 如果金额为非负数值返回 true，否则返回 false
   * 
   * 验证规则：
   * - 必须是数字类型或可转换为数字的字符串
   * - 必须是非负数（>= 0）
   * - 不能是 NaN 或 Infinity
   */
  static validateAmount(amount: any): boolean {
    // null 或 undefined 被视为有效（非必填字段可以为空）
    if (amount === null || amount === undefined || amount === '') {
      return true;
    }

    // 转换为数字
    const numAmount = typeof amount === 'number' ? amount : Number(amount);

    // 验证是否为有效数字且非负
    return !isNaN(numAmount) && isFinite(numAmount) && numAmount >= 0;
  }

  /**
   * 验证订单数据并返回错误列表
   * 
   * @param order - 待验证的订单数据（部分字段）
   * @returns 错误消息数组，如果没有错误则返回空数组
   * 
   * 验证内容：
   * - 日期格式（到款日期可为空、建档日期）
   * - 金额非负（发票金额、到款金额）
   */
  static validateOrderData(order: any): string[] {
    const errors: string[] = [];

    // 验证到款日期（允许为空）
    if (order.paymentDate && order.paymentDate !== null && order.paymentDate !== '') {
      if (!this.validateDate(order.paymentDate)) {
        errors.push('到款日期格式无效');
      }
    }

    // 验证建档日期（必填）
    if (order.orderDate && !this.validateDate(order.orderDate)) {
      errors.push('建档日期格式无效');
    }

    // 验证发票金额
    if (order.invoiceAmount !== null && order.invoiceAmount !== undefined && order.invoiceAmount !== '') {
      if (!this.validateAmount(order.invoiceAmount)) {
        errors.push('发票金额必须为非负数值');
      }
    }

    // 验证到款金额
    if (order.paymentAmount !== null && order.paymentAmount !== undefined && order.paymentAmount !== '') {
      if (!this.validateAmount(order.paymentAmount)) {
        errors.push('到款金额必须为非负数值');
      }
    }

    return errors;
  }
}
