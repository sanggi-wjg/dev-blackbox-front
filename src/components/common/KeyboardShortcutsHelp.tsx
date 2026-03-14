import Modal from './Modal';

interface Shortcut {
  keys: string[];
  description: string;
}

const GLOBAL_SHORTCUTS: Shortcut[] = [{ keys: ['?'], description: '키보드 단축키 도움말' }];

const WORKBOARD_SHORTCUTS: Shortcut[] = [{ keys: ['n'], description: '새 태스크 추가' }];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Modal open={open} onClose={onClose} title="키보드 단축키" size="sm">
      <div className="flex flex-col gap-4">
        <ShortcutSection title="전역" shortcuts={GLOBAL_SHORTCUTS} />
        <ShortcutSection title="업무 보드" shortcuts={WORKBOARD_SHORTCUTS} />
      </div>
    </Modal>
  );
}

function ShortcutSection({ title, shortcuts }: { title: string; shortcuts: Shortcut[] }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</h4>
      <div className="flex flex-col gap-1.5">
        {shortcuts.map((s) => (
          <div key={s.description} className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">{s.description}</span>
            <div className="flex gap-1">
              {s.keys.map((key) => (
                <kbd
                  key={key}
                  className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-border-primary bg-surface-secondary px-1.5 py-0.5 text-xs font-medium text-text-secondary"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
