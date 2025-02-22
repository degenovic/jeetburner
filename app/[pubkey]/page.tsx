import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ pubkey: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PubkeyPage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/?pubkey=${resolvedParams.pubkey}`);
}
