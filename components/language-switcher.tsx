'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/`;
    router.refresh();
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
