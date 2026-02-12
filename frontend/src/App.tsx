import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu } from 'antd';
import { ShoppingOutlined, BarChartOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider } from './context/AppContext';
import OrderList from './components/OrderList/OrderList';
import Statistics from './components/Statistics/Statistics';
import CustomerAnalysis from './components/CustomerAnalysis/CustomerAnalysis';
import ProductRanking from './components/ProductRanking/ProductRanking';
import './App.css';

const { Header, Content } = Layout;

// 内部组件，可以使用路由hooks
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = React.useState('orders');

  const menuItems = [
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '统计报表',
    },
    {
      key: 'customer-analysis',
      icon: <UserOutlined />,
      label: '客户分析',
    },
    {
      key: 'product-ranking',
      icon: <TrophyOutlined />,
      label: '成单产品排行榜',
    },
  ];

  // 监听路由变化，同步菜单选中状态
  React.useEffect(() => {
    const path = location.pathname.slice(1) || 'orders';
    setSelectedKey(path);
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/${key}`);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '20px', marginRight: '40px' }}>
          外贸订单管理系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/customer-analysis" element={<CustomerAnalysis />} />
          <Route path="/product-ranking" element={<ProductRanking />} />
        </Routes>
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AppProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App;
