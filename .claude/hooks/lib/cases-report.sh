#!/usr/bin/env bash
#
# 判定表（`*-cases.sh`）が 1 ケースの結果を報告する部分。source して使う。
#
# `import-rule-cases.sh` と `result-option-read-cases.sh` が一字一句同じものを持っていて、
# 違うのは期待を揃える桁幅だけだった（`rules/coding.md`「同じ処理が2箇所に現れたら
# 共通化する」は `.claude/hooks/` にも及ぶ）。桁幅は `verdict_width` で受ける。

# 期待と実際を突き合わせて 1 行出す。食い違っていたら呼び出し側の `failed` を 1 にする。
#
# @param 1 期待した判定
# @param 2 実際の判定
# @param 3 ケース名
report() {
  local expected="$1" decision="$2" label="$3"
  if [ "$decision" = "$expected" ]; then
    printf "ok   %-${verdict_width:-4}s %s\n" "$expected" "$label"
    return 0
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$expected" "$decision" "$label"
  failed=1
}
