#!/usr/bin/env bash
#
# テストヘルパーの重複検査の判定表。`duplicate-test-helpers.py` へ小さなテストファイルを流し、
# deny / pass / miss が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/duplicate-test-helpers-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、本体の切り出し方(引数・戻り値の型注釈を読み飛ばす・式本体の
# アロー関数)がこの検査の中心で、ゲートが呼ぶ `check-added-test-helper-duplication.sh` は
# 追加行に重複が無い限り緑のままだから。** 同じ形の前例は同じフォルダの `story-title-cases.sh`。
#
# **1 ケースを 2 つの呼び方で判定し、食い違えば NG にする。** ファイル 1 つを渡す形は
# Claude Code のフック、`--lines` は CI と git hooks が使う。本体の切り出しは共有していても、
# 報告の出し方(見出し / `<行番号>:<名前>`)が別なので、読み取りも別になる。
#
# 1 ケースは `check <期待> <ケース名>` に、テストファイルの中身をヒアドキュメントで渡す。
# 本体の切り出し方を見るケースは、ヘルパーを同じファイルに 2 つ置く。探す範囲がプロジェクト
# 全体の `__tests__/` で、ファイルを分けても判定が変わらないため。その探す範囲のほうは
# `check_across` で、深さの違う別の `__tests__/` にもう 1 ファイルを置いて確かめる。期待は 3 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `deny` | 重複として報告してほしい(exit 1) |
# | `pass` | 報告してはいけない(誤検知したら信用を失う側) |
# | `miss` | **意図した取りこぼし**(検出器の docstring に列挙)。期待の綴りを分けてあるのは、
#            `pass` と並べると次に読む人がバグと読んで直しにいくため |
#
# deny のケースは型注釈を持つ宣言を最後に置く。型注釈を読み違えると後ろの宣言の本体を
# 自分の本体と読むので、同じ本体の宣言が後ろにあると読み違えても偶然 deny になる。
#
# pass のケースで一致させる型注釈は、空白を潰して `MIN_BODY_CHARS`(20)以上にしてある。
# 短いと、型を本体と読み違えても短すぎて捨てられ、読み飛ばしを壊しても pass のまま通る。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/duplicate-test-helpers.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$lib_dir/cases-report.sh"

target="$work/src/sample/__tests__/sample.cases.test.tsx"
mkdir -p "$(dirname "$target")"

# 2 つの呼び方で検出器を走らせ、判定が揃えばそれを、食い違えば `split` を返す。
#
# $1 検査するファイル
verdict() {
  local checked="$1" output status by_file by_lines
  output="$(python3 "$detector" "$checked")" && status=0 || status=$?
  by_file="$(decide "$output" "$status" '^本体が同じテストヘルパーが')"
  output="$(python3 "$detector" --lines "$checked")" && status=0 || status=$?
  by_lines="$(decide "$output" "$status" '^[0-9]+:')"
  if [ "$by_file" = "$by_lines" ]; then
    echo "$by_file"
    return 0
  fi
  echo "split(file=$by_file,lines=$by_lines)"
}

# 標準入力をテストファイルとして置き、1 ケースを判定して報告する。
#
# $1 期待
# $2 ケース名
check() {
  local expected="$1" label="$2"
  cat >"$target"
  report "$expected" "$(normalize_miss "$expected" "$(verdict "$target")")" "$label"
}

# 深さの違う 2 つの `__tests__/`。`src` 直下 1 段目と、実際の `__tests__/` と同じくらい深い位置
shallow="$target"
deep="$work/src/features/editor/features/canvas/__tests__/canvas.cases.test.tsx"

# 検査するファイルと相方を置いて判定し、判定のあとで両方を消す(後ろのケースへ残さない)。
# 標準入力は検査するファイルの中身。
#
# $1 検査するファイル
# $2 相方
# $3 相方の中身
verdict_across() {
  local checked="$1" mate="$2" mate_source="$3" decision
  mkdir -p "$(dirname "$checked")" "$(dirname "$mate")"
  cat >"$checked"
  printf '%s\n' "$mate_source" >"$mate"
  decision="$(verdict "$checked")"
  rm -f "$checked" "$mate"
  echo "$decision"
}

