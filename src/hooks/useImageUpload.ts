import { useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import { createElement } from 'react';
import type { ICommand } from '@uiw/react-md-editor';
import { useUploadImageApiV1ImagesPost } from '@/api/generated/image/image';
import { useToast } from '@/components/common/Toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PLACEHOLDER = '![업로드 중...]()';

interface UseImageUploadOptions {
  content: string;
  onContentChange: (val: string) => void;
  editorWrapRef: React.RefObject<HTMLDivElement | null>;
}

export function useImageUpload({ content, onContentChange, editorWrapRef }: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // mutateAsync만 ref로 추적하여 의존성 체인 안정화
  const { mutateAsync } = useUploadImageApiV1ImagesPost();
  const mutateAsyncRef = useRef(mutateAsync);
  mutateAsyncRef.current = mutateAsync;

  const getInsertPosition = useCallback((): number => {
    const textarea = editorWrapRef.current?.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input');
    return textarea?.selectionStart ?? contentRef.current.length;
  }, [editorWrapRef]);

  const uploadAndInsert = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast('error', '이미지 파일만 업로드할 수 있습니다.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast('error', '이미지 크기는 10MB 이하만 가능합니다.');
        return;
      }

      setUploading(true);

      // 커서 위치에 플레이스홀더 삽입
      const pos = getInsertPosition();
      const before = contentRef.current.slice(0, pos);
      const after = contentRef.current.slice(pos);
      const withPlaceholder = before + PLACEHOLDER + after;
      onContentChange(withPlaceholder);

      try {
        const result = await mutateAsyncRef.current({ data: { file } });
        const imageUrl = `${BASE_URL}/api/v1/images/${result.id}`;
        const markdownImage = `![${file.name}](${imageUrl})`;

        // 플레이스홀더를 실제 이미지 마크다운으로 교체
        const current = contentRef.current;
        const placeholderIndex = current.indexOf(PLACEHOLDER);
        if (placeholderIndex !== -1) {
          const updated =
            current.slice(0, placeholderIndex) + markdownImage + current.slice(placeholderIndex + PLACEHOLDER.length);
          onContentChange(updated);
        } else {
          // 플레이스홀더를 찾지 못한 경우 끝에 추가
          onContentChange(current + '\n' + markdownImage);
        }
      } catch {
        // 플레이스홀더 제거
        const current = contentRef.current;
        const placeholderIndex = current.indexOf(PLACEHOLDER);
        if (placeholderIndex !== -1) {
          const cleaned = current.slice(0, placeholderIndex) + current.slice(placeholderIndex + PLACEHOLDER.length);
          onContentChange(cleaned);
        }
        toast('error', '이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [getInsertPosition, onContentChange, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      // 파일 드롭 시 항상 기본 동작 방지 (브라우저가 파일을 열지 않도록)
      e.preventDefault();
      e.stopPropagation();
      const imageFile = files.find((f) => f.type.startsWith('image/'));
      if (imageFile) uploadAndInsert(imageFile);
    },
    [uploadAndInsert],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) uploadAndInsert(file);
    },
    [uploadAndInsert],
  );

  // useMemo로 안정화하여 MDEditor 커맨드 상태 리셋 방지
  const imageCommand: ICommand = useMemo(
    () => ({
      name: 'image-upload',
      keyCommand: 'image-upload',
      buttonProps: { 'aria-label': '이미지 업로드', title: '이미지 업로드' },
      icon: createElement(
        'svg',
        {
          width: 12,
          height: 12,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        createElement('path', {
          d: 'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
        }),
      ),
      execute: () => {
        fileInputRef.current?.click();
      },
    }),
    [],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      uploadAndInsert(files[0]);
      // input 값 리셋 (같은 파일 재선택 가능)
      e.target.value = '';
    },
    [uploadAndInsert],
  );

  const fileInputEl: ReactNode = createElement('input', {
    ref: fileInputRef,
    type: 'file',
    accept: 'image/*',
    style: { display: 'none' },
    onChange: handleFileSelect,
  });

  return {
    handleDrop,
    handlePaste,
    imageCommand,
    uploading,
    fileInputEl,
  };
}
