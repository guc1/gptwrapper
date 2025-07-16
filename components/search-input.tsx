import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative search">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-5 opacity-70" />
      <Input className="h-14 rounded-[24px] pl-10 shadow-inner" placeholder={placeholder} disabled />
    </div>
  );
}
