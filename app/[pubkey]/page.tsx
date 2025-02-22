import { redirect } from 'next/navigation';

interface Props {
  params: {
    pubkey: string;
  };
}

export default function PubkeyPage({ params }: Props) {
  redirect(`/?pubkey=${params.pubkey}`);
}
