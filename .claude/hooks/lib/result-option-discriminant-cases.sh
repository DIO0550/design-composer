#!/usr/bin/env bash
#
# `Result` / `Option` の判別子の直読み・直書き検査の判定表。
# `result-option-discriminant-violations.py` へ小さなソースを流し、deny / pass / miss が
# 期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/result-option-discriminant-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、免除の判定（その判別子を型宣言で定義しているファイルか）が
# この検査の中心で、手で 1 回動かすだけでは退行を検知できないため。** 同じ形の前例は
# 同じフォルダの `canary-cases.sh`。
#
# 判定を終了コードで見る理由は `.claude/hooks/README.md`「終了コードまで見る」。deny の行は
# さらに報告の見出しが出ることも見る。
#
# 表は読み側（`result-option-read`）と作る側（`result-option-write`）の 2 つで、どちらも
# `期待|ケース名|ソース` の 1 行 1 ケース。ソース中の `@@` は改行に置き換わる。各表は自分の
# 種別の見出しで deny を読む。**pass / miss のソースは、もう一方の種別も発火させない**
# （`decide` は自分の見出しが無い exit 1 を `broken` にする）。deny のソースは両方が
# 発火してもよい。期待は 3 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `deny` | 違反として報告してほしい(exit 1) |
# | `pass` | 報告してはいけない(誤検知したら信用を失う側) |
# | `miss` | **意図した取りこぼし。** 拾えれば理想だが、型宣言の中の判別子と見分けが
#            付かないので諦めた形。期待の綴りを分けてあるのは、`pass` と並べると次に
#            読む人がバグと読んで検出器の Why not ごと消しにいくため |
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/result-option-discriminant-violations.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/src"

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$lib_dir/cases-report.sh"

# 検出器を 1 度走らせ、終了コードから deny / pass を決める。
#
# $1 報告の種別（`result-option-read` / `result-option-write`）
verdict() {
  local kind="$1" output status
  output="$(python3 "$detector" "$work/src")" && status=0 || status=$?
  decide "$output" "$status" "^\\[$kind\\]"
}

