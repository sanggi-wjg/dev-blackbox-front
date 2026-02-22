import { useNavigate } from 'react-router';
import Button from '@/components/common/Button';
import { ArrowLeftIcon } from '@/components/icons';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-8xl font-bold text-brand-100">404</p>
      <h2 className="text-lg font-semibold text-text-primary">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Button
        variant="primary"
        onClick={() => navigate('/')}
        icon={<ArrowLeftIcon className="h-4 w-4" />}
        className="mt-2"
      >
        업무일지로 이동
      </Button>
    </div>
  );
}
