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

## 規約一覧(常時ロード)

- @rules/architecture.md — フォルダ構造・依存方向・ロジックの帰属先・services / utils の責務
- @rules/coding.md — コンパニオンオブジェクトパターン・イミュータブル・Result / Option・型による境界・禁止事項
- @rules/naming.md — 命名(名前と実体の一致・汎用語の禁止・ファイル名)
- @rules/testing.md — テスト配置・テストの書き方(ネスト禁止)
- @rules/hooks.md — useEffect / useState / useReducer / カスタムフックの使い方
- @rules/components.md — コンポーネント設計(Composition パターン)
- @rules/ui-verification.md — UIの表示確認手順(playwright-cli)

## 規範と判例を分ける

`rules/` に置くのは**規範**(こうする)だけ。**判例**(この回こうだった / NG・OK の実例 /
このリポジトリ固有のシンボル名 / PR 番号)は `harness/case-law/` に置き、**常時ロードしない**
(判例は毎回増え、規範は増えない)。

- 判断軸は「**別のリポジトリへ持っていって意味が通るか**」。通るなら `rules/`、通らないなら判例
- 読むのは**その分類で迷ったとき・指摘を受けたとき**と検証エージェント。書けるのは `harness-growth` だけ

## 常時ロードは増やさない

**`AGENTS.md` + `rules/` の合計は、`harness/records/count.sh` の `always_loaded_budget` と一致する。**
足すなら同量を削る。予算は縮めたときに下げるだけで、上げない。

削ることは足すことと同じ重さの介入で、後回しにしない。常時ロードの 1 行は書く側が 1 回払うの
ではなく読む側が毎セッション払い、積もった文章は初期の設計を固定して次の回が試す範囲を狭める。
放っておくと削る側は発火しない(数字で候補を出すまで、`rules/` が正味マイナスになったコミットは
全履歴で 0 件だった)ので、予算は固定の閾値ではなく下げるだけのラチェットにする。

- 検査: `bash harness/records/count.sh --ratchet`(ずれていれば pre-push と CI が落ちる)
- 削り先が出せないなら、その追加は `rules/` ではなく判例かフックに置く

## 実装の進め方

実装は `implementation-flow` スキルの手順で進める(`.claude/skills/implementation-flow/`)。
ゴールの確定 → タスクの分割 → 計画 → **計画の検証(`plan-reviewer`)** → 実装 →
**実装の検証(`implementation-reviewer`)** → PR → マージ後の追記、までが1セット。

検証の観点は `.claude/agents/` のサブエージェントが持つ(検証のときにしか要らないものを
常時ロードへ入れないため)。

**計画・却下した案・その理由は、すべて Issue に追記する**(PR 本文は差分の説明、Issue は
判断の履歴。採用した案だけ残すと、同じ案が再浮上したときに前回やめた理由が失われる)。

マージ後は `harness-record` スキルでその回の評価を記録する
(`.claude/skills/harness-record/`)。記録を数えて規約やフックへ手を入れるのは
`harness-growth` スキル(`.claude/skills/harness-growth/`)で、別の機会に行う。

## タスクの分割

**タスクが大きくなりそうな場合は、Issue を分離して新たに登録する。** 1 つに抱え込むと
計画が「やることの列挙」になって判断が残らず、レビューも差分がまとまって一度に読めなくなる。

- 判断軸は「**独立してマージできるか**」。片方だけ入っても壊れない単位が2つ以上見えたら分ける
- 分けたら、元の Issue に**分割した理由**とリンクを残す。分けた側にも「何をスコープ外に
  したか」を書く
- 分けないと決めた場合も、**その理由を Issue に書く**。分けないこと自体が判断なので、記録の対象になる

## 着手した Issue は、その回で閉じる

**着手したら自分をアサインし、PR 本文の `Closes #<番号>` で閉じる。** 手では閉じない
(検査は `.github/workflows/pr-closing-issue.yml`。例外は `harness-record` の記録 PR だけ)。

- 続きが要るものは**新しい Issue を立てて元からリンクする**。閉じた Issue は開け直さない
  (その回に変わった判断は、閉じたままコメントで残す → `implementation-flow` フェーズ 8)
- PR を出さずに止まったものと、子へ分割した親 Issue は open のままでよい(閉じる起点が来ない)

## 実装を始める前に

実装前・PR 前に読む順(自己チェックの観点は `rules/` にあり、ここには写さない)。

1. `rules/architecture.md`「ロジックの帰属先」「services はドメインを探してから使う」
2. `rules/coding.md`「エラーと不在の表現」「値の語彙を型で閉じる」「不正な状態を型で表現できなくする」「関数のシグネチャ」
3. `rules/naming.md`「名前と実体を一致させる」「その名前が既に別の意味を持っていないか確認する」

迷ったら `harness/case-law/` の同名ファイルを開く(過去に同じ形で指摘された実例がある)。

## 規約の更新

レビューで新しい判断基準が示されたら、その場の修正で終わらせない。**ルールに書くくらいなら
フックにする。** 機械的に判定できないものは判例(`harness/case-law/`)に置き、`rules/` は増やさない。

材料は `harness/records/`(マージのたびに `harness-record` スキルが記録を 1 ファイル追加する)。
数えるのは `harness/records/count.sh` で、**人・bot・CI へ届いた指摘が、まだ閉じていない窓の
中に 2 回以上**ある分類にだけ手を入れる(手順は `harness-growth`)。

**規約を直すときは、同じファイルが既に持っている記述・例と突き合わせる**(判定文が規約自身の
例で逆の答えを出す / 前の節と矛盾する / 表の行が網羅していない、が起きる)。

## 設計判断の確認

層をまたぐ移動や既存モジュールの再配置など、**他の規約と衝突しうる変更**は、実装前に選択肢と根拠を示して確認する(勝手に進めず、判断だけを仰ぐ)。

## Issue に紐づいて起動したら、セッションの URL を Issue に残す

Issue に紐づく作業を始めたら、**着手した時点で**その Issue へセッションの URL
(`https://claude.ai/code/session_<id>`)をコメントし、判断待ちで止まるときも選択肢と根拠に併記する。

**経緯はそのセッションの中にしか無い。** Issue だけを見ている人と、あとから引き継ぐ別の
セッションが辿れるように、止まってからではなく着手時に残す(通知は流れるが Issue は残る)。
フックにできない理由は [`harness/case-law/process.md`](harness/case-law/process.md)。

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
