'use client';

import { useEffect, useState } from 'react';
import { Comment } from '@/types/comment';
import { useAuth } from '@/contexts/AuthContext';
import { commentsApi } from '@/lib/api';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const data = await commentsApi.getComments(postId);
      setComments(data);
      setError('');
    } catch (err) {
      setError('댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, token]);

  const handleCommentAdded = () => {
    fetchComments();
  };

  const handleCommentDeleted = () => {
    fetchComments();
  };

  const handleCommentUpdated = () => {
    fetchComments();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">
          댓글 {comments.length}개
        </h2>
      </div>

      <div className="p-6 border-b border-gray-100">
        <CommentForm
          postId={postId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {error && (
        <div className="p-6 border-b border-gray-100">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {comments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            첫 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentDeleted={handleCommentDeleted}
              onCommentUpdated={handleCommentUpdated}
              onReplyAdded={handleCommentAdded}
            />
          ))
        )}
      </div>
    </div>
  );
}
