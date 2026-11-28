#!/usr/bin/env bash
#
# Issue の作業の種類の判定表 2 本(`issue-flow-kind-cases.sh` と `issue-flow-kind-real-gh-cases.sh`)が共有する、
# ケースの前提の置き方。自リポジトリの origin・提案の行・共通節と、本文ファイルを置く関数を持つ。
#
# 使う側は `work`(作業ディレクトリ)を決めてから source し、`place_files` を呼ぶ。

own_origin="https://github.com/acme/widgets"
proposal_line='種類の提案: flow:feature（根拠）'
sections_body='## ゴール
作成できる

## 完了の確かめ方
結果を確認する

## 拠り所
無し

## 決めてよい範囲
既定に従う'
completion_section=$'## 完了の確かめ方\n結果を確認する\n\n'
missing_completion_body="${sections_body/"$completion_section"/}"

# 文字列を JSON の文字列にする(表の入力に出る制御文字は改行とタブだけ)。
#
# $1 文字列
json_string() {
  local text="$1"
  text="${text//\\/\\\\}"
  text="${text//\"/\\\"}"
  text="${text//$'\n'/\\n}"
  text="${text//$'\t'/\\t}"
  printf '"%s"' "$text"
}

# 表の `@S` を改行の印付きの共通節、`@SJ` を JSON 文字列内の共通節に置き換える。
#
# $1 表の入力
expand_section_tokens() {
  local text="$1" json
  json="$(json_string "$sections_body")"
  text="${text//@SJ/${json:1:${#json}-2}}"
  printf '%s' "${text//@S/${sections_body//$'\n'/⏎}}"
}

# 本文のファイルを `$work` に置く。`big.md` は提案の行を持つが 1 MiB を超え、`sub/rel.md` は `cd sub` の後の
# 相対パスで読まれるはずのもの(作業ディレクトリ直下に `rel.md` は置かない)。
place_files() {
  mkdir -p "$work/sub" "$work/elsewhere"
  printf '前置き\n%s\n\n%s\n' "$proposal_line" "$sections_body" >"$work/prop.md"
  printf '本文だけ\n' >"$work/plain.md"
  { printf '%s\n' "$proposal_line"; head -c 1100000 /dev/zero | tr '\0' 'a'; } >"$work/big.md"
  printf '%s\n\n%s\n' "$proposal_line" "$sections_body" >"$work/sub/rel.md"
  printf '%s\n' "$sections_body" >"$work/sections.md"
  printf '%s\n' "${sections_body//## /### }" >"$work/sections-h3.md"
  printf '{"title":"x"}\n' >"$work/in-plain.json"
  printf '{"title":"x","body":%s}\n' "$(json_string "前置き"$'\n'"$proposal_line"$'\n\n'"$sections_body")" >"$work/in-body.json"
  printf '{"title":"x","labels":["flow:feature"],"body":%s}\n' \
    "$(json_string "$missing_completion_body")" >"$work/in-missing-completion.json"
  printf 'title: x\n' >"$work/bad.json"
}
