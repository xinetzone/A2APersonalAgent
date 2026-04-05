import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from './context/AuthContext';
import HomePage from './page';

// Mock the AuthContext
jest.mock('./context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BookOpen: () => null,
  Users: () => null,
  Sword: () => null,
  Award: () => null,
  Wallet: () => null,
  Map: () => null,
  Sparkles: () => null,
  ArrowRight: () => null,
  LogIn: () => null,
}));

// Mock next/link
jest.mock('next/link', () => ({
  default: ({ children, href }) => children
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

describe('HomePage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the home page with correct title and description', () => {
    render(React.createElement(HomePage));
    
    expect(screen.getByText('道德人生')).toBeInTheDocument();
    expect(screen.getByText('基于帛书版《道德经》的智能修行平台')).toBeInTheDocument();
    expect(screen.getByText('与多元 Agent 组成"道德圆桌"，在协作与对话中共同成长')).toBeInTheDocument();
  });

  it('renders the login button when user is not authenticated', () => {
    render(React.createElement(HomePage));
    
    const loginButton = screen.getByText('登录 / 开始修行');
    expect(loginButton).toBeInTheDocument();
  });

  it('renders the profile button when user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', name: 'Test User' },
    });

    render(React.createElement(HomePage));
    
    const profileButton = screen.getByText('进入个人中心');
    expect(profileButton).toBeInTheDocument();
  });

  it('navigates to login page when login button is clicked', () => {
    render(React.createElement(HomePage));
    
    const loginButton = screen.getByText('登录 / 开始修行');
    fireEvent.click(loginButton);
    
    expect(window.location.href).toBe('/login');
  });

  it('renders all feature cards', () => {
    render(React.createElement(HomePage));
    
    expect(screen.getByText('道德圆桌')).toBeInTheDocument();
    expect(screen.getByText('道德修炼场')).toBeInTheDocument();
    expect(screen.getByText('道德信誉')).toBeInTheDocument();
    expect(screen.getByText('道德钱包')).toBeInTheDocument();
    expect(screen.getByText('道德小镇')).toBeInTheDocument();
    expect(screen.getByText('荒域')).toBeInTheDocument();
  });

  it('renders the dao wisdom section', () => {
    render(React.createElement(HomePage));
    
    expect(screen.getByText('帛书智慧')).toBeInTheDocument();
    expect(screen.getByText('道法自然')).toBeInTheDocument();
    expect(screen.getByText('上德不德')).toBeInTheDocument();
    expect(screen.getByText('玄德')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(React.createElement(HomePage));
    
    expect(screen.getByText('道德人生 v2.0 | 基于帛书版《道德经》+ A2A 协议')).toBeInTheDocument();
    expect(screen.getByText('Powered by SecondMe & Vercel')).toBeInTheDocument();
  });
});
