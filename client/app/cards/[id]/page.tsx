import { staticCardSlugs } from '@/lib/site-data';
import { CardDetailClient } from '@/components/card-detail-client';

export function generateStaticParams() {
  return staticCardSlugs.map((id) => ({ id }));
}

type CardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { id } = await params;

  return <CardDetailClient id={id} />;
}
