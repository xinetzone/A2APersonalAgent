import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: '道德人生 - A2A Personal Agent',
  description: '基于帛书版道德经的智能人生指导',
  keywords: ['道德经', '人生指导', '智能助手', 'A2A', '帛书老子'],
  authors: [{ name: 'A2A Team' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B4513',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}