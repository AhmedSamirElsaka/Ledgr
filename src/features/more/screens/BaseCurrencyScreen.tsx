import {useCallback, useEffect, useState} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {Icon} from '../../../design/icons/Icon';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {FormSection} from '../../../design/primitives/FormSection';
import {ListRow} from '../../../design/primitives/ListRow';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {CURRENCIES, isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {MoreStackChrome} from '../components/MoreStackChrome';

const CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function BaseCurrencyScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const repos = useRepos();
  const [current, setCurrent] = useState<CurrencyCode>('EGP');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(() => {
    setStatus('loading');
    return repos.settings
      .get('base_currency')
      .then(v => {
        if (v && isCurrencyCode(v)) {
          setCurrent(v);
        }
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [repos]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <MoreStackChrome>
      <FormSection
        title={t('baseCurrency.sectionTitle')}
        description={t('baseCurrency.body')}>
        {status === 'loading' ? (
          <View style={{gap: theme.space[2]}}>
            <Skeleton height={64} radius="lg" />
            <Skeleton height={64} radius="lg" />
            <Skeleton height={64} radius="lg" />
          </View>
        ) : null}
        {status === 'error' ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.loadFailed')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              load().catch(() => undefined);
            }}
          />
        ) : null}
        {status === 'ready' ? (
          <View style={{gap: theme.space[2]}}>
            {CODES.map(code => (
              <ListRow
                key={code}
                title={code}
                subtitle={CURRENCIES[code].symbol}
                icon="Banknote"
                showDisclosure={false}
                trailing={
                  current === code ? (
                    <Icon name="Check" size={20} color={theme.colors.accent.primary} />
                  ) : null
                }
                onPress={() => {
                  repos.settings
                    .set('base_currency', code)
                    .then(() => {
                      setCurrent(code);
                      hapticSuccess();
                    })
                    .catch(() => hapticWarning());
                }}
              />
            ))}
          </View>
        ) : null}
      </FormSection>
    </MoreStackChrome>
  );
}
