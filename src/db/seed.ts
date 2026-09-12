import {createId, nowIso} from '../lib/id';

import {seedSmsRulesIfNeeded} from './seedSmsRules';

import type {SqlDatabase} from './types';

type SeedCategory = {
  name: string;
  icon: string;
  color: string;
  kind: 'expense' | 'income';
  children?: Array<{name: string; icon: string; color: string}>;
};

/** Full personal-finance category tree used by SMS review + analytics. */
export const DEFAULT_CATEGORIES: SeedCategory[] = [
  {
    name: 'Food & Drink',
    icon: 'Utensils',
    color: '#E07A3D',
    kind: 'expense',
    children: [
      {name: 'Groceries', icon: 'ShoppingCart', color: '#E07A3D'},
      {name: 'Restaurants', icon: 'Coffee', color: '#E07A3D'},
      {name: 'Coffee & snacks', icon: 'Coffee', color: '#E07A3D'},
      {name: 'Delivery', icon: 'ShoppingBag', color: '#E07A3D'},
    ],
  },
  {
    name: 'Transport',
    icon: 'Car',
    color: '#2A6F9E',
    kind: 'expense',
    children: [
      {name: 'Fuel', icon: 'Fuel', color: '#2A6F9E'},
      {name: 'Ride share', icon: 'CarTaxiFront', color: '#2A6F9E'},
      {name: 'Parking', icon: 'Car', color: '#2A6F9E'},
      {name: 'Public transit', icon: 'Car', color: '#2A6F9E'},
    ],
  },
  {
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#6B5CAD',
    kind: 'expense',
    children: [
      {name: 'Clothes', icon: 'ShoppingBag', color: '#6B5CAD'},
      {name: 'Electronics', icon: 'ShoppingBag', color: '#6B5CAD'},
      {name: 'Online marketplaces', icon: 'ShoppingBag', color: '#6B5CAD'},
    ],
  },
  {
    name: 'Bills & Utilities',
    icon: 'Receipt',
    color: '#B87600',
    kind: 'expense',
    children: [
      {name: 'Electricity', icon: 'Zap', color: '#B87600'},
      {name: 'Water', icon: 'Receipt', color: '#B87600'},
      {name: 'Internet & mobile', icon: 'Receipt', color: '#B87600'},
      {name: 'Gas', icon: 'Fuel', color: '#B87600'},
    ],
  },
  {
    name: 'Housing',
    icon: 'Home',
    color: '#4A5C62',
    kind: 'expense',
    children: [
      {name: 'Rent', icon: 'Home', color: '#4A5C62'},
      {name: 'Maintenance', icon: 'Home', color: '#4A5C62'},
      {name: 'Furniture', icon: 'Home', color: '#4A5C62'},
    ],
  },
  {
    name: 'Health',
    icon: 'HeartPulse',
    color: '#C23B2E',
    kind: 'expense',
    children: [
      {name: 'Pharmacy', icon: 'HeartPulse', color: '#C23B2E'},
      {name: 'Clinic & dentist', icon: 'HeartPulse', color: '#C23B2E'},
      {name: 'Insurance', icon: 'Shield', color: '#C23B2E'},
    ],
  },
  {
    name: 'Entertainment',
    icon: 'Clapperboard',
    color: '#0F8F8A',
    kind: 'expense',
    children: [
      {name: 'Streaming', icon: 'Clapperboard', color: '#0F8F8A'},
      {name: 'Games', icon: 'Clapperboard', color: '#0F8F8A'},
      {name: 'Events', icon: 'Clapperboard', color: '#0F8F8A'},
    ],
  },
  {
    name: 'Personal',
    icon: 'User',
    color: '#7A8B91',
    kind: 'expense',
    children: [
      {name: 'Care & salon', icon: 'User', color: '#7A8B91'},
      {name: 'Subscriptions', icon: 'Calendar', color: '#7A8B91'},
      {name: 'Education', icon: 'BookOpen', color: '#7A8B91'},
      {name: 'Gym & fitness', icon: 'HeartPulse', color: '#7A8B91'},
    ],
  },
  {
    name: 'Family & Kids',
    icon: 'Users',
    color: '#C45C8A',
    kind: 'expense',
    children: [
      {name: 'School', icon: 'BookOpen', color: '#C45C8A'},
      {name: 'Childcare', icon: 'Users', color: '#C45C8A'},
      {name: 'Toys & activities', icon: 'Gift', color: '#C45C8A'},
    ],
  },
  {
    name: 'Travel',
    icon: 'Plane',
    color: '#3D8B9C',
    kind: 'expense',
    children: [
      {name: 'Flights', icon: 'Plane', color: '#3D8B9C'},
      {name: 'Hotels', icon: 'Home', color: '#3D8B9C'},
      {name: 'Visa & fees', icon: 'Receipt', color: '#3D8B9C'},
    ],
  },
  {name: 'Gifts & Donations', icon: 'Gift', color: '#A06B4F', kind: 'expense'},
  {name: 'Fees & ATM', icon: 'Landmark', color: '#8FA0A6', kind: 'expense'},
  {name: 'Transfers', icon: 'ArrowLeftRight', color: '#8FA0A6', kind: 'expense'},
  {name: 'Other', icon: 'Ellipsis', color: '#A3B0B5', kind: 'expense'},
  {
    name: 'Income',
    icon: 'Banknote',
    color: '#1B7F5A',
    kind: 'income',
    children: [
      {name: 'Salary', icon: 'Banknote', color: '#1B7F5A'},
      {name: 'Freelance', icon: 'Briefcase', color: '#1B7F5A'},
      {name: 'Investments', icon: 'TrendingUp', color: '#1B7F5A'},
      {name: 'Refunds', icon: 'RotateCcw', color: '#1B7F5A'},
      {name: 'Other income', icon: 'PlusCircle', color: '#1B7F5A'},
    ],
  },
];

