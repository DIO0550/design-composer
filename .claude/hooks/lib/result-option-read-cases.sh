#!/usr/bin/env bash
#
# `Result` / `Option` の判別子の直読み検査の判定表。`result-option-read-violations.py` へ
# 小さなソースを流し、deny / pass / miss が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/result-option-read-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、免除の判定（その判別子を型宣言で定義しているファイルか）が
# この検査の中心で、手で 1 回動かすだけでは退行を検知できないため。** 同じ形の前例は
# 同じフォルダの `canary-cases.sh`。
#
# **判定は終了コードで見る。** 層 1(CI の `run:`)と層 2(`pre-push` の `set -e`)は
# 終了コードだけが配線なので、標準出力の文字列を見ても止まることを確かめたことに
# ならない(`.claude/hooks/README.md`「終了コードまで見る」)。deny の行はさらに報告の
# 見出しが出ることも見る。
#
# 表は `期待|ケース名|ソース` の 1 行 1 ケース。ソース中の `@@` は改行に置き換わる。
# 期待は 3 つ。
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
detector="$lib_dir/result-option-read-violations.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/src"
failed=0

# 検出器を 1 度走らせ、終了コードから deny / pass を決める。
verdict() {
  local output status
  output="$(python3 "$detector" "$work/src")" && status=0 || status=$?
  if [ "$status" -ne 1 ]; then
    echo "pass"
    return 0
  fi
  # exit 1 は違反あり。報告の見出しが無いなら判定が壊れている。
  if printf '%s' "$output" | grep -q '^\[result-option-read\]'; then
    echo "deny"
  else
    echo "broken"
  fi
}

verdict_width=4
. "$lib_dir/cases-report.sh"

while IFS='|' read -r expected label source; do
  [ -n "$source" ] || continue
  rm -f "$work/src"/*
  printf '%s\n' "${source//@@/$'\n'}" > "$work/src/case.ts"
  decision="$(verdict)"
  # 意図した取りこぼしは pass になるのが正解。
  if [ "$expected" = "miss" ] && [ "$decision" = "pass" ]; then
    decision="miss"
  fi
  report "$expected" "$decision" "$label"
done <<'CASES'
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
miss|分割代入で判別子を取り出す|const { ok } = result;
miss|in 演算子で判別子を見る|const has = "some" in option;
miss|ブラケットアクセスで判別子を読む|const has = result["ok"];
CASES

# 拡張子の取りこぼし（`SOURCE_SUFFIXES` から `.tsx` が落ちる形）を素通りさせないため、
# `.tsx` でも 1 件見る。表のケースはすべて `.ts` で書き出している
# （`.claude/hooks/README.md`「probe は `.tsx` でも置く」）。
rm -f "$work/src"/*
printf 'export const Probe = () => (result.ok ? <p>y</p> : <p>n</p>);\n' > "$work/src/case.tsx"
report "deny" "$(verdict)" ".tsx でも直読みを拾う"

# 型宣言だけのファイル（`*.d.ts`）は実装を持たないので走査しない。
rm -f "$work/src"/*
printf 'declare const probe: typeof result.ok;\n' > "$work/src/case.d.ts"
report "pass" "$(verdict)" "*.d.ts は走査しない"

# 報告は先頭 10 件で切り、残りを件数で示す。表のケースは 1〜2 件しか出さないので、
# 切り詰めの行はここでしか通らない。
rm -f "$work/src"/*
for _ in $(seq 11); do echo 'const label = result.ok;' >> "$work/src/case.ts"; done
truncated="$(python3 "$detector" "$work/src" || true)"
if printf '%s' "$truncated" | grep -q '^  \.\.\. 他 1 件$'; then
  printf 'ok   %-4s %s\n' "deny" "11 件出たら先頭 10 件で切り、残りを件数で示す"
else
  printf 'NG   expected=%s got=%s  %s\n' "deny" "切り詰めの行が出ない" "11 件出たら先頭 10 件で切り、残りを件数で示す"
  failed=1
fi

exit "$failed"
