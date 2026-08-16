# 01. ドキュメントフォーマット仕様

## 概要

design-composer のドキュメントは、単一の JSON ファイル（`.dcmp`）として保存される。
1ファイルは1ドキュメントを表し、**意味情報において自己完結する**。レンダリングに必要な意味（トークン・部品定義・画面構造）はすべてファイル内に含まれる。バイナリ資産（画像等）のみ、将来的に相対パス参照の例外を認める（下記「資産の参照」）。

編集の主体は GUI と AI である。人間はファイルを直接閲覧しない想定（閲覧はアプリが担う）。フォーマットの可読性は AI の読み書きしやすさと Git diff のレビュー性のために設計する。

## ファイル

| 項目 | 内容 |
|---|---|
| 拡張子 | `.dcmp` |
| 形式 | JSON（UTF-8） |
| 単位 | 1ドキュメント = 1ファイル。外部ファイル依存なし |

- OSのファイル関連付けによりダブルクリックでアプリが開く
- エディタ・GitHub でJSONとして扱うには設定で対応する（例: `.gitattributes` に `*.dcmp linguist-language=JSON`）
- プロジェクト構成（ディレクトリ配置・ファイルの分け方）はツールは規定しない。Figma のページに相当する分割をユーザーがファイルで行う

## ドキュメント全体の例

```json
{
  "formatVersion": "1.0",
  "tokens": {
    "colors": { "primary": "#3b82f6" },
    "spacing": { "md": "16px" }
  },
  "components": {
    "primary-button": {
      "type": "Button",
      "props": { "variant": "primary" }
    }
  },
  "artboards": [
    {
      "name": "login-screen",
      "width": 375,
      "height": 812,
      "props": { "background": "primary" },
      "children": [
        {
          "name": "login-form",
          "type": "Box",
          "props": { "direction": "column", "gap": "md" },
          "children": [
            { "name": "login-submit", "ref": "primary-button", "overrides": { "label": "ログイン" } }
          ]
        }
      ]
    }
  ]
}
```

※ ノード（`type` / `props` / `children`）と参照ノード（`ref` / `overrides`）の詳細な形は 02-data-model / 03-schema で定義する。tokens の体系は 04-tokens で定義する。上記の中身は例示。

## トップレベルフィールド

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `formatVersion` | string | ✔ | `"major.minor"` 形式（下記） |
| `tokens` | object | ✔ | デザイントークン定義 |
| `components` | object | ✔ | 部品定義（名前 → ノード の辞書） |
| `artboards` | array | ✔ | artboard の配列 |

## formatVersion

`"major.minor"` の文字列（number では 1.10 が表現できないため）。

- **major**: 破壊的変更。読み込み時にマイグレーションが必要
- **minor**: 追加的変更（新プリミティブ・新 prop・新トークン種別など）

| 状況 | 挙動 |
|---|---|
| ファイルの major > アプリ | エラー（アプリの更新を促す） |
| ファイルの major < アプリ | 読み込み時に最新形へマイグレーションし、保存は最新形式で書く |
| major 一致、ファイルの minor > アプリ | エラー（アプリの更新を促す） |
| major 一致、minor ≦ アプリ | そのまま読める |

- マイグレーションは一方向のみ。旧形式へのダウングレード書き出しは持たない

## ノードの識別（name）

- **すべてのノードは `name` を必須で持つ**（Pencil の id と同方式。意味のある人間可読な名前であり、不透明な採番ではない)
- 名前空間は**ドキュメント全体で単一**: components のキー・artboard 名・全ノードの `name` は1つの名前空間で一意とする。「名前 X」はドキュメント内の何かを常に一意に指す
- components のルートノードは辞書キーが `name` を兼ねる（値側に `name` フィールドは持たない）
- 用途: 部品の binding の宛先、将来の外科手術的操作（MCP 等によるノード単位の読み書き・スクリーンショット）の宛先、GUI 選択状態の維持
- ツールはコピー&ペースト時に自動リネームして一意性を保つ。AI 直接編集による重複・欠落はバリデーションで検出する

