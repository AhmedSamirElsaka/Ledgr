import {useTranslation} from 'react-i18next';

import {FilterChipSection} from './FilterChipSection';

type EntityOption = {id: string; name: string};

type FilterEntitySectionProps = {
  label: string;
  entities: readonly EntityOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function FilterEntitySection({
  label,
  entities,
  selectedId,
  onSelect,
}: FilterEntitySectionProps) {
  const {t} = useTranslation();

  return (
    <FilterChipSection
      label={label}
      options={[
        {id: null as string | null, label: t('activity.any')},
        ...entities.map(e => ({id: e.id, label: e.name})),
      ]}
      selected={selectedId}
      onSelect={onSelect}
      keyFn={option => option.id ?? 'any'}
    />
  );
}
