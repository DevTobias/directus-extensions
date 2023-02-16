import { generateAssetBundleFromBuffer } from 'imonizer';
import { Readable } from 'stream';
import directus from 'directus';

type CreateFile = {
  user_id: string;
  directus_files_id: { id: string };
};

interface OptimizeTarget {
  o_profile: string;
  profile?: { create: CreateFile[]; update: CreateFile[]; delete: CreateFile[] };
}

export const hasImageToOptimize = (input: unknown): input is OptimizeTarget => {
  return (input as OptimizeTarget)?.o_profile !== undefined && typeof (input as OptimizeTarget).o_profile === 'string';
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
  const optimizedImages = await generateAssetBundleFromBuffer(['jpg', 'webp', 'avif'], [400, 800, 1000], buffer);

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
