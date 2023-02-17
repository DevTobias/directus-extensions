interface ImonizerConfig {
  prefix: string;
  files: string[];
  sizes: number[];
}

let config: ImonizerConfig | null;

export const getConfig = () => {
  if (config) return config;

  config = {
    prefix: process.env.IMONIZER_PREFIX ?? 'imonizer',
    files: process.env.IMONIZER_FILES?.split(',') ?? ['jpg', 'webp', 'avif'],
    sizes: process.env.IMONIZER_SIZES?.split(',').map((val) => parseInt(val, 10)) ?? [400, 800, 1000],
  };

  return config;
};
