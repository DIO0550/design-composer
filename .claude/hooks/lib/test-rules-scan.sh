#!/usr/bin/env bash
#
# テスト規約(rules/testing.md)の全体検査。指定したルート配下の *.test.ts(x) を
# すべて検査し、違反の説明を標準出力へ書く。違反があれば exit 1。
#
# 使う側:
#   - .claude/hooks/pre-push-test-rules.sh  (Claude Code の PreToolUse。deny の理由に使う)
#   - harness/githooks/pre-push             (git のフック。exit コードで止める)
#
# 検証ルール・無効化の方法は check-test-rules.sh(PostToolUse 版)と同一。
#   - no-describe:    describe/context/suite 禁止
#   - no-conditional: test() / it() のブロック内の if/else/switch 禁止
#   - file-naming:    {テスト対象}.{カテゴリ}.test.ts|tsx 形式
#   - test-location:  テストは対象モジュールと同じフォルダの __tests__/ 直下
set -euo pipefail

lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
conditionals_awk="$lib_dir/test-conditionals.awk"
# 相対パスで受けると find が相対パスを出し、find_config の遡りが "." で止まらなくなる
root="$(cd "${1:-$PWD}" && pwd)"

# --- 設定ファイル (.test-rules.yml) を探索 ---
find_config() {
  local dir="$1" parent
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/.test-rules.yml" ]; then
      echo "$dir/.test-rules.yml"
      return 0
    fi
    parent="$(dirname "$dir")"
    [ "$parent" = "$dir" ] && break
    dir="$parent"
  done
  return 1
}

# YAML からフラット構造のルール値を読み取る
read_yaml_rule() {
  local config="$1" key="$2"
  local value
  value="$(grep -E "^\s+${key}:" "$config" 2>/dev/null | sed 's/.*:\s*//' | tr -d ' ')" || true
  if [ "$value" = "false" ]; then
    echo "false"
  else
    echo "true"
  fi
}

# --- 1ファイル分のテストルール違反を検出 ---
check_file() {
  local file="$1"
  local rule_no_describe=true rule_no_conditional=true rule_file_naming=true rule_test_location=true
  local config_file
  if config_file="$(find_config "$(dirname "$file")")"; then
    rule_no_describe="$(read_yaml_rule "$config_file" "no-describe")"
    rule_no_conditional="$(read_yaml_rule "$config_file" "no-conditional")"
    rule_file_naming="$(read_yaml_rule "$config_file" "file-naming")"
    rule_test_location="$(read_yaml_rule "$config_file" "test-location")"
  fi

  # ファイルレベル無効化 (// @test-rules-disable [ルール名...])
  local disable_line
  disable_line="$(grep -m1 '@test-rules-disable' "$file" 2>/dev/null || true)"
  if [ -n "$disable_line" ]; then
    if echo "$disable_line" | grep -qE '@test-rules-disable\s*$'; then
      return 0
    fi
    echo "$disable_line" | grep -q 'no-describe' && rule_no_describe=false
    echo "$disable_line" | grep -q 'no-conditional' && rule_no_conditional=false
    echo "$disable_line" | grep -q 'file-naming' && rule_file_naming=false
    echo "$disable_line" | grep -q 'test-location' && rule_test_location=false
  fi

  local file_violations=""

  # describe/context/suite の使用チェック
  if [ "$rule_no_describe" = "true" ]; then
    local matches
    matches="$(grep -nE '\b(describe|context|suite)\s*\(' "$file" | head -5 || true)"
    if [ -n "$matches" ]; then
      file_violations="${file_violations}[構造違反] ${file}: describe/context/suite の使用は禁止です。フラット構造（test() のみ）にしてください。
該当箇所:
${matches}

"
    fi
  fi

  # テストコード内の条件分岐チェック
  if [ "$rule_no_conditional" = "true" ]; then
    local matches
    matches="$(awk -f "$conditionals_awk" "$file" | head -5 || true)"
    if [ -n "$matches" ]; then
      file_violations="${file_violations}[条件分岐禁止] ${file}: テストケース内で if/else/switch は禁止です。test.each またはテストケースの分割で対応してください。
該当箇所:
${matches}

"
    fi
  fi

  # ファイル命名規則チェック
  if [ "$rule_file_naming" = "true" ]; then
    local basename
    basename="$(basename "$file")"
    if [[ ! "$basename" =~ ^[^.]+\.[^.]+\.test\.tsx?$ ]]; then
      file_violations="${file_violations}[命名規則] ${file}: テストファイル名は {テスト対象名}.{カテゴリ}.test.ts|tsx を推奨します（例: layout.normal.test.ts）。

"
    fi
  fi

  # 置き場所チェック（rules/testing.md「配置と命名」/ 分類 test-placement）
  if [ "$rule_test_location" = "true" ]; then
    local parent
    parent="$(basename "$(dirname "$file")")"
    if [ "$parent" != "__tests__" ]; then
      file_violations="${file_violations}[配置] ${file}: テストは対象モジュールと同じフォルダの __tests__/ 直下に置いてください（rules/testing.md「配置と命名」）。

"
    fi
  fi

  printf '%s' "$file_violations"
}

# --- 対象ファイルを列挙して検査 ---
violations=""
while IFS= read -r file; do
  result="$(check_file "$file")" || true
  if [ -n "$result" ]; then
    violations="${violations}${result}"
  fi
done < <(find "$root" \
  \( -path '*/node_modules' -o -path '*/dist' -o -path '*/build' -o -path '*/.git' -o -path '*/src-tauri/target' \) -prune -o \
  -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -print)

[ -z "$violations" ] && exit 0

printf '%s' "$violations"
exit 1
