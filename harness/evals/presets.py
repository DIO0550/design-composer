"""テスト配置・命名の候補をコミットの規約に適用し、比較条件を記録する。"""

from functools import cache
import json
from pathlib import Path
import re
import subprocess

from experiment import BASE, FORMAT, ROOT, TASKS, conditions, digest, encoded


CATALOG = Path(__file__).with_name("presets")
SUITE = "test-placement-naming"
ID = re.compile(r"P-[0-9]+(?:-[a-z0-9]+)*")
IMPORT = re.compile(r"^[ \t]*[-+*][ \t]+@(rules/(?:[\w-]+/)*[\w-]+\.md)(?=$|[ \t])")


def validate_preset(preset, candidate):
    fields = {"id", "suite", "target", "section", "remove", "replace", "hypothesis"}
    if not isinstance(preset, dict) or set(preset) != fields or not all(isinstance(v, str) for v in preset.values()):
        raise ValueError("候補のデータ形式が不正です")
    if (not ID.fullmatch(candidate) or preset["id"] != candidate or candidate == "P-001"
            or preset["suite"] != SUITE or preset["target"] != "rules/testing.md"
            or preset["section"] != "配置と命名"):
        raise ValueError("候補 ID または対象が配置・命名の評価スイートに対応していません")
    if not preset["hypothesis"].strip() or not preset["remove"].strip() or preset["remove"] == preset["replace"]:
        raise ValueError("仮説または単一の変更内容が不正です")
    return preset


def read_preset(candidate):
    if not ID.fullmatch(candidate):
        raise ValueError("候補 ID が不正です")
    file = CATALOG / (candidate + ".json")
    if not file.is_file():
        raise ValueError(f"候補 {candidate} は inventory にありません")
    return validate_preset(json.loads(file.read_bytes()), candidate)


def catalog():
    return [read_preset(file.stem) for file in sorted(CATALOG.glob("*.json"))]


def resolve_base(ref):
    result = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--verify", "--end-of-options",
                             ref + "^{commit}"], capture_output=True, text=True)
    if result.returncode:
        raise ValueError(f"基準コミット {ref} を解決できません。履歴を取得するか --base を指定してください")
    return result.stdout.strip()


@cache
def source_text(commit, path):
    result = subprocess.run(["git", "-C", str(ROOT), "show", f"{commit}:{path}"], capture_output=True)
    if result.returncode:
        raise ValueError(f"{commit} から {path} を読み取れません")
    return result.stdout.decode()


def rule_imports(entry):
    paths = []
    for line in entry.splitlines():
        match = IMPORT.match(line)
        remainder = line[match.end():] if match else line
        if re.search(r"@rules[/\\]|(?<![\w.])@[\w./\\~-]+\.md\b", remainder):
            raise ValueError(f"AGENTS.md の import を一意に解釈できません: {line}")
        if match:
            paths.append(match[1])
    return paths


def comparison(preset, commit):
    """A/B の差分は対象の節の一箇所だけに限定する。"""
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("保存した基準コミットが完全な SHA ではありません")
    entry = source_text(commit, "AGENTS.md")
    imports = rule_imports(entry)
    target = preset["target"]
    if len(set(imports)) != len(imports) or target not in imports:
        raise ValueError("常時ロードする規約の中で対象を特定できません")
    parts = [f"# AGENTS.md\n{entry}"]
    for path in imports:
        parts.append(f"# {path}\n{source_text(commit, path)}")
    baseline = "\n".join(parts)
    # 候補の文が別の節や複数箇所に移ったときは、現行の仮説を再確認する。
    sections = re.split(r"^## (.+)$", source_text(commit, target), flags=re.MULTILINE)
    matches = [body for heading, body in zip(sections[1::2], sections[2::2]) if heading == preset["section"]]
    old = preset["remove"]
    if len(matches) != 1 or matches[0].count(old) != 1 or baseline.count(old) != 1:
        raise ValueError(f"{target} の「{preset['section']}」で変更箇所が一意に定まりません")
    return {"A": baseline, "B": baseline.replace(old, preset["replace"], 1)}


def batch_inputs(preset, commit):
    variants = comparison(preset, commit)
    packets = {(task, key): f"{context}\n---\n\n# 今回の課題\n\n{text}\n\n{FORMAT}\n".encode()
               for task, text in TASKS.items() for key, context in variants.items()}
    evaluator = conditions()["evaluator_sha256"]
    fingerprint = digest(encoded({
        "suite": preset["suite"], "evaluator": evaluator,
        "packets": {task: [digest(packets[task, k]) for k in "AB"] for task in TASKS},
    }))
    definition = {
        "experiment": preset["id"], "target": preset["target"], "source_commit": commit,
        "preset": preset, "preset_sha256": digest(encoded(preset)),
        "evaluator_source_commit": BASE, "evaluator_sha256": evaluator, "condition_fingerprint": fingerprint,
        "variant_sha256": {key: digest(text.encode()) for key, text in variants.items()},
        "task_sha256": {task: digest((text + FORMAT).encode()) for task, text in TASKS.items()},
        "context_lines": {key: len(text.splitlines()) for key, text in variants.items()},
    }
    return definition, packets
