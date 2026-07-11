# tauri-devcontainer-template

Tauri + React (TypeScript) 開発をすぐに始めるための **Dev Container 付きスターターテンプレート**です。
Ubuntu ベースのコンテナに Tauri のビルドに必要なシステムライブラリ・Node.js・Rust ツールチェーンを組み込み、さらにフロントエンド（React 19 / Vite / Storybook / Biome / oxlint / Vitest）の設定一式を同梱しています。ホスト側に依存環境を入れずに、統一された開発環境を再現できます。

## 含まれるツール

| カテゴリ | ツール / バージョン |
| --- | --- |
| OS | Ubuntu 24.04 |
| Node.js | v24 (nodesource) |
| パッケージマネージャー | pnpm |
| Rust | stable (`rustup` / `rustfmt` / `clippy` / `rust-src`) |
| Tauri CLI | v2 (`@tauri-apps/cli` / Node ベース。`pnpm tauri` で利用) |
| バージョン管理 | Git |
| GitHub CLI | gh |
| フロントエンド | React 19 / Vite 8 / TypeScript 5.8 |
| スタイル | Tailwind CSS v4 (`@tailwindcss/vite`。同梱・任意利用) |
| Lint / Format | Biome / oxlint |
| テスト | Vitest (happy-dom) / Playwright (ブラウザ依存パッケージ込み) |
| UI カタログ | Storybook (ポート 6006 を転送済み) |
| GUI 表示 | desktop-lite (noVNC / VNC。Tauri ウィンドウをブラウザで表示) |
| ターミナル | tmux |
| ネットワーク | ファイアウォール (外向き通信を許可リストで制限。iptables / ipset) |

## VS Code 拡張機能

- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) — 保存時に自動フォーマット

## 前提条件

