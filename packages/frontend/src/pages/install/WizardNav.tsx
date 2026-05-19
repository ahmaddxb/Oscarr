import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface Props {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  backDisabled?: boolean;
}

/**
 * Floating wizard nav — sits in the bottom-right of the viewport so step content can scroll
 * unobstructed and the nav stays at thumb-reach. Pill buttons with label + arrow.
 */
export function WizardNav({ onBack, onNext, nextDisabled, nextLoading, backDisabled }: Readonly<Props>) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          className={clsx(
            'h-11 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-black/40',
            'bg-ndp-surface border border-white/10 text-ndp-text-muted',
            'hover:bg-ndp-surface-light hover:text-ndp-text disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className={clsx(
            'h-11 px-5 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-ndp-accent/40',
            'bg-ndp-accent text-white hover:bg-ndp-accent-hover',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-black/40',
          )}
        >
          {t('common.next')}
          {nextLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