async function insertCategoryTree(db: SqlDatabase, stamped: string): Promise<void> {
  let sort = 0;
  await db.transaction(async tx => {
    for (const category of DEFAULT_CATEGORIES) {
      const parentId = createId();
      await tx.execute(
        `INSERT INTO categories (
          id, name, icon, color, kind, parent_id, sort_order, archived, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, ?, 0, ?, ?)`,
        [
          parentId,
          category.name,
          category.icon,
          category.color,
          category.kind,
          sort++,
          stamped,
          stamped,
        ],
      );

      for (const child of category.children ?? []) {
        await tx.execute(
          `INSERT INTO categories (
            id, name, icon, color, kind, parent_id, sort_order, archived, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          [
            createId(),
            child.name,
            child.icon,
            child.color,
            category.kind,
            parentId,
            sort++,
            stamped,
            stamped,
          ],
        );
      }
    }
  });
}

export async function seedIfNeeded(db: SqlDatabase): Promise<void> {
  const flag = await db.execute(`SELECT value FROM settings WHERE key = ?`, [
    'seed.categories.v1',
  ]);
  if (flag.rows.length === 0) {
    const stamped = nowIso();
    await insertCategoryTree(db, stamped);
    await db.execute(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
      'seed.categories.v1',
      '1',
      stamped,
    ]);
    await db.execute(
      `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      ['base_currency', 'EGP', stamped],
    );
    await db.execute(
      `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      ['onboarding.completed', '0', stamped],
    );
  }

  // Upgrade path: expand catalog once for installs that already had v1.
  const v2 = await db.execute(`SELECT value FROM settings WHERE key = ?`, [
    'seed.categories.v2',
  ]);
  if (v2.rows.length === 0) {
    const stamped = nowIso();
    const existingParents = await db.execute(
      `SELECT id, name FROM categories WHERE parent_id IS NULL AND archived = 0`,
    );
    const parentByName = new Map(
      existingParents.rows.map(row => [String(row.name), String(row.id)]),
    );
    const existingChildren = await db.execute(
      `SELECT name, parent_id FROM categories WHERE parent_id IS NOT NULL AND archived = 0`,
    );
    const childKeys = new Set(
      existingChildren.rows.map(row => `${String(row.parent_id)}\0${String(row.name)}`),
    );
    const sortRow = await db.execute(`SELECT MAX(sort_order) AS m FROM categories`);
    let sort = Number(sortRow.rows[0]?.m ?? 0) + 1;

    await db.transaction(async tx => {
      for (const category of DEFAULT_CATEGORIES) {
        let parentId = parentByName.get(category.name);
        if (!parentId) {
          parentId = createId();
          await tx.execute(
            `INSERT INTO categories (
              id, name, icon, color, kind, parent_id, sort_order, archived, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NULL, ?, 0, ?, ?)`,
            [
              parentId,
              category.name,
              category.icon,
              category.color,
              category.kind,
              sort++,
              stamped,
              stamped,
            ],
          );
          parentByName.set(category.name, parentId);
        }
        for (const child of category.children ?? []) {
          const key = `${parentId}\0${child.name}`;
          if (childKeys.has(key)) {
            continue;
          }
          await tx.execute(
            `INSERT INTO categories (
              id, name, icon, color, kind, parent_id, sort_order, archived, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [
              createId(),
              child.name,
              child.icon,
              child.color,
              category.kind,
              parentId,
              sort++,
              stamped,
              stamped,
            ],
          );
          childKeys.add(key);
        }
      }
      await tx.execute(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
        'seed.categories.v2',
        '1',
        stamped,
      ]);
    });
  }

  await seedSmsRulesIfNeeded(db);
}
