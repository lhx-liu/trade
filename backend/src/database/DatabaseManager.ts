import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DatabaseManager - 单例模式管理SQLite数据库
 * 使用sql.js实现纯JavaScript的SQLite数据库
 */
class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;
  private dbPath: string;
  private SQL: any;

  private constructor() {
    this.dbPath = path.join(process.cwd(), 'orders.db');
  }

  /**
   * 获取DatabaseManager单例实例
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库连接
   */
  public async initialize(): Promise<void> {
    try {
      // 初始化sql.js
      this.SQL = await initSqlJs();

      // 检查数据库文件是否存在
      if (fs.existsSync(this.dbPath)) {
        // 加载现有数据库
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
        console.log('数据库加载成功');
      } else {
        // 创建新数据库
        this.db = new this.SQL.Database();
        console.log('创建新数据库');
      }

      // 创建表结构
      this.createTables();
      
      // 保存数据库到文件
      this.saveDatabase();
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw new Error('无法连接到数据库');
    }
  }

  /**
   * 创建数据库表结构
   */
  private createTables(): void {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    // 创建customers表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        company_name TEXT PRIMARY KEY,
        business_opportunity TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // 创建orders表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_date TEXT NOT NULL,
        company_name TEXT NOT NULL,
        contact_info TEXT NOT NULL,
        lead_number TEXT NOT NULL,
        new_or_old TEXT,
        customer_level TEXT,
        country TEXT,
        continent TEXT,
        source TEXT,
        customer_nature TEXT,
        invoice_amount REAL,
        payment_amount REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (company_name) REFERENCES customers(company_name) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_orders_company_name ON orders(company_name)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_orders_country ON orders(country)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_orders_continent ON orders(continent)');

    console.log('数据库表结构创建成功');
  }

  /**
   * 获取数据库实例
   */
  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用initialize()');
    }
    return this.db;
  }

  /**
   * 保存数据库到文件
   */
  public saveDatabase(): void {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('数据库保存失败:', error);
      throw new Error('数据库保存失败');
    }
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
      console.log('数据库连接已关闭');
    }
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   */
  public transaction<T>(callback: () => T): T {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      this.db.run('BEGIN TRANSACTION');
      const result = callback();
      this.db.run('COMMIT');
      this.saveDatabase();
      return result;
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }
}

export default DatabaseManager;
