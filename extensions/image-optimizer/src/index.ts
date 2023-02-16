import { defineHook } from '@directus/extensions-sdk';
import path from 'path';

export default defineHook(({ action, filter }, { services }) => {
  const { FilesService, AssetsService } = services;

  filter(
    'items.create',
    async (input, { collection }, { schema, database }) => {
      if (collection !== 'user') return input;

      const assetService = new AssetsService({ knex: database, schema });
      const result = await assetService.getAsset((input as any).o_profile, {});

      console.log('works');
      //console.log(result);
      console.log(input.profile.create);
      console.log(collection);
      console.log(input);

      return input;
    }
  );

  action('files.upload', async ({ payload, key }, { schema, database }) => {
    if (payload.metadata.isOptimized) {
      return;
    }

    console.log(key);

    const imonizer = await import('imonizer');

    const assetService = new AssetsService({ knex: database, schema }, {});
    const fileService = new FilesService({ knex: database, schema });

    const result = await assetService.getAsset(key);
    let buffer = Buffer.from('');

    result.stream.on('data', (chunk: Uint8Array) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    result.stream.on('end', async () => {
      const optimizedImages = await imonizer.generateAssetBundleFromBuffer(
        ['jpg', 'webp', 'avif'],
        [400, 800, 1000],
        buffer
      );

      const originalName = path.parse(payload.filename_download).name;

      const uploadImages = optimizedImages.images.map((image) => {
        return fileService.uploadOne(image.buffer, {
          folder: payload.folder,
          storage: 'local',
          title: originalName + '-' + image.name,
          filename_download: originalName + '-' + image.name,
          type: image.type,
          metadata: { isOptimized: true },
        });
      });

      const uploadPlaceholder = fileService.uploadOne(Buffer.from(''), {
        folder: payload.folder,
        storage: 'local',
        title: originalName + '-placeholder',
        description: optimizedImages.placeholder,
        filename_download: originalName + '-placeholder',
        type: 'text/plain',
        metadata: { isOptimized: true },
      });

      const result = await Promise.all([...uploadImages, uploadPlaceholder]);
      console.log(result);
    });
  });
});
