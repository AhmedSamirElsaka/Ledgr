import {MORE_MENU_GROUPS} from '../components/moreMenuRows';

describe('MORE_MENU_GROUPS', () => {
  it('exposes Stage 3–4 destinations used by More search', () => {
    const routes = MORE_MENU_GROUPS.flatMap(group =>
      group.rows.map(row => row.route),
    );
    expect(routes).toEqual(
      expect.arrayContaining([
        'RecurringRules',
        'BackupExport',
        'NotificationsSettings',
        'SecuritySettings',
        'Trash',
        'MerchantAliases',
      ]),
    );
  });

  it('keeps unique routes so search results do not duplicate destinations', () => {
    const routes = MORE_MENU_GROUPS.flatMap(group =>
      group.rows.map(row => row.route),
    );
    expect(new Set(routes).size).toBe(routes.length);
  });
});
