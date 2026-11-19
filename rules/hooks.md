# Hooks 規約

## useEffect: 最終手段として扱う

`useEffect` は「外部システムとの同期」専用とする。React 公式 "You Might Not Need an Effect" に従い、外部システムが関与しない `useEffect` は禁止する。

- **導出可能な値の state 化禁止**: レンダー中に計算できるものは計算する。重い計算のキャッシュには `useMemo` を使う
- **イベント起因の処理を Effect に書かない**: ユーザー操作への応答（保存実行・通知など）はイベントハンドラに書く
- **state リセット目的の Effect 禁止**: コンポーネントツリーのリセットは `key` の変更で行う
- **Effect チェーン禁止**: ある Effect が state を更新し別の Effect を発火させる連鎖は設計の誤り

許可されるのは、ブラウザ API・外部ライブラリとの同期（必ず `libs/` のラッパー経由）と、購読の開始／解除（クリーンアップ関数を必ず返す）だけ。

## useState / useReducer の使い分け

**判断基準: 1 つの処理（ユーザー操作・イベント）が複数の state を更新するなら `useReducer` を使う。**

| 状況 | 使うもの |
| --- | --- |
| 単一の独立した値（入力値・トグル・選択中の項目） | `useState` |
| 1 つの処理が複数の state を同時に更新する / 前の state から次の state を計算する / 更新パターン（アクション）が複数ある | `useReducer` |

- 1 つのイベントハンドラ内で複数の setter を順に呼ぶ実装は禁止。state が連動しているサインなので、`useReducer` で 1 つの state + アクションに統合する
- reducer は**純粋関数**としてフックの外（またはファイル外）に定義し、I/O や副作用を入れない
- reducer 内にドメイン知識を書かない。状態遷移の中でドメイン計算が必要な場合は `domains/` / `services/` の関数を呼ぶ

## hooks はドメインロジックを持たない

hooks（`useState` の更新ロジック・reducer・カスタムフック・イベントハンドラを含む）の責務は**状態の保持と UI イベントの仲介のみ**。ドメインロジック（判定・計算・変換）は必ず `domains/` または `services/` 側で管理し、hooks は呼び出すだけにする。

判定基準: **その処理は React がなくても意味を持つか。** 持つならドメインロジックなので hooks に書かない。

## document / window へのイベントリスナー

**要素の props で済むイベントを `document` / `window` に張ることは禁止。** イベントは原則、対象要素の props（`onClick`, `onKeyDown`, `onChange` 等）で処理する。

- `document` / `window` への `addEventListener` が許されるのは、**本質的にグローバルな関心事のみ**（`resize`、ページ全体のキーボードショートカット、要素外クリックの検知など）
- その場合も必ず `useEffect` 内で登録し、クリーンアップ関数で解除する（解除漏れは違反）
- グローバルリスナーが必要なロジックはカスタムフックに切り出す

## useRef の使い分け

**判定軸: render で読むなら `useState`、イベントハンドラ／同期処理の内側だけで使うなら `useRef`。**
React 公式 `useRef` リファレンス（"Information that's used for rendering should be state instead"）に従う。

**ref をフラグにした「防御」は禁止。**

- **二重発火防止の `hasFetchedRef` 禁止**: StrictMode の二重実行を ref で抑えにいかない。「防ぐ」のではなく「結果を捨てる」のが公式設計（`useEffect` 内で `let ignore = false`、cleanup で `ignore = true`。必要なら `AbortController`）
- **ローディング状態を `isLoadingRef` で持たない**: スピナー・`disabled`・エラー UI に出すなら `useState` 一択
- **連打防止の `inFlightRef` 禁止**: ボタンなら `useState` + `disabled` 属性が第一選択（DOM レベルで二重発火を遮断できる）
- カスタムフックがハンドラを返す場合も同様に、フック内で `useState` を持ち `isSubmitting` 等を返して呼び出し側で `disabled` に流す

`useRef` が正当なのは、render では読まずイベントハンドラ内だけで参照する可変な値（`AbortController` 等）、DOM 要素への参照、`disabled` 属性で受けられないグローバル `keydown` の連打防止だけ。

## カスタムフック

- 命名は `useXxx` とし、1 フック 1 責務を守る
- features やコンポーネント内で同じ hook ロジックが 2 箇所に現れたらカスタムフックに抽出する
- **過度な抽象化は禁止**: 1 箇所でしか使わない単純な state / handler を整理目的だけで公開カスタムフックへ切り出さない
- カスタムフックは stateful な UI ロジックの再利用単位であり、状態共有の手段ではない。複数コンポーネントで状態を共有するなら state を lift up し、props または Provider で渡す
- **UI を認識しない**（`rules/components.md`「hooks と UI の分離（headless 原則）」）
- 配置: `src/hooks/` は汎用のみ。feature 固有のものは `features/<x>/hooks/`
- 戻り値は使う側が必要とする最小限に絞る

## 共通

- 依存配列を欺く実装（意図的な依存の省略・lint 抑制コメント）は禁止
- フックの条件付き呼び出しは禁止（Rules of Hooks 準拠）
