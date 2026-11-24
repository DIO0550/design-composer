"""常時ロードされる記述の除去実験を実行する。"""

import sys


def main():
    """実験 CLI の終了コードを返す。"""
    print("実験コマンドを準備中", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
