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
# 加えて、git がクォートして出すパス(非 ASCII・`"`・タブ)の追加と移動を置く。外すと
# クォートされたファイルが `[ -f ]` で黙って検査から外れても、表は緑のまま通る。
#
# 重複の検査には、既にある重複を分割・rename と組めない移動で動かした組と、重複を増やした組を
# 置く。前者は追加行に載っても違反にせず、後者は違反にする(base と本体の数を比べる境界)。
# lint の検査には、既にある抑制行を新しいファイルへ切り出した組を置き、違反にしない。
#
# どちらの検査も比べる相手は base の先端ではなく merge-base(理由は lib/added-lines.sh の
# `init_added_lines`)。分岐のあとで base 側に同じ本体を足した組と、lint には base 側から消した組を
# 置く。後者が無いと、先端と merge-base の両方に本体があるときだけ除く実装も表を通る。
#
# **「走らせられない」は PATH 先頭に置いた壊れた python3 で作る。** PATH から python3 を
# 消す形にすると、前提チェックが `command -v python3` で書かれていても同じ終了コードに
# なり、採らなかったその実装を表が素通りさせる。
#
# 一時リポジトリを組むのは、この 2 本が base と HEAD の差分で判定するため。base との
# 差分が無いブランチではループ本体が 1 度も回らず、検出器が 1 回も呼ばれないまま
# 「ありません」が出る。「base と差分が無い」のケースがそこを分けている。
#
# 表は `期待する終了コード|出力に含まれる綴り|検査|python3|検出器|入力|ケース名|出力に含まれない綴り`。
# 綴りが空(最後の列は省略)なら、その綴りは見ない。
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
# base に無い本体を持つ、新しく作った重複の組
fresh_pair_ts='export const freshA = () => {
  return { depth: 300, weight: 400 };
};
export const freshB = () => {
  return { depth: 300, weight: 400 };
};
'
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

# base の時点で、HEAD が移す・書き足す本体(lint は抑制行・重複はヘルパー)を既に持つ入力か。
base_has_carried_body() {
  case "$1" in
    duplication-renamed*|duplication-split*|duplication-moved-dissimilar|duplication-grown*) return 0 ;;
    lint-split*) return 0 ;;
  esac
  return 1
}

