import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {IconButton} from '../../../design/primitives/IconButton';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';

import type {TransactionTemplate} from '../../../lib/transactionTemplates';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

type AddTransactionTemplatesProps = {
  templates: TransactionTemplate[];
  canSave: boolean;
  onApply: (template: TransactionTemplate) => void;
  onSaveCurrent: () => void;
  onDelete: (id: string) => void;
};

export function AddTransactionTemplates({
  templates,
  canSave,
  onApply,
  onSaveCurrent,
  onDelete,
}: AddTransactionTemplatesProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <View style={{gap: theme.space[3]}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space[2],
        }}>
        <View style={{flex: 1, gap: theme.space[1]}}>
          <Text variant="label" color="tertiary">
            {t('templates.section')}
          </Text>
          <Text variant="caption" color="secondary">
            {t('templates.privacy')}
          </Text>
        </View>
        <Button
          label={t('templates.saveCurrent')}
          variant="secondary"
          disabled={!canSave}
          onPress={onSaveCurrent}
        />
      </View>

      {templates.length === 0 ? (
        <Text variant="body" color="secondary">
          {t('templates.emptyBody')}
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: theme.space[2]}}>
          {templates.map(template => (
            <View
              key={template.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
                backgroundColor: theme.colors.surface.raised,
                borderRadius: theme.radius.lg,
                paddingStart: theme.space[3],
                ...theme.elevation[1],
              }}>
              <Pressable
                onPress={() => onApply(template)}
                accessibilityLabel={t('templates.applyA11y', {
                  name: template.name,
                })}
                style={{
                  paddingVertical: theme.space[3],
                  paddingEnd: theme.space[2],
                  gap: theme.space[1],
                  minWidth: 120,
                }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {template.name}
                </Text>
                <Amount
                  value={money(
                    template.amountMinor,
                    asCurrency(template.currency),
                  )}
                  size="sm"
                />
              </Pressable>
              <IconButton
                name="X"
                accessibilityLabel={t('templates.deleteA11y', {
                  name: template.name,
                })}
                onPress={() => onDelete(template.id)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
