'use client';

import { useState } from 'react';
import { Comment } from '@/types/comment';
import { useAuth } from '@/contexts/AuthContext';
import CommentForm from './CommentForm';

const API_URL = 'http://localhost:3000';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
  onCommentDeleted: () => void;
  onCommentUpdated: () => void;
  onReplyAdded: () => void;
}

export default function CommentItem({
  comment,
  postId,
  isReply = false,
  onCommentDeleted,
  onCommentUpdated,
  onReplyAdded,
}: CommentItemProps) {
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user && comment.author && comment.author.id === user.id;

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`${API_URL}/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('댓글 수정에 실패했습니다.');
      }

      setIsEditing(false);
      onCommentUpdated();
    } catch (err) {
      alert('댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('댓글 삭제에 실패했습니다.');
      }

      onCommentDeleted();
    } catch (err) {
      alert('댓글 삭제 중 오류가 발생했습니다.');
      setDeleting(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="p-6">
        <div className="flex items-start gap-3">
          {comment.author?.profileImage ? (
            <img
              src={`${API_URL}${comment.author.profileImage}`}
              alt={comment.author.username}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {comment.author?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">
                {comment.author?.username || '알 수 없음'}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
              {comment.createdAt !== comment.updatedAt && (
                <span className="text-xs text-gray-400">(수정됨)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:bg-gray-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {updating ? '수정 중...' : '수정'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-800 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  {!isReply && (
                    <button
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      답글
                    </button>
                  )}

                  {isAuthor && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleting ? '삭제 중...' : '삭제'}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {showReplyForm && !isReply && (
          <div className="mt-4 ml-13">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCommentAdded={() => {
                setShowReplyForm(false);
                onReplyAdded();
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder="답글을 작성하세요..."
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-200">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isReply
              onCommentDeleted={onCommentDeleted}
              onCommentUpdated={onCommentUpdated}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
