# 채팅 기능 트러블슈팅 가이드

> 실시간 채팅 기능 구현 과정에서 발생한 문제들과 해결 방법 정리

## 목차
- [1. 실시간 채팅 업데이트 문제](#1-실시간-채팅-업데이트-문제)
- [2. 프로필 사진 표시 문제](#2-프로필-사진-표시-문제)
- [3. 텍스트 가독성 문제](#3-텍스트-가독성-문제)
- [4. 읽지 않은 메시지 카운트 기능](#4-읽지-않은-메시지-카운트-기능)
- [5. NestJS 라우트 순서 문제](#5-nestjs-라우트-순서-문제)
- [6. 전체 시스템 플로우](#6-전체-시스템-플로우)

---

## 1. 실시간 채팅 업데이트 문제

### 문제 상황
- 채팅 메시지를 전송하면 새로고침을 해야만 메시지가 화면에 표시됨
- Socket.IO를 통한 실시간 업데이트가 작동하지 않음

### 원인 분석
백엔드에서 전송하는 메시지 객체의 필드명과 프론트엔드에서 기대하는 필드명이 불일치

**백엔드 (ChatsGateway):**
```typescript
// ❌ 문제가 있던 코드
this.server.to(data.roomId).emit('message:receive', {
  id: message._id,  // ❌ 'id'로 전송
  roomId: message.roomId,
  // ...
});
```

**프론트엔드 (Message 타입):**
```typescript
export interface Message {
  _id: string;  // ✅ '_id'를 기대
  roomId: string;
  // ...
}
```

### 해결 방법

**파일:** `backend/src/chats/chats.gateway.ts`

```typescript
// ✅ 수정된 코드
this.server.to(data.roomId).emit('message:receive', {
  _id: message._id,        // ✅ '_id'로 통일
  roomId: message.roomId,
  senderId: message.senderId,
  receiverId: message.receiverId,
  content: message.content,
  isRead: message.isRead,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,  // 추가
});
```

### 검증 방법
1. 채팅 메시지 전송
2. 새로고침 없이 즉시 화면에 표시되는지 확인
3. 브라우저 콘솔에서 Socket.IO 이벤트 로그 확인

---

## 2. 프로필 사진 표시 문제

### 문제 상황
- 채팅에서 사용자 프로필 사진이 제대로 표시되지 않음
- 카카오 OAuth 사용자와 일반 사용자의 프로필 이미지 URL 처리가 다름

### 원인 분석
1. 카카오 OAuth: 외부 URL (https://...)
2. 일반 사용자: 상대 경로 (/uploads/...)
3. URL 처리 로직이 없어서 상대 경로가 깨짐

### 해결 방법

**1단계: 유틸리티 함수 생성**

**파일:** `frontend/src/lib/utils.ts`

```typescript
/**
 * 프로필 이미지 URL 처리
 * - 카카오 OAuth 등 외부 URL은 그대로 반환
 * - 상대 경로는 절대 경로로 변환
 */
export const getProfileImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;

  // 외부 URL인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 상대 경로인 경우 API 서버 URL과 결합
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  if (imageUrl.startsWith('/')) {
    return `${API_URL}${imageUrl}`;
  }

  return `${API_URL}/${imageUrl}`;
};
```

**2단계: 채팅 UI에 적용**

**파일:** `frontend/src/app/chats/[roomId]/page.tsx`

```typescript
// 헤더의 프로필 이미지
{getProfileImageUrl(otherUser.profileImage) ? (
  <img
    src={getProfileImageUrl(otherUser.profileImage)}
    alt={otherUser.username}
    className="w-10 h-10 rounded-full object-cover"
  />
) : (
  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
    <span className="text-gray-600 font-semibold">
      {otherUser.username[0].toUpperCase()}
    </span>
  </div>
)}

// 각 메시지의 프로필 이미지 (상대방 메시지에만)
{!isMine && (
  <div
    className="flex-shrink-0 cursor-pointer"
    onClick={() => router.push(`/profile/${otherUser?.id}`)}
  >
    {getProfileImageUrl(otherUser?.profileImage) ? (
      <img
        src={getProfileImageUrl(otherUser?.profileImage)}
        alt={otherUser?.username || ''}
        className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
      />
    ) : (
      // 기본 아바타
    )}
  </div>
)}
```

### 추가 기능
- 프로필 사진 클릭 시 해당 사용자의 프로필 페이지로 이동
- hover 효과로 클릭 가능함을 시각적으로 표시

---

## 3. 텍스트 가독성 문제

### 문제 상황
- 입력 필드의 placeholder와 텍스트가 흐릿하게 보임
- 채팅 목록의 사용자 이름이 선명하지 않음

### 해결 방법

**1. 입력 필드 스타일 개선**

```typescript
<input
  type="text"
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  placeholder="메시지를 입력하세요..."
  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-blue-500
             text-gray-900 placeholder-gray-500 font-medium"  // ✅ 추가
/>
```

**2. 메시지 버블 스타일 개선**

```typescript
<div
  className={`px-4 py-2 rounded-2xl ${
    isMine
      ? 'bg-blue-500 text-white rounded-br-sm'
      : 'bg-white border border-gray-200 text-gray-900'  // ✅ text-gray-900
  }`}
>
  <p className="font-medium break-words">{message.content}</p>  {/* ✅ font-medium */}
</div>
```

**3. 채팅 목록 사용자 이름**

```typescript
<h3 className="text-lg font-bold text-gray-900 truncate">  {/* ✅ font-bold, text-gray-900 */}
  {otherUser?.username || '알 수 없는 사용자'}
</h3>
```

---

## 4. 읽지 않은 메시지 카운트 기능

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    프론트엔드                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Header     │         │  Chats List  │                  │
│  │              │         │              │                  │
│  │  [채팅 (3)]  │         │  Room 1 (2)  │                  │
│  │   ↑          │         │  Room 2 (1)  │                  │
│  │   │          │         │  Room 3 (0)  │                  │
│  └───┼──────────┘         └──────────────┘                  │
│      │                           ↑                           │
│      └───────────────────────────┘                           │
│             실시간 업데이트                                    │
└──────────────┬──────────────────────────────────────────────┘
               │ REST API + WebSocket
               ↓
┌─────────────────────────────────────────────────────────────┐
│                      백엔드                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             ChatsController (REST API)                  │ │
│  │                                                          │ │
│  │  GET /chats/unread-count                                │ │
│  │  → 전체 읽지 않은 메시지 수 반환                         │ │
│  │                                                          │ │
│  │  GET /chats/unread-count-by-room                        │ │
│  │  → 채팅방별 읽지 않은 메시지 수 반환                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ChatsService (비즈니스 로직)                │ │
│  │                                                          │ │
│  │  getUnreadCount(userId)                                 │ │
│  │  getUnreadCountByRoom(userId)                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              MongoDB (Messages Collection)              │ │
│  │                                                          │ │
│  │  Aggregation Pipeline:                                  │ │
│  │  { receiverId: userId, isRead: false }                  │ │
│  │  → Group by roomId → Count                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            ChatsGateway (WebSocket)                     │ │
│  │                                                          │ │
│  │  message:receive → 새 메시지 알림                        │ │
│  │  message:readConfirm → 읽음 확인                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 구현 단계

#### 1단계: 백엔드 API 추가

**파일:** `backend/src/chats/chats.service.ts`

```typescript
/**
 * 사용자의 읽지 않은 메시지 수 조회
 */
async getUnreadCount(userId: string): Promise<number> {
  return await this.messageModel.countDocuments({
    receiverId: userId,
    isRead: false,
  });
}

/**
 * 채팅방별 읽지 않은 메시지 수 조회
 */
async getUnreadCountByRoom(userId: string): Promise<Record<string, number>> {
  const unreadMessages = await this.messageModel.aggregate([
    {
      $match: {
        receiverId: userId,
        isRead: false,
      },
    },
    {
      $group: {
        _id: '$roomId',
        count: { $sum: 1 },
      },
    },
  ]);

  const result: Record<string, number> = {};
  unreadMessages.forEach((item) => {
    result[item._id] = item.count;
  });

  return result;
}
```

**파일:** `backend/src/chats/chats.controller.ts`

```typescript
/**
 * GET /chats/unread-count
 * 읽지 않은 메시지 수 조회 (전체)
 */
@Get('unread-count')
async getUnreadCount(@CurrentUser() user: any): Promise<{ count: number }> {
  const count = await this.chatsService.getUnreadCount(user.id);
  return { count };
}

/**
 * GET /chats/unread-count-by-room
 * 채팅방별 읽지 않은 메시지 수 조회
 */
@Get('unread-count-by-room')
async getUnreadCountByRoom(@CurrentUser() user: any): Promise<Record<string, number>> {
  return await this.chatsService.getUnreadCountByRoom(user.id);
}
```

#### 2단계: 프론트엔드 API 연동

**파일:** `frontend/src/lib/api.ts`

```typescript
export const chatApi = {
  // 기존 API...

  // 전체 읽지 않은 메시지 수 조회
  getUnreadCount: () => authFetch('/chats/unread-count'),

  // 채팅방별 읽지 않은 메시지 수 조회
  getUnreadCountByRoom: () => authFetch('/chats/unread-count-by-room'),
};
```

#### 3단계: Header 컴포넌트 생성

**파일:** `frontend/src/components/Header.tsx`

```typescript
export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // 읽지 않은 메시지 수 가져오기
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await chatApi.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();

      // Socket 연결하여 실시간 업데이트 받기
      const token = localStorage.getItem('token');
      if (token) {
        const socket = connectSocket(token);

        // 새 메시지 알림 수신
        socket.on('message:notification', () => {
          fetchUnreadCount();
        });

        // 메시지 읽음 확인 수신
        socket.on('message:readConfirm', () => {
          fetchUnreadCount();
        });

        return () => {
          socket.off('message:notification');
          socket.off('message:readConfirm');
        };
      }
    }
  }, [isAuthenticated]);

  return (
    <header>
      {/* 채팅 버튼 with 알림 뱃지 */}
      <Link href="/chats" className="relative">
        채팅
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center
                           justify-center px-2 py-1 text-xs font-bold
                           leading-none text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
```

#### 4단계: 채팅 목록에 개별 뱃지 추가

**파일:** `frontend/src/app/chats/page.tsx`

```typescript
export default function ChatsPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchChatRooms = async () => {
      const [rooms, unreadCountsByRoom] = await Promise.all([
        chatApi.getChatRooms(),
        chatApi.getUnreadCountByRoom(),
      ]);
      setChatRooms(rooms);
      setUnreadCounts(unreadCountsByRoom);
    };

    fetchChatRooms();
  }, [isAuthenticated]);

  return (
    <div>
      {chatRooms.map((room) => (
        <div key={room.id}>
          {/* 채팅방 정보 */}

          {/* 읽지 않은 메시지 수 뱃지 */}
          {unreadCounts[room.id] > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold
                            rounded-full px-2 py-1 min-w-[20px] text-center">
              {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### 5단계: 자동 읽음 처리

**파일:** `frontend/src/app/chats/[roomId]/page.tsx`

```typescript
// 채팅방 정보 및 메시지 로드
useEffect(() => {
  const fetchData = async () => {
    const [roomData, messagesData] = await Promise.all([
      chatApi.getChatRoom(roomId),
      chatApi.getMessages(roomId),
    ]);
    setChatRoom(roomData);
    setMessages(messagesData.messages);

    // ✅ 채팅방에 들어오면 모든 메시지를 읽음 처리
    markMessageAsRead({ roomId });
  };

  fetchData();
}, [isAuthenticated, roomId]);

// 새 메시지 수신 시 읽음 처리
socket.on('message:receive', (message: Message) => {
  setMessages((prev) => [...prev, message]);

  // ✅ 상대방의 메시지인 경우 읽음 처리
  if (message.senderId !== user?.id) {
    markMessageAsRead({ roomId, messageId: message._id });
  }
});
```

---

## 5. NestJS 라우트 순서 문제

### 문제 상황
```
Error: invalid input syntax for type uuid: "unread-count-by-room"
```

API 호출: `GET /chats/unread-count`
→ 실제 매칭: `/chats/:roomId` 라우트
→ "unread-count"를 roomId로 인식

### 원인 분석

NestJS는 라우트를 **정의된 순서대로** 매칭합니다.

**문제가 있던 순서:**
```typescript
@Get()              // /chats
@Get(':roomId')     // /chats/:roomId ⚠️ 먼저 정의됨
@Get('unread-count') // /chats/unread-count ❌ 도달 불가
```

### 해결 방법

**구체적인 경로를 동적 경로보다 먼저 정의**

**파일:** `backend/src/chats/chats.controller.ts`

```typescript
@Controller('chats')
export class ChatsController {

  @Get()
  async getMyChatRooms() { }

  // ✅ 구체적인 경로를 먼저 정의
  @Get('unread-count')
  async getUnreadCount() { }

  @Get('unread-count-by-room')
  async getUnreadCountByRoom() { }

  // ✅ 동적 경로는 마지막에
  @Get(':roomId')
  async getChatRoom() { }

  @Get(':roomId/messages')
  async getMessages() { }
}
```

### 라우트 우선순위 규칙

1. **정적 경로** (`/chats/unread-count`) - 최우선
2. **와일드카드가 있는 정적 경로** (`/chats/*/count`)
3. **동적 경로** (`/chats/:roomId`) - 최후순위

---

## 6. 전체 시스템 플로우

### 메시지 전송 플로우

```
[클라이언트 A - 송신자]
    │
    │ 1. sendMessage()
    │    { roomId, receiverId, content }
    ↓
[Socket.IO Client]
    │
    │ 2. emit('message:send')
    ↓
[ChatsGateway - Backend]
    │
    │ 3. @SubscribeMessage('message:send')
    ↓
[ChatsService]
    │
    │ 4. createMessage()
    │    → MongoDB에 저장
    ↓
[ChatsGateway]
    │
    ├─→ 5a. server.to(roomId).emit('message:receive')
    │        → 채팅방의 모든 참여자에게 전송
    │
    └─→ 5b. sendToUser(receiverId, 'message:notification')
             → 수신자에게 개인 알림

[클라이언트 A]          [클라이언트 B - 수신자]
    │                        │
    │ 6. on('message:receive')│
    │    → 메시지 화면 표시   │
    │                        │
    │                        │ 7. on('message:receive')
    │                        │    → 메시지 화면 표시
    │                        │
    │                        │ 8. on('message:notification')
    │                        │    → Header 뱃지 업데이트
    │                        │
    │                        │ 9. markMessageAsRead()
    │                        │    emit('message:read')
    │                        ↓
                        [ChatsGateway]
                             │
                             │ 10. markMessageAsRead()
                             │     → MongoDB 업데이트
                             ↓
                        [ChatsGateway]
                             │
                             │ 11. emit('message:readConfirm')
                             ↓
[클라이언트 A]          [클라이언트 B]
    │                        │
    │ 12. '읽음' 표시 업데이트│
```

### 읽지 않은 메시지 카운트 플로우

```
[Header Component]
    │
    │ 1. useEffect() - 컴포넌트 마운트
    ↓
    │ 2. fetchUnreadCount()
    │    GET /chats/unread-count
    ↓
[ChatsController]
    │
    │ 3. getUnreadCount()
    ↓
[ChatsService]
    │
    │ 4. messageModel.countDocuments()
    │    { receiverId: userId, isRead: false }
    ↓
[MongoDB]
    │
    │ 5. 카운트 결과 반환
    ↓
[Header Component]
    │
    │ 6. setUnreadCount(count)
    │    → 뱃지 업데이트

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
실시간 업데이트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Socket.IO]
    │
    │ on('message:notification') 또는
    │ on('message:readConfirm')
    ↓
[Header Component]
    │
    │ fetchUnreadCount() 재호출
    ↓
    카운트 업데이트
```

---

## 주요 학습 포인트

### 1. TypeScript 타입 일관성
- 백엔드와 프론트엔드 간 데이터 구조 일치 중요
- 인터페이스 정의를 통한 타입 안정성 확보

### 2. NestJS 라우트 설계
- 구체적 경로 → 동적 경로 순서로 정의
- 라우트 충돌 방지를 위한 명명 규칙 필요

### 3. Socket.IO 이벤트 설계
- 이벤트 네이밍 컨벤션 (`action:subject`)
- 양방향 통신과 단방향 알림 구분

### 4. MongoDB Aggregation
- 복잡한 쿼리는 Aggregation Pipeline 활용
- 성능을 위한 인덱스 설계 고려

### 5. React 상태 관리
- Socket 이벤트와 React state의 동기화
- useEffect cleanup을 통한 메모리 누수 방지

---

## 체크리스트

### 개발 환경 검증
- [ ] Socket.IO 클라이언트/서버 버전 호환성
- [ ] CORS 설정 확인
- [ ] 환경변수 설정 (NEXT_PUBLIC_API_URL)
- [ ] MongoDB 연결 상태

### 기능 테스트
- [ ] 메시지 전송 → 즉시 화면 업데이트
- [ ] 프로필 사진 정상 표시 (카카오/일반 사용자)
- [ ] 읽지 않은 메시지 카운트 실시간 업데이트
- [ ] 채팅방 입장 시 자동 읽음 처리
- [ ] 다중 탭에서 동시 접속 테스트

### 성능 최적화
- [ ] Socket 이벤트 리스너 cleanup
- [ ] 불필요한 API 호출 방지
- [ ] 메시지 목록 가상화 (대량 메시지 처리)
- [ ] 이미지 lazy loading

---

## 참고 자료

- [Socket.IO 공식 문서](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- [Next.js 환경변수](https://nextjs.org/docs/basic-features/environment-variables)
