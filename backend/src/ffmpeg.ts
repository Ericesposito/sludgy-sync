import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export function convertToHLS(inputFile: string, outputDir: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .outputOptions([
        '-codec: copy',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls',
      ])
      .output(path.join(outputDir, 'output.m3u8'))
      .on('end', () => resolve('Conversion completed successfully'))
      .on('error', (err: Error) => reject(err))
      .run();
  });
}
