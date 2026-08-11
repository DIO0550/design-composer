# AGENTS.md — 実装規約

このリポジトリで実装を行うAIエージェントは、以下の規約に**必ず**従うこと。
各規約は `rules/` 配下にあり、以下の `@` import で常にコンテキストへ読み込まれる。

## プロジェクト構成

- フレームワーク: React 19 + Vite (Tauri v2 デスクトップアプリ)
- 言語: TypeScript (strict mode)
- パッケージマネージャ: pnpm
- テスト: Vitest (happy-dom) / E2E・表示確認: Playwright / UIカタログ: Storybook
- Lint / Format: oxlint / Biome
- 外部ランタイム依存: **原則禁止**(React / Tauri 本体・Tailwind CSS と devDependencies を除く)

## 規約一覧

- @rules/architecture.md — フォルダ構造・依存方向・ロジックの帰属先・services / utils の責務
- @rules/coding.md — コンパニオンオブジェクトパターン・イミュータブル・Result / Option・型による境界・禁止事項
- @rules/naming.md — 命名(名前と実体の一致・汎用語の禁止・ファイル名)
- @rules/testing.md — テスト配置・テストの書き方(ネスト禁止)
- @rules/hooks.md — useEffect / useState / useReducer / カスタムフックの使い方
- @rules/components.md — コンポーネント設計(Composition パターン)
- @rules/ui-verification.md — UIの表示確認手順(playwright-cli)

## 実装の進め方

実装は `implementation-flow` スキルの手順で進める(`.claude/skills/implementation-flow/`)。
ゴールの確定 → タスクの分割 → 計画 → **計画の検証(サブエージェント)** → 実装 →
**実装の検証(サブエージェント)** → PR → マージ後の追記、までが1セット。

**計画・却下した案・その理由は、すべて Issue に追記する。** PR 本文は差分の説明、
Issue は判断の履歴、という分担にする。採用した案だけを残すと、後で同じ案が再浮上した
ときに前回やめた理由が失われる。

マージ後は `harness-record` スキルでその回の評価を記録する
(`.claude/skills/harness-record/`)。記録を数えて規約やフックへ手を入れるのは
`harness-growth` スキル(`.claude/skills/harness-growth/`)で、別の機会に行う。

## タスクの分割

**タスクが大きくなりそうな場合は、Issue を分離して新たに登録する。** 1つの Issue に
抱え込むと、計画が「やることの列挙」になって判断の記録が残らず、レビューも差分が
まとまって届くため一度に読めなくなる。

- 判断軸は「**独立してマージできるか**」。片方だけ入っても壊れない単位が2つ以上見えたら分ける
- 分けたら、元の Issue に**分割した理由**とリンクを残す。分けた側にも「何をスコープ外に
  したか」を書く
- 分けないと決めた場合も、**その理由を Issue に書く**(「片方だけ入れると中間状態が
  画面に出る」など)。分けないこと自体が判断なので、記録の対象になる

## 実装を始める前に

過去のレビューで繰り返し指摘された観点。実装前および PR を出す前に自己チェックすること。

- そのロジックは**帰属先のドメインオブジェクト**に置いたか(`services/` や呼び出し側のヘルパー関数のままになっていないか)
- `services/` に置いたロジックについて、**帰属先のドメインオブジェクトが無いかを確認**したか
- 失敗を `throw` ではなく `Result`、不在を `undefined` ではなく `Option` で表現したか
- 関数名は**戻り値と一致**しているか(エラー配列を返すのに `validate*` になっていないか)
- 引数は3つ以内か。汎用の判定・変換をローカル関数として書いていないか(`utils/` の `<型名>Ex` にあるべきではないか)
- `string` のままにしている値のうち、**語彙が仕様で決まっているもの**を型で閉じたか
- **不正な状態が型で表現できてしまわないか**(boolean / Option の組み合わせで矛盾が作れるなら直和で列挙する。検証済みが前提なら検証済みを表す型で受け取る)

## 規約の更新

レビューで新しい判断基準が示されたら、その場の修正で終わらせず **`rules/` 配下へ反映**する。ルールに書かれていない指摘が2回以上出たら、規約の抜けとして扱う。

回数を数える材料は `harness/records/` に溜まる(マージのたびに `harness-record`
スキルが記録を1ファイル追加する)。数えるのは `harness/records/count.sh`。
**通算ではなく「最後の介入以降の再発数」で見る**(通算は単調増加するので、介入が効いたかを
表さない)。同じ層で再発したら層を1つ上げる。手順は
`.claude/skills/harness-growth/SKILL.md`「Step 1」「Step 2」。

## 設計判断の確認

層をまたぐ移動や既存モジュールの再配置など、**他の規約と衝突しうる変更**は、実装前に選択肢と根拠を示して確認する(勝手に進めず、判断だけを仰ぐ)。

## Common Commands

リポジトリルートで実行する：

```bash
pnpm install              # 依存関係のインストール
pnpm run dev              # 開発サーバー起動（Vite / ポート 14000）
pnpm run build            # プロダクションビルド（tsc -b && vite build）
pnpm run typecheck        # TypeScript 型チェック（tsc -b）
pnpm run test             # Vitest（watch モード）
pnpm run test:run         # Vitest 全テスト実行（CI 向け）
pnpm run lint             # oxlint 実行
pnpm run lint:fix         # oxlint 自動修正
pnpm exec biome check     # Biome の lint / format 検査（CI と同じ。oxlint とは別のステップ）
pnpm exec biome check --write  # Biome の自動修正（整形はこれで通す）
pnpm run storybook        # Storybook 起動（ポート 6006）
pnpm run tauri dev        # Tauri アプリ起動
```

## Development Environment

- パッケージマネージャ: **pnpm**
- DevContainer 設定あり（`.devcontainer/`）。ポート 14000（Vite）/ 14001（HMR）/ 6006（Storybook）をフォワード
- パスエイリアス: `@/*` → `src/*`（tsconfig.json / vite.config.ts）
