import { redirect } from 'next/navigation';

export default async function PubkeyPage({
  params,
}: {
  params: { pubkey: string };
}) {
  redirect(`/?pubkey=${params.pubkey}`);
}
