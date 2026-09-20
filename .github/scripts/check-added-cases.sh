#!/usr/bin/env bash
#
# 追加された分の検査の判定表。`check-added-lint-suppressions.sh` と
# `check-added-test-helper-duplication.sh` へ一時リポジトリを流し、終了コードと出力が
# 期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/check-added-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 覆うのは「追加行の違反の有無」×「検査を走らせられるか」の組。**走らせられない枝を
# ここへ置くのが主目的**で、外すと「検査できなかった」が「違反がありません」と同じ
# 綴り・同じ終了コードに戻る。
#
# **「走らせられない」は PATH 先頭に置いた壊れた python3 で作る。** PATH から python3 を
# 消す形にすると、前提チェックが `command -v python3` で書かれていても同じ終了コードに
# なり、採らなかったその実装を表が素通りさせる。
#
# 一時リポジトリを組むのは、この 2 本が base と HEAD の差分で判定するため。base との
# 差分が無いブランチではループ本体が 1 度も回らず、検出器が 1 回も呼ばれないまま
# 「ありません」が出る。「base と差分が無い」のケースがそこを分けている。
#
# 表は `期待する終了コード|出力に含まれる綴り|検査|python3|検出器|入力|ケース名`。
# 綴りが空の行は終了コードだけを見る。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
failed=0

# 外側のリポジトリを指す git の環境変数を落とす。立ったまま一時ディレクトリで
# `git init` すると本物のリポジトリが re-init され、以降の `git add` が本物の
# インデックスを触る。
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

lint_script=check-added-lint-suppressions.sh
lint_check_name="追加された lint 抑制"
lint_detector=lint-suppressions.py

duplication_script=check-added-test-helper-duplication.sh
duplication_check_name="追加されたテストヘルパーの重複"
duplication_detector=duplicate-test-helpers.py

# 抑制コメントをそのまま置ける。`check-added-lint-suppressions.sh` も
# `block-lint-suppress.sh` も見るのは `*.ts` `*.tsx` `*.js` `*.jsx` だけで、`.sh` は対象外。
suppressed_ts="// biome-ignore lint/suspicious/noExplicitAny: 判定表のための行
export const other = 2;
"
plain_ts='export const added = 3;
'
base_ts='export const value = 1;
'
# 本体が一字一句同じヘルパーを 2 つ置く。本体は空白を潰して 20 文字以上でないと
# 検出器が見ない(`duplicate-test-helpers.py` の MIN_BODY_CHARS)。
helper_body='  return { width: 100, height: 200 };
};
'
mate_ts="export const artboard = () => {
${helper_body}"
added_helper_ts="export const board = () => {
${helper_body}"

# 一時リポジトリの中でコミットする。CI のランナーには既定の user.email が無いので
# `-c` で毎回渡す(手元は global の設定で通ってしまい、CI だけが落ちる)。
commit_in() {
  local dir="$1"
  shift
  git -C "$dir" -c user.email=cases@example.com -c user.name=cases commit -q "$@"
}

# 起動すると 127 で落ちる python3 を持つディレクトリを作り、そのパスを返す。
broken_python3_dir() {
  local dir="$1/broken-bin"
  mkdir -p "$dir"
  printf '#!/usr/bin/env bash\nexit 127\n' >"$dir/python3"
  chmod +x "$dir/python3"
  printf '%s' "$dir"
}

