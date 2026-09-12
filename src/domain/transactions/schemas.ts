import {z} from 'zod';

export const transactionTypeSchema = z.enum(['expense', 'income', 'transfer']);

/** Zod issue messages are i18n keys under `add.*` — translate at the UI boundary. */
export const addTransactionSchema = z
  .object({
    type: transactionTypeSchema,
    amountMinor: z.number().int().positive('add.validationAmount'),
    accountId: z.string().min(1, 'add.validationAccount'),
    toAccountId: z.string().optional(),
    categoryId: z.string().nullable().optional(),
    note: z.string().max(500).optional(),
    occurredAt: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.type !== 'transfer' && !value.categoryId) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'add.validationCategory',
      });
    }
    if (value.type === 'transfer') {
      if (!value.toAccountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['toAccountId'],
          message: 'add.validationDestination',
        });
      } else if (value.toAccountId === value.accountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['toAccountId'],
          message: 'add.validationAccountsDiffer',
        });
      }
    }
  });

export type AddTransactionForm = z.infer<typeof addTransactionSchema>;
