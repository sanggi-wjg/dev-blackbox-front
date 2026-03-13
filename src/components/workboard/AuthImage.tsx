import { useState, useEffect } from 'react';
import { AXIOS_INSTANCE } from '@/api/axios-instance';

const API_IMAGE_PATTERN = /\/api\/v1\/images\//;

function isApiImageUrl(src: string): boolean {
  return API_IMAGE_PATTERN.test(src);
}

export default function AuthImage({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || !isApiImageUrl(src)) return;

    const controller = new AbortController();
    // src에서 baseURL 이후의 경로만 추출 (AXIOS_INSTANCE에 baseURL이 설정되어 있으므로)
    const url = new URL(src, window.location.origin);
    const pathname = url.pathname;

    AXIOS_INSTANCE.get(pathname, { responseType: 'blob', signal: controller.signal })
      .then((res) => {
        const objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (err?.code !== 'ERR_CANCELED') setError(true);
      });

    return () => {
      controller.abort();
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [src]);

  if (!src || !isApiImageUrl(src)) {
    return <img src={src} alt={alt} {...props} />;
  }

  if (error) {
    return <span className="text-xs text-text-tertiary">이미지를 불러올 수 없습니다</span>;
  }

  if (!blobUrl) {
    return <span className="text-xs text-text-tertiary">로딩 중...</span>;
  }

  return <img src={blobUrl} alt={alt} {...props} style={{ maxWidth: '100%', ...props.style }} />;
}