# 1 ケースのソースを書き出し、その種別の見出しで判定して報告する。
#
# $1 報告の種別
# $2 表に書かれた期待
# $3 ケース名
# $4 書き出すファイル名（拡張子で走査対象かが決まる）
# $5 ソース
run_case() {
  local kind="$1" expected="$2" label="$3" file="$4" source="$5"
  rm -f "$work/src"/*
  printf '%s\n' "$source" > "$work/src/$file"
  report "$expected" "$(normalize_miss "$expected" "$(verdict "$kind")")" "$label"
}

# 標準入力の表を 1 行ずつ流し、その種別の見出しで判定する。
#
# $1 報告の種別
run_table() {
  local kind="$1" expected label source
  while IFS='|' read -r expected label source; do
    [ -n "$source" ] || continue
    run_case "$kind" "$expected" "$label" case.ts "${source//@@/$'\n'}"
  done
}

run_table result-option-read <<'CASES'
deny|定義元の外で result.ok を読む|const label = result.ok ? "y" : "n";
deny|定義元の外で option.some を読む|const has = option.some;
deny|ok を定義しているファイルで option.some を読む|type Ok = Readonly<{ ok: true; value: number }>;@@const has = option.some;
deny|some を定義しているファイルで result.ok を読む|type Some = Readonly<{ some: true; value: number }>;@@const label = result.ok;
deny|1 行の値リテラルしか持たないファイルで result.ok を読む|const expected = { ok: false, error: "e" };@@const label = result.ok;
deny|複数行の値リテラルしか持たないファイルで result.ok を読む|const expected = {@@  ok: true,@@  value: 1,@@};@@const label = result.ok;
deny|型宣言を持つファイルでも、領域の外の値リテラルは定義と数えない|export type Foo = Readonly<{@@  value: number;@@}>;@@const expected = { ok: false };@@const label = result.ok;
deny|型宣言の中のコメントに書いた判別子は定義と数えない|export type Foo = Readonly<{@@  // { ok: true } のような形は持たない@@  value: number;@@}>;@@const label = result.ok;
deny|波括弧を含むテンプレートリテラル型で宣言が開いたままにならない|export type Tpl = `{${string}`;@@const expected = { ok: false };@@const label = result.ok;
pass|複数行の型宣言に ok: true を持つファイルで result.ok を読む|type Ok = Readonly<{@@  ok: true;@@  value: number;@@}>;@@const label = result.ok;
pass|複数行の型宣言に some: true を持つファイルで option.some を読む|type Some = Readonly<{@@  some: true;@@  value: number;@@}>;@@const has = option.some;
pass|export された型宣言も定義と数える|export type Ok = Readonly<{@@  ok: true;@@  value: number;@@}>;@@const label = result.ok;
pass|判別子が 2 番目以降のメンバでも定義と数える|export type Ok = Readonly<{@@  value: number;@@  ok: true;@@}>;@@const label = result.ok;
pass|型メンバを , で区切った 1 行の型宣言も定義と数える|export type Ok = Readonly<{ value: number, ok: true }>;@@const label = result.ok;
pass|readonly 付きのメンバも定義と数える|export type Ok = Readonly<{@@  readonly ok: true;@@  readonly value: number;@@}>;@@const label = result.ok;
pass|判別子が false 側の型宣言も定義と数える|export type None = Readonly<{@@  some: false;@@}>;@@const has = option.some;
pass|コンパニオンの生成メソッドを呼ぶ|const made = Result.ok(1);@@const wrapped = Option.some<number>(2);
pass|コンパニオンの生成メソッドを値として渡す|const fns = [Result.ok, Option.some];
pass|Array.prototype.some を呼ぶ|const found = list.some((x) => x > 1);
pass|コンパニオン以外の総称メソッドを呼ぶ|const wrapped = wrapper.some<number>(2);
pass|判別子と前方一致する別の識別子を読む|const other = result.okValue;
pass|JSDoc の継続行に判別子を書く|/**@@ * `result.ok` ではなく Result.isOk で判定する。@@ */@@export const Doc = 1;
pass|行コメントに判別子を書く|// result.ok は直接読まない
pass|行末に追い書きしたコメントに判別子を書く|const v = Result.isOk(r) ? 1 : 0; // result.ok は読まない
pass|文字列リテラルに判別子の綴りを書く|test("option.some を直読みしない", () => { expect(1).toBe(1); });
pass|継続行に * を置かないブロックコメントに判別子を書く|/*@@const label = result.ok;@@*/@@export const Doc = 1;
deny|1 行に閉じたブロックコメントの次の行の直読みを拾う|const a = 1; /* note */@@const label = result.ok;
miss|分割代入で判別子を取り出す|const { ok } = result;
miss|in 演算子で判別子を見る|const has = "some" in option;
miss|ブラケットアクセスで判別子を読む|const has = result["ok"];
CASES

run_table result-option-write <<'CASES'
deny|定義元の外で失敗を 1 行の値リテラルで作る|const expected = { ok: false, error: "e" };
deny|定義元の外で値を持つ Option を複数行の値リテラルで作る|const expected = {@@  some: true,@@  value: 1,@@};
deny|toEqual の期待値に値リテラルを書く|expect(made).toEqual({ ok: true, value: 1 });
deny|定義元の生成メソッドと同じ形を定義元の外で書く|const made = Object.freeze({ ok: true as const, value: 1 });
deny|不在を値リテラルで作る|const expected = { some: false };
deny|ok を定義しているファイルで some の値リテラルを書く|type Ok = Readonly<{ ok: true; value: number }>;@@const expected = { some: false };
deny|some を定義しているファイルで ok の値リテラルを書く|type Some = Readonly<{ some: true; value: number }>;@@const expected = { ok: false, error: "e" };
deny|型宣言を持つファイルでも、領域の外の値リテラルは報告する|export type Foo = Readonly<{@@  value: number;@@}>;@@const expected = { ok: false, error: "e" };
deny|型宣言の領域の外に書いた型注釈も報告する|const made: Readonly<{ ok: true; value: number }> = make();
pass|型宣言で判別子を定義しているファイルの値リテラル|type Scan = Readonly<{@@  ok: true;@@  position: number;@@}>;@@const scanned: Scan = { ok: true, position: 0 };
pass|コンパニオンの生成メソッドで期待値を作る|expect(made).toEqual(Result.err("e"));@@expect(found).toEqual(Option.some(1));@@expect(missing).toBe(Option.none);
pass|判別子と後方一致する別のキー|const flags = { handsome: true, isOk: false };
pass|= で改行し、union の各行に判別子を持つ型宣言|export type R<T> =@@  | Readonly<{ ok: true; value: T }>@@  | Readonly<{ ok: false }>;@@const scanned: R<number> = { ok: false };
pass|三項演算子の : の後ろの真偽リテラル|const flag = cond ? ok : false;
pass|行コメントに値リテラルを書く|// { ok: false, error: e } とは書かない
pass|行末に追い書きしたコメントに値リテラルを書く|const made = Result.err("e"); // { ok: false } とは書かない
pass|JSDoc の継続行に値リテラルを書く|/**@@ * `{ some: true, value }` ではなく Option.some で作る。@@ */@@export const Doc = 1;
pass|継続行に * を置かないブロックコメントに値リテラルを書く|/*@@const expected = { ok: false };@@*/@@export const Doc = 1;
pass|文字列リテラルに値リテラルの綴りを書く|test("{ ok: true } を返さない", () => { expect(1).toBe(1); });
miss|真偽リテラルでない値を判別子に入れる|const made = { ok: flag, value: 1 };
miss|shorthand で判別子を書く|const made = { ok, value };
CASES

# 拡張子の取りこぼし（`SOURCE_SUFFIXES` から `.tsx` が落ちる形）を素通りさせないため、
# `.tsx` でも 1 件見る。表のケースはすべて `.ts` で書き出している
# （`.claude/hooks/README.md`「probe は `.tsx` でも置く」）。
run_case result-option-read deny ".tsx でも直読みを拾う" case.tsx \
  'export const Probe = () => (result.ok ? <p>y</p> : <p>n</p>);'
run_case result-option-write deny ".tsx でも直書きを拾う" case.tsx \
  'export const Probe = () => <p>{String({ ok: false, error: "e" })}</p>;'

# 型宣言だけのファイル（`*.d.ts`）は実装を持たないので走査しない。
run_case result-option-read pass "*.d.ts は走査しない" case.d.ts \
  'declare const probe: typeof result.ok;'

# 報告は先頭 10 件で切り、残りを件数で示す。表のケースは 1〜2 件しか出さないので、
# 切り詰めの行はここでしか通らない。
rm -f "$work/src"/*
for _ in $(seq 11); do echo 'const label = result.ok;' >> "$work/src/case.ts"; done
truncated="$(python3 "$detector" "$work/src" || true)"
if printf '%s' "$truncated" | grep -q '^  \.\.\. 他 1 件$'; then
  printf 'ok   %-4s %s\n' "deny" "11 件出たら先頭 10 件で切り、残りを件数で示す"
else
  printf 'NG   expected=%s got=%s  %s\n' "deny" "切り詰めの行が出ない" "11 件出たら先頭 10 件で切り、残りを件数で示す"
  cases_failed=1
fi

exit "$cases_failed"
