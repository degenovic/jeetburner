import { redirect } from 'next/navigation';

interface PageProps {
  params: { pubkey: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PubkeyPage({ params }: PageProps) {
  redirect(`/?pubkey=${params.pubkey}`);
}
