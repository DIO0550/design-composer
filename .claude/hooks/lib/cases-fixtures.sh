#!/usr/bin/env bash
#
# フックの判定表(`*-cases.sh`)が共有する、ケースの前提の置き方。落ちる検出器・起動できないコマンド・
# 本体が同じテストヘルパーを渡されたパスへ置くものと、サブエージェントの中の呼び出しの入力と Bash の
# 呼び出しの入力を組むものと、フックを一時ディレクトリへ写すもの。
#
# 使う側: lib/pre-push-detector-cases.sh / lib/edit-detector-cases.sh / lib/import-rule-cases.sh /
# lib/verification-agent-cases.sh / lib/parent-session-edit-cases.sh / lib/issue-flow-kind-cases.sh /
# lib/git-add-all-cases.sh / lib/commit-md-heading-cases.sh
#
# 終了コードと出力の組を実物の検出器から決まった形で作れないので、判定表は検出器をスタブで作る
# (ここに置くのは判定表どうしが共有する落ちる側。報告の行を出すスタブは報告の綴りが違うので各判定表が持つ)。
#
# 起動できない python3 は、起動すると 127 で落ちる。`command -v python3` で疎通を見る実装は
# これを見つけてしまい、検出器を走らせて「落ちた」と読む(起動して見る `python3_usable` は
# 無いものと扱う)。

cases_fixtures_repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# サブエージェントの中の PreToolUse で、session_id と tool_input の間に挟むフィールドを出す(`,` で終わる)。
# サブエージェントの中の呼び出しは、入力に `agent_id` / `agent_type` が載る(並びは実物の入力に合わせた)。
#
# $1 ツール名
subagent_call_fields() {
  printf '"agent_id":"ab90e859b438c06a1","agent_type":"implementer","hook_event_name":"PreToolUse","tool_name":"%s",' "$1"
}

# 起動するとすぐ落ちる検出器のスタブを置く。どれも報告の行を出さない。
#
# $1 落ち方(`crash` は traceback、`summary-exit1` は要約の行だけを出して exit 1、
#    `usage` は使い方を出して exit 2)
# $2 スタブを書くパス
place_failing_detector() {
  local failure="$1" target="$2"
  case "$failure" in
    crash) printf 'raise RuntimeError("判定表: 検出器が途中で落ちる")\n' >"$target" ;;
    summary-exit1) printf 'import sys\nprint("違反は 0 件")\nsys.exit(1)\n' >"$target" ;;
    usage) printf 'import sys\nprint("使い方: 検査する対象を渡す")\nsys.exit(2)\n' >"$target" ;;
  esac
}

# 起動すると 127 で落ちるコマンドを置き、PATH の先頭に足す値を返す。`broken` 以外なら空。
#
# $1 コマンド名(`python3` / `jq` など)
# $2 `broken` なら置く
# $3 置き場のディレクトリ(その下の `broken-bin/` に置く。後ろのケースへ残さないよう呼び出し側が消す)
broken_command_path_prefix() {
  [ "$2" = "broken" ] || return 0
  mkdir -p "$3/broken-bin"
  printf '#!/usr/bin/env bash\nexit 127\n' >"$3/broken-bin/$1"
  chmod +x "$3/broken-bin/$1"
  printf '%s:' "$3/broken-bin"
}

# リポジトリのファイルを、リポジトリと同じ相対位置で写し先へ写す(判定表がフックを一時ディレクトリで走らせるため)。
#
# $1 写し先のディレクトリ
# $2 以降 リポジトリのルートからの相対パス
copy_repo_files() {
  local dest="$1" path
  shift
  for path in "$@"; do
    mkdir -p "$dest/$(dirname "$path")"
    cp "$cases_fixtures_repo_dir/$path" "$dest/$path"
  done
}

# 深さの違う 2 つの `__tests__/`(`a/__tests__/` と `b/c/__tests__/`)の `setup.ts` に、本体が同じヘルパーを置く。
#
# $1 置き場のディレクトリ(`src` にあたるもの)
place_duplicate_helpers() {
  local folder
  for folder in "$1/a/__tests__" "$1/b/c/__tests__"; do
    mkdir -p "$folder"
    printf 'function openedAt(path: string) {\n  return OpenedDocument.create({ path, document: sampleDocument() });\n}\n' \
      >"$folder/setup.ts"
  done
}

# Bash の PreToolUse でフックへ渡す JSON を書く(`tool_input.command` だけを載せる)。
#
# $1 フックへ渡すコマンド
bash_call_input() {
  jq -n --arg c "$1" '{tool_input: {command: $c}}'
}
