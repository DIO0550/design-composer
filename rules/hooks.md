# Hooks 規約

> **この規約は記録 32 本で 1 件も引かれていない**(`effect` / `state-management` / `ref-guard` の
> 通算がいずれも 0〜2 件)。フック・CI・型のどれでも強制していないので「効いているから 0」とは
> 言えず、`harness-growth` の棚卸しで縮めてある。指摘が出たら、その回に必要な分だけ書き戻す。

## useEffect: 最終手段として扱う

useEffect は「外部システムとの同期」専用。React 公式 "You Might Not Need an Effect" に従い、外部システムが関与しない useEffect は禁止する。

- **導出可能な値の state 化禁止**: レンダー中に計算できるものは計算する。重い計算のキャッシュは `useMemo`
- **イベント起因の処理を Effect に書かない**: ユーザー操作への応答(保存実行、通知など)はイベントハンドラに書く
- **state リセット目的の Effect 禁止**: コンポーネントツリーのリセットは `key` の変更で行う
- **Effect チェーン禁止**: ある Effect が state を更新し、それが別の Effect を発火させる連鎖は設計の誤り

許可されるのは、ブラウザ API・外部ライブラリとの同期(必ず `libs/` のラッパー経由)と、購読の開始/解除(クリーンアップ関数を必ず返す)だけ。

## useState / useReducer の使い分け

**判断基準: 1つの処理(ユーザー操作・イベント)が複数の state を更新するなら `useReducer` を使う。**

| 状況 | 使うもの |
|---|---|
| 単一の独立した値(入力値、トグル、選択中の項目) | `useState` |
| 1つの処理が複数の state を同時に更新する / 前の state から次の state を計算する / 更新パターン(アクション)が複数ある | `useReducer` |

- 1つのイベントハンドラ内で複数の setter を順に呼ぶ実装は禁止。それは state が連動しているサインなので、`useReducer` で1つの state + アクションに統合する
- reducer は**純粋関数**としてフックの外(またはファイル外)に定義する。reducer 内での I/O・副作用は禁止
- reducer 内にドメイン知識を書かない。状態遷移の中でドメイン計算が必要な場合は `domains/` / `services/` の関数を呼び出す

## hooks はドメインロジックを持たない

hooks(useState の更新ロジック、reducer、カスタムフック、イベントハンドラを含む)の責務は**状態の保持と UI イベントの仲介のみ**。ドメインロジック(判定・計算・変換)は必ず `domains/` または `services/` 側で管理し、hooks はそれを呼び出すだけにする。

判定基準: **その処理は React がなくても意味を持つか?** 持つならドメインロジックなので hooks に書いてはならない。

## document / window へのイベントリスナー

**要素の props で済むイベントを document / window に張ることは禁止。** イベントは原則、対象要素の props(`onClick`, `onKeyDown`, `onChange` 等)で処理する。

- `document` / `window` への addEventListener が許されるのは、**本質的にグローバルな関心事のみ**: `resize`、ページ全体のキーボードショートカット、要素外クリックの検知など
- その場合も必ず useEffect 内で登録し、クリーンアップ関数で解除すること(解除漏れは違反)
- グローバルリスナーが必要なロジックはカスタムフックに切り出すこと

## useRef の使い分け

**判定軸: render で読むなら `useState`、event handler / 同期処理の内側だけで使うなら `useRef`。**
React 公式 `useRef` リファレンス("Information that's used for rendering should be state instead")に従う。

**ref をフラグにした「防御」は禁止。**

- **二重発火防止の `hasFetchedRef` 禁止**: StrictMode の二重実行を ref で抑えにいかない。「防ぐ」のではなく「結果を捨てる」が公式設計(`useEffect` 内で `let ignore = false`、cleanup で `ignore = true`。必要なら `AbortController`)
- **ローディング状態を `isLoadingRef` で持たない**: スピナー・`disabled`・エラー UI に出すなら `useState` 一択
- **連打防止の `inFlightRef` 禁止**: ボタンなら `useState` + `disabled` 属性が第一選択(DOM レベルで二重発火を遮断できる)
- カスタムフックがハンドラを返す場合も同じ。フック内で `useState` を持ち、`isSubmitting` 等を一緒に返して呼び出し側で `disabled` に流す

`useRef` が正当なのは、render では読まず event handler 内でだけ参照する mutable な値(`AbortController` 等)、DOM 要素への参照、`disabled` 属性で受けられないグローバル `keydown` 連打防止。

## カスタムフック

- 命名は `useXxx`。1フック1責務
- features/コンポーネント内で同じ hook ロジックが2箇所に現れたらカスタムフックに抽出する
- **過度な抽象化は禁止**: 1箇所でしか使わない単純な state / handler を「何となく整理するため」だけに公開カスタムフックへ切り出さない
- カスタムフックは stateful UI ロジックの再利用単位であり、状態そのものの共有手段ではない。複数コンポーネントで同じ状態を共有したい場合は state を lift up し、props または Provider で渡す
- **UIを認識しない**: JSX、コンポーネント、className、文言、アイコン、レイアウト都合を返さない(`rules/components.md`「headless 原則」)
- 配置: `src/hooks/` は汎用のみ。feature 固有のものは `features/<x>/hooks/`
- 戻り値は使う側が必要とする最小限に絞る

## 共通

- 依存配列を欺く実装(意図的な依存の省略、lint ルールの抑制コメント)は禁止
- フックの条件付き呼び出し禁止(Rules of Hooks 準拠)
