import { redirect } from 'next/navigation';
import HomeClient from '@/components/HomeClient/HomeClient';
import { getUser } from '@/lib/firebase/getUser';

export default async function HomePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <HomeClient appUser={{ uid: user.uid, email: user.email }} />;
}
