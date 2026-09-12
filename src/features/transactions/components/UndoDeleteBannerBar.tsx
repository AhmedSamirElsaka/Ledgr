import {View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {useUndoDeleteBanner} from '../hooks/undoDeleteBanner';

type UndoDeleteBannerBarProps = {
  /** Extra bottom offset when a bulk bar or FAB is present. */
  bottomOffset?: number;
};

export function UndoDeleteBannerBar({bottomOffset = 0}: UndoDeleteBannerBarProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const {offer, undo} = useUndoDeleteBanner(repos);

  if (!offer) {
    return null;
  }

  const message =
    offer.count === 1
      ? t('activity.undoOne')
      : t('activity.undoMany', {count: offer.count});

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: theme.space[4],
        right: theme.space[4],
        bottom: insets.bottom + theme.space[3] + bottomOffset,
      }}>
      <FeedbackBanner
        message={message}
        tone="info"
        actionLabel={t('common.undo')}
        onAction={() => {
          undo().catch(() => undefined);
        }}
      />
    </View>
  );
}
