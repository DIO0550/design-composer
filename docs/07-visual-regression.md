# Storybook Visual Regression Plan

Storybook を GitHub Pages にデプロイするだけでなく、PR ごとの UI 差分を確認できる visual regression を追加する方針をまとめる。

## 結論

可能。現行の構成では Storybook を `gh-pages` にデプロイ済みなので、visual regression は次の 2 段階に分けるのが扱いやすい。

1. PR CI で Storybook をビルドし、各 story のスクリーンショットを取得する。
2. `main` の baseline スクリーンショットと比較し、差分画像を GitHub Actions artifact と PR コメントから確認できるようにする。

GitHub Pages は「レビュー用の公開 URL」、Actions artifact は「diff の詳細確認先」として役割を分ける。

## 推奨構成

### 1. スクリーンショット取得

- Storybook を静的ビルドする。
- GitHub Actions runner の Chrome と `odiff-bin` を使う。ローカルでは Google Chrome / Chromium が必要。
- Storybook の `index.json` を読み、story ごとに `iframe.html?id=<story-id>` を開いて撮影する。
- viewport はまず `1280x720` に固定する。
- アニメーション・カーソル・現在時刻などの非決定要素は story 側で固定する。

### 2. baseline の保存

このリポジトリでは `gh-pages` を Storybook 配信用にすでに使っているため、`gh-pages/visual-baseline/` に保存する。

### 3. diff の見せ方

PR workflow で以下を生成し、artifact にアップロードする。

```text
visual-report/
  index.html              # Overlay / Split / Slider 付きのリッチレポート
  summary.json            # CI コメント生成用の機械可読サマリ
  actual/*.png            # PR の撮影結果
  expected/*.png          # main baseline
  diff/*.png              # 差分画像
```

## 実装済みの構成

spec-viewer と同じ構成を採用している。

- `.github/scripts/storybook-visual-regression.mjs`
  - `capture`: 静的ビルド済み Storybook を一時 HTTP server で配信し、Chrome DevTools Protocol 経由で story ごとの PNG を生成する。
  - `compare`: baseline / actual の PNG を `odiff-bin` で比較し、`visual-report/summary.json` と Overlay / Split / Slider 付きの `visual-report/index.html` を生成する。
- `.github/workflows/storybook-visual-regression.yml`
  - PR ごとに Storybook をビルドし、`gh-pages/visual-baseline/` と比較する。
  - `visual-report/` を GitHub Actions artifact としてアップロードし、`gh-pages/visual-regression/pr-{PR番号}/` へも公開する。
  - PR コメントに結果、リッチ diff レポート URL、artifact URL、Storybook preview URL を投稿する。
  - 閾値超過の差分がある場合は job を失敗させる。
  - PR close 時は `gh-pages/visual-regression/pr-{PR番号}/` を削除する。
- `.github/workflows/deploy-storybook-main.yml`
  - `main` の Storybook デプロイ時に `visual-baseline/` も更新する。
  - `pr-preview/` と `visual-regression/` は保持する。

## 閾値の初期値

- pixel threshold: `0.1`
- story 全体の許容差分率: `0.2%` (`max-diff-ratio 0.002`)

## ローカル実行

```bash
pnpm build-storybook
pnpm visual:capture -- --storybook-dir storybook-static --out visual-actual
pnpm visual:compare -- --expected visual-baseline --actual visual-actual --out visual-report
```

ローカルで `visual:capture` を実行するには Google Chrome / Chromium が必要。`CHROME_BIN` で実行ファイルを指定できる。
