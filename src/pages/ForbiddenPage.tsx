import { useNavigate } from 'react-router';
import Button from '@/components/common/Button';
import { ArrowLeftIcon } from '@/components/icons';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-8xl font-bold text-danger-100">403</p>
      <h2 className="text-lg font-semibold text-text-primary">접근 권한이 없습니다</h2>
      <p className="text-sm text-text-secondary">이 페이지는 관리자만 접근할 수 있습니다.</p>
      <Button
        variant="primary"
        onClick={() => navigate('/')}
        icon={<ArrowLeftIcon className="h-4 w-4" />}
        className="mt-2"
      >
        대시보드로 이동
      </Button>
    </div>
  );
}
