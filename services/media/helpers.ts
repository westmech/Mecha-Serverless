import { Readable } from 'stream';

interface StreamToBuffer {
    (stream: Readable): Promise<Buffer>;
}

export const streamToBuffer: StreamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};
