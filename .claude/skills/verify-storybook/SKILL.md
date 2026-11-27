---
name: verify-storybook
description: "Storybook の実ブラウザで UI の操作と表示を検証し、PNG と確認結果を残す。編集画面の確認、Issue に指定された UI の再現、ドラッグ中の撮影、操作の前後を比較するときに使う。"
---

# Storybook で動作を検証する

対象の story・操作・期待する見え方を確認する。操作による状態変化を確かめる場合は、固定の props を受け取る単体 story ではなく、編集画面全体を組み立てる story（OpenedDocumentEditor など）を選ぶ。アプリの編集画面を開く導線は Tauri の IPC / ダイアログを使うため、開発サーバー上のアプリを直接開く手順ではなく Storybook を使う。

## 一度で実行する

リポジトリのルートで実行する。Node 24、`pnpm install --frozen-lockfile` で導入した依存関係、Chrome / Chromium が必要。Chrome が PATH に無ければ `CHROME_BIN` に実行ファイルを指定する。

```bash
node .github/scripts/verify-storybook.mjs \
  --story features-editor-openeddocumenteditor--absolute-node \
  --steps .claude/skills/verify-storybook/examples/add-edit-drag.json
```

- `--story ID` の代わりに `--title 'features/editor/OpenedDocumentEditor' --name '絶対配置のノードがある編集画面'` も使える。名前は完全一致で、一意に選べないと失敗する。
- 毎回一時ディレクトリに Storybook を静的ビルドする。手元に対象コミットのビルドがあるときは `--storybook-dir DIR` で再利用できる。使うビルドが対象コミットのものか確認してから渡す。
- 結果は標準出力と `report.json`、画像は同じ出力先に保存される。既定は新しい一時ディレクトリで、場所は `reportPath` に出る。明示するなら `--out DIR` に未使用の出力先を渡す。

## 操作を指定する

`--steps FILE` に JSON 配列を渡す。要素を指定するときは一意な CSS セレクターを使う。可能なら `aria-label` など意味のある属性で絞る。操作は配列の順に実行される。

| `kind` | フィールド |
| --- | --- |
| `click` / `double-click` | `selector` |
| `fill` | `selector`、テキスト入力欄に入れる `value` |
| `press` | `key`（Enter / Escape / Tab / Backspace） |
| `pointer-down` | `selector` または画面内の `x` と `y` |
| `pointer-move` | `x` と `y`、または現在位置からの `dx` と `dy` |
| `pointer-up` | 省略すると現在位置。位置を指定するなら `x` と `y` |
| `expect-visible` | `selector` と、何を確かめるかを書く `description` |
| `expect-text` | `selector`、前後の空白を除いた表示文言との完全一致値 `expected`、`description` |
| `capture` | 拡張子のない一意な画像名 `name`（英数字で始め、英数字・ハイフン・アンダースコアを使用）と `description` |

ドラッグ中は `pointer-down` → `pointer-move` → `capture` → `pointer-up` の順にし、押したままの間に撮影する。撮影を指定しなければ成功時の最後の画面を撮る。静止画だけなら `--steps` を省略してよい。

## 何を確かめたか残す

1. `report.json` で選ばれた story とチェックの期待値・観測値を確認する。不成立時は非ゼロ終了になる。報告に残った撮影済みの画像と、止まった理由を確認する。
2. PNG を目視し、表示の崩れ・重なり・はみ出しがなく、意図した見え方になったかを確かめる。ドラッグ中は操作対象が写っていることも見る。自動チェックが通っても目視したことにはならない。
3. 作業ログや PR に取得コマンド、何を確かめたか、結果と画像を添える。スクリーンショットは VRT のベースライン比較や撮影範囲の検査の代わりにはしない。

手動で story を調べるときは `pnpm storybook`（ポート 6006）を起動し、`http://localhost:6006/index.json` で ID を探して `http://localhost:6006/iframe.html?id=<storyId>&viewMode=story` を開く。

検証 CLI 自体を変えたときは `node .github/scripts/verify-storybook-browser-cases.mjs` で、入力先・押下先・クリップの境界を実ブラウザで再確認する。
