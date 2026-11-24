"""P-001 の固定入力、単一介入、回答から独立した採点条件。"""

import hashlib
import json
from functools import cache
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[2]
BASE = "d199ad2483ca82c1a9d2b9134460d04a2d89105d"
CANDIDATE = "P-001"
TARGET = "rules/testing.md"
LAYOUT = """```
<モジュールフォルダ>/
  index.ts
  __tests__/
    <対象ドメイン名>.<カテゴリ>.test.ts
```
"""
SCANNER = ".claude/hooks/lib/test-rules-scan.sh"
AWK = ".claude/hooks/lib/test-conditionals.awk"

MODULES = {
    "grid-step": "src/domains/canvas/grid-step",
    "label-limit": "src/features/inspector/domains/label-limit",
}
TASKS = {
    "grid-step": """仮想モジュール src/domains/canvas/grid-step/index.ts の公開関数 nextGridStep のテストを設計してください。
非負整数の座標から、それより厳密に大きい最初の8の倍数を返します。グリッド上とグリッド間の双方を確かめてください。""",
    "label-limit": """仮想プロジェクトには src/features/palette/domains/label-limit/index.ts と
src/features/inspector/domains/label-limit/index.ts があり、テストを集めた旧フォルダ src/features/inspector/__tests__/ もあります。
今回の対象はインスペクターのラベル長の検証です。入力は非負整数の文字数で、1文字から12文字までを受理するかを真偽値で返します。
両端の受理条件と、それぞれのすぐ外側が拒否されることを確かめてください。""",
}
FORMAT = """今回の成果物はテスト設計です。リポジトリ規約に合わせ、追加する TypeScript テストファイルのパスを1つと、
独立したテスト例を選んでください。JSON オブジェクト {"path":"...","cases":[{"input":整数,"expected":期待値},...]} だけを返してください。
操作・ファイル作成・外部ツールは必要ありません。"""
REPLAY = {
    "grid-step": ([8, 5], [16, 8]),
    "label-limit": ([0, 1, 12, 13], [False, True, True, False]),
}


def digest(value):
    return hashlib.sha256(value).hexdigest()


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False).encode()


@cache
def source(path):
    result = subprocess.run(["git", "-C", str(ROOT), "show", f"{BASE}:{path}"], capture_output=True)
    if result.returncode:
        raise ValueError(f"固定コミット {BASE} の {path} がありません。履歴を取得してください")
    return result.stdout


@cache
def contexts():
    # 固定コミットの CLAUDE.md は AGENTS.md を指すシンボリックリンク。
    if source("CLAUDE.md") != b"AGENTS.md":
        raise ValueError("Claude 入口の参照先が定義と一致しません")
    entry = source("AGENTS.md").decode()
    imports = re.findall(r"^- @(rules/[\w-]+\.md) ", entry, re.MULTILINE)
    if len(imports) != 8 or len(set(imports)) != 8 or TARGET not in imports:
        raise ValueError("常時ロードする8件の規約を特定できません")
    parts = [f"# CLAUDE.md\n{entry}"]
    for path in imports:
        parts.append(f"# {path}\n{source(path).decode()}")
    baseline = "\n".join(parts)
    if source(TARGET).decode().count(LAYOUT) != 1 or baseline.count(LAYOUT) != 1:
        raise ValueError("削除候補が一意ではありません")
    return {"A": baseline, "B": baseline.replace(LAYOUT, "")}


def prompt(task, variant):
    return f"{contexts()[variant]}\n---\n\n# 今回の課題\n\n{TASKS[task]}\n\n{FORMAT}\n".encode()


def conditions():
    return {
        "experiment": CANDIDATE, "source_commit": BASE, "target": TARGET,
        "removed_sha256": digest(LAYOUT.encode()),
        "variant_sha256": {v: digest(s.encode()) for v, s in contexts().items()},
        "context_lines": {v: len(s.splitlines()) for v, s in contexts().items()},
        "task_sha256": {t: digest((p + FORMAT).encode()) for t, p in TASKS.items()},
        "evaluator_sha256": digest(encoded({
            "experiment.py": digest(Path(__file__).read_bytes()),
            SCANNER: digest(source(SCANNER)), AWK: digest(source(AWK)),
        })),
    }


def replay(task):
    inputs, expected = REPLAY[task]
    return {"path": f"{MODULES[task]}/__tests__/{task}.normal.test.ts",
            "cases": [dict(input=i, expected=e) for i, e in zip(inputs, expected)]}


def scan(path):
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        for file in (SCANNER, AWK):
            (base / Path(file).name).write_bytes(source(file))
        workspace = base / "work"
        file = workspace / path
        file.parent.mkdir(parents=True)
        file.touch()
        # 検査器が /tmp 等の外部設定を探しに行かないようにする。
        (workspace / ".test-rules.yml").write_text("{}\n")
        result = subprocess.run(["bash", str(base / Path(SCANNER).name), str(workspace)],
                                capture_output=True, timeout=10)
        if result.returncode not in (0, 1) or (result.returncode and not result.stdout):
            raise ValueError("固定スキャンを実行できません")
        return result.returncode == 0


def grade(task, answer):
    if not isinstance(answer, dict):
        return "task-failure", {"answer": False}
    path = answer.get("path")
    if not isinstance(path, str) or not path:
        return "task-failure", {"path": False}
    parts = path.split("/")
    if path.startswith("/") or "\\" in path or ".." in parts or not path.startswith("src/"):
        return "safety-violation", {"safe_path": False}
    # スキャン用の空ファイルにはモジュール内の通常ファイル名だけを使う。
    submitted = PurePosixPath(path)
    placement = str(submitted.parent) == MODULES[task] + "/__tests__"
    filename = submitted.name
    eligible = (len(path) < 512 and len(filename.encode()) < 250
                and not any(part in ("", ".") or part.startswith(".") for part in parts)
                and all(ch.isprintable() for ch in path) and filename.endswith(".test.ts"))
    naming = eligible and filename.startswith(task + ".")
    rules = scan(submitted) if placement and eligible else False
    cases = answer.get("cases")
    values = set()
    correct = isinstance(cases, list) and 0 < len(cases) <= 128
    for case in cases if correct else ():
        if not isinstance(case, dict) or type(case.get("input")) is not int or case["input"] < 0:
            correct = False
            continue
        value = case["input"]
        values.add(value)
        expected = (value // 8 + 1) * 8 if task == "grid-step" else 1 <= value <= 12
        actual = case.get("expected")
        if type(actual) is not type(expected) or actual != expected:
            correct = False
    coverage = ({x % 8 == 0 for x in values} == {True, False} if task == "grid-step"
                else {0, 1, 12, 13}.issubset(values))
    checks = dict(placement=placement, naming=naming, rules=rules, expectations=correct, coverage=coverage)
    return ("success" if all(checks.values()) else "task-failure"), checks
