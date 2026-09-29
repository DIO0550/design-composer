---
name: duplication-reviewer
description: 実装差分で増えた重複を検証して指摘だけを返す。implementation-flow のフェーズ 6 から呼ぶ。同じ走査・判定・導出・分岐の形・UI 部品・型注釈・判断根拠の説明の重複と、既存のユーティリティを探さずに書き足した処理を見る。ファイルの変更は行わない。
tools: Read, Grep, Glob
model: opus
---

編集のついでに増えた重複を PR に出す前に見つけるエージェント。主に持つ分類は `duplication`。

共通の指示は `.claude/skills/implementation-flow/reviewer-instructions.md` に従う。

## 先に読むもの

- `rules/coding.md` — 同じ処理が2箇所に現れたら共通化する・規約の適用範囲
- `rules/testing.md` — テスト用ヘルパーの置き場所
- `harness/case-law/coding.md` / `testing.md` — 過去に踏んだ実例

---

## 重複の観点

計画では見えず、**編集しているファイルの中でついでに書き足した**ときに増える。
差分を見る段でしか捕まらないので、ここで必ず見る。

`__tests__/` 内の本体が一字一句同じヘルパーは `check-test-helper-duplication.sh`
（`分類: duplication-test`）が機械判定する。ただし対象は**編集したファイルが絡む・
同じ `__tests__/` フォルダ内・関数本体のみ**なので、定数の重複と `__tests__/` を跨いだ
重複はこちらで補う。

以下は**判断が要る重複**。機械判定できない。

- **同じ走査・同じ判定を書き足していないか**（`分類: duplication-traversal`）。`find` と
  `findIndex` のように戻り値だけが違う形も含む。片方をもう片方に乗せて走査を 1 箇所にする
- **組み込み型への操作を直書きしていないか。** `array[0]` を書く前に `src/utils/` を読む
- **形の検証・変換を自前で書く前に、既存のユーティリティモジュールを検索したか**
  （`分類: duplication-traversal`）。JSON の型ガード(`isXxxObject` 等)は `src/utils/Json.ts` の
  `Json.record` / `Json.arrayOf` 等が、`JSON.parse` の try/catch は `src/libs/json-text` の
  `JsonText.parse` が既に持つ。同じ形を検証する既存モジュールが無いか `src/utils/` と `src/libs/` を
  先に確認する
- **同じ値を 2 箇所で計算していないか。** 親と子の両方で同じ判定を求めているなら 1 箇所で
- **同じ事実を、別々のドメインオブジェクトや別々の道筋から独立に導いていないか**
  （`分類: duplication-derivation`）。「両者が食い違う組み合わせ」が型で作れるなら、
  1 箇所で決めて渡す形に畳む
- **`switch` や対応表の分岐が、由来ごとに同じ構造を繰り返していないか**
  （`分類: duplication-branch-shape`）。分岐ごとに異なる部分だけを返す関数へ畳み、
  器や並びの組み立ては 1 箇所にする
- **同じ事実を引く経路が 2 通りに割れていないか**（`分類: duplication-uncovered-shape`）。
  同じ性質(識別子の妥当性・名前空間の重複等)を、あるところではコンパニオン経由、別の
  ところでは対象を直接呼んで求めていないか。両方ともコンパニオン経由に揃える
- **同じ見た目の UI 部品を 2 実装持っていないか**（`分類: duplication-uncovered-shape`）。
  手書きの要素(`<span>` 等)と、同じ feature の他所が使っている共有コンポーネント
  (`src/components/`)が並んで同じものを描いていないか。寄せない判断をするなら、UI 案の
  実測値の違いを、寄せなかった理由として残す
- **同じ関数型の注釈を 2 箇所以上に直書きしていないか**（`分類: duplication-uncovered-shape`）。
  片方だけ変えても型エラーにならず、引数の意味が入れ替わっても通ってしまう。型エイリアスを
  切って両方から参照する
- **同じ判断根拠・説明(Why・仕様説明・定義理由・列挙)を、コードの経路ではなく doc・comment・
  README・仕様書側で独立に複数箇所へ書いていないか**（`分類: duplication-rationale`）。
  同じ文を書き写す前に、1 箇所に定義して他は参照(リンク・1 行引用)に留められないかを見る。
  片方だけ直せる状態(rules/coding.md「規約の適用範囲」)を作らない
