import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold text-gray-300">404</h2>
      <p className="text-gray-500">페이지를 찾을 수 없습니다</p>
      <Link
        to="/"
        className="text-sm text-blue-600 hover:underline"
      >
        업무일지로 이동
      </Link>
    </div>
  );
}
