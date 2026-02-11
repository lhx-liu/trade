import { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MigrationRunner - 数据库迁移执行器
 * 负责执行和管理数据库迁移脚本
 */
class MigrationRunner {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 创建迁移记录表
   */
  private createMigrationsTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  /**
   * 检查迁移是否已执行
   */
  private isMigrationExecuted(name: string): boolean {
    const result = this.db.exec(
      'SELECT COUNT(*) as count FROM migrations WHERE name = ?',
      [name]
    );
    return result[0]?.values[0][0] > 0;
  }

  /**
   * 记录迁移执行
   */
  private recordMigration(name: string): void {
    this.db.run('INSERT INTO migrations (name) VALUES (?)', [name]);
  }

  /**
   * 执行所有待执行的迁移
   */
  public async runMigrations(): Promise<void> {
    console.log('开始执行数据库迁移...');

    // 创建迁移记录表
    this.createMigrationsTable();

    // 导入并执行迁移
    const migrations = [
      { name: '001_add_order_fields', module: require('./migrations/001_add_order_fields') }
    ];

    for (const migration of migrations) {
      if (!this.isMigrationExecuted(migration.name)) {
        console.log(`执行迁移: ${migration.name}`);
        try {
          migration.module.up(this.db);
          this.recordMigration(migration.name);
          console.log(`✓ 迁移 ${migration.name} 执行成功`);
        } catch (error) {
          console.error(`✗ 迁移 ${migration.name} 执行失败:`, error);
          throw error;
        }
      } else {
        console.log(`跳过已执行的迁移: ${migration.name}`);
      }
    }

    console.log('所有迁移执行完成！');
  }

  /**
   * 回滚最后一次迁移
   */
  public async rollbackLastMigration(): Promise<void> {
    console.log('回滚最后一次迁移...');

    const result = this.db.exec(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );

    if (!result.length || !result[0].values.length) {
      console.log('没有可回滚的迁移');
      return;
    }

    const migrationName = result[0].values[0][0] as string;
    console.log(`回滚迁移: ${migrationName}`);

    // 这里需要根据迁移名称动态加载对应的模块
    // 简化实现，仅支持已知的迁移
    if (migrationName === '001_add_order_fields') {
      const migration = require('./migrations/001_add_order_fields');
      migration.down(this.db);
      this.db.run('DELETE FROM migrations WHERE name = ?', [migrationName]);
      console.log(`✓ 迁移 ${migrationName} 回滚成功`);
    }
  }
}

export default MigrationRunner;
