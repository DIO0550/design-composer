# セットアップ / 開発コマンド

Dev Container に入った状態で、リポジトリの root から実行します。フロントエンド（React + Vite + Storybook + Biome/oxlint）と Tauri（Rust 側の `src-tauri/`）は同じリポジトリにあるので、依存を入れればそのまま起動できます。

## 1. 依存インストール

```bash
pnpm install
```

`pnpm-lock.yaml` をリポジトリに含めているため、バージョンを固定して入れる場合は `pnpm install --frozen-lockfile` を使います。これだけでフロントエンドは動きます。

開発サーバー・型チェック・テスト・Lint / Format のコマンドは [AGENTS.md](AGENTS.md) の「Common Commands」にあります。

## 2. Tauri（Rust 側）の構成

`src-tauri/` は Tauri の標準構成です。Vite 側とつなぐポート/コマンドは次のとおり設定してあります。

| 項目 | 値 | 設定箇所 |
| --- | --- | --- |
| Web assets location | `../dist` | `src-tauri/tauri.conf.json` の `build.frontendDist` |
| Dev server URL | `http://localhost:14000` | `build.devUrl` |
| Frontend dev command | `pnpm dev` | `build.beforeDevCommand` |
| Frontend build command | `pnpm build` | `build.beforeBuildCommand` |

アプリ名・ウィンドウタイトル・識別子（`identifier`）は `src-tauri/tauri.conf.json`、Rust のクレート名とパッケージメタデータは `src-tauri/Cargo.toml` にあります。

`src-tauri/icons/` には design-composer のアイコンが入っています（原本は `icon.svg`。1024x1024）。差し替えるときは原本を描き直し、1024x1024 の PNG へ書き出してから各プラットフォーム向けを生成します。

```bash
pnpm tauri icon path/to/app-icon.png
```

## 3. 開発起動

```bash
pnpm tauri dev
```

Vite の開発サーバーは **14000**、HMR は **14001** を使います（`vite.config.ts` / `.devcontainer` で揃えてあります）。

### Tauri ウィンドウの表示（コンテナ内 GUI）

Tauri はデスクトップ GUI アプリのため、コンテナ内に仮想デスクトップ（[desktop-lite](https://github.com/devcontainers/features/tree/main/src/desktop-lite)）を組み込んでいます。`pnpm tauri dev` で起動したウィンドウは以下から確認できます。

- ブラウザ (noVNC): <http://localhost:16080>（パスワード: `vscode`）
- VNC クライアント: `localhost:15901`（パスワード: `vscode`）

WebView（WebKitGTK）の描画は、コンテナ向けに `WEBKIT_DISABLE_DMABUF_RENDERER` / `WEBKIT_DISABLE_COMPOSITING_MODE` と `DISPLAY=:1` を `devcontainer.json` の `containerEnv` で設定済みです。

## 4. ビルド

```bash
pnpm tauri build
```

## Storybook

コンポーネントカタログは Storybook で見ます。ポート **6006** は `.devcontainer` で転送済み。

```bash
pnpm storybook          # 開発（http://localhost:6006）
pnpm build-storybook    # 静的エクスポート（storybook-static/ に出力）
```

`.storybook/main.ts` は `@/` alias を `vite.config.ts` と揃えて解決します。Tauri backend（`invoke`）に依存するフック/コンポーネントは、`viteFinal` の `resolve.alias` でモックへ差し替えると Storybook 上で表示できます。
