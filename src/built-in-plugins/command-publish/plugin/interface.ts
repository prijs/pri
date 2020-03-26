export interface PublishOption {
  tag?: string;
  bundle?: boolean;
  skipLint?: boolean;
  skipNpm?: boolean;
  semver?: string;
  commitOnly?: boolean;
  publishOnly?: boolean;
  branch?: string;
  includeAll?: boolean;
  exitAfterPublish?: boolean;
}
