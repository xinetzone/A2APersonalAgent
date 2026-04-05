import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '../context/AuthContext';
import WalletPage from './page';

// Mock the AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet: () => null,
  Coins: () => null,
  Gift: () => null,
  ArrowUpDown: () => null,
  Plus: () => null,
  History: () => null,
  Shield: () => null,
  CheckCircle: () => null,
  XCircle: () => null,
  AlertCircle: () => null,
  Settings: () => null,
  Lock: () => null,
  User: () => null,
  Eye: () => null,
  EyeOff: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  CreditCard: () => null,
  TrendingUp: () => null,
  ArrowUpCircle: () => null,
  ArrowDownCircle: () => null,
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
  Toaster: function Toaster() {
    return { type: 'div', props: {} };
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('WalletPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [{
            text: JSON.stringify({
              error: '钱包不存在，请先创建钱包'
            })
          }]
        }
      })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the wallet page with correct title and description', () => {
    render(React.createElement(WalletPage));
    
    expect(screen.getByText('道德钱包')).toBeInTheDocument();
    expect(screen.getByText('功德积分体系，让道德修行可量化、可流通')).toBeInTheDocument();
  });

  it('renders the no wallet message when user is not authenticated', () => {
    render(React.createElement(WalletPage));
    
    expect(screen.getByText('还没有钱包')).toBeInTheDocument();
    expect(screen.getByText('创建你的道德钱包，开始积累功德')).toBeInTheDocument();
  });

  it('shows warning when create wallet button is clicked without authentication', () => {
    const { toast } = require('sonner');
    render(React.createElement(WalletPage));
    
    const createButton = screen.getByText('创建道德钱包');
    fireEvent.click(createButton);
    
    expect(toast.warning).toHaveBeenCalledWith('请先登录：创建钱包前请先登录您的账号');
  });

  it('renders the create wallet button when wallet does not exist', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', name: 'Test User' },
      isLoading: false,
    });

    render(React.createElement(WalletPage));
    
    expect(screen.getByText('创建道德钱包')).toBeInTheDocument();
  });

  it('renders the wallet summary when wallet exists', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', name: 'Test User' },
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [{
            text: JSON.stringify({
              meritBalance: 100,
              trustQuota: 50,
              trustScore: 75,
              level: '闻道',
              totalEarned: 100,
              totalSpent: 0,
              recentTransactions: []
            })
          }]
        }
      })
    });

    render(React.createElement(WalletPage));
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('功德积分')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('信任额度')).toBeInTheDocument();
    });
  });

  it('renders the get merit section', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', name: 'Test User' },
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [{
            text: JSON.stringify({
              meritBalance: 100,
              trustQuota: 50,
              trustScore: 75,
              level: '闻道',
              totalEarned: 100,
              totalSpent: 0,
              recentTransactions: []
            })
          }]
        }
      })
    });

    render(React.createElement(WalletPage));
    
    await waitFor(() => {
      expect(screen.getByText('获取功德')).toBeInTheDocument();
      expect(screen.getByText('每日修身')).toBeInTheDocument();
      expect(screen.getByText('参与圆桌')).toBeInTheDocument();
      expect(screen.getByText('帮助他人')).toBeInTheDocument();
      expect(screen.getByText('共享经验')).toBeInTheDocument();
    });
  });

  it('renders the wallet operations section', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', name: 'Test User' },
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [{
            text: JSON.stringify({
              meritBalance: 100,
              trustQuota: 50,
              trustScore: 75,
              level: '闻道',
              totalEarned: 100,
              totalSpent: 0,
              recentTransactions: []
            })
          }]
        }
      })
    });

    render(React.createElement(WalletPage));
    
    await waitFor(() => {
      expect(screen.getByText('钱包操作')).toBeInTheDocument();
      expect(screen.getByText('消费积分')).toBeInTheDocument();
      expect(screen.getByText('捐赠功德')).toBeInTheDocument();
      expect(screen.getByText('使用额度')).toBeInTheDocument();
      expect(screen.getByText('提升境界')).toBeInTheDocument();
    });
  });

  it('renders the recent transactions section', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', name: 'Test User' },
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [{
            text: JSON.stringify({
              meritBalance: 100,
              trustQuota: 50,
              trustScore: 75,
              level: '闻道',
              totalEarned: 100,
              totalSpent: 0,
              recentTransactions: []
            })
          }]
        }
      })
    });

    render(React.createElement(WalletPage));
    
    await waitFor(() => {
      expect(screen.getByText('最近交易')).toBeInTheDocument();
      expect(screen.getByText('暂无交易记录')).toBeInTheDocument();
    });
  });
});
