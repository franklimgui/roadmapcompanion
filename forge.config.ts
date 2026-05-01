import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Roadmap Companion',
    executableName: 'roadmap-companion',
    icon: path.resolve(__dirname, 'src/assets/icon'), // sem extensão — Forge resolve .ico/.icns/.png
    asar: true,
    appCopyright: `Copyright © ${new Date().getFullYear()} Guilherme Franklim`,
    win32metadata: {
      CompanyName: 'Roadmap Dev de Oferta',
      ProductName: 'Roadmap Companion',
      FileDescription: 'Companion app do Roadmap Dev de Oferta',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'roadmap-companion',
      setupExe: 'RoadmapCompanion-Setup.exe',
      iconUrl: 'https://www.roadmapdevdeoferta.com/icon.ico',
      setupIcon: path.resolve(__dirname, 'src/assets/icon.ico'),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'franklimgui',
          name: 'roadmapcompanion',
        },
        prerelease: false,
        // Sobe como rascunho. Você marca como release manualmente no GitHub
        // quando quiser disparar update pros alunos. Permite testar antes.
        draft: true,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
