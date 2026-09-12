import {useTranslation} from 'react-i18next';

import {Card} from '../../../design/primitives/Card';
import {ListRow} from '../../../design/primitives/ListRow';

type HomeMonthReviewTeaserProps = {
  onOpenInsights: () => void;
};

/** Quiet Home row that opens Insights month-in-review. */
export function HomeMonthReviewTeaser({
  onOpenInsights,
}: HomeMonthReviewTeaserProps) {
  const {t} = useTranslation();

  return (
    <Card padded={false}>
      <ListRow
        variant="inset"
        icon="ChartPie"
        title={t('home.monthReviewTitle')}
        subtitle={t('home.monthReviewSubtitle')}
        onPress={onOpenInsights}
        accessibilityLabel={t('home.monthReviewA11y')}
        accessibilityHint={t('home.monthReviewHint')}
      />
    </Card>
  );
}