# 深さの違う別の `__tests__/` に相方を置いて、1 ケースを判定する。標準入力は検査する
# ファイルの中身で、`check` と同じく扱う。
#
# 検査するファイルを浅い側に置く向きと深い側に置く向きの両方で判定し、食い違えば `split`
# にする。片方の向きだけだと、探す範囲を検査するファイルの位置から決め打ちする退行
# (`target.parent.parent` など)が配置の偶然で `src` と一致して通る。`check-added-cases.sh` の
# 相方はどちらも 1 段目なので、`src/*/__tests__` へ狭める退行もここでしか捕まらない。
#
# $1 期待
# $2 ケース名
# $3 相方の中身
check_across() {
  local expected="$1" label="$2" mate_source="$3" source by_shallow by_deep decision
  source="$(cat)"
  by_shallow="$(verdict_across "$shallow" "$deep" "$mate_source" <<<"$source")"
  by_deep="$(verdict_across "$deep" "$shallow" "$mate_source" <<<"$source")"
  decision="$by_shallow"
  if [ "$by_shallow" != "$by_deep" ]; then
    decision="split(shallow=$by_shallow,deep=$by_deep)"
  fi
  report "$expected" "$(normalize_miss "$expected" "$decision")" "$label"
}

check pass "引数の型注釈だけが同じ関数を重複と読まない" <<'TS'
function dragNode(from: Element, by: Readonly<{ x: number; y: number }>): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(from, { x: 100 + by.x, y: 100 + by.y });
}
function carryBadge(by: Readonly<{ x: number; y: number }>): void {
  pressPointer(badge(), { x: 10, y: 10 });
}
TS

check pass "複数行の引数と既定値を持ち、引数の型注釈だけが同じ関数を重複と読まない" <<'TS'
function setupSelection(
  badgeAt: Readonly<{ x: number; y: number }> = { x: 40, y: 24 },
): DocumentSelection {
  return selectionFromArtboards([{ name: "home", width: 360 }], []);
}
function dragNode(from: Element, by: Readonly<{ x: number; y: number }>): void {
  pressPointer(from, { x: 100, y: 100 });
}
TS

check pass "戻り値の型注釈 Readonly<{…}> だけが同じ関数宣言を重複と読まない" <<'TS'
function pointA(n: number): Readonly<{ x: number; y: number }> {
  return { x: n, y: n * 2 };
}
function pointB(s: string): Readonly<{ x: number; y: number }> {
  return { x: s.length, y: 0 };
}
TS

check pass "戻り値の型注釈がオブジェクト型リテラルだけ同じ関数宣言を重複と読まない" <<'TS'
function sizeA(n: number): { width: number; height: number } {
  return { width: n, height: n * 2 };
}
function sizeB(s: string): { width: number; height: number } {
  return { width: s.length, height: 0 };
}
TS

check pass "戻り値の型注釈だけが同じアロー関数を重複と読まない" <<'TS'
const sizeA = (n: number): { width: number; height: number } => {
  return { width: n, height: n * 2 };
};
const sizeB = (s: string): { width: number; height: number } => {
  return { width: s.length, height: 0 };
};
TS

check pass "式本体のアロー関数が、後ろにある別の宣言の本体を自分の本体と読まない" <<'TS'
const inc = (n: number): number => n + 1;
const dec = (n: number): number => n - 1;
function names(): string[] {
  return ["home", "settings", "profile"];
}
TS

check pass "括弧で始まるだけの値が、後ろにあるアロー関数の本体を自分の本体と読まない" <<'TS'
const total = (base + offset) * scale;
const labelOf = (node: Node) => `${node.kind}:${node.name}:${node.id}`;
TS

check pass "括弧で囲んだ関数型を返すアロー関数が、後ろの宣言の本体を自分の本体と読まない" <<'TS'
const handlerA = (): (() => void) => {
  return () => console.log("pressed", 100);
};
const other = () => {
  return () => console.log("released", 200);
};
TS

