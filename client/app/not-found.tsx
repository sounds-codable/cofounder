import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <span className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">页面不存在</span>
          <CardTitle className="text-2xl leading-tight md:text-3xl">这个页面还没有被生成，或者已经被移动了。</CardTitle>
          <p className="text-sm text-muted-foreground md:text-base">你可以回到首页继续查看公开基础信息，或者进入资料录入与请求中心相关页面。</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link className={buttonVariants()} href="/">
            回到首页
          </Link>
          <Link className={buttonVariants({ variant: 'outline' })} href="/projects">
            查看项目方
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
