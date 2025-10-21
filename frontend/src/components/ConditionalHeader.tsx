'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // 채팅 페이지와 인증 페이지에서는 Header를 숨김
  const hideHeader = pathname?.startsWith('/chats') || pathname?.startsWith('/auth');

  if (hideHeader) {
    return null;
  }

  return <Header />;
}
