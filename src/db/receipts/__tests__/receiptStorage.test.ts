import {
  absoluteReceiptPath,
  buildRelativeReceiptPath,
  collectReceiptFiles,
  isManagedReceiptPath,
  removeOrphanReceiptFiles,
} from '../receiptStorage';

const RNFS = jest.requireMock('react-native-fs') as {
  DocumentDirectoryPath: string;
  exists: jest.Mock;
  mkdir: jest.Mock;
  unlink: jest.Mock;
  readDir: jest.Mock;
  readFile: jest.Mock;
  copyFile: jest.Mock;
};

describe('receiptStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RNFS.exists.mockResolvedValue(false);
    RNFS.readDir.mockResolvedValue([]);
    RNFS.readFile.mockResolvedValue('base64data');
  });

  it('builds portable relative paths under receipts/', () => {
    expect(buildRelativeReceiptPath('tx-1', 'file:///tmp/a.PNG', 'image/png')).toBe(
      'receipts/tx-1.png',
    );
    expect(isManagedReceiptPath('receipts/tx-1.jpg')).toBe(true);
    expect(isManagedReceiptPath('../etc/passwd')).toBe(false);
    expect(absoluteReceiptPath('receipts/tx-1.jpg')).toBe(
      `${RNFS.DocumentDirectoryPath}/receipts/tx-1.jpg`,
    );
  });

  it('collects base64 bytes only for managed existing files', async () => {
    RNFS.exists.mockImplementation(async (path: string) => path.endsWith('receipts/a.jpg'));
    const files = await collectReceiptFiles(['receipts/a.jpg', 'evil/../x', null]);
    expect(files).toEqual({'receipts/a.jpg': 'base64data'});
  });

  it('removes orphan files that are not referenced', async () => {
    RNFS.exists.mockResolvedValue(true);
    RNFS.readDir.mockResolvedValue([
      {
        name: 'keep.jpg',
        path: `${RNFS.DocumentDirectoryPath}/receipts/keep.jpg`,
        isDirectory: () => false,
      },
      {
        name: 'orphan.jpg',
        path: `${RNFS.DocumentDirectoryPath}/receipts/orphan.jpg`,
        isDirectory: () => false,
      },
    ]);

    const removed = await removeOrphanReceiptFiles(new Set(['receipts/keep.jpg']));

    expect(removed).toBe(1);
    expect(RNFS.unlink).toHaveBeenCalledWith(
      `${RNFS.DocumentDirectoryPath}/receipts/orphan.jpg`,
    );
  });
});
