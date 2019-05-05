import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from './exec';
import { logFatal } from './log';
import { PackageJson } from './define';

function getRandomFolderPath() {
  const ramdomId = crypto.randomBytes(20).toString('hex');
  return path.join(process.env.HOME, `.cardTemp${ramdomId}`);
}

export async function runInTempFolderAndDestroyAfterFinished(fn: (tempFolderPath?: string) => any) {
  // 获取一个临时文件夹路径
  const tempFolderPath = getRandomFolderPath();

  if (fs.existsSync(tempFolderPath)) {
    logFatal(`error code: 1`);
  }

  try {
    // Create temp folder
    await exec(`mkdir -p ${tempFolderPath}`);

    // Run callback
    await fn.apply(null, [tempFolderPath]);
  } finally {
    // Remove when finished it.
    await exec(`rm -rf ${tempFolderPath}`);
  }
}

export async function getPackageJson(projectPath: string): Promise<PackageJson> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(projectPath)) {
    return {} as any;
  }

  return fs.readJson(packageJsonPath);
}

export async function writePackageJson(projectPath: string, packageJson: PackageJson) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  fs.outputFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
