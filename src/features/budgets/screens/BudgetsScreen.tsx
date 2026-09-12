import {useCallback} from 'react';

import {View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList, type ListRenderItem} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {BudgetListRow} from '../components/BudgetListRow';
import {useBudgetsScreen} from '../hooks/useBudgetsScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {BudgetListItem} from '../hooks/useBudgetsScreen';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function BudgetsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const {items, loadState, refreshing, onRefresh, onRetry} = useBudgetsScreen();

  const onPressBudget = useCallback(
    (id: string) => {
      navigation.navigate('BudgetForm', {id});
    },
    [navigation],
  );

  const renderItem = useCallback<ListRenderItem<BudgetListItem>>(
    ({item}) => <BudgetListRow item={item} onPress={onPressBudget} />,
    [onPressBudget],
  );

  return (
    <ScreenBackdrop washHeight={220}>
      {loadState === 'loading' ? (
        <View style={{padding: theme.space[4], gap: theme.space[3]}}>
          <Skeleton height={48} radius="lg" />
          <Skeleton height={88} radius="lg" />
          <Skeleton height={88} radius="lg" />
        </View>
      ) : loadState === 'error' && items.length === 0 ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={t('common.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={onRetry}
        />
      ) : (
        <FlashList
          style={{flex: 1}}
          data={items}
          keyExtractor={item => item.budget.id}
          drawDistance={250}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            padding: theme.space[4],
            paddingBottom: insets.bottom + theme.space[8],
            flexGrow: 1,
          }}
          ListHeaderComponent={
            <View style={{marginBottom: theme.space[3]}}>
              <Button
                label={t('budgetsScreen.create')}
                onPress={() => navigation.navigate('BudgetForm')}
                fullWidth
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={t('budgetsScreen.emptyTitle')}
              description={t('budgetsScreen.emptyBody')}
              actionLabel={t('budgetsScreen.create')}
              onAction={() => navigation.navigate('BudgetForm')}
              illustration={
                <EmptyIllustration name="Target" secondaryName="Plus" />
              }
            />
          }
          renderItem={renderItem}
        />
      )}
    </ScreenBackdrop>
  );
}
