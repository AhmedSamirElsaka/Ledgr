import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

type ChartProseSummaryProps = {
  summary: string;
  accessibilityHint?: string;
  /** When true, render muted empty/single-state copy without competing with the title. */
  muted?: boolean;
};

/** Visible prose + accessible summary for chart sections (not decorative motion). */
export function ChartProseSummary({
  summary,
  accessibilityHint,
  muted = false,
}: ChartProseSummaryProps) {
  const {theme} = useTheme();

  return (
    <Text
      variant="body"
      color={muted ? 'tertiary' : 'secondary'}
      accessible
      accessibilityRole="text"
      accessibilityLabel={summary}
      accessibilityHint={accessibilityHint}
      style={{marginTop: theme.space[2]}}>
      {summary}
    </Text>
  );
}
