# AGENTS.md — 実装規約

このリポジトリで実装を行う AI エージェントは、以下の規約に**必ず**従う。
各規約は `rules/` 配下にあり、以下の `@` import で常にコンテキストへ読み込まれる。

## プロジェクト構成

- フレームワーク: React 19 + Vite（Tauri v2 デスクトップアプリ）
- 言語: TypeScript（strict mode）
- パッケージマネージャ: pnpm
- テスト: Vitest（happy-dom） / E2E・表示確認: Playwright / UI カタログ: Storybook
- Lint / Format: oxlint / Biome
- 外部ランタイム依存: **原則禁止**（React / Tauri 本体・Tailwind CSS と devDependencies を除く）

## 規約一覧（常時ロード）

- @rules/architecture.md — フォルダ構造・依存方向・ロジックの帰属先・services / utils の責務
- @rules/consistency.md — 整合性境界・更新の入口・導出・feature の構成とネスト
- @rules/coding.md — コンパニオンオブジェクトパターン・イミュータブル・Result / Option・型による境界・禁止事項
- @rules/naming.md — 命名（名前と実体の一致・汎用語の禁止・ファイル名）
- @rules/testing.md — テスト配置・テストの書き方（ネスト禁止）
- @rules/hooks.md — useEffect / useState / useReducer / カスタムフックの使い方
- @rules/components.md — コンポーネント設計（Composition パターン）
- @rules/ui-verification.md — UI の表示確認手順（playwright-cli）

## 規範と判例を分ける

`rules/` に置くのは**規範**（こうする）だけとする。**判例**（この回こうだった / NG・OK の実例 / このリポジトリ固有のシンボル名 / PR 番号）は `harness/case-law/` に置き、**常時ロードしない**（判例は増え続けるが、規範は増えない）。

- 判断軸は「**別のリポジトリへ持っていって意味が通るか**」。通るなら `rules/`、通らないなら判例
- 判例を読むのは、**その分類で迷ったとき・指摘を受けたとき**と検証エージェントのみ。書き方は `harness/case-law/README.md` を参照

## 常時ロードは増やさない

**`AGENTS.md` + `rules/` の合計行数は、`harness/records/count.sh` の `always_loaded_cap` を超えない。** 足すなら同量を削る。上限は縮めたときに下げるだけで、上げない。

削ることは足すことと同じ重さの介入であり、後回しにしない。常時ロードの 1 行は毎セッション読まれるコストになり、積もった文章は初期設計を固定して試行範囲を狭める。上限を固定値ではなくラチェットにしている理由は [`harness/case-law/process.md`](harness/case-law/process.md) を参照。

- 検査: `bash harness/records/count.sh --ratchet`（pre-push と CI が実行し、実測と上限がずれていれば失敗する）
- 削り先を出せないなら、追加先は `rules/` ではなく判例かフックにする

## 実装の進め方

実装は `implementation-flow` スキル（`.claude/skills/implementation-flow/`）の手順で進める。
ゴールの確定 → タスクの分割 → 計画 → **計画の検証（`plan-reviewer`）** → 実装 → **実装の検証（観点別の `*-reviewer`）** → PR → マージ後の追記、までを 1 セットとする。

- 検証の観点は `.claude/agents/` のサブエージェントが定義する（検証時にだけ必要な情報を常時ロードへ入れないため）
- **計画・却下した案・その理由はすべて Issue に追記する**（PR 本文は差分の説明、Issue は判断の履歴。採用案だけ残すと、同じ案が再浮上した際に前回の却下理由が失われる）
- マージ後は `harness-record` スキル（`.claude/skills/harness-record/`）で評価を記録する

## タスクの分割

**タスクが大きくなりそうな場合は、Issue を分割して新たに登録する（種類は `implementation-flow` フェーズ 1「種類の確定」の手順 4）。** 1 つに抱え込むと計画が作業項目の列挙になり判断が残らず、レビューも差分が大きくなりすぎて読みづらくなる。

- 判断軸は「**独立してマージできるか**」。片方だけ入っても壊れない単位が 2 つ以上見えたら分ける
- 分けたら、元の Issue に**分割した理由**とリンクを残し、分けた側にもスコープ外にした内容を明記する
- 分けないと決めた場合も、**その理由を Issue に書く**（分けないこと自体が判断のため）

