import { redirect } from 'next/navigation';

interface Props {
  params: {
    pubkey: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PubkeyPage({ params }: Props) {
  redirect(`/?pubkey=${params.pubkey}`);
}
