import { notFound } from 'next/navigation';

type DeprecatedCardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  return [{ id: 'deprecated' }];
}

export default async function DeprecatedCardDetailPage({ params }: DeprecatedCardDetailPageProps) {
  await params;
  notFound();
}
