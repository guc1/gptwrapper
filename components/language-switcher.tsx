'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    router.push(pathname, { locale: nextLocale });
  };

  return (
    <select
      className="border rounded p-1 text-sm"
      value={locale}
      onChange={handleChange}
    >
      <option value="en">English</option>
      <option value="nl">Dutch</option>
    </select>
  );
}
