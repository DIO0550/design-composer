#!/usr/bin/env bash
#
# 計画のファイル表が「コードの import」だけを grep して作られていると、
# doc / Why コメントの中だけで対象ファイルを名指ししている参照を見落とす
# (`分類: plan-comment-reference`)。implementation-flow フェーズ 3 の手順 4 として、
# 変更するファイルごとに、他ファイルのコメント内でその名前に触れている行を洗い出す。
#
# 出す行は「ファイル表に入れるべきかを確かめる候補」であり、そのコメントの主張が
# 実際にこの差分で嘘になるかどうかまでは判定しない(読んで判断する)。
#
# 使い方:
#   find-comment-references.sh <計画で変更するファイルのパス>...
#
# 出力: 対象ファイルごとに `<他ファイル>:<行番号>:<内容>`。無ければ何も出ない
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "使い方: $(basename "$0") <計画で変更するファイルのパス>..." >&2
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"

mapfile -t files < <(git ls-files -- '*.ts' '*.tsx' '*.md' '*.sh')

# index.ts はモジュール名を持たないので、親ディレクトリ名を検索語にする
search_term() {
  local target="$1"
  local base stem
  base="$(basename "$target")"
  stem="${base%.*}"
  if [ "$stem" = "index" ]; then
    stem="$(basename "$(dirname "$target")")"
  fi
  printf '%s' "$stem"
}

# .md は全文が doc なので、行の形を問わずヒットさせる。それ以外の拡張子は
# コメント行(`//` `*` `#` `/*`)だけに絞る
is_relevant_line() {
  local file="$1"
  local content="$2"
  case "$file" in
    *.md) return 0 ;;
  esac
  printf '%s\n' "$content" | grep -qE '^[[:space:]]*(//|\*|#)|/\*'
}

for target in "$@"; do
  stem="$(search_term "$target")"
  echo "=== ${target}(検索語: ${stem}) ==="
  # 対象ファイルにヒットが無い(grep が 1 を返す)のは正常な結果なので、
  # `set -e` に引きずられて途中終了しないよう `|| true` で受ける
  grep -Ern "\b${stem}\b" -- "${files[@]}" 2>/dev/null \
    | grep -v -E "^${target}:" \
    | while IFS= read -r line; do
        file="${line%%:*}"
        # "path:行番号:" の最短一致を剥がして中身だけ取り出す
        content="${line#*:*:}"
        is_relevant_line "$file" "$content" && printf '%s\n' "$line"
      done || true
done
