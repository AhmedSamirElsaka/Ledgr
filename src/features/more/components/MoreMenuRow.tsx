import type {ReactNode} from 'react';

import {useTranslation} from 'react-i18next';

import {Card} from '../../../design/primitives/Card';
import {ListRow} from '../../../design/primitives/ListRow';

import type {MoreMenuRow as MoreMenuRowData} from './moreMenuRows';

type MoreMenuRowProps = {
  row: MoreMenuRowData;
  onPress: () => void;
  showSeparator?: boolean;
};

export function MoreMenuRow({row, onPress}: MoreMenuRowProps) {
  const {t} = useTranslation();
  const title = t(row.titleKey);
  const subtitle = t(row.subtitleKey);

  return (
    <ListRow
      variant="inset"
      icon={row.icon}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      accessibilityLabel={title}
    />
  );
}

type MoreMenuGroupCardProps = {
  children: ReactNode;
};

/** Elevated group shell for menu rows with shared hairline separators. */
export function MoreMenuGroupCard({children}: MoreMenuGroupCardProps) {
  return (
    <Card padded={false}>
      {children}
    </Card>
  );
}
