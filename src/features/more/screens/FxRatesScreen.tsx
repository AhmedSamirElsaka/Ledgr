import {RefreshControl, View} from 'react-native';

import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {ListRow} from '../../../design/primitives/ListRow';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  MoreListStatusBody,
  MoreRefreshBanner,
} from '../components/MoreListStates';
import {useFxRatesScreen} from '../hooks/useFxRatesScreen';

export function FxRatesScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {
    rates,
    status,
    refreshing,
    refreshError,
    onRefresh,
    onRetry,
    dismissRefreshError,
    base,
    quote,
    setQuote,
    rateText,
    setRateText,
    saving,
    codes,
    onSave,
    onRemove,
  } = useFxRatesScreen();

  return (
    <ScreenBackdrop washHeight={220}>
      <FlashList
        style={{flex: 1}}
        data={status === 'ready' || rates.length > 0 ? rates : []}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
          />
        }
        ItemSeparatorComponent={ListItemSeparator}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{gap: theme.space[4], marginBottom: theme.space[3]}}>
            <MoreRefreshBanner
              visible={refreshError}
              onRetry={onRefresh}
              onDismiss={dismissRefreshError}
            />
            <Text variant="body" color="secondary">
              {t('fxRatesScreen.intro')}
            </Text>
            <FormSection
              title={t('fxRatesScreen.quoteLabel', {quote, base})}
              description={t('fxRatesScreen.rateLabel', {base, quote})}>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
                {codes
                  .filter(c => c !== base)
                  .map(c => (
                    <Button
                      key={c}
                      label={c}
                      variant={quote === c ? 'primary' : 'secondary'}
                      onPress={() => setQuote(c)}
                    />
                  ))}
              </View>
              <Input
                label={t('fxRatesScreen.rateLabel', {base, quote})}
                value={rateText}
                onChangeText={setRateText}
                keyboardType="decimal-pad"
              />
              <Button
                label={t('fxRatesScreen.saveRate')}
                fullWidth
                loading={saving}
                onPress={() => {
                  onSave().catch(() => undefined);
                }}
              />
            </FormSection>
            <Text variant="headline">{t('fxRatesScreen.savedRates')}</Text>
          </View>
        }
        ListEmptyComponent={
          <MoreListStatusBody
            status={status}
            itemCount={rates.length}
            onRetry={onRetry}
            empty={
              <EmptyState
                title={t('fxRatesScreen.emptyTitle')}
                description={t('fxRatesScreen.emptyBody')}
              />
            }
          />
        }
        renderItem={({item}) => (
          <ListRow
            title={t('fxRatesScreen.rateLine', {
              quote: item.quote_currency,
              rate: item.rate,
              base: item.base_currency,
            })}
            icon="ArrowLeftRight"
            showDisclosure={false}
            trailing={
              <Button
                label={t('common.remove')}
                variant="ghost"
                onPress={() => onRemove(item.id)}
              />
            }
          />
        )}
      />
    </ScreenBackdrop>
  );
}
