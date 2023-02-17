import { Readable } from 'stream';

export const streamToBuffer = async (stream: Readable) => {
  return new Promise<Buffer>((resolve, reject) => {
    const buffer = Array<any>();
    stream.on('data', (chunk) => buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffer)));
    stream.on('error', (err) => reject(err));
  });
};

export const readUnknownFromKey = (input: unknown, key: string): any | null => {
  return (input as any)[key] !== undefined ? (input as any)[key] : null;
};