# 入力の名前から、base コミットと HEAD コミットを持つ一時リポジトリを組み、そのパスを返す。
#
# 検出器は「リポジトリ top からの相対パス」で呼ばれるので、`.claude/hooks/lib/` を
# 中へコピーしないと、python3 が動いていても検出器が見つからない。
setup_repo() {
  local input="$1" path mate_path="" mate_content="" added_content
  local dir
  dir="$(mktemp -d --tmpdir="$work")"

  case "$input" in
    lint-*) path=src/sample.ts ;;
    *) path=src/a/__tests__/a.test.ts
       mate_path=src/b/__tests__/b.test.ts
       mate_content="$mate_ts" ;;
  esac
  case "$input" in
    lint-violation) added_content="$suppressed_ts" ;;
    duplication-violation) added_content="$added_helper_ts" ;;
    no-diff) added_content="" ;;
    *) added_content="$plain_ts" ;;
  esac

  mkdir -p "$dir/.claude/hooks/lib" "$dir/$(dirname "$path")"
  cp "$repo_root/.claude/hooks/lib/$lint_detector" \
    "$repo_root/.claude/hooks/lib/$duplication_detector" "$dir/.claude/hooks/lib/"

  git -C "$dir" init -q
  printf '%s' "$base_ts" >"$dir/$path"
  git -C "$dir" add "$path" ".claude/hooks/lib/$lint_detector" \
    ".claude/hooks/lib/$duplication_detector"
  if [ -n "$mate_path" ]; then
    mkdir -p "$dir/$(dirname "$mate_path")"
    printf '%s' "$mate_content" >"$dir/$mate_path"
    git -C "$dir" add "$mate_path"
  fi
  commit_in "$dir" -m base

  if [ -n "$added_content" ]; then
    printf '%s' "$added_content" >>"$dir/$path"
    git -C "$dir" add "$path"
    commit_in "$dir" -m head
  else
    commit_in "$dir" --allow-empty -m head
  fi
  printf '%s' "$dir"
}

# 表の 1 行を走らせて、終了コードと(綴りが指定されていれば)出力を確かめる。
run_case() {
  local expected="$1" expected_text="$2" script="$3" python3_state="$4"
  local detector_state="$5" input="$6" label="$7"
  local dir actual=0 output path_prefix=""

  dir="$(setup_repo "$input")"
  [ "$python3_state" = broken ] && path_prefix="$(broken_python3_dir "$dir"):"
  [ "$detector_state" = missing ] && rm -f "$dir/.claude/hooks/lib/$lint_detector" \
    "$dir/.claude/hooks/lib/$duplication_detector"
  output="$(cd "$dir" && PATH="${path_prefix}${PATH}" \
    bash "$scripts_dir/$script" "$(git -C "$dir" rev-parse HEAD~1)" 2>&1)" || actual=$?

  if [ "$actual" != "$expected" ]; then
    printf 'NG   exit=%s (期待 %s)  %s\n' "$actual" "$expected" "$label"
    failed=1
    return
  fi
  if [ -n "$expected_text" ] && ! printf '%s' "$output" | grep -qF "$expected_text"; then
    printf 'NG   exit=%s 出力に「%s」が無い  %s\n' "$actual" "$expected_text" "$label"
    failed=1
    return
  fi
  printf 'ok   exit=%s  %s\n' "$actual" "$label"
}

# 違反ありのケースが報告の見出しまで見るのは、終了コードだけだと `|| true` を外した実装も
# 同じ 1 で通ってしまうため(外すと違反を見つけた瞬間に見出しを出さずに止まる)。
cases="\
1|検出された行:|$lint_script|ok|present|lint-violation|追加行に lint 抑制がある
0||$lint_script|ok|present|lint-clean|追加行に lint 抑制が無い
0||$lint_script|ok|present|no-diff|base と差分が無い
2|$lint_check_name|$lint_script|broken|present|lint-violation|python3 が起動できない / 追加行に lint 抑制がある
2||$lint_script|broken|present|lint-clean|python3 が起動できない / 追加行に lint 抑制が無い
2||$lint_script|broken|present|no-diff|python3 が起動できない / base と差分が無い
2|$lint_check_name|$lint_script|ok|missing|lint-violation|検出器が見つからない / 追加行に lint 抑制がある
1|検出された行:|$duplication_script|ok|present|duplication-violation|追加行に重複したテストヘルパーがある
0||$duplication_script|ok|present|duplication-clean|追加行に重複したテストヘルパーが無い
2|$duplication_check_name|$duplication_script|broken|present|duplication-violation|python3 が起動できない / 追加行に重複したテストヘルパーがある
2||$duplication_script|broken|present|duplication-clean|python3 が起動できない / 追加行に重複したテストヘルパーが無い
2|$duplication_check_name|$duplication_script|ok|missing|duplication-violation|検出器が見つからない / 追加行に重複したテストヘルパーがある"

while IFS='|' read -r expected expected_text script python3_state detector_state input label; do
  run_case "$expected" "$expected_text" "$script" "$python3_state" "$detector_state" \
    "$input" "$label"
done <<< "$cases"

exit "$failed"
