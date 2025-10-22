'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { storiesApi } from '@/lib/api';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 스토리 업로드 모달
 * 이미지/영상 선택 및 업로드
 */
export default function StoryUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: StoryUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 확인
    let fileMediaType: 'image' | 'video';
    if (file.type.startsWith('image/')) {
      fileMediaType = 'image';
      // 이미지 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지 파일 크기는 10MB 이하여야 합니다.');
        return;
      }
    } else if (file.type.startsWith('video/')) {
      fileMediaType = 'video';
      // 영상 크기 제한 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('영상 파일 크기는 100MB 이하여야 합니다.');
        return;
      }
    } else {
      setError('이미지 또는 영상 파일만 업로드 가능합니다.');
      return;
    }

    setMediaType(fileMediaType);
    setSelectedFile(file);
    setError('');

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('파일을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      let fileToUpload = selectedFile;

      // 이미지인 경우 클라이언트 사이드 압축 적용
      if (mediaType === 'image') {
        try {
          setUploadStage('compressing');
          const options = {
            maxWidthOrHeight: 1920, // 최대 1920px 너비
            useWebWorker: true,
            initialQuality: 0.8, // 80% 품질
          };

          fileToUpload = await imageCompression(selectedFile, options);

          console.log('Image compression:', {
            originalSize: (selectedFile.size / 1024 / 1024).toFixed(2) + 'MB',
            compressedSize: (fileToUpload.size / 1024 / 1024).toFixed(2) + 'MB',
            reduction: (((selectedFile.size - fileToUpload.size) / selectedFile.size) * 100).toFixed(1) + '%',
          });
        } catch (compressionError) {
          console.warn('Image compression failed, using original file:', compressionError);
          // 압축 실패 시 원본 파일 사용
          fileToUpload = selectedFile;
        }
      }

      // FormData를 사용한 multipart/form-data 업로드
      setUploadStage('uploading');
      await storiesApi.createStory(
        fileToUpload,
        mediaType,
        undefined, // TODO: 영상 썸네일 생성 추가 예정
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // 성공
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Story upload failed:', err);
      setError(err instanceof Error ? err.message : '스토리 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStage('idle');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                스토리 추가
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 내용 */}
            <div className="p-6">
              {/* 파일 선택 영역 */}
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    이미지 또는 영상을 선택하세요
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    이미지: 최대 10MB / 영상: 최대 100MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 미리보기 */}
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    {mediaType === 'image' ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    ) : (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full h-auto max-h-96"
                      />
                    )}
                  </div>

                  {/* 파일 변경 버튼 */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    다른 파일 선택
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* 업로드 진행률 */}
              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {uploadStage === 'compressing' && '이미지 압축 중...'}
                      {uploadStage === 'uploading' && '업로드 중...'}
                    </span>
                    {uploadStage === 'uploading' && (
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {uploadProgress}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{
                        width: uploadStage === 'compressing' ? '50%' : `${uploadProgress}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                disabled={uploading}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
