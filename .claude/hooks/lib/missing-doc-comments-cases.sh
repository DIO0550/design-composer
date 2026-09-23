#!/usr/bin/env bash
#
# doc コメント検査の判定表。`missing-doc-comments.py` へ小さなファイルを流し、
# deny / pass / miss が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/missing-doc-comments-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、コンパニオンオブジェクトのメソッドの見分け方(オブジェクトの
# 直下・本体が続くか)がこの検査の中心で、`--include-methods` を付けて呼ぶ `check-added-doc-comments.sh`
# は追加行に違反が無い限り緑のままだから。** 同じ形の前例は同じフォルダの `story-title-cases.sh`。
#
# 検出器は `--lines` ではなく既定の形で呼ぶ。`decide` は exit 1 に報告の見出しがあるかまで
# 見るが、`--lines` の出力には見出しが無い。
#
# 表は `期待|--include-methods を付けるか|入力|ケース名` の 1 行 1 ケース。期待は 3 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `deny` | 違反として報告してほしい(exit 1) |
# | `pass` | 報告してはいけない(誤検知したら信用を失う側) |
# | `miss` | **意図した取りこぼし。** 入れ子のオブジェクトのメソッドは見ない。期待の綴りを
#            分けてあるのは、`pass` と並べると次に読む人がバグと読んで直しにいくため |
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/missing-doc-comments.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$lib_dir/cases-report.sh"

# 入力の名前から、検査するファイルの中身を書く。どの入力もコンパニオンオブジェクトそのものには
# doc を付けてあり、ケースが見ているメンバ以外で報告が出ないようにしてある。
write_input() {
  local input="$1" file="$2"
  case "$input" in
    method-undocumented)
      printf '/** 値 */\nexport const Foo = {\n  bar(x: number): number {\n    return x;\n  },\n};\n' ;;
    method-multiline-undocumented)
      printf '/** 値 */\nexport const Foo = {\n  bar(\n    x: number,\n  ): number {\n    return x;\n  },\n};\n' ;;
    property-undocumented)
      printf '/** 値 */\nexport const Foo = {\n  bar: (x: number): number => {\n    return x;\n  },\n};\n' ;;
    expression-property-undocumented)
      printf '/** 値 */\nexport const Foo = {\n  bar: (x: number): number => x + 1,\n};\n' ;;
    call-in-body-undocumented)
      printf '/** 値 */\nexport const Foo = {\n  bar: (x: number): number => Math.abs(x),\n};\n' ;;
    annotated-companion-undocumented)
      printf '/** 型 */\nexport type Bar = { bar(x: number): number };\n/** 値 */\nexport const Foo: Bar = {\n  bar(x: number): number {\n    return x;\n  },\n};\n' ;;
    unexported-companion-undocumented)
      printf '/** 値 */\nconst Foo = {\n  bar(x: number): number {\n    return x;\n  },\n};\n' ;;
    function-after-companion)
      printf '/** 値 */\nexport const Foo = {\n  /**\n   * 足す\n   * @param x 元の値\n   * @returns 足した値\n   */\n  bar(x: number): number {\n    return x;\n  },\n};\n\nexport function later(x: number): number {\n  return x;\n}\n' ;;
    method-items-missing)
      printf '/** 値 */\nexport const Foo = {\n  /** 足す */\n  bar(x: number): number {\n    return x;\n  },\n};\n' ;;
    method-documented)
      printf '/** 値 */\nexport const Foo = {\n  /**\n   * 足す\n   * @param x 元の値\n   * @returns 足した値\n   */\n  bar(x: number): number {\n    return x;\n  },\n};\n' ;;
    # `=>` を持つ関数型のメンバにしてあるのは、本体が続くかの判定では弾けない入力にして、
    # `type` をオブジェクトとして読まないことだけを守らせるため。
    type-literal-member)
      printf '/** 型 */\nexport type Foo = {\n  ref: (kind: string) => string;\n};\n' ;;
    lookup-table)
      printf '/** 表 */\nexport const Foo = {\n  colors: "Color",\n};\n' ;;
    parenthesized-value)
      printf '/** 値 */\nexport const Foo = {\n  width: (1 + 2) * 3,\n};\n' ;;
    nested-method-undocumented)
      printf '/** 値 */\nexport const Foo = {\n  /** 入れ子 */\n  refs: {\n    bar(x: number): number {\n      return x;\n    },\n  },\n};\n' ;;
    brace-in-string)
      printf '/** 値 */\nexport const Foo = {\n  /**\n   * 括弧を足す\n   * @param x 元の文字列\n   * @returns 足した文字列\n   */\n  a(x: string): string {\n    return x + "{";\n  },\n  b(x: number): number {\n    return x;\n  },\n};\n' ;;
    function-undocumented)
      printf 'export function bar(x: number): number {\n  return x;\n}\n' ;;
  esac >"$file"
}

# 検出器を 1 度走らせ、終了コードから deny / pass を決める。
verdict() {
  local flag="$1" file="$2" output status
  if [ "$flag" = "methods" ]; then
    output="$(python3 "$detector" --include-methods "$file")" && status=0 || status=$?
  else
    output="$(python3 "$detector" "$file")" && status=0 || status=$?
  fi
  decide "$output" "$status" '^doc が規約を満たしていません'
}

while IFS='|' read -r expected flag input label; do
  [ -n "$input" ] || continue
  file="$work/src/sample.ts"
  mkdir -p "$(dirname "$file")"
  write_input "$input" "$file"
  report "$expected" "$(normalize_miss "$expected" "$(verdict "$flag" "$file")")" "$label"
done <<'CASES'
deny|methods|method-undocumented|コンパニオンのメソッドに doc が無い
deny|methods|method-multiline-undocumented|シグネチャを改行したメソッドに doc が無い
deny|methods|property-undocumented|関数プロパティ(name: (x) => {)に doc が無い
deny|methods|expression-property-undocumented|式本体の関数プロパティ(name: (x) => x + 1,)に doc が無い
deny|methods|method-items-missing|メソッドの doc に @param / @returns が無い
pass|methods|method-documented|メソッドに @param / @returns の揃った doc がある
pass|methods|type-literal-member|type の型リテラルの関数型のメンバはオブジェクトのメソッドとして読まない
pass|methods|lookup-table|対応表のキーは引数の括弧が無いので読まない
pass|methods|parenthesized-value|値が括弧で始まるだけのプロパティは本体が続かないので読まない
miss|methods|nested-method-undocumented|入れ子のオブジェクトのメソッドは見ない(意図した取りこぼし)
deny|methods|brace-in-string|文字列の中に { があっても、その後ろのメソッドを報告する
deny|methods|call-in-body-undocumented|式本体に括弧を含む関数プロパティ(=> Math.abs(x))に doc が無い
deny|methods|annotated-companion-undocumented|型注釈の付いたコンパニオン(const Foo: Bar = {)のメソッドに doc が無い
deny|methods|unexported-companion-undocumented|export していないコンパニオンのメソッドに doc が無い
deny|methods|function-after-companion|コンパニオンを閉じた後ろのファイル直下の関数に doc が無い
pass|default|method-undocumented|--include-methods を付けなければ doc の無いメソッドを報告しない
deny|default|function-undocumented|ファイル直下の関数に doc が無い
deny|methods|function-undocumented|--include-methods を付けてもファイル直下の関数を報告する
CASES

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "doc コメントの判定表: 期待どおり"
