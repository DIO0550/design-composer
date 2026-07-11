# セットアップ / 開発コマンド

Dev Container に入った状態で、リポジトリの root から実行します。フロントエンド（React + Vite + Storybook + Biome/oxlint）と Tauri（Rust 側の `src-tauri/`）はどちらも同梱済みなので、依存を入れればそのまま起動できます。

## 1. 依存インストール

```bash
pnpm install
```

`pnpm-lock.yaml` を同梱しているため、バージョンを固定して入れる場合は `pnpm install --frozen-lockfile` を使います。これだけでフロントエンドは動きます。

- 開発サーバー: `pnpm dev`（<http://localhost:14000>）
- Storybook: `pnpm storybook`（<http://localhost:6006>）
- テスト: `pnpm test:run`
- Lint / Format: `pnpm lint` / `pnpm dlx @biomejs/biome format --write .`

## 2. Tauri（Rust 側）の構成

`src-tauri/` は `pnpm tauri init` で生成した標準構成を **同梱済み**です。ポート/コマンドはこのテンプレートに合わせて設定してあります。

| 項目 | 値 | 設定箇所 |
| --- | --- | --- |
| Web assets location | `../dist` | `src-tauri/tauri.conf.json` の `build.frontendDist` |
| Dev server URL | `http://localhost:14000` | `build.devUrl` |
| Frontend dev command | `pnpm dev` | `build.beforeDevCommand` |
| Frontend build command | `pnpm build` | `build.beforeBuildCommand` |

アプリ名・ウィンドウタイトル・識別子（`identifier`）などは `src-tauri/tauri.conf.json`、Rust クレート名は `src-tauri/Cargo.toml` で変更できます。

`src-tauri/icons/` には **Tauri のデフォルトアイコン**が入っているため、そのまま `tauri dev` / `tauri build` が通ります。独自アイコンに差し替えたいときだけ、任意の 1024x1024 PNG から各プラットフォーム向けを生成します。

```bash
pnpm tauri icon path/to/app-icon.png
```

## 3. 開発起動

```bash
pnpm tauri dev
```

Vite の開発サーバーは **14000**、HMR は **14001** を使います（`vite.config.ts` / `.devcontainer` で揃えてあります）。

### Tauri ウィンドウの表示（コンテナ内 GUI）

Tauri はデスクトップ GUI アプリのため、コンテナ内に仮想デスクトップ（[desktop-lite](https://github.com/devcontainers/features/tree/main/src/desktop-lite)）を同梱しています。`pnpm tauri dev` で起動したウィンドウは以下から確認できます。

- ブラウザ (noVNC): <http://localhost:16080>（パスワード: `vscode`）
- VNC クライアント: `localhost:15901`（パスワード: `vscode`）

WebView（WebKitGTK）の描画は、コンテナ向けに `WEBKIT_DISABLE_DMABUF_RENDERER` / `WEBKIT_DISABLE_COMPOSITING_MODE` と `DISPLAY=:1` を `devcontainer.json` の `containerEnv` で設定済みです。

## 4. ビルド

```bash
pnpm tauri build
```

## Storybook

コンポーネントカタログは同梱済みです。ポート **6006** は `.devcontainer` で転送済み。

```bash
pnpm storybook          # 開発（http://localhost:6006）
pnpm build-storybook    # 静的エクスポート（storybook-static/ に出力）
```

`.storybook/main.ts` は `@/` alias を `vite.config.ts` と揃えて解決します。Tauri backend（`invoke`）に依存するフック/コンポーネントは、`viteFinal` の `resolve.alias` でモックへ差し替えると Storybook 上で表示できます。
