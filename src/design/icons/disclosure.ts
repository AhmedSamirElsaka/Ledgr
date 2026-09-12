import type {IconName} from './Icon';

/** Forward chevron that mirrors for RTL layouts. */
export function disclosureIconName(isRtl: boolean): IconName {
  return isRtl ? 'ChevronLeft' : 'ChevronRight';
}
