import {create} from 'zustand';

import {getPrefString, setPrefString} from '../lib/prefs';

export type PeriodFilter =
  | '7d'
  | '30d'
  | '90d'
  | 'week'
  | 'month'
  | 'year'
  | 'all'
  | 'custom';

export type MainTab = 'Home' | 'Transactions' | 'Analytics' | 'More';

type UiState = {
  period: PeriodFilter;
  setPeriod: (period: PeriodFilter) => void;
  customFrom: string;
  customTo: string;
  setCustomRange: (from: string, to: string) => void;
  selectedTab: MainTab;
  setSelectedTab: (tab: MainTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const PERIODS: PeriodFilter[] = [
  '7d',
  '30d',
  '90d',
  'week',
  'month',
  'year',
  'all',
  'custom',
];

function loadPeriod(): PeriodFilter {
  const raw = getPrefString('ui.period');
  if (raw && (PERIODS as string[]).includes(raw)) {
    return raw as PeriodFilter;
  }
  return 'month';
}

function loadTab(): MainTab {
  const raw = getPrefString('ui.lastTab');
  if (
    raw === 'Home' ||
    raw === 'Transactions' ||
    raw === 'Analytics' ||
    raw === 'More'
  ) {
    return raw;
  }
  return 'Home';
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export const useUiStore = create<UiState>(set => ({
  period: loadPeriod(),
  setPeriod: period => {
    setPrefString('ui.period', period);
    set({period});
  },
  customFrom: getPrefString('ui.customFrom') ?? monthStartKey(),
  customTo: getPrefString('ui.customTo') ?? todayKey(),
  setCustomRange: (from, to) => {
    setPrefString('ui.customFrom', from);
    setPrefString('ui.customTo', to);
    set({customFrom: from, customTo: to, period: 'custom'});
    setPrefString('ui.period', 'custom');
  },
  selectedTab: loadTab(),
  setSelectedTab: tab => {
    setPrefString('ui.lastTab', tab);
    set({selectedTab: tab});
  },
  searchQuery: '',
  setSearchQuery: query => set({searchQuery: query}),
}));
