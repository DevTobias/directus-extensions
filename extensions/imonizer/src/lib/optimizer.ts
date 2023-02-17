import { generateAssetBundleFromBuffer } from 'imonizer';
import { Readable } from 'stream';
import directus from 'directus';

import { getConfig } from './config';

export const getOptimizeKeys = (input: object) => {
  return Object.entries(input).filter(([key]) => key.startsWith(getConfig().prefix));
};

type UploadConfig = {
  buffer: Buffer;
  originalName: string;
  folder: string;
  service: directus.FilesService;
  storage?: string;
};

export const uploadOptimizedBundleFromBuffer = async ({
  buffer,
  originalName,
  folder,
  service,
  storage = 'local',
}: UploadConfig) => {
  const optimizedImages = await generateAssetBundleFromBuffer(getConfig().files, getConfig().sizes, buffer);

  const uploadImages = optimizedImages.images.map(async (image) =>
    service.uploadOne(Readable.from(await image.buffer), {
      folder,
      storage,
      type: image.type,
      metadata: { isOptimized: true },
      title: `${originalName}-${image.name}`,
      filename_download: `${originalName}-${image.name}`,
    }),
  );

  const uploadPlaceholder = service.uploadOne(Readable.from(''), {
    folder,
    storage,
    type: 'text/plain',
    metadata: { isOptimized: true },
    title: `${originalName}-placeholder`,
    description: optimizedImages.placeholder,
    filename_download: `${originalName}-placeholder`,
  });

  return Promise.all([...uploadImages, uploadPlaceholder]);
};