check pass "戻り値の型が型リテラルとの合併・交差・条件型だけ同じ関数を重複と読まない" <<'TS'
function unionA(n: number): Base | { width: number; height: number } {
  return { width: n, height: n * 2 };
}
function unionB(s: string): Base | { width: number; height: number } {
  return { width: s.length, height: 0 };
}
function mixA(n: number): Base & { width: number; height: number } {
  return { kind: "mix", width: n, height: 1 };
}
function mixB(s: string): Base & { width: number; height: number } {
  return { kind: "mix", width: s.length, height: 2 };
}
function pickA<T>(n: T): T extends { kind: "a"; value: number } ? { width: number; height: number } : { depth: number; margin: number } {
  return pickFrom(n, "first");
}
function pickB<T>(s: T): T extends { kind: "a"; value: number } ? { width: number; height: number } : { depth: number; margin: number } {
  return pickFrom(s, "second");
}
TS

check pass "戻り値の型が keyof・型の述語で型リテラルを持つだけ同じ関数を重複と読まない" <<'TS'
function keyA(n: number): keyof { width: number; height: number } {
  return n > 0 ? "width" : "height";
}
function keyB(s: string): keyof { width: number; height: number } {
  return s.length > 0 ? "height" : "width";
}
function isSizeA(value: unknown): value is { width: number; height: number } {
  return typeof value === "object" && value !== null;
}
function isSizeB(value: unknown): value is { width: number; height: number } {
  return value instanceof Object;
}
TS

check pass "戻り値の型が型リテラルを返す関数型だけ同じ関数を重複と読まない" <<'TS'
function makeA(): (n: number) => { width: number; height: number } {
  return (n) => ({ width: n, height: n });
}
function makeB(): (n: number) => { width: number; height: number } {
  return (n) => ({ width: n * 2, height: 0 });
}
TS

check pass "戻り値の型の文字列リテラル型に括弧があっても、そこを本体と読まない" <<'TS'
function braceA(n: number) : "{ open the brace" | "close the brace }" {
  return n > 0 ? "{ open the brace" : "close the brace }";
}
function braceB(s: string) : "{ open the brace" | "close the brace }" {
  return s.length > 0 ? "close the brace }" : "{ open the brace";
}
TS

check deny "本体が同じで引数の名前と型が違う関数を重複と読む" <<'TS'
function artboardList(document: DesignDocument): readonly string[] {
  return document.artboards.map((artboard) => artboard.name);
}
function boardNames(document: Readonly<{ artboards: readonly Artboard[] }>): readonly string[] {
  return document.artboards.map((artboard) => artboard.name);
}
TS

check deny "本体が同じで片方だけ戻り値の型注釈を持つ関数宣言を重複と読む" <<'TS'
function originB() {
  return { x: 100, y: 200, z: 300 };
}
function originA(): Readonly<{ x: number; y: number }> {
  return { x: 100, y: 200, z: 300 };
}
TS

check deny "本体が同じで片方だけ戻り値の型注釈を持つアロー関数を重複と読む" <<'TS'
const originB = () => {
  return { x: 100, y: 200, z: 300 };
};
const originA = (): { x: number; y: number } => {
  return { x: 100, y: 200, z: 300 };
};
TS

check deny "本体が同じで戻り値の型注釈の中身が違う関数を重複と読む" <<'TS'
function originA(): Readonly<{ x: number; y: number }> {
  return { x: 100, y: 200, z: 300 };
}
function originB(): { x: number; y: number; z: number } {
  return { x: 100, y: 200, z: 300 };
}
TS

check deny "戻り値の型が関数型の関数宣言で、本体が同じものを重複と読む" <<'TS'
function handlerB() {
  return () => console.log("pressed", 100);
}
function handlerA(): () => void {
  return () => console.log("pressed", 100);
}
TS

check deny "戻り値の型が関数型のアロー関数で、本体が同じものを重複と読む" <<'TS'
const handlerB = () => {
  return () => console.log("pressed", 100);
};
const handlerA = (): () => void => {
  return () => console.log("pressed", 100);
};
TS

check deny "戻り値の型が括弧で囲んだ関数型のアロー関数で、本体が同じものを重複と読む" <<'TS'
const handlerB = () => {
  return () => console.log("pressed", 100);
};
const handlerA = (): (() => void) => {
  return () => console.log("pressed", 100);
};
TS

