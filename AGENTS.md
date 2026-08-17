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
このリポジトリ固有のシンボル名)は `harness/case-law/` に置き、**常時ロードしない**。

- 判断軸は「**別のリポジトリへ持っていって意味が通るか**」。通るなら `rules/`、通らないなら判例
- 判例を読むのは、**その分類で実際に迷ったとき・指摘を受けたとき**と、検証エージェント
- 判例を書けるのは `harness-growth` だけ(`harness/case-law/README.md`)

**理由: 判例は毎回増え、規範は増えない。** 同じファイルに置くと常時ロードが単調増加する。

## 常時ロードには上限がある

**`AGENTS.md` + `rules/` の合計を 900 行以内に保つ。** これを超えたら、足す前に同量を削る
(削り先が出せないなら、その追加は `rules/` ではなく判例・観点・フックのどれかに置く)。

- 数え方: `wc -l AGENTS.md rules/*.md`
- 閾値に達してから棚卸しするのではなく、**追加のたびに払う**。閾値方式は「超えるまで増え続ける」
  ことを許すので、超えた時点で必ず大きな棚卸しが要る
- 上限そのものの見直しは `harness-growth` の Step 3

## 実装の進め方

実装は `implementation-flow` スキルの手順で進める(`.claude/skills/implementation-flow/`)。
ゴールの確定 → タスクの分割 → 計画 → **計画の検証(`plan-reviewer`)** → 実装 →
**実装の検証(`implementation-reviewer`)** → PR → マージ後の追記、までが1セット。

検証の観点は `.claude/agents/` のサブエージェントが持つ。ここにも `rules/` にも置かないのは、
**検証のときにしか要らないものを常時ロードへ入れないため**。

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
- 分けないと決めた場合も、**その理由を Issue に書く**。分けないこと自体が判断なので、記録の対象になる

## 実装を始める前に

自己チェックの観点は `rules/` にある。**同じ内容をここに写さない**(2 箇所に置くと片方だけ
古くなる)。実装前・PR 前に読む順は次の通り。

1. `rules/architecture.md`「ロジックの帰属先」「services はドメインを探してから使う」
2. `rules/coding.md`「エラーと不在の表現」「値の語彙を型で閉じる」「不正な状態を型で表現できなくする」「関数のシグネチャ」
3. `rules/naming.md`「名前と実体を一致させる」「その名前が既に別の意味を持っていないか確認する」

迷ったら `harness/case-law/` の同名ファイルを開く(過去に同じ形で指摘された実例がある)。

## 規約の更新

レビューで新しい判断基準が示されたら、その場の修正で終わらせず反映する。**ルールに書かれて
いない指摘が2回以上出たら、規約の抜けとして扱う。**

回数を数える材料は `harness/records/` に溜まる(マージのたびに `harness-record`
スキルが記録を1ファイル追加する)。数えるのは `harness/records/count.sh`。
**通算ではなく「最後の介入以降の再発数」で見る**(通算は単調増加するので、介入が効いたかを
表さない)。同じ層で再発したら層を1つ上げる。手順は
`.claude/skills/harness-growth/SKILL.md`「Step 1」「Step 2」。

**規約に足すときは、同じファイルが既に持っている記述・例と突き合わせる**
(`分類: rules-consistency`。判定文が規約自身の例で逆の答えを出した / 前の節と矛盾した /
表の行が網羅していなかった、が実際に起きている)。手順は `harness-growth` の Step 2。

## 設計判断の確認

層をまたぐ移動や既存モジュールの再配置など、**他の規約と衝突しうる変更**は、実装前に選択肢と根拠を示して確認する(勝手に進めず、判断だけを仰ぐ)。

## Issue に紐づいて起動したら、セッションの URL を Issue に残す

Issue に紐づく作業でセッションが始まったら、**着手した時点で**その Issue へ
Claude Code セッションの URL をコメントする(`https://claude.ai/code/session_<id>`)。
判断待ちで止まるときは、**選択肢と根拠を書いたコメントに改めて併記する**。

**理由: 経緯はそのセッションの中にしか無い。** どこまで読んだか・何を確かめて選択肢を絞ったかは
Issue のコメントに書ききれず、Issue だけを見ている人と、あとから引き継ぐ**別のセッション**が
辿れなくなる。**止まってから残すのでは遅い**(止まるかどうかは着手時には決まっていない)。
通知(Discord 等)にだけ載せるのでは足りない — 通知は流れるが Issue は残る。

層 3 まで上げてある(`session-url-notice.sh` / SessionStart)。**なぜ層 2・層 1 へ上げられないか**は
[`harness/case-law/process.md`](harness/case-law/process.md)。

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
