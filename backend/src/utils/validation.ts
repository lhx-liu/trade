/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证必填字段
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

/**
 * 验证数字
 */
export function validateNumber(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return true; // 可选字段
  }
  return !isNaN(Number(value)) && isFinite(Number(value));
}

/**
 * 验证日期格式 (YYYY-MM-DD)
 */
export function validateDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * 验证ISO 8601日期格式
 * 支持格式: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ss.sssZ
 */
export function validateISO8601Date(date: string): boolean {
  if (!date || typeof date !== 'string') {
    return false;
  }
  
  // 尝试解析日期
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return false;
  }
  
  // 验证基本格式
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  return iso8601Regex.test(date);
}

/**
 * 验证数值格式（用于EXW货值等）
 * 允许正数、负数、小数
 */
export function validateNumericValue(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return true; // 可选字段，空值有效
  }
  
  // 如果是数字类型，直接验证
  if (typeof value === 'number') {
    return isFinite(value);
  }
  
  // 如果是字符串，尝试转换
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
  }
  
  return false;
}

/**
 * 验证订单新字段
 * @param order 订单对象
 * @returns 验证结果 { valid: boolean, errors: string[] }
 */
export function validateOrderNewFields(order: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 验证成单产品（必填）
  if (!validateRequired(order.closedProduct)) {
    errors.push('成单产品为必填项');
  }
  
  // 验证到款日期格式（可选，但如果提供则必须有效）
  if (order.paymentDate && !validateISO8601Date(order.paymentDate)) {
    errors.push('到款日期格式无效，请使用ISO 8601格式（如：2024-01-15）');
  }
  
  // 验证EXW货值格式（可选，但如果提供则必须有效）
  if (order.exwValue !== undefined && order.exwValue !== null && order.exwValue !== '') {
    if (!validateNumericValue(order.exwValue)) {
      errors.push('EXW货值必须为有效的数值');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
