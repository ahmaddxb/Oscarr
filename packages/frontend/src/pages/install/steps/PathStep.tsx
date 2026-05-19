import { useTranslation } from 'react-i18next';
import { Sparkles, Import, ChevronRight } from 'lucide-react';
import { WizardNav } from '../WizardNav';

export type InstallPath = 'fresh' | 'migration';

interface Props {
  onSelect: (path: InstallPath) => void;
  onBack: () => void;
}

export default function PathStep({ onSelect, onBack }: Readonly<Props>) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-ndp-text">{t('install.path.title')}</h2>
        <p className="text-sm text-ndp-text-muted">{t('install.path.desc')}</p>
      </header>

      <div className="space-y-3">
        <PathCard
          icon={<Sparkles className="w-5 h-5" />}
          accent="ndp-accent"
          title={t('install.path.fresh_title')}
          desc={t('install.path.fresh_desc')}
          onSelect={() => onSelect('fresh')}
        />
        <PathCard
          icon={<Import className="w-5 h-5" />}
          accent="ndp-gold"
          title={t('install.path.migration_title')}
          desc={t('install.path.migration_desc')}
          onSelect={() => onSelect('migration')}
        />
      </div>

      <WizardNav onBack={onBack} />
    </div>
  );
}

interface PathCardProps {
  icon: React.ReactNode;
  accent: 'ndp-accent' | 'ndp-gold';
  title: string;
  desc: string;
  onSelect: () => void;
}

function PathCard({ icon, accent, title, desc, onSelect }: Readonly<PathCardProps>) {
  const iconBg = accent === 'ndp-accent' ? 'bg-ndp-accent/10 text-ndp-accent' : 'bg-ndp-gold/10 text-ndp-gold';
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all text-left"
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ndp-text">{title}</span>
        <span className="block text-xs text-ndp-text-dim mt-0.5 leading-snug">{desc}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-ndp-text-dim group-hover:text-ndp-text transition-colors flex-shrink-0" />
    </button>
  );
}
