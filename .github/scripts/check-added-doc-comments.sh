#!/usr/bin/env bash
#
# この PR で**追加された**宣言(コンパニオンオブジェクトのメソッドを含む)のうち、doc コメントが
# 無いもの・「doc に書く項目」が欠けたものを検出する。1 件でもあれば exit 1。
#
# `missing-doc-comments.py --all src`(`rules-check` / `harness/githooks/pre-push`)はメソッドを
# 見ないので、メソッドはここで**追加された行に載っているものだけ**を違反にする。`--all` に
# 載せない理由と外す条件は `.claude/hooks/README.md`「例外(エスケープハッチ)」。
#
# 判定そのものは `.claude/hooks/lib/missing-doc-comments.py --include-methods --lines` で
# 共有している(`<行番号>:<名前>` を返す)。報告の行番号は宣言の始まりの行なので、改行した
# シグネチャの引数の行だけを足した場合は追加行に入らず通る。
set -euo pipefail

# `cd` の前に解決する(`cd` したあとの `$0` は元の作業ディレクトリからの相対になる)
script_dir="$(cd "$(dirname "$0")" && pwd)"
base="${1:-${BASE_SHA:-origin/main}}"
cd "$(git rev-parse --show-toplevel)"

. "$script_dir/lib/detector-precondition.sh"
. "$script_dir/lib/added-lines.sh"
init_added_lines "$base"
detector=.claude/hooks/lib/missing-doc-comments.py
require_runnable_detector "追加された宣言の doc コメント" "$detector"

violations=""
while IFS= read -r file; do
  [ -f "$file" ] || continue
  # ファイル単位のエスケープハッチ(check-doc-comments.sh / pre-push-doc-comments.sh と同じ)
  grep -qm1 '@doc-comments-ok' "$file" 2>/dev/null && continue

  added="$(added_line_numbers "$base" "$file")"
  [ -z "$added" ] && continue

  # `|| true` は外せない(理由は check-added-lint-suppressions.sh の同じ行)。
  reported="$(python3 "$detector" --include-methods --lines "$file" || true)"
  [ -z "$reported" ] && continue

  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    violations="${violations}${file}:${entry}
"
  done < <(entries_on_added_lines "$added" "$reported")
done < <(git diff --name-only --diff-filter=d "$base"...HEAD -- 'src/*.ts' 'src/*.tsx')

if [ -z "$violations" ]; then
  echo "追加された宣言の doc コメントに抜けはありません"
  exit 0
fi

cat <<'MESSAGE'
doc が規約を満たしていません(このブランチで新しく追加された宣言)。
rules/coding.md「コメントは doc と Why / Why not に絞る」「doc に書く項目」
その関数・メソッドが何かに加え、引数は @param、戻り値は @returns、投げる例外は @throws を書いてください。
意図して省くなら、ファイルに `// @doc-comments-ok` を記載します。

検出された行:
MESSAGE
printf '%s' "$violations"
exit 1
