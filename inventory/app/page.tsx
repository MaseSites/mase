import { redirect } from 'next/navigation';

// redirect() does NOT auto-prefix basePath, so add it explicitly.
const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Page() {
  redirect(`${BP}/dashboard`);
}
