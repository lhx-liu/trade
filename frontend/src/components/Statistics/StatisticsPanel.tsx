import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatNumber } from '../../utils';
import type { Statistics } from '../../types';

interface StatisticsPanelProps {
  statistics: Statistics | null;
  loading?: boolean;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics, loading }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="订单总数"
            value={statistics?.totalOrders || 0}
            prefix={<ShoppingOutlined />}
            formatter={(value) => formatNumber(value as number)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="客户总数"
            value={statistics?.totalCustomers || 0}
            prefix={<UserOutlined />}
            formatter={(value) => formatNumber(value as number)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="发票金额总计"
            value={statistics?.totalInvoiceAmount || 0}
            prefix={<DollarOutlined />}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="到款金额总计"
            value={statistics?.totalPaymentAmount || 0}
            prefix={<CheckCircleOutlined />}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatisticsPanel;
