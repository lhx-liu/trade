/**
 * 数据格式化工具函数
 */

/**
 * 格式化数值为两位小数
 */
export function formatDecimal(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化金额（千分位分隔符）
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