# 入力の名前から、base コミットと HEAD コミットを持つ一時リポジトリを組み、そのパスを返す。
#
# 検出器は「リポジトリ top からの相対パス」で呼ばれるので、`.claude/hooks/lib/` を
# 中へコピーしないと、python3 が動いていても検出器が見つからない。
setup_repo() {
  local input="$1" path mate_path="" mate_content="" added_content carried_body
  local dir
  dir="$(mktemp -d --tmpdir="$work")"

  case "$input" in
    lint-violation-non-ascii) path=src/日本語.ts ;;
    lint-violation-quoted) path='src/say"hi".ts' ;;
    lint-*) path=src/sample.ts ;;
    duplication-violation-non-ascii) path=src/日本語/__tests__/a.test.ts ;;
    duplication-violation-tab) path=$'src/tab\tdir/__tests__/a.test.ts' ;;
    *) path=src/a/__tests__/a.test.ts ;;
  esac
  case "$input" in
    duplication-*) mate_path=src/b/__tests__/b.test.ts
       mate_content="$mate_ts" ;;
  esac
  # 追加行・base 側に足す本体・移す本体を同じ変数から取る。`*-main-advanced` は、base 側に
  # 足したものと追加行の綴りが一致していないと、先端と比べる実装でも違反になって表を通す
  case "$input" in
    lint-*) carried_body="$suppressed_ts" ;;
    *) carried_body="$added_helper_ts" ;;
  esac
  case "$input" in
    lint-violation*|duplication-violation*) added_content="$carried_body" ;;
    no-diff) added_content="" ;;
    *) added_content="$plain_ts" ;;
  esac
  base_has_carried_body "$input" && added_content=""

  mkdir -p "$dir/.claude/hooks/lib" "$dir/$(dirname "$path")"
  cp "$repo_root/.claude/hooks/lib/$lint_detector" \
    "$repo_root/.claude/hooks/lib/$duplication_detector" "$dir/.claude/hooks/lib/"

  git -C "$dir" init -q
  printf '%s' "$base_ts" >"$dir/$path"
  # 移動・分割・書き足しの検査では、本体は base の時点で既にある(重複なら相方と 2 件)
  base_has_carried_body "$input" && printf '%s' "$carried_body" >>"$dir/$path"
  git -C "$dir" add "$path" ".claude/hooks/lib/$lint_detector" \
    ".claude/hooks/lib/$duplication_detector"
  if [ -n "$mate_path" ]; then
    mkdir -p "$dir/$(dirname "$mate_path")"
    printf '%s' "$mate_content" >"$dir/$mate_path"
    git -C "$dir" add "$mate_path"
  fi
  commit_in "$dir" -m base

  local moved="" written=""
  case "$input" in
    duplication-renamed) moved=src/moved/__tests__/a.test.ts ;;
    duplication-renamed-non-ascii) moved=src/移動/__tests__/a.test.ts ;;
    duplication-renamed-tab) moved=$'src/tab\tdir/__tests__/a.test.ts' ;;
    duplication-moved-dissimilar) moved=src/moved/__tests__/a.test.ts ;;
    duplication-split*) written="$(dirname "$path")/c.test.ts" ;;
    lint-split*) written=src/split.ts ;;
    duplication-grown*) written=src/c/__tests__/c.test.ts ;;
  esac
  case "$input" in
    *-main-advanced|*-main-removed)
      # 分岐のあとで、base 側(タグ `base`)に同じ本体を足す / base 側から本体を消す
      git -C "$dir" checkout -q -b advanced
      case "$input" in
        *-main-advanced)
          mkdir -p "$dir/src/d/__tests__"
          printf '%s' "$carried_body" >"$dir/src/d/__tests__/d.test.ts"
          git -C "$dir" add src/d/__tests__/d.test.ts ;;
        *-main-removed)
          printf '%s' "$base_ts" >"$dir/$path"
          git -C "$dir" add "$path" ;;
      esac
      commit_in "$dir" -m advanced
      git -C "$dir" tag base
      git -C "$dir" checkout -q - ;;
  esac
  if [ "$input" = duplication-moved-dissimilar ]; then
    # 4 行のファイルへ 8 行書き足し、類似度を git の rename の閾値(既定 50%)より下げる。
    # rename として組めると `duplication-renamed` と同じ経路を通り、base 照合を外しても通る
    mkdir -p "$dir/$(dirname "$moved")"
    git -C "$dir" mv "$path" "$moved"
    printf 'export const extra%s = %s;\n' 1 1 2 2 3 3 4 4 5 5 6 6 7 7 8 8 >>"$dir/$moved"
    git -C "$dir" add "$moved"
    commit_in "$dir" -m head
  elif [ -n "$written" ]; then
    # 分割は元のファイルから本体を消し(重複は 2 件のまま)、書き足しは残す(2 件から 3 件)
    case "$input" in duplication-split*|lint-split*) printf '%s' "$base_ts" >"$dir/$path" ;; esac
    mkdir -p "$dir/$(dirname "$written")"
    printf '%s' "$carried_body" >"$dir/$written"
    # 移しただけの既存の重複と、新しく作った重複を同じファイルに同居させる
    [ "$input" = duplication-split-with-new ] && printf '%s' "$fresh_pair_ts" >>"$dir/$written"
    git -C "$dir" add "$path" "$written"
    commit_in "$dir" -m head
  elif [ -n "$moved" ]; then
    # 移動しただけのファイルが全行「追加」に見えると、既存の重複が新規として報告される
    mkdir -p "$dir/$(dirname "$moved")"
    git -C "$dir" mv "$path" "$moved"
    commit_in "$dir" -m head
  elif [ -n "$added_content" ]; then
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
  local detector_state="$5" input="$6" label="$7" absent_text="$8"
  local dir actual=0 output path_prefix="" base_rev

  dir="$(setup_repo "$input")"
  [ "$python3_state" = broken ] && path_prefix="$(broken_python3_dir "$dir"):"
  [ "$detector_state" = missing ] && rm -f "$dir/.claude/hooks/lib/$lint_detector" \
    "$dir/.claude/hooks/lib/$duplication_detector"
  # base は既定で HEAD の 1 つ前。分岐のあとで base 側が進むケースだけ、タグ `base` を渡す
  base_rev="$(git -C "$dir" rev-parse -q --verify refs/tags/base || git -C "$dir" rev-parse HEAD~1)"
  output="$(cd "$dir" && PATH="${path_prefix}${PATH}" \
    bash "$scripts_dir/$script" "$base_rev" 2>&1)" || actual=$?

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
  if [ -n "$absent_text" ] && printf '%s' "$output" | grep -qF "$absent_text"; then
    printf 'NG   exit=%s 出力に「%s」がある  %s\n' "$actual" "$absent_text" "$label"
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
2|$duplication_check_name|$duplication_script|ok|missing|duplication-violation|検出器が見つからない / 追加行に重複したテストヘルパーがある
0||$duplication_script|ok|present|duplication-renamed|既にある重複をフォルダごと移しただけ
1|検出された行:|$lint_script|ok|present|lint-violation-non-ascii|非 ASCII のパスの追加行に lint 抑制がある
1|検出された行:|$lint_script|ok|present|lint-violation-quoted|\" を含むパスの追加行に lint 抑制がある
1|検出された行:|$duplication_script|ok|present|duplication-violation-non-ascii|非 ASCII のフォルダの追加行に重複したテストヘルパーがある
1|検出された行:|$duplication_script|ok|present|duplication-violation-tab|タブを含むフォルダの追加行に重複したテストヘルパーがある
0||$duplication_script|ok|present|duplication-renamed-non-ascii|既にある重複を非 ASCII のフォルダへ移しただけ
0||$duplication_script|ok|present|duplication-renamed-tab|既にある重複をタブを含むフォルダへ移しただけ
0||$duplication_script|ok|present|duplication-split|既にある重複を、同じフォルダの新しいファイルへ切り出した
0||$duplication_script|ok|present|duplication-moved-dissimilar|既にある重複を、rename と組めないほど書き足しながら別のフォルダへ移した
1|検出された行:|$duplication_script|ok|present|duplication-grown|既にある重複の本体を、さらに別のファイルへ書き足した
1|検出された行:|$duplication_script|ok|present|duplication-grown-main-advanced|既にある重複の本体を書き足し、分岐のあとで base 側にも同じ本体が足された
1|:freshA|$duplication_script|ok|present|duplication-split-with-new|既にある重複を切り出した先に、新しい重複を作った|:board
0||$lint_script|ok|present|lint-split|既にある lint 抑制を、新しいファイルへ切り出した
1|検出された行:|$lint_script|ok|present|lint-violation-main-advanced|追加行に lint 抑制があり、分岐のあとで base 側にも同じ綴りの抑制が足された
0||$lint_script|ok|present|lint-split-main-removed|既にある lint 抑制を切り出し、分岐のあとで base 側からはその抑制が消された"

while IFS='|' read -r expected expected_text script python3_state detector_state input label absent_text; do
  run_case "$expected" "$expected_text" "$script" "$python3_state" "$detector_state" \
    "$input" "$label" "$absent_text"
done <<< "$cases"

exit "$failed"
