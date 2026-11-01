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
| `document` | ノード・部品・トークンの型、ツリー操作（挿入 / 移動 / 部品化 / detach / 自動リネーム） | schema | `src/domains/dcmp/` の `design-document` / `node` / `node-tree`（型とツリー操作）、`component` / `component-binding`（部品）、`token`（トークン）、`document-names`（一意名と自動リネーム） |
| `validator` | 03 の全エラー検出（重複キーの字句スキャンを含む） | schema, document | `src/domains/dcmp/design-document`（走査は `DesignDocument.collectErrors` と本体の非公開関数、違反からエラーへの詰め替えは `src/domains/dcmp/design-document/validation-error`）。ただし重複キーだけは検証ではなく**読み込み時**に見つかる（serializer 側の字句スキャン） |
| `compiler` | ドキュメント → HTML/CSS（カスタムプロパティ＋インライン style）。ref / overrides の合成 | schema, document | 合成は `src/domains/dcmp/` の `expanded-node`（ref の展開）と `resolved-props`（既定値の解決）、HTML/CSS の組み立ては `src/services/` の `document-html` / `node-html` / `token-css`、描画用の表現は `src/domains/compiled/` |
| `serializer` | JSON ⇔ ドキュメントの正規化入出力。フォーマット差し替えの閉じ込め先（外部フォーマットの解釈なので `libs/`） | document | `src/libs/document-json` / `src/libs/json-lexical-scanner` |

- UI 層はこれらを呼ぶだけのクライアントとする

## Tauri IPC

Rust に .dcmp の構造を一切教えず、IPC を渡るのは**常に生の JSON 文字列**とする。パース・検証・マイグレーションはすべて TS 側。

| 種別 | 名前 | 内容 |
|---|---|---|
| command | `canonicalize_document_path(path) → string` | 同じファイルを指す別の綴り（symlink 経由・`.` や続いた区切りを含む・macOS / Windows での大小違い）を 1 つの綴りへ寄せる。TS は寄せた綴りで他のドキュメントのコマンドを呼ぶ |
| command | `choose_open_document_path() → string \| null` / `choose_save_document_path() → string \| null` | 開くファイル / 保存先を選ぶダイアログを出し、選ばれたパスを選ばれたファイルの記録へ載せて寄せた綴りを返す（閉じたら `null`）。選ばれたものを受け付けられないときは `invalidPath`（下記） |
| command | `load_document(path) → string` | ファイル読み込み |
| command | `save_document(path, content)` | アトミック書き込み（tmp + rename）。自書き込みの識別を行う |
| command | `watch_document(path)` / `unwatch_document(path)` | file watch の開始 / 停止 |
| command | `load_app_state() → string \| null` | アプリ自身の状態の読み込み（まだ保存が無ければ `null`） |
| command | `save_app_state(content)` | アプリ自身の状態の書き込み |
| command | `close_current_window()` | 呼び出し元のウィンドウを閉じる |
| event | `document-changed` | 外部変更の通知（Rust → JS） |
| event | `document-menu` | OS のメニューで選ばれた項目（`open` / `create` / `close-tab`）の通知（Rust → JS） |
| event | `document-dropped` | ウィンドウへ落とされたファイルの通知（Rust → JS）。選ばれたファイルの記録へ載せたものは寄せた綴りで、載せられなかったものは落とされた綴りのまま並ぶ |

- ファイルを開く / 保存先を決めるダイアログは Tauri 標準プラグインを **Rust から**出す。webview にはダイアログの権限を与えない（選ばれたパスを webview を経由せずに記録へ載せるため）
- `.dcmp` 以外を選んだとき・選ばれたパスを UTF-8 で表せないときは、選ぶコマンドが `invalidPath` を返す
- ドキュメントを開く / 新しく作る指示は、OS のメニュー（⌘O / ⌘N）とウィンドウへのドロップ、および開く前の画面から届く
- 見ているタブを閉じる指示（⌘W）も OS のメニューから届く。開いているものが無ければ TS が `close_current_window` でウィンドウを閉じる（タブの有無は TS だけが持つ）。ウィンドウを閉じる項目（Shift+⌘W）は TS へ流さず Rust 側で閉じる
- `canonicalize_document_path` / `load_document` / `save_document` / `watch_document` / `unwatch_document` が受け付けるパスは、拡張子が `.dcmp`（大文字小文字は問わない）の絶対パスで、`..` の要素を含まず、ファイル名で終わり、ファイル名に `:` を含まないものだけ。それ以外は `invalidPath` で拒否し、ファイルには触れない
- `load_document` / `save_document` / `watch_document` / `unwatch_document` は、さらに渡された綴りが選ばれたファイルの記録（下記）に**綴りのまま**あるものだけを受け付ける。無ければ `notChosen` で拒否し、ファイルには触れない。同じファイルを指す別の綴りも通さない。`canonicalize_document_path` は記録を見ない
- `canonicalize_document_path` は、寄せた綴りが上の条件を満たさないとき（実体が `.dcmp` でない symlink など）と、寄せた綴りを UTF-8 で表せないときも `invalidPath` で拒否する
- Linux では大小違いを寄せない（大小違いの綴りは別のファイルとして扱う）
- symlink 経由で開いたものは実体へ保存する（綴りを寄せた結果、保存先も実体の綴りになる）

