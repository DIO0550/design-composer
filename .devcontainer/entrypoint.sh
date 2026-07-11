#!/bin/bash
# =============================================================================
# entrypoint.sh
#
# コンテナ起動時に root として実行されるエントリポイント。
# 特権が必要な初期化（VNC デスクトップ / ネットワークファイアウォール）を
# ここで済ませることで、開発セッションのユーザー（vscode）に sudo 権限を
# 一切付与せずに済むようにする。初期化後は本来のコマンド（sleep infinity）へ
# バトンタッチする。
#
# 個々の初期化が失敗してもコンテナ自体は起動できるよう、警告を出して継続する
# （fail-open）。厳格に遮断したい場合は各ステップの `|| echo ...` を削除する。
# =============================================================================
set -u

# --- 1. desktop-lite（VNC / noVNC）の初期化 ---
if [ -x /usr/local/share/desktop-init.sh ]; then
  echo "[entrypoint] Initializing desktop (VNC)..."
  /usr/local/share/desktop-init.sh || echo "[entrypoint] WARN: desktop-init.sh failed"
fi

# --- 2. ネットワークファイアウォール（外向き通信の許可リスト制限）の適用 ---
FW=/workspace/.devcontainer/init-firewall.sh
if [ -f "$FW" ]; then
  echo "[entrypoint] Applying network firewall..."
  bash "$FW" || echo "[entrypoint] WARN: init-firewall.sh failed"
fi

# --- 本来のコマンド（compose の command。既定では sleep infinity）を実行 ---
exec "$@"
