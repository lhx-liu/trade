import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import { message } from 'antd';
import type { Order, Customer, Statistics, QueryParams } from '../types';
import { orderApi, customerApi, statisticsApi } from '../services/api';

// 定义 AppState 接口
interface AppState {
  orders: Order[];
  customers: Customer[];
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  queryParams: QueryParams;
  totalOrders: number;
  totalCustomers: number;
}

// 定义 Action 类型
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORDERS'; payload: { orders: Order[]; total: number } }
  | { type: 'SET_CUSTOMERS'; payload: { customers: Customer[]; total: number } }
  | { type: 'SET_STATISTICS'; payload: Statistics }
  | { type: 'SET_QUERY_PARAMS'; payload: QueryParams }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'DELETE_ORDER'; payload: number };

// 初始状态
const initialState: AppState = {
  orders: [],
  customers: [],
  statistics: null,
  loading: false,
  error: null,
  queryParams: {},
  totalOrders: 0,
  totalCustomers: 0,
};

// Reducer 函数
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload.orders,
        totalOrders: action.payload.total,
        loading: false,
        error: null,
      };
    
    case 'SET_CUSTOMERS':
      return {
        ...state,
        customers: action.payload.customers,
        totalCustomers: action.payload.total,
        loading: false,
        error: null,
      };
    
    case 'SET_STATISTICS':
      return {
        ...state,
        statistics: action.payload,
        loading: false,
        error: null,
      };
    
    case 'SET_QUERY_PARAMS':
      return { ...state, queryParams: action.payload };
    
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        totalOrders: state.totalOrders + 1,
      };
    
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id ? action.payload : order
        ),
      };
    
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter((order) => order.id !== action.payload),
        totalOrders: state.totalOrders - 1,
      };
    
    default:
      return state;
  }
}

// 定义 Context Value 接口
interface AppContextValue {
  state: AppState;
  actions: {
    fetchOrders: (params: QueryParams) => Promise<void>;
    createOrder: (order: Order) => Promise<void>;
    updateOrder: (id: number, order: Order) => Promise<void>;
    deleteOrder: (id: number) => Promise<void>;
    fetchCustomers: (page?: number, pageSize?: number) => Promise<void>;
    fetchCustomerOrders: (companyName: string, page?: number, pageSize?: number) => Promise<{
      customer: Customer;
      orders: Order[];
      total: number;
    }>;
    fetchStatistics: (startDate?: string, endDate?: string) => Promise<void>;
    setQueryParams: (params: QueryParams) => void;
  };
}

// 创建 Context
const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider 组件
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions - 使用 useMemo 避免每次渲染都创建新对象
  const actions = useMemo(() => ({
    // 查询订单列表
    fetchOrders: async (params: QueryParams) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_QUERY_PARAMS', payload: params });
        
        const response = await orderApi.queryOrders(params);
        dispatch({
          type: 'SET_ORDERS',
          payload: { orders: response.items, total: response.total },
        });
      } catch (error) {
        const errorMessage = '获取订单列表失败';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        console.error('fetchOrders error:', error);
      }
    },

    // 创建订单
    createOrder: async (order: Order) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const newOrder = await orderApi.createOrder(order);
        dispatch({ type: 'ADD_ORDER', payload: newOrder });
        dispatch({ type: 'SET_LOADING', payload: false });
        
        message.success('订单创建成功');
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.error('createOrder error:', error);
        throw error;
      }
    },

    // 更新订单
    updateOrder: async (id: number, order: Order) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const updatedOrder = await orderApi.updateOrder(id, order);
        dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
        dispatch({ type: 'SET_LOADING', payload: false });
        
        message.success('订单更新成功');
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.error('updateOrder error:', error);
        throw error;
      }
    },

    // 删除订单
    deleteOrder: async (id: number) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        await orderApi.deleteOrder(id);
        dispatch({ type: 'DELETE_ORDER', payload: id });
        dispatch({ type: 'SET_LOADING', payload: false });
        
        message.success('订单删除成功');
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.error('deleteOrder error:', error);
        throw error;
      }
    },

    // 获取客户列表
    fetchCustomers: async (page: number = 1, pageSize: number = 20) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const response = await customerApi.getCustomers(page, pageSize);
        dispatch({
          type: 'SET_CUSTOMERS',
          payload: { customers: response.items, total: response.total },
        });
      } catch (error) {
        const errorMessage = '获取客户列表失败';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        console.error('fetchCustomers error:', error);
      }
    },

    // 获取客户的所有订单
    fetchCustomerOrders: async (
      companyName: string,
      page: number = 1,
      pageSize: number = 10
    ) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const response = await customerApi.getCustomerOrders(companyName, page, pageSize);
        dispatch({ type: 'SET_LOADING', payload: false });
        
        return {
          customer: response.customer,
          orders: response.orders.items,
          total: response.orders.total,
        };
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.error('fetchCustomerOrders error:', error);
        throw error;
      }
    },

    // 获取统计数据
    fetchStatistics: async (startDate?: string, endDate?: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const statistics = await statisticsApi.getStatistics(startDate, endDate);
        dispatch({ type: 'SET_STATISTICS', payload: statistics });
      } catch (error) {
        const errorMessage = '获取统计数据失败';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        console.error('fetchStatistics error:', error);
      }
    },

    // 设置查询参数
    setQueryParams: (params: QueryParams) => {
      dispatch({ type: 'SET_QUERY_PARAMS', payload: params });
    },
  }), []);

  const value: AppContextValue = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 自定义 Hook
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
