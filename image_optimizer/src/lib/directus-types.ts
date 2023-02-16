/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable import/no-extraneous-dependencies */

import directus from 'directus';
import { Knex } from 'knex';

export type HookContext = {
  services: {
    FilesService: typeof directus.FilesService;
    AssetsService: typeof directus.AssetsService;
    FoldersService: typeof directus.FoldersService;
  };
  database: Knex;
};

export type FileUploadMeta = {
  payload: {
    folder: string;
    filename_download: string;
    metadata: {
      isOptimized?: boolean;
    };
  };
  key: string;
};

export type DirectusFile = {
  folder: string;
  filename_download: string;
};

export const parseMeta = (meta: unknown) => meta as FileUploadMeta;
