import { zipSync } from 'fflate';
import { uniqueFilenames } from './unique-filenames';

export async function filesToZipBlob(files: File[]): Promise<Blob> {
  const names = uniqueFilenames(files.map((file) => file.name));
  const zipEntries: Record<string, Uint8Array> = {};

  await Promise.all(
    files.map(async (file, index) => {
      zipEntries[names[index]] = new Uint8Array(await file.arrayBuffer());
    }),
  );

  return new Blob([zipSync(zipEntries)], { type: 'application/zip' });
}
