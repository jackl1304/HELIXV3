declare module 'ssh2-sftp-client' {
  import type { Readable } from 'node:stream';
  class SftpClient {
    connect(config: any): Promise<void>;
    end(): Promise<void>;
    exists(remotePath: string): Promise<false | 'd' | '-'>;
    mkdir(remotePath: string, recursive?: boolean): Promise<void>;
    fastPut(localPath: string, remotePath: string, options?: any): Promise<void>;
    put(input: string | Buffer | Readable, remotePath: string, options?: any): Promise<void>;
  }
  export default SftpClient;
}
