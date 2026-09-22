import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  // ここが拾う綴りは `.claude/hooks/lib/story-title-violations.py` が写している（title が
  // フォルダ階層と揃っているかの検査）。設定を Python から読み解く処理そのものが検査の
  // 外になるので導出はしない。増やすときは向こうも増やす。
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-themes"],
  framework: { name: "@storybook/react-vite", options: {} },
  typescript: { reactDocgen: "react-docgen-typescript" },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        // vite.config.ts と同じ `@/` alias を Storybook でも解決させる。
        // Tauri backend（invoke）に依存するモジュールは、ここに
        // `{ find: /^@\/hooks\/useSomething$/, replacement: "./mocks/..." }`
        // を追加してモックへ差し替えると Storybook 上で表示できる。
        alias: [
          {
            find: /^@\//,
            replacement: `${fileURLToPath(new URL("../src", import.meta.url))}/`,
          },
        ],
      },
    });
  },
};

export default config;
