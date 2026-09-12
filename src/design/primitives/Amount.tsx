import {formatMoney, type FormatMoneyOptions, type Money} from '../../domain/money/Money';
import {useTheme} from '../theme/ThemeProvider';

import {Text, type AppTextProps} from './Text';

export type AmountProps = {
  value: Money;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'income' | 'expense' | 'muted' | 'onHero';
  signed?: boolean;
  formatOptions?: Omit<FormatMoneyOptions, 'signed'>;
  accessibilityLabel?: string;
};

export function Amount({
  value,
  size = 'md',
  tone = 'default',
  signed = false,
  formatOptions,
  accessibilityLabel,
}: AmountProps) {
  const {theme} = useTheme();
  const variant =
    size === 'lg' ? 'amountLg' : size === 'sm' ? 'amountSm' : 'amountMd';

  let color: AppTextProps['color'] = 'primary';
  let overrideColor: string | undefined;
  if (tone === 'income') {
    color = 'positive';
  } else if (tone === 'expense') {
    color = 'negative';
  } else if (tone === 'muted') {
    color = 'secondary';
  } else if (tone === 'onHero') {
    color = 'inverse';
    overrideColor = theme.colors.hero.text;
  } else if (value.amountMinor < 0) {
    color = 'negative';
  }

  const formatted = formatMoney(value, {...formatOptions, signed});

  return (
    <Text
      variant={variant}
      color={color}
      tabular
      accessibilityLabel={accessibilityLabel ?? formatted}
      style={overrideColor ? {color: overrideColor} : undefined}>
      {formatted}
    </Text>
  );
}
