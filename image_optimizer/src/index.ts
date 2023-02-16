import { defineHook } from '@directus/extensions-sdk';
import path from 'path';
import crypto from 'crypto';

import { streamToBuffer } from './lib/utils';
import { DirectusFile, HookContext } from './lib/directus-types';
import { hasImageToOptimize, uploadOptimizedBundleFromBuffer } from './lib/optimizer';

export default defineHook(({ filter }, { services }: HookContext) => {
  const { FilesService, AssetsService, FoldersService } = services;

  filter('items.create', async (input, { collection }, { schema, database }) => {
    if (schema === null || collection !== 'user') return input;

    const assetService = new AssetsService({ knex: database, schema });
    const fileService = new FilesService({ knex: database, schema });
    const folderService = new FoldersService({ knex: database, schema });

    if (hasImageToOptimize(input)) {
      console.log(input.profile);

      if (input.profile) return input;

      const foundAsset = await assetService.getAsset(input.o_profile, {});
      const buffer = await streamToBuffer(foundAsset.stream);

      const { name } = path.parse((foundAsset.file as DirectusFile).filename_download);
      const hash = crypto.randomBytes(5).toString('hex');
      const folder = (await folderService.createOne({ name: `${name}-${hash}` })).toString();

      const optimizedAssets = await uploadOptimizedBundleFromBuffer({
        folder,
        buffer,
        originalName: name,
        service: fileService,
      });

      const fileRelation = optimizedAssets.map((asset) => ({
        user_id: '+',
        directus_files_id: { id: asset.toString() },
      }));

      input.profile = { create: fileRelation, update: [], delete: [] };
    }

    return input;
  });
});