## tokens

- デザイントークン（色・余白・フォント等）をドキュメント内に持つ
- 外部トークンファイルの import は将来拡張として予約。初期仕様ではファイル内 tokens のみ
- 内部構造は 04-tokens.md で定義する

## components

```json
"components": {
  "primary-button": { "type": "Button", "props": { "variant": "primary" } },
  "search-field":   { "type": "Stack",  "props": { "direction": "row" }, "children": [ ... ] }
}
```

- **部品名をキー、ノード（サブツリーのルート）を値とする辞書**
- 名前がそのまま部品の識別子。別途の内部 id は持たない
- ロード時、JSONテキストに対して**重複キー検出**を行う。`JSON.parse` はキー重複を後勝ちで無警告に解決するため、パース前の字句スキャンで重複をエラーとして報告する（AI直接編集による無警告のデータ消失を防ぐ）

## artboards

```json
{
  "name": "login-screen",
  "width": 375,
  "height": 812,
  "props": { "background": "primary" },
  "children": [ ... ]
}
```

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `name` | string | ✔ | 識別子。命名規則は下記、ドキュメント内で一意 |
| `width` | number | ✔ | 幅（px、固定値） |
| `height` | number | ✔ | 高さ（px、固定値） |
| `props` | object | - | Box としてのプロパティ（background・padding・レイアウト方向等） |
| `children` | array | ✔ | プリミティブツリー |

- artboard は **Figma のフレームに相当**し、**ルートノード（Box）を兼ねる**。`props` は Box のスキーマをそのまま流用して検証・パネル生成する（例外を作らない）
- はみ出し: コンテンツが固定サイズを超えた場合、**デフォルトで clip**（Figma の Clip content 相当）
- **キャンバス座標は持たない**。ツールが配列順に自動レイアウトする。作業スペースの見た目（配置・ズーム等）は source of truth に含めない
- 将来の artboard 間参照（プロトタイプ遷移等）に備え、`name` は識別子として扱う

## 部品参照（ref）

```json
{ "ref": "primary-button", "overrides": { "label": "保存" } }
```

- ツリー内の任意の位置に置ける参照ノード。`ref` の値は同一ファイル内の部品名
- ファイル跨ぎ参照（パス修飾）は将来拡張として予約。初期仕様ではファイル内名のみ
- リネームはファイル内置換で完結する。スキーマ検証は dangling ref（存在しない名前への参照）を必ず検出する
- `overrides` の仕様は 02-data-model で定義する（部品の props 宣言によるインターフェース方式）
- JSON Pointer 等、JSON外部の参照機構には依存しない

## 資産の参照（将来拡張の予約）

- 画像等のバイナリ資産は、**.dcmp ファイルからの相対パスで参照する**方式を予約する（Pencil の image fill と同方式）
- base64 埋め込みは採用しない（Git diff と AI 可読性を破壊するため）
- 線引きの原則: **意味情報（構造・トークン・部品）は自己完結、バイナリ資産のみ外部参照**。バイナリは AI が読む対象ではないため、自己完結の動機（ファイル1つで全体を理解できる）を損なわない
- Image プリミティブの導入時期は未定（03-schema）。導入時にこの方式を適用する

## 識別子の規則

- 対象: 部品名、artboard 名、すべてのノードの `name`
- kebab-case、使用可能文字は `[a-z0-9-]`
- `/` `#` `.` は将来のパス修飾（ファイル跨ぎ参照）のために予約し、使用を禁止する

## Figma との対応

| Figma | design-composer |
|---|---|
| ページ | .dcmp ファイル 1つ |
| フレーム | artboard |
| フレーム内の要素 | プリミティブツリー |

## 未定義項目

- Image プリミティブの導入時期（参照方式は相対パスで決定済み。「資産の参照」参照）
