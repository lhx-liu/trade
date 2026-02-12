import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Space, Alert, Spin, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import { ProductRankingItem } from '../../types';
import { getProductRanking } from '../../services/productRankingService';

const { RangePicker } = DatePicker;

const ProductRanking: React.FC = () => {
  const [data, setData] = useState<ProductRankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 初始加载数据
  useEffect(() => {
    fetchData();
  }, []);

  // 获取数据
  const fetchData = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getProductRanking({
        startDate,
        endDate,
      });

      setData(result.products);
    } catch (err: any) {
      setError(err.message || '加载失败，请重试');
      console.error('加载产品排行榜失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0];
      const end = dates[1];

      // 验证日期范围
      if (start.isAfter(end)) {
        setError('开始日期不能晚于结束日期');
        return;
      }

      setDateRange([start, end]);
      setError(null);
      fetchData(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
    } else {
      // 清空日期范围，查询全部数据
      setDateRange(null);
      setError(null);
      fetchData();
    }
  };

  // 重试
  const handleRetry = () => {
    if (dateRange) {
      fetchData(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
    } else {
      fetchData();
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '销售数量',
      dataIndex: 'salesCount',
      key: 'salesCount',
      width: 120,
      sorter: (a: ProductRankingItem, b: ProductRankingItem) => a.salesCount - b.salesCount,
    },
    {
      title: '销售金额',
      dataIndex: 'salesAmount',
      key: 'salesAmount',
      width: 150,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
      sorter: (a: ProductRankingItem, b: ProductRankingItem) => a.salesAmount - b.salesAmount,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="成单产品排行榜"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRetry}>
              刷新
            </Button>
          </Space>
        }
      >
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" danger onClick={handleRetry}>
                重试
              </Button>
            }
          />
        )}

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="productName"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个产品`,
            }}
            locale={{
              emptyText: '暂无数据',
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ProductRanking;
