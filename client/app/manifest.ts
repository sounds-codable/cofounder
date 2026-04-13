import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '叩饭 Cofounder',
    short_name: '叩饭',
    description: '行业专家与程序员双向授权协作平台。先公开基础信息，再逐步开放详细资料与联系方式。',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6fbff',
    theme_color: '#13bfa8',
    lang: 'zh-CN',
    id: getSiteUrl(),
  };
}
