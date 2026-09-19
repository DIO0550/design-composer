# 判例: アーキテクチャ

規範は [`rules/architecture.md`](../../rules/architecture.md)。ここはその実例。

## `ownership-reasoning` — 帰属の理由が理由になっていない

置き場所自体は合っていても、**理由がその型に固有の性質を指していない**形。
「第 1 引数の型が◯◯だから」だけでは、他の型でも同じ理由が成り立ってしまう。
次に似た値が出たときに、同じ場所へ置いてよいか判断できない。

| NG | OK |
|---|---|
| `TypographyToken.withField(token, { field: "fontFamily", value: "" })` が空文字を「省略」と読む | コントロール側で `raw === "" ? Option.none : Option.some(raw)` に解釈し、ドメインは `Option<string>` を受ける |
| `DocumentErrorLocation.toText(location)` をドメインに置き、`"home-title.typography"` を組み立てる | ドメインは `DocumentErrorLocation` の直和まで。綴りは `document-error-list` の `locationLabel` が持つ |

- **テストが表示の綴りを必要としているように見えたら、まず assert のほうを疑う。**
  「テストのヘルパーが実装の再実装になっている」を理由に綴りをドメインへ移したくなるが、
  多くの場合テストが見たいのは綴りではなく**構造**（どのノードのどの prop か）で、
  構造のまま比べれば綴りを作る必要そのものが消える

## `service-placement` — services に置く前にドメインを探していない

「複数ドメインに跨る」という感触だけを根拠に `services/` へ置いた形。過去のレビューで
services に置かれたロジックの多くは、`rules/architecture.md` の 1〜6 で帰属先が見つかっている。

- 対を表す型を作って帰属させた例: `TypographyFieldRef` / `Padding`
- ドメインが出力形式を必要とする場合は、変換手段を**引数で受け取る**ことで依存方向を保ったまま
  ドメインに置ける

  ```typescript
  // domains/padding — カスタムプロパティ名の綴り方（出力層の知識）は引数で受け取る
  declarations(padding: Padding, resolveToken: (token: string) => string): readonly CssDeclaration[]
  ```

## `utils-form` — utils の名前が用途を指している

| NG | OK | 理由 |
|---|---|---|
| `StringEx.toLabel(prop)` | `CaseStyle.toCapitalCase(prop)` | 「ラベル」は表示という**用途**。「camelCase を Capital Case にする」は用途に依らない**操作** |

- 汎用の操作が 1 つだけでも、`<型名>Ex` に押し込めず**まとまりを表すモジュール**を立てる
  （綴りの流儀の変換なら `CaseStyle`）
- 型で閉じた対応表（`as const satisfies` でリテラル型を保つもの）を汎用変換に置き換えない。
  戻り値が `string` へ広がり、網羅性の保証が失われる（`TypographyField.cssProperty` を
  `toKebabCase()` にしない）
- ドメイン概念になった時点で `utils/` から `domains/` へ移す。規則を持つ `Px` は `domains/px/`、
  文字列定数だけの `Font` は `utils/`

## `domain-scope-promotion` — 置き場所を消費する feature の数で決めていない

1 feature でしか使わないのに `src/domains/` へ置く / 2 つ以上の feature が必要なのに
`features/<x>/domains/` に留める。どちらの向きにも出る。

## `module-api` — 公開 API が広がる / 分割の閾値が無い

`rules/architecture.md`「モジュールの公開API」に対する再発は 3 つの形に分かれる。
**どれも「何を外へ出すか」の話だが、止まる場所が違う。**

### 1. 未使用・過剰な export（いちばん多い形・層 3 で止まっている）

`export` を付けたが、production 側の消費者が同一ファイル内にしかない。

| NG | OK |
|---|---|
| `export type AxisGrab` を置くが、overlay は `grip.width.end` と値で触るだけで型名を使わない | `export` を外す |
| `RepositionPreviewProperty` を、`__tests__/setup.tsx` が綴りを写さずに済むよう export する | 否定 assert を実装から引くこと自体は正しいので現状のまま入れたが、公開 API は広がっている |

**この形は `implementation-reviewer` の観点（`index.ts` の export が増えていないか）が
毎回捕まえている。** pr-235 以降の再発のうち過半数がこの形で、人・bot まで届いた件数は 0。

### 2. 部品が積み上がって分割の起点を失う（層 1 = oxlint `max-lines` で止める）

`artboard-canvas/index.tsx` が 716 行・11 コンポーネントになるまで誰も気づかなかった。
足した差分は `DropPositionLabel` 1 つで、残りは以前から積み上がっていた分。
規範は分け方（サブフォルダへ）を書いているが**「必要になった」の判定基準を持たない**ので、
足す側は毎回「まだ必要ではない」と判断できてしまう。

`.oxlintrc.json` の `src/**/*.tsx` → `max-lines: 600` がこの形を機械的に止める。
`src/**/__tests__/**/*.tsx` は対象外（テストの肥大化は `rules/testing.md`
「1ファイルが肥大化したらカテゴリを分けること」が別の軸で持つ）。

**`.ts` は対象外なので、中身を兄弟の `.ts` へ逃がす経路は開いたままになる。**
`rules/architecture.md`「実装は `index.ts` に直接書く」が禁じているが、機械的に止めているのは
`import-rule-violations.py` の「外から非 index ファイルを読む」形だけで、
**`index.tsx` からだけ読む兄弟 `.ts` は検出されない**。

### 3. 他 feature の公開口への触り方が割れる（機械化できなかった形）

`EditorScreen` だけが `ipc: DocumentSessionPorts["ipc"]` と**他 feature の口の束へ添字で**
書いており、他の 5 箇所（`opened-document-editor` / `use-document-session` / `use-auto-save` /
`use-document-reload` / `use-file-revert`）はすべて `DocumentIpc` を直接 import していた。
依存方向としては規約どおりで、割れていたのは流儀だけ。

**この形はフックにしていない。** 「束オブジェクトへの添字アクセス」を一律に禁じると、
TypeScript の正当な indexed access 型まで誤検知する（`src/` に 21 件・うち非テスト 8 件。
`CSSProperties["cursor"]` / `DocumentSaveState["kind"]` / `ArtboardBoxProps["rotation"]` など）。
1 件しか出ていないので一般化の材料も無い。**再発したらフック化の候補に戻す。**
