'use client';

import { useEffect } from 'react';

interface BlockConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  isLoading?: boolean;
}

/**
 * 인스타그램 스타일의 차단 확인 모달
 *
 * 사용자를 차단할 때 확인을 요청하는 모달입니다.
 * - 차단 시 게시글, 댓글, 채팅이 모두 차단됨을 알립니다.
 * - 차단당한 사용자는 눈치채지 못합니다.
 */
export default function BlockConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  username,
  isLoading = false,
}: BlockConfirmModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden animate-modal-slide-up">
        {/* 헤더 */}
        <div className="px-6 pt-8 pb-4 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {username}님을 차단하시겠어요?
          </h3>
          <p className="text-sm text-gray-500">
            차단하면 다음과 같은 제한이 적용됩니다
          </p>
        </div>

        {/* 차단 효과 설명 */}
        <div className="px-6 pb-6">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>이 사용자의 게시글과 댓글이 보이지 않습니다</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>이 사용자와 채팅을 주고받을 수 없습니다</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>이 사용자도 회원님의 게시글과 댓글을 볼 수 없습니다</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span className="text-gray-500 italic">
                이 사용자는 차단되었다는 사실을 알 수 없습니다
              </span>
            </li>
          </ul>
        </div>

        {/* 버튼 그룹 */}
        <div className="border-t border-gray-200">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3.5 text-red-600 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-200"
          >
            {isLoading ? '차단 중...' : '차단'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3.5 text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-modal-slide-up {
          animation: modal-slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
