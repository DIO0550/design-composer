# design-composer

ローカルで動く、宣言的データ駆動のデザインツール。**部品も画面も同じデータモデルで扱い、両方を主役にする。**

スキーマで縛った宣言的データ（JSON）から、実 HTML/CSS をそのまま組み立てる。デザインの成果物はベクター画像ではなく、レンダリングに必要な意味（トークン・部品定義・画面構造）をすべて含んだ 1 つの JSON ファイルになる。

## コンセプト

既存ツールとの違いは 2 つ。**ベクターで描き直さないので実コードと切れない**こと（Figma との違い）と、**パターンをドキュメントとして見せるのではなく、データから部品・画面を組み立てて編集できる**こと（pattern-lab 系との違い）。

source of truth は JSON で、その可読性は AI と Git diff のレビューのために設計する（人間はファイルを直接読まない想定）。→ [docs/00-overview.md](docs/00-overview.md)

## ドキュメント（`.dcmp`）

編集の実体はすべて「ドキュメント（JSON）への変更」で、GUI は AI や外部エディタと対等な「ファイルへの書き手」の 1 つに過ぎない。

- 拡張子 `.dcmp`、JSON（UTF-8）。**1 ドキュメント = 1 ファイル**で、外部ファイルへの依存を持たない
- 明示的な保存操作は無い。編集はデバウンス付きで即座にファイルへ**自動保存**される（書き込みは一時ファイル + rename でアトミックに行う）
- ファイルを watch し、**外部（AI・エディタ・git 操作）による変更を検知して再読み込み**する。不正な内容だった場合は最後に正常だった描画を保持してエラーを重ねて表示する

フォーマットの詳細は [docs/01-file-format.md](docs/01-file-format.md)、保存モデルと外部編集の扱いは [docs/05-architecture.md](docs/05-architecture.md) を参照。

## 入手

タグを push すると [`release-desktop`](.github/workflows/release-desktop.yml) が次の成果物をビルドし、[Releases](https://github.com/DIO0550/design-composer/releases) へ添付する。

| プラットフォーム | 成果物 |
| --- | --- |
| macOS（Apple Silicon） | `.app`（zip） / `.dmg` |
| Windows（x86_64） | `.exe`（zip。インストーラは作らない） |

いずれも**未署名ビルド**のため、初回起動時に OS の警告が出る。

## 技術スタック

| 項目 | 内容 |
| --- | --- |
| デスクトップ | Tauri v2 |
| フロントエンド | React 19 / Vite / TypeScript（strict） |
| スタイル | Tailwind CSS v4 |
| テスト | Vitest（happy-dom） |
| UI カタログ | Storybook |
| Lint / Format | oxlint / Biome |
| パッケージマネージャ | pnpm |

**スキーマ定義・検証・HTML/CSS へのコンパイルは TypeScript 側に置き、Rust は JSON の読み書きと file watch（永続化 I/O）に絞る。**

## 開発

Dev Container に入った状態で、リポジトリのルートから実行する。

```bash
pnpm install
pnpm run tauri dev
```

コマンドの一覧（開発サーバー・型チェック・テスト・Lint・Storybook）は [AGENTS.md](AGENTS.md) の「Common Commands」にある。依存インストールと Tauri 側の設定項目は [TAURI_SETUP.md](TAURI_SETUP.md) を参照。

## 開発環境（Dev Container）

必要なのは Docker と VS Code、[Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)。VS Code でプロジェクトを開き、コマンドパレット（`F1`）→ **Dev Containers: Reopen in Container** を選ぶ。Ubuntu 24.04 ベースのコンテナに、Tauri のビルドに必要なシステムライブラリ・Node.js 24・Rust ツールチェーンを組み込んである（[`.devcontainer/`](.devcontainer/)）。

| ポート | 用途 |
| --- | --- |
| 14000 | Vite 開発サーバー |
| 14001 | Vite HMR |
| 6006 | Storybook |
| 16080 | デスクトップ表示（noVNC / ブラウザ） |
| 15901 | デスクトップ表示（VNC クライアント） |

5 つとも `devcontainer.json` の `forwardPorts` で転送する。14000 / 14001 / 6006 は `docker-compose.yml` の `ports` でも publish しているので、**変更するときは両方を揃える**。16080 / 15901 の実体は `devcontainer.json` の `features` → `desktop-lite` の `webPort` / `vncPort`。

- **Tauri ウィンドウの表示**: GUI アプリなのでコンテナ内に仮想デスクトップ（desktop-lite）を同梱している。表示方法と WebView 向けの環境変数は [TAURI_SETUP.md](TAURI_SETUP.md) にある
- **ネットワークファイアウォール**: コンテナからの外向き通信を [`.devcontainer/init-firewall.sh`](.devcontainer/init-firewall.sh) で許可リスト方式に制限している。許可先の追加はこのファイルの `ALLOWED_DOMAINS` 配列で行う
- **sudo を使わない設計**: 開発セッションのユーザー（`vscode`）に sudo 権限を付与していない。特権が必要な初期化は、コンテナ起動時に root で動く [`.devcontainer/entrypoint.sh`](.devcontainer/entrypoint.sh) が行う

## リポジトリ構成

```
src/                # React フロントエンド
├── app/            # エントリ層
├── features/       # Feature 層
├── domains/        # ドメイン層
├── services/       # ドメインサービス層
├── components/     # 汎用UIコンポーネント
├── hooks/          # 汎用カスタムフック
├── libs/           # 外部世界との境界
├── utils/          # 汎用純粋関数
└── types/          # 純粋な型定義
src-tauri/          # Tauri（Rust 側）。JSON の読み書きと file watch
docs/               # 仕様書
rules/              # 実装規約（常時ロード）
harness/            # 判例・git hooks・振り返りの記録
.claude/            # サブエージェント・フック・スキル
.storybook/         # Storybook 設定
.devcontainer/      # Dev Container 設定
.github/            # CI ワークフローとスクリプト
```

各フォルダの責務と、層をまたぐ依存の許される向きは [rules/architecture.md](rules/architecture.md) が規定する。

## 仕様書

仕様の拠り所は [`docs/`](docs/) の `00-overview.md` 〜 `06-ui.md`（概要・ドキュメントフォーマット・データモデル・スキーマ・トークン・アーキテクチャ・UI）。各ファイルの内容と決定状況は [docs/00-overview.md](docs/00-overview.md) にまとまっている。

画面の見た目・構成の拠り所は [`docs/Design Composer.html`](docs/Design%20Composer.html)（UI 案のプロトタイプ）。この位置づけと、実装前に読むべき手順は [rules/ui-verification.md](rules/ui-verification.md) が規定する。

## 実装規約

このリポジトリの実装は [AGENTS.md](AGENTS.md) の規約に従う。

- [`rules/`](rules/) — アーキテクチャ・コーディング・命名・テスト・hooks・コンポーネント・UI 表示確認の**規範**
- [`harness/case-law/`](harness/case-law/) — 過去に指摘された NG / OK の**判例**（規範と分けて、常時ロードしない）
- [`harness/records/`](harness/records/) — マージのたびに残す 1 回分の振り返り。規約を見直すときの材料になる
- [`harness/githooks/`](harness/githooks/) — push 前の検査（型チェック・oxlint・Biome・doc コメント・import 規約・テスト規約）
- [`.claude/skills/`](.claude/skills/) — 実装フロー・振り返りの記録・ハーネスの見直しの手順

## ライセンス

[MIT](LICENSE)
