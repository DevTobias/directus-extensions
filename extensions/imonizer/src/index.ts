import { defineHook } from '@directus/extensions-sdk';
import path from 'path';
import crypto from 'crypto';

import { getConfig } from './lib/config';
import { streamToBuffer, readUnknownFromKey } from './lib/utils';
import { DirectusFile, HookContext } from './lib/directus-types';
import { getOptimizeKeys, uploadOptimizedBundleFromBuffer } from './lib/optimizer';

export default defineHook(({ filter }, { services }: HookContext) => {
  const { FilesService, AssetsService, FoldersService } = services;

  filter('items.create', async (input, { collection }, { schema, database: knex }) => {
    if (schema === null || collection !== 'user') return input;

    const assetService = new AssetsService({ knex, schema });
    const fileService = new FilesService({ knex, schema });
    const folderService = new FoldersService({ knex, schema });

    const optimizeKeys = getOptimizeKeys(input as object);

    await Promise.all(
      optimizeKeys.map(async (pair) => {
        const targetKey = pair[0].replace(`${getConfig().prefix}_`, '');

        if (readUnknownFromKey(input, targetKey)) return;

        const foundAsset = await assetService.getAsset(pair[1] as string, {});
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

        (input as any)[targetKey] = { create: fileRelation, update: [], delete: [] };
      }),
    );

    return input;
  });
});
