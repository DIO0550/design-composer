# design-composer

ローカルで動く、宣言的データ駆動のデザインツール。**部品も画面も同じデータモデルで扱い、両方を主役にする。**

スキーマで縛った宣言的データ（JSON）から、実 HTML/CSS をそのまま組み立てる。デザインの成果物はベクター画像ではなく、レンダリングにそのまま使える 1 つの JSON ファイルになる。

## コンセプト

- **Figma との違い**: Figma はベクターで描き直すため実コードと切れる。design-composer は実 HTML/CSS をそのまま構成する。
- **pattern-lab 系との違い**: パターンをドキュメントとして見せるのではなく、データから部品・画面を組み立てて編集できる。
- **AI フレンドリー**: source of truth は JSON。可読性の受益者は AI と Git diff のレビューであり、人間の閲覧はアプリが担う（人間はファイルを直接読まない想定）。

## ドキュメント（`.dcmp`）

編集の実体はすべて「ドキュメント（JSON）への変更」で、GUI はその 1 クライアントに過ぎない（AI・外部エディタと対等）。

- 拡張子 `.dcmp`、JSON（UTF-8）。**1 ドキュメント = 1 ファイル**で、外部ファイルへの依存を持たない
- 明示的な保存操作は無い。編集はデバウンス付きで即座にファイルへ**自動保存**される（書き込みは一時ファイル + rename でアトミックに行う）
- ファイルを watch し、**外部（AI・エディタ・git 操作）による変更を検知して再読み込み**する。不正な内容だった場合は最後に正常だった描画を保持してエラーを重ねて表示する

フォーマットの詳細は [docs/01-file-format.md](docs/01-file-format.md)、保存モデルと外部編集の扱いは [docs/05-architecture.md](docs/05-architecture.md) を参照。

## 技術スタック

| 項目 | 内容 |
| --- | --- |
| デスクトップ | Tauri v2 |
| フロントエンド | React 19 / Vite / TypeScript（strict） |
| スタイル | Tailwind CSS v4 |
| テスト | Vitest（happy-dom） / Playwright |
| UI カタログ | Storybook |
| Lint / Format | oxlint / Biome |
| パッケージマネージャ | pnpm |

**スキーマ定義・検証・HTML/CSS へのコンパイルは TypeScript 側に置き、Rust は JSON の読み書きと file watch（永続化 I/O）だけを担う。** Rust に `.dcmp` の構造を教えず、IPC を渡るのは常に生の JSON 文字列とする。

外部ランタイム依存は原則として増やさない（React / Tauri 本体・Tailwind CSS と devDependencies を除く）。

## 入手

[Releases](https://github.com/DIO0550/design-composer/releases) からダウンロードできる。

| プラットフォーム | 成果物 |
| --- | --- |
| macOS（Apple Silicon） | `.app` / `.dmg` |
| Windows（x86_64） | `.exe`（zip） |

いずれも**未署名ビルド**のため、初回起動時に OS の警告が出る。

## 開発

Dev Container に入った状態で、リポジトリのルートから実行する。

```bash
pnpm install
pnpm run tauri dev
```

コマンドの一覧（開発サーバー・型チェック・テスト・Lint・Storybook）は [AGENTS.md](AGENTS.md) の「Common Commands」にある。依存インストールと Tauri 側の設定項目は [TAURI_SETUP.md](TAURI_SETUP.md) を参照。

## 開発環境（Dev Container）

Ubuntu 24.04 ベースのコンテナに、Tauri のビルドに必要なシステムライブラリ・Node.js 24・Rust ツールチェーンを組み込んである（[`.devcontainer/`](.devcontainer/)）。VS Code でプロジェクトを開き、コマンドパレット（`F1`）→ **Dev Containers: Reopen in Container** を選ぶ。

| ポート | 用途 | 経路 |
| --- | --- | --- |
| 14000 | Vite 開発サーバー | `docker-compose.yml` の `ports` |
| 14001 | Vite HMR | `docker-compose.yml` の `ports` |
| 6006 | Storybook | `docker-compose.yml` の `ports` |
| 16080 | デスクトップ表示（noVNC / ブラウザ） | `devcontainer.json` の `forwardPorts` |
| 15901 | デスクトップ表示（VNC クライアント） | `devcontainer.json` の `forwardPorts` |

- **Tauri ウィンドウの表示**: GUI アプリなのでコンテナ内に仮想デスクトップ（desktop-lite）を同梱している。表示方法と WebView 向けの環境変数は [TAURI_SETUP.md](TAURI_SETUP.md) にある
- **ネットワークファイアウォール**: コンテナからの外向き通信を [`.devcontainer/init-firewall.sh`](.devcontainer/init-firewall.sh) で許可リスト方式に制限している。許可先の追加はこのファイルの `ALLOWED_DOMAINS` 配列で行う
- **sudo を使わない設計**: 開発セッションのユーザー（`vscode`）に sudo 権限を付与していない。特権が必要な初期化は、コンテナ起動時に root で動く [`.devcontainer/entrypoint.sh`](.devcontainer/entrypoint.sh) が行う

## リポジトリ構成

```
src/                # React フロントエンド
├── app/            # エントリ層（main.tsx / App.tsx・Provider の組み立て）
├── features/       # ユースケース単位の feature
├── domains/        # 複数 feature から使われるドメインオブジェクト
├── services/       # 複数ドメインを組み合わせるロジック
├── components/     # 汎用UIコンポーネント
├── hooks/          # 汎用カスタムフック
├── libs/           # 外部世界との境界（Tauri API・I/O・外部フォーマットの解釈）
├── types/          # ロジックを持たない型定義
└── utils/          # 汎用純粋関数
src-tauri/          # Tauri（Rust 側）。永続化 I/O のみ
docs/               # 仕様書
rules/              # 実装規約（常時ロード）
harness/            # 判例・git hooks・振り返りの記録
.claude/            # サブエージェント・フック・スキル
.storybook/         # Storybook 設定
.devcontainer/      # Dev Container 設定
.github/            # CI ワークフローとスクリプト
```

各フォルダの責務と依存方向は [rules/architecture.md](rules/architecture.md) が規定する。

## 仕様書

仕様の拠り所は [`docs/`](docs/) の `00-overview.md` 〜 `06-ui.md`（概要・ドキュメントフォーマット・データモデル・スキーマ・トークン・アーキテクチャ・UI）。各ファイルの内容と決定状況は [docs/00-overview.md](docs/00-overview.md) にまとまっている。

**画面の見た目・構成の拠り所は [`docs/Design Composer.html`](docs/Design%20Composer.html)**（UI 案のプロトタイプ）。文章の仕様書が規定するのは何ができるかで、それをどう見せるかはこのファイルが持つ。

## 実装規約

このリポジトリの実装（人・AI を問わない）は [AGENTS.md](AGENTS.md) の規約に従う。

- [`rules/`](rules/) — アーキテクチャ・コーディング・命名・テスト・hooks・コンポーネント・UI 表示確認の**規範**
- [`harness/case-law/`](harness/case-law/) — 過去に指摘された NG / OK の**実例**（規範と分けて、常時ロードしない）
- [`harness/githooks/`](harness/githooks/) — push 前の検査（型チェック・Lint・テスト規約・doc コメント）
- [`.claude/skills/`](.claude/skills/) — 実装フロー・振り返りの記録・ハーネスの見直しの手順

## ライセンス

[MIT](LICENSE)
