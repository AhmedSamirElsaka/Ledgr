import {useCallback, useEffect, useState} from 'react';

import {View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';
import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {Pressable} from '../../../design/primitives/Pressable';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {SmsRuleRow} from '../../../db/repositories/smsRulesRepository';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type LoadState = 'loading' | 'ready' | 'error';

export function SmsRulesScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [rules, setRules] = useState<SmsRuleRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const refresh = useCallback(async () => {
    try {
      setRules(await repos.smsRules.listAll());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [repos]);

  useEffect(() => {
    refresh().catch(() => undefined);
    return subscribeTable('sms_rules', () => {
      refresh().catch(() => undefined);
    });
  }, [refresh]);

  if (loadState === 'loading' && rules.length === 0) {
    return (
      <ScreenBackdrop washHeight={220}>
        <View style={{padding: theme.space[4], gap: theme.space[3]}}>
          <Skeleton height={48} radius="md" />
          <Skeleton height={72} radius="md" />
          <Skeleton height={72} radius="md" />
        </View>
      </ScreenBackdrop>
    );
  }

  if (loadState === 'error' && rules.length === 0) {
    return (
      <ScreenBackdrop washHeight={220}>
        <ErrorState
          title={t('common.errorTitle')}
          message={t('common.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setLoadState('loading');
            refresh().catch(() => undefined);
          }}
        />
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop washHeight={220}>
      <FlashList
        style={{flex: 1}}
        data={rules}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={ListItemSeparator}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{marginBottom: theme.space[3]}}>
            <Button
              label={t('smsRules.add')}
              onPress={() => navigation.navigate('SmsRuleForm')}
              fullWidth
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('smsRules.emptyTitle')}
            description={t('smsRules.emptyBody')}
            actionLabel={t('smsRules.add')}
            onAction={() => navigation.navigate('SmsRuleForm')}
            illustration={<EmptyIllustration name="MessageSquare" />}
          />
        }
        renderItem={({item}) => (
          <Card elevated padded={false}>
            <Pressable
              onPress={() => navigation.navigate('SmsRuleForm', {id: item.id})}
              accessibilityLabel={item.name}
              style={{padding: theme.space[4]}}>
              <Text variant="bodyStrong">{item.name}</Text>
              <Text
                variant="caption"
                color="tertiary"
                style={{marginTop: theme.space[1]}}>
                {t('smsRules.priorityStatus', {
                  priority: item.priority,
                  status:
                    item.enabled === 1 ? t('smsRules.on') : t('smsRules.off'),
                })}
              </Text>
            </Pressable>
          </Card>
        )}
      />
    </ScreenBackdrop>
  );
}
