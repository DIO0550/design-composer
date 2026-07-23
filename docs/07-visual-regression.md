# Storybook Visual Regression Plan

Storybook を GitHub Pages にデプロイするだけでなく、PR ごとの UI 差分を確認できる visual regression を追加する方針をまとめる。

## 結論

可能。現行の構成では Storybook を `gh-pages` にデプロイ済みなので、visual regression は次の 2 段階に分けるのが扱いやすい。

1. PR CI で Storybook をビルドし、各 story のスクリーンショットを取得する。
2. `main` の baseline スクリーンショットと比較し、差分画像を GitHub Actions artifact と PR コメントから確認できるようにする。

GitHub Pages は「レビュー用の公開 URL」、Actions artifact は「diff の詳細確認先」として役割を分ける。Pages 配下に diff を永続公開することも可能だが、失敗時の証跡は artifact の方が権限・保持期間・削除の制御が簡単。

## 推奨構成

### 1. スクリーンショット取得

- Storybook を静的ビルドする。
- GitHub Actions runner の Chrome と ImageMagick を使う。ローカルでは Google Chrome / Chromium と ImageMagick が必要。
- Storybook の `index.json` を読み、story ごとに `iframe.html?id=<story-id>` を開いて撮影する。
- viewport はまず `1280x720` に固定する。
- アニメーション・カーソル・現在時刻などの非決定要素は story 側で固定する。

### 2. baseline の保存

候補は 2 つある。

- **GitHub Actions artifact**: `main` push 時に baseline を artifact として保存する。履歴管理は楽だが、PR から最新 artifact を取得する処理が必要。
- **`gh-pages` 配下**: `visual-baseline/` に `main` の画像を配置する。PR workflow から取得しやすいが、Pages の公開物が増える。

このリポジトリでは `gh-pages` を Storybook 配信用にすでに使っているため、初期導入は `gh-pages/visual-baseline/` に保存する方式がシンプル。

### 3. diff の見せ方

PR workflow で以下を生成し、artifact にアップロードする。

```text
visual-report/
  index.html              # 変更 story の一覧と before / after スライダー / diff
  summary.json            # CI コメント生成用の機械可読サマリ
  actual/*.png            # PR の撮影結果
  expected/*.png          # main baseline
  diff/*.png              # 差分画像
```

PR コメントには以下を載せる。

- 変更 story 数
- 最大差分率
- artifact へのリンク
- Storybook PR Preview URL

`index.html` を artifact または PR ごとの Pages URL として開けば、before / after のスライダー比較と diff 画像を確認できる。

## 実装候補

### 候補 A: Chrome DevTools Protocol + ImageMagick を自前実装

- 追加 npm dependency なし。GitHub Actions の Chrome と ImageMagick を使う。
- メリット: npm dependency を増やさず、GitHub Pages / Actions に閉じて運用できる。
- デメリット: レポート HTML、baseline 更新、閾値調整を自前で持つ必要がある。

### 候補 B: Storybook Test Runner + image snapshot

- 追加 devDependencies: `@storybook/test-runner`, `jest-image-snapshot` など。
- メリット: Storybook との相性がよく、story 単位の実行が自然。
- デメリット: Jest 系の設定が増え、現行の Vitest 中心構成から少し外れる。

### 候補 C: Chromatic / Percy などの SaaS

- メリット: baseline 管理、差分 UI、承認フローが最も強い。
- デメリット: 外部サービス・トークン・料金・権限設計が必要。

まずは **候補 A** で実装する。現行の GitHub Actions と Pages の延長で始められ、diff HTML も artifact として見られる。

## CI フロー案

### main push

1. `pnpm install --frozen-lockfile`
2. `pnpm build-storybook`
3. Storybook から baseline screenshot を生成
4. `gh-pages/visual-baseline/` を更新
5. Storybook 本体を `gh-pages` ルートへデプロイ

### pull request

1. `pnpm install --frozen-lockfile`
2. `pnpm build-storybook`
3. `gh-pages/visual-baseline/` を取得
4. PR の screenshot を生成
5. baseline と比較して `visual-report/` を生成
6. `visual-report/` を artifact にアップロード
7. PR コメントに結果と artifact / Storybook Preview URL を投稿
8. 差分率が閾値を超えた場合は job を失敗させる

## 閾値の初期値

- pixel threshold: `0.1`
- story 全体の許容差分率: `0.2%`
- 新規 story: warning 扱い。baseline がないため PR では失敗させない。
- 削除 story: warning 扱い。main 側 baseline の掃除は main push 時に行う。

## 注意点

- GitHub Pages の PR Preview は「目視レビュー URL」として残し、visual regression の pass/fail とは独立させる。
- diff 画像を Pages に公開すると古い PR の画像が残りやすい。初期導入では artifact の retention を短く設定する。
- スクリーンショットの安定性が CI の信頼性を左右するため、ランダム値・時刻・フォント読み込み・アニメーションは story 側で固定する。
- UI が大きく変わる PR では、レビュー後に main にマージすることで baseline が自動更新される運用にする。PR から baseline を直接更新しない。

## 実装済みの構成

- `.github/scripts/storybook-visual-regression.mjs`
  - `capture`: 静的ビルド済み Storybook を一時 HTTP server で配信し、Chrome DevTools Protocol 経由で story ごとの PNG を生成する。
  - `compare`: baseline / actual の PNG を ImageMagick `compare -metric AE` で比較し、`visual-report/summary.json` とスライダー付きの `visual-report/index.html` を生成する。
- `.github/workflows/storybook-visual-regression.yml`
  - PR ごとに Storybook をビルドし、`gh-pages/visual-baseline/` と比較する。
  - `visual-report/` を GitHub Actions artifact としてアップロードし、`gh-pages/visual-regression/pr-{PR番号}/` へも公開する。
  - PR コメントに結果、リッチ diff レポート URL、artifact URL、Storybook preview URL を投稿する。
  - 閾値超過の差分がある場合は job を失敗させる。
  - PR close 時は `gh-pages/visual-regression/pr-{PR番号}/` を削除する。
- `.github/workflows/deploy-storybook-main.yml`
  - `main` の Storybook デプロイ時に `visual-baseline/` も更新する。

## ローカル実行

```bash
pnpm build-storybook
pnpm visual:capture -- --storybook-dir storybook-static --out visual-actual
pnpm visual:compare -- --expected visual-baseline --actual visual-actual --out visual-report
```

ローカルで `visual:capture` を実行するには Google Chrome / Chromium が必要。`CHROME_BIN` で実行ファイルを指定できる。
