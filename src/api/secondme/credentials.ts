import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Credentials {
  accessToken: string;
  tokenType?: string;
  name?: string;
  homepage?: string;
  originRoute?: string;
}

export class CredentialManager {
  private credentialsPath: string;

  constructor() {
    this.credentialsPath = path.resolve(os.homedir(), '.openclaw', '.credentials');
  }

  async load(): Promise<Credentials | null> {
    try {
      const dir = path.dirname(this.credentialsPath);
      await fsPromises.access(dir);
      await fsPromises.access(this.credentialsPath);
      const content = await fsPromises.readFile(this.credentialsPath, 'utf-8');
      const creds = JSON.parse(content);
      if (creds.access_token && !creds.accessToken) {
        creds.accessToken = creds.access_token;
      }
      return creds;
    } catch {
      return null;
    }
  }

  async save(credentials: Credentials): Promise<void> {
    const dir = path.dirname(this.credentialsPath);
    await fsPromises.mkdir(dir, { recursive: true });
    const content = JSON.stringify(credentials, null, 2);
    await fsPromises.writeFile(this.credentialsPath, content, 'utf-8');
  }

  async clear(): Promise<void> {
    try {
      await fsPromises.unlink(this.credentialsPath);
    } catch {
    }
  }

  async hasCredentials(): Promise<boolean> {
    const creds = await this.load();
    return creds !== null && !!creds.accessToken;
  }

  async getAccessToken(): Promise<string | null> {
    const creds = await this.load();
    return creds?.accessToken || null;
  }
}

export const credentialManager = new CredentialManager();
