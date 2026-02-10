// 防抖函数（使用 lodash.debounce）
import { debounce as lodashDebounce } from 'lodash';

/**
 * 创建防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 500
): ((...args: Parameters<T>) => void) => {
  return lodashDebounce(func, wait);
};

export default debounce;
