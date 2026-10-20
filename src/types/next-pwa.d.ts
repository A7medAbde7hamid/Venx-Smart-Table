declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface RuntimeCaching {
    urlPattern: RegExp | string;
    handler: string;
    options?: Record<string, unknown>;
  }

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    publicExcludes?: string[];
    buildExcludes?: (string | RegExp)[];
    additionalManifestEntries?: { url: string; revision: string | null }[];
    cacheStartUrl?: boolean;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    runtimeCaching?: RuntimeCaching[];
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
    customWorkerExclude?: (string | RegExp)[];
  }

  export default function withPWAInit(
    config: PWAConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}
