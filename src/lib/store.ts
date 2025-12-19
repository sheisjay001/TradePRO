import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

// Define a type for NodeJS error with code
interface NodeJSError extends Error {
  code?: string;
}

async function ensureDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error: unknown) {
    // Safely check if error has a code property
    const nodeError = error as NodeJSError;
    if (nodeError.code !== 'EEXIST') {
      console.error('Error creating data directory:', error);
    }
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    await ensureDir();
    const filePath = path.join(dataDir, file);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    return fallback;
  }
}

export async function writeJson(file: string, value: any): Promise<void> {
  try {
    await ensureDir();
    const filePath = path.join(dataDir, file);
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing JSON file:', error);
    throw error;
  }
}