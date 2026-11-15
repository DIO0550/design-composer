#!/usr/bin/env bash
#
# Actions のトークン(`GH_TOKEN`)で github.com へ git を通す認証ヘッダを、環境変数の git 設定として
# export する。source して `export_git_token_header` を呼ぶ。
#
# 環境変数の git 設定(`GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_0` / `GIT_CONFIG_VALUE_0`)にするのは、
# `pr-explain-pages.sh` が gh-pages を作業用の別フォルダへ clone するので、どのフォルダで走る git にも
# 同じ設定が効く形にするため。base64 にした値は Actions が自動では伏せないので、ログに出ないよう登録する。
#
# 使う側の checkout は `persist-credentials: false` にする。残すと git が Authorization を 2 本送る。
#
# 使う側: `.github/workflows/pr-explain.yml` / `.github/workflows/pr-explain-list.yml`

export_git_token_header() {
  local credential
  credential="$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 -w0)"
  echo "::add-mask::$credential"
  export GIT_CONFIG_COUNT=1
  export GIT_CONFIG_KEY_0="http.https://github.com/.extraheader"
  export GIT_CONFIG_VALUE_0="AUTHORIZATION: basic $credential"
}
