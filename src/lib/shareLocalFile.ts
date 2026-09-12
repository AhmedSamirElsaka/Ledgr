import {Platform} from 'react-native';

import Share from 'react-native-share';

/** Share an on-device file via the system sheet — never uploads. */
export async function shareLocalFile(
  path: string,
  type: string,
  filename: string,
): Promise<void> {
  await Share.open({
    url: Platform.OS === 'android' ? `file://${path}` : path,
    type,
    filename,
    failOnCancel: false,
  });
}
