// 表单验证函数

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证必填字段
 * @param value 字段值
 * @returns 是否有效
 */
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * 验证数字字段
 * @param value 数字值
 * @returns 是否有效
 */
export const validateNumber = (value: any): boolean => {
  if (value === null || value === undefined || value === '') return true; // 可选字段
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
};

/**
 * 验证日期格式 (YYYY-MM-DD)
 * @param date 日期字符串
 * @returns 是否有效
 */
export const validateDate = (date: string): boolean => {
  if (!date) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * 验证电话号码（简单验证）
 * @param phone 电话号码
 * @returns 是否有效
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  // 简单验证：至少8位数字
  const phoneRegex = /^\d{8,}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};
