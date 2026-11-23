import { Sun } from 'lucide-react';
import { t } from '@/shared/i18n';
import { BrandHeader } from '@/shared/ui/BrandHeader';
import type { TodayViewModel } from '../today-view-model';
import { CashCard } from './CashCard';
import { DayProgram } from './DayProgram';
import { RecentExpenses } from './RecentExpenses';

/** Écran « Aujourd'hui » pendant le voyage : rendu pur à partir du view model. */
export function TodayView({ model, badge }: { model: TodayViewModel; badge?: string }) {
  return (
    <>
      <BrandHeader
        overlap
        badge={badge}
        title={model.dateLabel}
        subtitle={`${t.today.dayOf(model.dayNumber, model.totalDays)} · ${model.stopName}`}
        aside={
          model.weatherLabel && (
            <span className="flex items-center gap-1.5">
              <Sun className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
              {model.weatherLabel}
            </span>
          )
        }
      />
      <div className="relative mx-auto -mt-9 flex max-w-3xl flex-col gap-5 px-4 pb-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <CashCard cash={model.cash} day={model.day} />
        <div className="flex flex-col gap-5 lg:pt-14">
          <DayProgram entries={model.program} />
          <RecentExpenses items={model.recentExpenses} />
        </div>
      </div>
    </>
  );
}
