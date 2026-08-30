# 05. アーキテクチャ

- headless core / UI 層を一方向依存で分離。
- **core（スキーマ定義＋HTML/CSSコンパイラ＋バリデーション）は TS 側**。
- **Rust は永続化I/O（JSONの読み書き・file watch）に絞る**。

## パッケージ構成

**core は概念であってディレクトリ名ではない。** `src/` 直下のどのフォルダが core 側（`domains` / `services` / `libs` / `utils` / `types`）でどれが UI 側（`app` / `features` / `components` / `hooks`）か、どの向きに import してよいかは [`rules/architecture.md`](../rules/architecture.md)「依存方向のルール」が規定する。**当初ここに書いていた「境界に lint ツールを足さず、レビューと指示で守る」という方針は撤回済み**で、いまは lint と hook で機械的に検査している。

- **単一パッケージ＋ `src/` 配下のレイヤ分割**から始める。pnpm workspace によるパッケージ分離は行わない
- core → UI の import は禁止（一方向依存）
- core を外部利用したくなった時点で workspace 化する（レイヤ境界を保っていれば移行は機械的）

## core のモジュール分割

**モジュールは責務の単位で、フォルダ名とは 1 対 1 にならない。** 実体の列は、責務の文が指している処理の現在の置き場所（そのモジュールに属するフォルダの全列挙ではない）。

| モジュール | 責務 | 依存 | 実体 |
|---|---|---|---|
| `schema` | プリミティブ定義の TS 定数と型（03-schema） | なし | `src/domains/dcmp/primitive-schema` |
| `document` | ノード・部品・トークンの型、ツリー操作（挿入 / 移動 / 部品化 / detach / 自動リネーム） | schema | `src/domains/dcmp/` の `design-document` / `node` / `node-tree`（型とツリー操作）、`component` / `component-binding`（部品）、`token`（トークン）、`name-space`（一意名と自動リネーム） |
| `validator` | 03 の全エラー検出（重複キーの字句スキャンを含む） | schema, document | `src/domains/dcmp/design-document/validation`。ただし重複キーだけは検証ではなく**読み込み時**に見つかる（serializer 側の字句スキャン） |
| `compiler` | ドキュメント → HTML/CSS（カスタムプロパティ＋インライン style）。ref / overrides の合成 | schema, document | 合成は `src/domains/dcmp/` の `expanded-node`（ref の展開）と `resolved-props`（既定値の解決）、HTML/CSS の組み立ては `src/services/` の `document-html` / `node-html` / `token-css`、描画用の表現は `src/domains/compiled/` |
| `serializer` | JSON ⇔ ドキュメントの正規化入出力。フォーマット差し替えの閉じ込め先（外部フォーマットの解釈なので `libs/`） | document | `src/libs/document-json` / `src/libs/json-lexical-scanner` |

- UI 層はこれらを呼ぶだけのクライアントとする

## Tauri IPC

Rust に .dcmp の構造を一切教えず、IPC を渡るのは**常に生の JSON 文字列**とする。パース・検証・マイグレーションはすべて TS 側。

| 種別 | 名前 | 内容 |
|---|---|---|
| command | `load_document(path) → string` | ファイル読み込み |
| command | `save_document(path, content)` | アトミック書き込み（tmp + rename）。自書き込みの識別を行う |
| command | `watch_document(path)` / `unwatch_document(path)` | file watch の開始 / 停止 |
| event | `document-changed` | 外部変更の通知（Rust → JS） |

- ファイルを開くダイアログ等は Tauri 標準プラグインを使用する

## 保存モデル: 自動保存

- GUI の編集は明示的な保存操作なしに、**デバウンス付きで即座にファイルへ書き込む**（Figma 型）
- 「アプリの中にだけ存在する未保存状態」を最小化する。source of truth は常にファイルであり、GUI も AI も対等な「ファイルへの書き手」となる
- undo / redo はアプリのメモリ内で管理する。undo の適用も通常の編集としてファイルへ自動保存される
- ここで規定するのは**ドキュメント本体**の永続化だけ。アプリ自身の状態（最後に開いたパス・最近使ったファイル等）の置き場と、同時に開けるドキュメントの数は規定しない

### 書き込みの安全性

- 書き込みは**アトミック**に行う（一時ファイルへ書いて rename）。外部の読み手（AI・エディタ）が部分書き込み状態を読むことを防ぐ
- 自アプリの書き込みを file watch が検知して再リロードする**自己ループを防止**する（自書き込みの識別）

## 外部編集の検知

- ファイルを watch し、外部（AI・エディタ・git 操作等）による変更を検知したら再読み込みする
- 読み込んだ内容が**正常**: 即リロードして再描画する（自動保存により GUI 側に未保存変更は存在しないため、無条件に安全）
- 読み込んだ内容が**不正**: 最後に正常だった状態のレンダリングを保持し、エラー一覧を重ねて表示する（03-schema「不正ファイル時の挙動」）

## 競合の解決

- 保存は **last-write-wins**。書き込みが交差した場合は後の書き込みが残る
- マージ・確認ダイアログは持たない。GUI 側の失われた変更は undo バッファから復元できる
- Git 上の履歴管理・コミット単位はユーザーの責任範囲とし、ツールは関与しない
