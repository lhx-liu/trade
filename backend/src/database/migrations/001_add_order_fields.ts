import { Database } from 'sql.js';

/**
 * 迁移脚本：添加订单新字段
 * - customer_background_check: 客户背调
 * - closed_product: 成单产品（必填）
 * - payment_date: 到款日期
 * - exw_value: EXW货值
 */

export function up(db: Database): void {
  console.log('执行迁移：添加订单新字段...');

  try {
    // 检查字段是否已存在
    const tableInfo = db.exec("PRAGMA table_info(orders)");
    const existingColumns = tableInfo[0]?.values.map(row => row[1]) || [];

    // 添加新字段（如果不存在）
    if (!existingColumns.includes('customer_background_check')) {
      db.run('ALTER TABLE orders ADD COLUMN customer_background_check TEXT');
      console.log('✓ 添加字段: customer_background_check');
    }

    if (!existingColumns.includes('closed_product')) {
      db.run('ALTER TABLE orders ADD COLUMN closed_product TEXT');
      console.log('✓ 添加字段: closed_product');
    }

    if (!existingColumns.includes('payment_date')) {
      db.run('ALTER TABLE orders ADD COLUMN payment_date TEXT');
      console.log('✓ 添加字段: payment_date');
    }

    if (!existingColumns.includes('exw_value')) {
      db.run('ALTER TABLE orders ADD COLUMN exw_value REAL');
      console.log('✓ 添加字段: exw_value');
    }

    // 创建索引以优化Top5查询
    try {
      db.run('CREATE INDEX IF NOT EXISTS idx_orders_closed_product ON orders(closed_product)');
      console.log('✓ 创建索引: idx_orders_closed_product');
    } catch (e) {
      console.log('索引 idx_orders_closed_product 已存在');
    }

    try {
      db.run('CREATE INDEX IF NOT EXISTS idx_orders_customer_product ON orders(company_name, closed_product)');
      console.log('✓ 创建索引: idx_orders_customer_product');
    } catch (e) {
      console.log('索引 idx_orders_customer_product 已存在');
    }

    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

export function down(db: Database): void {
  console.log('回滚迁移：删除订单新字段...');

  try {
    // SQLite不支持直接删除列，需要重建表
    // 这里提供回滚说明
    console.log('注意：SQLite不支持直接删除列');
    console.log('如需回滚，请执行以下步骤：');
    console.log('1. 备份数据');
    console.log('2. 删除索引');
    console.log('3. 重建表结构（不包含新字段）');
    console.log('4. 恢复数据');

    // 删除索引
    db.run('DROP INDEX IF EXISTS idx_orders_closed_product');
    db.run('DROP INDEX IF EXISTS idx_orders_customer_product');
    console.log('✓ 删除索引完成');

  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}