## 着手した Issue は、その回で閉じる

**着手したら自分をアサインし、PR 本文の `Closes #<番号>` で閉じる。** 手動では閉じない（例外は PR を出さない `flow:investigation` のみ）。閉じる Issue を持たない PR は `.github/workflows/pr-closing-issue.yml` が落とす（例外は `harness-record` の記録 PR）。

- 続きが必要な作業は**新しい Issue を立てて元の Issue からリンクする**（種類は `implementation-flow` フェーズ 1「種類の確定」の手順 4）。閉じた Issue は再オープンしない（判断の変更は閉じたままコメントで残す → `implementation-flow` フェーズ 8）
- PR を出さずに止まった Issue と、子へ分割した親 Issue は open のままでよい（閉じる起点がないため）

## 実装を始める前に

実装前・PR 前に以下の順で読む（自己チェックの観点は各 `rules/` にあるためここには写さない）。

1. `rules/architecture.md`「ロジックの帰属先」「services はドメインを探してから使う」
2. `rules/coding.md`「エラーと不在の表現」「値の語彙を型で閉じる」「不正な状態を型で表現できなくする」「関数のシグネチャ」
3. `rules/naming.md`「名前と実体を一致させる」「その名前が既に別の意味を持っていないか確認する」

迷ったら `harness/case-law/` の同名ファイルを開く（過去に指摘された実例がある）。

## 規約の更新

レビューで新しい判断基準が示されたら、その場の修正で終わらせない。**ルールに書くより先にフック化を検討する。** 機械的に判定できないものは判例（`harness/case-law/`）に置き、`rules/` は増やさない。

- 材料は `harness/records/` の記録を使い、`harness/records/count.sh` で集計する
- **人・bot・CI に届いた指摘が最後の介入より後に 2 回以上**ある分類にだけ、別の機会に `harness-growth` スキル（`.claude/skills/harness-growth/`）で手を入れる
- **規約を直すときは、同じファイル内の既存の記述・例と突き合わせる**（判定文と例が矛盾する、前後の節と食い違う、表が網羅していない、といった不整合を防ぐため）

## 設計判断の確認

層をまたぐ移動や既存モジュールの再配置など、**他の規約と衝突しうる変更**は、実装前に選択肢と根拠を示して確認する（独断で進めず判断だけを仰ぐ）。

## Issue に紐づいて起動したら、セッションの URL を Issue に残す

Issue に紐づく作業を始めたら、**着手した時点で**その Issue へセッションの URL（`https://claude.ai/code/session_<id>`）をコメントし、判断待ちで止まるときも選択肢と根拠に併記する。

**経緯はそのセッションの中にしか残らない。** Issue だけを見る人や後から引き継ぐセッションが辿れるよう、停止時ではなく着手時に残す（通知は流れるが Issue は残る）。フック化できない理由は [`harness/case-law/process.md`](harness/case-law/process.md) を参照。

## Common Commands

リポジトリルートで実行する。

```bash
pnpm install              # 依存関係のインストール
pnpm run dev              # 開発サーバー起動（Vite / ポート 14000）
pnpm run build            # プロダクションビルド（tsc -b && vite build）
pnpm run typecheck        # TypeScript 型チェック（tsc -b）
pnpm run test             # Vitest（watch モード）
pnpm run test:run         # Vitest 全テスト実行（CI 向け）
pnpm run lint             # oxlint 実行
pnpm run lint:fix         # oxlint 自動修正
pnpm exec biome check     # Biome の lint / format 検査（CI と同じ。oxlint とは別ステップ）
pnpm exec biome check --write  # Biome の自動修正（整形はこれで通す）
pnpm run storybook        # Storybook 起動（ポート 6006）
pnpm run tauri dev        # Tauri アプリ起動
```

## Development Environment

- パッケージマネージャ: **pnpm**
- DevContainer 設定あり（`.devcontainer/`）。ポート 14000（Vite）/ 14001（HMR）/ 6006（Storybook）をフォワード
- パスエイリアス: `@/*` → `src/*`（tsconfig.json / vite.config.ts）