## 保存モデル: 自動保存

- GUI の編集は明示的な保存操作なしに、**デバウンス付きで即座にファイルへ書き込む**（Figma 型）
- 「アプリの中にだけ存在する未保存状態」を最小化する。source of truth は常にファイルであり、GUI も AI も対等な「ファイルへの書き手」となる
- undo / redo はアプリのメモリ内で管理する。undo の適用も通常の編集としてファイルへ自動保存される
- ここで規定するのは**ドキュメント本体**の永続化。アプリ自身の状態の置き場は下記「アプリ自身の状態」
- 同時に複数のドキュメントを開ける（06-ui「開いているドキュメントの行き来」）。自動保存と外部変更の監視は**開いているドキュメントごとに 1 組**で、見えていないものについても続く

### 書き込みの安全性

- ドキュメント本体の書き込みは**アトミック**に行う（一時ファイルへ書いて rename）。外部の読み手（AI・エディタ）が部分書き込み状態を読むことを防ぐ（アプリ自身の状態・選ばれたファイルの記録はアトミックにしない。下記）
- 自アプリの書き込みを file watch が検知して再リロードする**自己ループを防止**する（自書き込みの識別）

## アプリ自身の状態

ドキュメントの外に残す状態（最近使ったファイル等）は、**OS のアプリ設定ディレクトリの `app-state.json`** に持つ。どのドキュメントにも属さない状態なので .dcmp には置けない。開いてよいファイルの記録はここではなく別のファイルに持つ（下記「選ばれたファイルの記録」）。

- 中身は .dcmp と同じく **TS 側だけが解釈**し、IPC を渡るのは生の JSON 文字列
- 今持つのは**最近使ったファイルのパスの並び**だけ。ズーム / パン・選択は非永続（06-ui）なのでここに含めない
- 書き込みはアトミックにしない。ドキュメント本体と違い、失われても開き直せば作り直せる

## 選ばれたファイルの記録

ドキュメントのコマンドに渡してよいパスは、利用者がダイアログで選んだ・ウィンドウへ落とした・過去にそうして記録に残っているものに限る。その記録を **OS のアプリ設定ディレクトリの `chosen-documents.json`**（寄せた綴りの JSON 配列、新しい順）に持つ。

- 書くのは **Rust だけ**。載るのはダイアログで選ばれたパスと、ウィンドウへ落とされたパスの寄せた綴りで、webview から足す口は無い
- `app-state.json` の最近使ったファイルからは作らない。webview が書けるファイルなので、そこから作ると webview が任意のパスを載せられる
- そのため、この記録を入れる前から最近使ったファイルに残っていたパスは、更新して最初の起動では開けず、`開く` で選び直すことになる（一覧からは外さない）
- ドロップは、Rust が記録へ載せてから `document-dropped` を出す。Tauri 自身の `tauri://drag-drop` は記録へ載せる前に webview へ届くので、それを見て開くと載せる前に `load_document` が届きうる
- 読み込めたパスは並びの先頭へ移す。常用しているファイルが、新しく選んだものに押されて記録から外れないようにする。保存のたびには並べ替えない（編集のたびに記録を書き出すことになる）
- 記録ファイルに残すのは新しいものから **50 件**。起動中にメモリで持つ集合には上限を置かない（タブを多く開いたとき、古いタブの自動保存が `notChosen` にならないように）
- 記録ファイルへ書き出すのは、並びが変わったときだけ
- 書き込みはアトミックにしない。記録が無い・JSON として壊れているときは空として扱い、次に選んだときに作り直す
- 記録ファイルを読めない（権限が無い・UTF-8 として読めない等）ときも空として起動するが、その起動中は記録ファイルへ書き出さない。一時的に読めなかっただけで書き出すと、残っていた記録が選んだ 1 件に置き換わり、次の起動で最近使ったファイルのほとんどが `notChosen` になる
- 設定ディレクトリを解決できないときも起動は止めず、記録ファイルを持たずに動く
- 記録が読めない・書けないことは、起動も選ぶ・開く操作も失敗にしない。起動中の照合はメモリの集合で続き、失われるのは次の起動で選び直さずに開けることだけなので、選び直せば済む
- `app-state.json` と合わせて 2 ファイルになるが、「複数ファイルに跨る保存」には当たらない。2 つは同時に正しくなければならない塊ではなく、記録が欠けても `notChosen` から選び直しに落ちるだけで、どちらも他方を壊さない

## 外部編集の検知

- ファイルを watch し、外部（AI・エディタ・git 操作等）による変更を検知したら再読み込みする
- 読み込んだ内容が**正常**: 即リロードして再描画する（自動保存により GUI 側に未保存変更は存在しないため、無条件に安全）
- 読み込んだ内容が**不正**: 最後に正常だった状態のレンダリングを保持し、エラー一覧を重ねて表示する（03-schema「不正ファイル時の挙動」）

## 競合の解決

- 保存は **last-write-wins**。書き込みが交差した場合は後の書き込みが残る
- マージ・確認ダイアログは持たない。GUI 側の失われた変更は undo バッファから復元できる
- Git 上の履歴管理・コミット単位はユーザーの責任範囲とし、ツールは関与しない
