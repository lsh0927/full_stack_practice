'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // 채팅 페이지에서는 Header를 숨김 (인스타그램 스타일)
  const hideHeader = pathname?.startsWith('/chats');

  if (hideHeader) {
    return null;
  }

  return <Header />;
}