check pass "戻り値の型の <…> の中に、型リテラルを返す関数型だけが同じ関数を重複と読まない" <<'TS'
function measureA(n: number): Array<() => { width: number; height: number }> {
  return [() => ({ width: n, height: n })];
}
function measureB(s: string): Array<() => { width: number; height: number }> {
  return [() => ({ width: s.length, height: 0 })];
}
TS

check deny "戻り値の型リテラルの中に関数型を持つアロー関数で、本体が同じものを重複と読む" <<'TS'
const holderB = () => {
  return { press: () => console.log("pressed", 100) };
};
const holderA = (): Readonly<{ press: () => void }> => {
  return { press: () => console.log("pressed", 100) };
};
TS

check deny "式本体が同じアロー関数を重複と読む" <<'TS'
const renderA = (props: Props) => render(<Toolbar mode="edit" {...props} />);
const renderB = (props: Partial<Props>): RenderResult =>
  render(<Toolbar mode="edit" {...props} />);
TS

check deny "セミコロンの無い式本体が同じアロー関数を、行の終わりで区切って重複と読む" <<'TS'
const renderA = (props: Props) => render(<Toolbar mode="edit" {...props} />)
const renderB = (props: Props) => render(<Toolbar mode="edit" {...props} />)
TS

check deny "セミコロンで終わる式本体と終わらない式本体を、セミコロンの手前で区切って重複と読む" <<'TS'
const renderA = (props: Props) => render(<Toolbar mode="edit" {...props} />);
const renderB = (props: Props) => render(<Toolbar mode="edit" {...props} />)
TS

check deny "比較演算子 < を含む式本体が同じアロー関数を重複と読む" <<'TS'
const smallerA = (a: number, b: number) => expect(a < b).toBe(true);
const smallerB = (a: number, b: number) => expect(a < b).toBe(true);
TS

check deny "既定引数 {} を持ち、本体が同じ関数を重複と読む" <<'TS'
function renderA(props: Partial<Props> = {}) {
  return render(<Toolbar mode="edit" {...props} />);
}
function renderB(props: Partial<Props> = {}) {
  return render(<Toolbar mode="edit" {...props} />);
}
TS

check deny "export の付いた宣言と付かない宣言で、本体が同じものを重複と読む" <<'TS'
function renderPanelA() {
  return render(<Panel mode="edit" title="layers" />);
}
export function renderPanelB() {
  return render(<Panel mode="edit" title="layers" />);
}
TS

check miss "先頭の桁から始まらない(入れ子の)宣言は、本体が同じでも見ない" <<'TS'
test("入れ子", () => {
  function nestedA(): string[] {
    return ["home", "settings", "profile"];
  }
  function nestedB(): string[] {
    return ["home", "settings", "profile"];
  }
});
TS

check miss "空白を潰して 20 字未満の本体は、同じでも見ない" <<'TS'
function one() {
  return 1;
}
function first() {
  return 1;
}
TS

check_across deny "深さの違う別の __tests__ フォルダにある、本体が同じヘルパーを重複と読む" "$(
  cat <<'TS'
function openedAt(path: string) {
  return OpenedDocument.create({ path, document: sampleDocument() });
}
TS
)" <<'TS'
function openedAt(path: string) {
  return OpenedDocument.create({ path, document: sampleDocument() });
}
TS

# 守っているのはファイル 1 つを渡す形の絞り込み(`groups_for_file`)。`--lines` は出力の段でも
# 検査するファイルで絞るので、`groups_for_file` の絞り込みを外すと両者が割れて NG になる。
check_across pass "検査するファイルが絡まない重複は、別の __tests__ フォルダにあっても報告しない" "$(
  cat <<'TS'
function canvasSurfaceA() {
  return screen.getByTestId("artboard-canvas-surface");
}
function canvasSurfaceB() {
  return screen.getByTestId("artboard-canvas-surface");
}
TS
)" <<'TS'
function openedAt(path: string) {
  return OpenedDocument.create({ path, document: sampleDocument() });
}
TS

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "テストヘルパーの重複の判定表: 期待どおり"