- [Docker](https://www.docker.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## 使い方

1. このリポジトリを **Use this template** でコピー、またはクローンします。
2. VS Code でプロジェクトを開きます。
3. コマンドパレット (`F1`) → **Dev Containers: Reopen in Container** を選択します。
4. コンテナのビルドが完了すると、開発環境が利用可能になります。
5. `pnpm install` で依存をインストールします。フロントエンド（`pnpm dev` / `pnpm storybook` / `pnpm test:run`）はこの時点で動きます。
6. Rust/Tauri 側を初期化します（`pnpm tauri init` → `pnpm tauri dev`）。詳細は [TAURI_SETUP.md](TAURI_SETUP.md) を参照してください。

以下のポートがホストへ自動転送されます。

| ポート | 用途 |
| --- | --- |
| 14000 | Vite 開発サーバー |
| 14001 | Vite HMR |
| 6006 | Storybook (任意) |
| 16080 | デスクトップ表示 (noVNC / ブラウザ) |
| 15901 | デスクトップ表示 (VNC クライアント) |

## Tauri ウィンドウの表示（コンテナ内 GUI）

Tauri はデスクトップ GUI アプリのため、コンテナ内に仮想デスクトップ（[desktop-lite](https://github.com/devcontainers/features/tree/main/src/desktop-lite)）を同梱しています。`pnpm tauri dev` で起動したウィンドウは、ブラウザで <http://localhost:16080>（パスワード: `vscode`）、または VNC クライアントで `localhost:15901` から確認できます。

WebView（WebKitGTK）の描画向けに `WEBKIT_DISABLE_DMABUF_RENDERER` / `WEBKIT_DISABLE_COMPOSITING_MODE` / `DISPLAY=:1` を `devcontainer.json` の `containerEnv` に設定済みです。

## ネットワークファイアウォール（外向き通信の制限）

コンテナからの外向き通信（egress）を、`.devcontainer/init-firewall.sh` で **許可リスト方式** に制限しています。開発に必要な宛先（GitHub / npm レジストリ / crates.io / rustup / Anthropic API など）だけを許可し、それ以外への通信はすべて遮断します。意図しない外部への通信を防ぐための安全策です。

- 適用タイミング: コンテナ起動時（`.devcontainer/entrypoint.sh` が root で実行し、その中で `init-firewall.sh` を適用）。再起動のたびに再適用されます。
- 仕組み: `iptables` でデフォルト DROP にし、`ipset` に登録した許可先（GitHub の公開 IP レンジ + 許可ドメインの解決結果）だけを ACCEPT します。DNS・localhost・確立済みコネクション・ホストネットワークは常に許可します。
- 必要な権限: `docker-compose.yml` の `cap_add` に `NET_ADMIN` / `NET_RAW` を付与しています。

許可先を追加したいときは、`.devcontainer/init-firewall.sh` の `ALLOWED_DOMAINS` 配列にドメインを追記してください。ファイアウォールが不要な場合は、`.devcontainer/entrypoint.sh` のファイアウォール適用部分と、`docker-compose.yml` の `cap_add` を削除します。

## sudo を使わない設計（特権分離）

開発セッションのユーザー（`vscode`）には **sudo 権限を付与していません**。特権が必要な初期化（VNC デスクトップ / ファイアウォール）は、コンテナ起動時に root として動く `.devcontainer/entrypoint.sh` で実行します。

- ビルド時のセットアップスクリプトのためだけに sudo を使い、`Dockerfile` の最後で `/etc/sudoers.d/vscode` を削除して実行時には残しません。
- コンテナ本体プロセスは root（エントリポイント）で動きますが、VS Code のセッション・ターミナルは `devcontainer.json` の `remoteUser: vscode` で動くため、日常操作は非 root ユーザーです。
- 実行時に root 権限が必要な作業を追加したい場合は、`entrypoint.sh`（root で実行される）に処理を足すか、`Dockerfile` の `rm -f /etc/sudoers.d/$USERNAME` を削除して従来どおり sudo を許可します。

## プロジェクト構成

```
.devcontainer/
├── devcontainer.json   # Dev Container 設定
├── docker-compose.yml  # Docker Compose 定義
├── entrypoint.sh       # 起動時に root で特権初期化(VNC/firewall)を実行
├── init-firewall.sh    # 外向き通信を許可リストで制限するファイアウォール
└── node/
    └── Dockerfile      # コンテナイメージ定義
.storybook/             # Storybook 設定 (main.ts / preview.ts)
.vscode/
└── extensions.json     # 推奨拡張機能
src/                    # React フロントエンド (create-tauri-app デフォルト構成)
├── main.tsx            # エントリーポイント
├── App.tsx             # ルートコンポーネント (greet デモ)
├── App.css             # スタイル
├── assets/             # 画像アセット (react.svg など)
└── vite-env.d.ts       # Vite 型定義
src-tauri/              # Tauri (Rust 側)。tauri init 標準構成を同梱
├── Cargo.toml          # Rust 依存 / クレート設定
├── tauri.conf.json     # Tauri 設定 (ポート / コマンド / アプリ名)
├── build.rs            # ビルドスクリプト
├── capabilities/       # 権限 (capability) 定義
├── icons/              # アプリアイコン (デフォルト同梱)
└── src/                # Rust エントリ (main.rs / lib.rs。greet コマンド)
public/                 # 静的アセット (tauri.svg / vite.svg)
index.html              # Vite エントリ HTML
package.json            # 依存 / スクリプト
vite.config.ts          # Vite + Vitest 設定 (ポート 14000/14001)
tsconfig*.json          # TypeScript 設定
biome.json / .oxlintrc.json  # Lint / Format 設定
TAURI_SETUP.md          # セットアップ / 開発コマンド
```

`src-tauri/`（Rust 側）は `pnpm tauri init` で生成した標準構成を同梱済みです。`pnpm install` 後、そのまま `pnpm tauri dev` で起動できます。詳細は [TAURI_SETUP.md](TAURI_SETUP.md) を参照してください。

## カスタマイズ

- **Node.js のバージョン**: `.devcontainer/node/Dockerfile` の `ARG NODE_VERSION` を変更します。
- **転送ポート**: アプリのポート（`14000`/`14001`）は `.devcontainer/devcontainer.json` の `forwardPorts` と `.devcontainer/docker-compose.yml` の `ports` を揃えて変更します。GUI ポート（`16080`/`15901`）は `devcontainer.json` の `features` の `webPort` / `vncPort` と `forwardPorts` を揃えます。
- **GUI パスワード**: `devcontainer.json` の `features` → `desktop-lite` → `password` で変更します。GUI が不要な場合は `features` / `containerEnv` / GUI ポートに加えて、`.devcontainer/entrypoint.sh` の desktop-init 実行部分を削除します。
- **ファイアウォール許可先**: `.devcontainer/init-firewall.sh` の `ALLOWED_DOMAINS` 配列で追加・削除します。ファイアウォール自体が不要な場合は `.devcontainer/entrypoint.sh` の該当部分と `docker-compose.yml` の `cap_add` を削除します。
- **sudo 権限**: 既定では実行時ユーザー(`vscode`)に sudo を付与しません（`Dockerfile` 末尾で sudoers を削除）。従来どおり sudo を使いたい場合は、その `rm -f /etc/sudoers.d/$USERNAME` を削除します。
- **セットアップスクリプト**: `Dockerfile` / `devcontainer.json` はコンテナ構築時に外部 gist（リポジトリオーナーの gist）から gh / pnpm / AI ツール / tmux / Playwright などのセットアップスクリプトを取得します。用途に応じて差し替え・削除してください。

## ライセンス

[MIT](LICENSE)
