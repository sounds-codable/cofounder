import type { Metadata } from 'next';
 import type { ReactNode } from 'react';
import './globals.css';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '叩饭 Cofounder',
  description: '行业专家与程序员双向授权协作平台。先公开最少信息，再在需要时逐步开放详细资料与联系方式。',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
