import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
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
