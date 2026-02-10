import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import CustomerFilter from './CustomerFilter';
import CustomerList from './CustomerList';
import CustomerDetail from './CustomerDetail';
import {
  CustomerMetrics,
  FilterCriteria,
  PaginationConfig,
} from '../../types/customerAnalysis';
import { customerAnalysisApi } from '../../services/customerAnalysisService';

const CustomerAnalysis: React.FC = () => {
  // 状态管理
  const [customers, setCustomers] = useState<CustomerMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // 初始加载数据
  useEffect(() => {
    loadCustomers();
  }, []);

  // 当筛选条件、分页、排序变化时重新加载数据
  useEffect(() => {
    loadCustomers();
  }, [filters, pagination.current, pagination.pageSize, sortBy, sortOrder]);

  // 加载客户列表
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await customerAnalysisApi.getCustomers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
        ...filters,
      });

      setCustomers(result.customers);
      setPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (error) {
      console.error('加载客户列表失败:', error);
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理筛选条件变更
  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setPagination({ ...pagination, current: 1 }); // 重置到第一页
  };

  // 处理重置筛选
  const handleReset = () => {
    setFilters({});
    setPagination({ ...pagination, current: 1 });
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  // 处理排序
  const handleSort = (field: string, order: 'ascend' | 'descend' | null) => {
    if (order) {
      setSortBy(field);
      setSortOrder(order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortBy('');
      setSortOrder('desc');
    }
  };

  // 处理客户点击
  const handleCustomerClick = (companyName: string) => {
    setSelectedCustomer(companyName);
  };

  // 关闭客户详情
  const handleCloseDetail = () => {
    setSelectedCustomer(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>客户行为分析</h2>

      {/* 筛选器 */}
      <CustomerFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* 客户列表 */}
      <CustomerList
        customers={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSort={handleSort}
        onCustomerClick={handleCustomerClick}
      />

      {/* 客户详情抽屉 */}
      {selectedCustomer && (
        <CustomerDetail
          companyName={selectedCustomer}
          visible={!!selectedCustomer}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default CustomerAnalysis;
