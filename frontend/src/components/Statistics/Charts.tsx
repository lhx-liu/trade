import React from 'react';
import { Row, Col, Card } from 'antd';
import { Column, Pie, Line } from '@ant-design/charts';
import type { Statistics } from '../../types';

interface ChartsProps {
  statistics: Statistics | null;
  loading?: boolean;
}

const Charts: React.FC<ChartsProps> = ({ statistics, loading }) => {
  // 按国家分布的柱状图数据
  const countryData = statistics?.byCountry
    ? Object.entries(statistics.byCountry).map(([country, count]) => ({
        country: country || '未知',
        count,
      }))
    : [];

  // 按大洲分布的饼图数据
  const continentData = statistics?.byContinent
    ? Object.entries(statistics.byContinent).map(([continent, count]) => ({
        type: continent || '未知',
        value: count,
      }))
    : [];

  // 按客户等级分布的饼图数据
  const levelData = statistics?.byCustomerLevel
    ? Object.entries(statistics.byCustomerLevel).map(([level, count]) => ({
        type: level || '未知',
        value: count,
      }))
    : [];

  // 月度趋势的折线图数据
  const monthlyData = statistics?.monthlyTrend || [];
  const trendData = monthlyData.flatMap((item) => [
    {
      month: item.month,
      type: '订单数量',
      value: item.orderCount,
    },
    {
      month: item.month,
      type: '发票金额',
      value: item.invoiceAmount / 1000, // 转换为千元
    },
    {
      month: item.month,
      type: '到款金额',
      value: item.paymentAmount / 1000, // 转换为千元
    },
  ]);

  // 柱状图配置
  const columnConfig = {
    data: countryData,
    xField: 'country',
    yField: 'count',
    label: {
      position: 'top' as const,
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: true,
      },
    },
    meta: {
      country: { alias: '国家' },
      count: { alias: '订单数量' },
    },
  };

  // 饼图配置（大洲）
  const continentPieConfig = {
    data: continentData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  // 饼图配置（客户等级）
  const levelPieConfig = {
    data: levelData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
    color: ['#ff4d4f', '#faad14', '#52c41a'], // A红、B橙、C绿
  };

  // 折线图配置
  const lineConfig = {
    data: trendData,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    legend: {
      position: 'top' as const,
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${v}`,
      },
    },
  };

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title="按国家分布" loading={loading}>
            {countryData.length > 0 ? (
              <Column {...columnConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="按大洲分布" loading={loading}>
            {continentData.length > 0 ? (
              <Pie {...continentPieConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="按客户等级分布" loading={loading}>
            {levelData.length > 0 ? (
              <Pie {...levelPieConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="月度趋势（金额单位：千元）" loading={loading}>
            {trendData.length > 0 ? (
              <Line {...lineConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Charts;
