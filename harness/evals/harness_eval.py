"""常時ロードされる記述の除去実験を実行する。"""

import argparse
from collections import Counter
from contextlib import contextmanager
import fcntl
import json
import math
from pathlib import Path
import re
import sys
import uuid

from claude_adapter import ask, empty_metrics, runtime_version
from experiment import CANDIDATE, ROOT, TASKS, conditions, digest, encoded, grade, prompt, replay


def run_dir(value):
    directory = Path(value).resolve()
    if directory == ROOT or ROOT in directory.parents:
        raise ValueError("出力先はリポジトリの外を指定してください")
    return directory


def write_json(path, value):
    with path.open("xb") as stream:
        stream.write(encoded(value) + b"\n")


def schedule(repeats):
    for trial in range(1, repeats + 1):
        for offset, task in enumerate(TASKS):
            order = "AB" if (trial + offset) % 2 else "BA"
            for variant in order:
                yield task, variant, trial


def prepare(out, repeat, adapter, settings):
    if not 1 <= repeat <= 30:
        raise ValueError("反復回数は1〜30を指定してください")
    manifest = conditions()
    out.mkdir(mode=0o700)
    (out / "prompts").mkdir()
    (out / "answers").mkdir()
    trials = []
    for task, variant, number in schedule(repeat):
        packet = prompt(task, variant)
        trial_id = uuid.uuid4().hex
        (out / "prompts" / f"{trial_id}.txt").write_bytes(packet)
        trials.append(dict(id=trial_id, task_id=task, variant=variant, trial=number,
                           prompt_sha256=digest(packet)))
    manifest.update(version=1, adapter=adapter, repeat=repeat, settings=settings, trials=trials)
    write_json(out / "manifest.json", manifest)
    return manifest


def checked_manifest(out):
    manifest = json.loads((out / "manifest.json").read_bytes())
    for key, value in conditions().items():
        if manifest.get(key) != value:
            raise ValueError(f"固定した実験定義と一致しません ({key})")
    repeats = manifest["repeat"]
    if type(repeats) is not int or not 1 <= repeats <= 30:
        raise ValueError("実験定義の反復回数が不正です")
    trials = manifest["trials"]
    ids = set()
    for row, (task, variant, number) in zip(trials, schedule(repeats), strict=True):
        trial_id = row["id"]
        if not re.fullmatch("[a-f0-9]{32}", trial_id) or trial_id in ids:
            raise ValueError("試行 ID が不正です")
        ids.add(trial_id)
        packet = prompt(task, variant)
        expected = dict(id=trial_id, task_id=task, variant=variant, trial=number,
                        prompt_sha256=digest(packet))
        if row != expected or (out / "prompts" / f"{trial_id}.txt").read_bytes() != packet:
            raise ValueError("試行の入力・順番が元の実験と一致しません")
    return manifest


def parser():
    cli = argparse.ArgumentParser(description=__doc__)
    sub = cli.add_subparsers(dest="command", required=True)
    for command in ("inventory", "validate"):
        sub.add_parser(command)
    for name in ("prepare", "run"):
        cmd = sub.add_parser(name)
        cmd.add_argument("--out", type=Path, required=True)
        cmd.add_argument("--repeat", default=1, type=int)
    cmd.add_argument("--adapter", required=True, choices=("claude", "replay"))
    cmd.add_argument("--model")
    cmd.add_argument("--budget-usd", type=float)
    cmd.add_argument("--timeout", default=90, type=int)
    collect = sub.add_parser("collect")
    collect.add_argument("out", type=Path)
    collect.add_argument("--model", required=True)
    collect.add_argument("--runtime", required=True)
    sub.add_parser("report").add_argument("out", type=Path)
    return cli


def settings(args):
    if args.adapter == "replay":
        if args.budget_usd is not None or args.model:
            raise ValueError("replay にモデルと予算は指定できません")
        return {"model": "fixture", "runtime": "replay-v1"}
    if not args.model or not re.fullmatch(r"claude-[a-z0-9.]+(?:-[a-z0-9.]+)+", args.model):
        raise ValueError("--model に完全な Claude モデル ID を指定してください")
    if not args.budget_usd or not math.isfinite(args.budget_usd) or args.budget_usd <= 0:
        raise ValueError("--budget-usd に実験全体の正の予算を指定してください")
    if not 1 <= args.timeout <= 1800:
        raise ValueError("--timeout は1〜1800秒で指定してください")
    return dict(model=args.model, runtime=runtime_version(), budget_usd=args.budget_usd,
                timeout=args.timeout, max_turns=1)


def external_answer(out, row):
    file = out / "answers" / (row["id"] + ".json")
    if not file.exists():
        return None
    if file.stat().st_size > 256 * 1024:
        return None, "task-failure", "answer-too-large", empty_metrics()
    try:
        envelope = json.loads(file.read_bytes())
    except (ValueError, UnicodeError):
        return None, "task-failure", "answer-json", empty_metrics()
    if not isinstance(envelope, dict) or envelope.get("prompt_sha256") != row["prompt_sha256"]:
        raise ValueError("外部回答と配布したプロンプトのハッシュが一致しません")
    return envelope.get("answer"), None, None, empty_metrics()


def stored_rows(out, manifest):
    results = out / "results.jsonl"
    if not results.exists():
        return {}
    trials = {row["id"]: row for row in manifest["trials"]}
    rows = {}
    for line in results.read_bytes().splitlines():
        row = json.loads(line)
        trial = trials.get(row["id"])
        if (not trial or row["id"] in rows or row["adapter"] != manifest["adapter"]
                or any(row[k] != v for k, v in trial.items())):
            raise ValueError("試行に対応しない結果、または重複があります")
        rows[row["id"]] = row
    return rows


@contextmanager
def collection_lock(out):
    with (out / ".collect.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ValueError("この出力先は別の集計が使用中です") from None
        yield


def collect(out, manifest, model, runtime):
    mode = manifest["adapter"]
    with collection_lock(out):
        rows = stored_rows(out, manifest)
        if any((r["model"], r["runtime"]) != (model, runtime) for r in rows.values()):
            raise ValueError("採点済みの結果とモデルまたはランタイムが異なります")
        if any(r["status"] == "safety-violation" for r in rows.values()):
            return 1
        config = manifest["settings"]
        remaining = config.get("budget_usd", 0)
        for trial in manifest["trials"]:
            if trial["id"] in rows:
                continue
            task = trial["task_id"]
            if mode == "external":
                reply = external_answer(out, trial)
                if reply is None:
                    continue
                answer, status, reason, metrics = reply
            elif mode == "replay":
                answer, status, reason, metrics = replay(task), None, None, empty_metrics()
            elif not runtime:
                answer, status, reason, metrics = None, "infra-error", "cli-unavailable", empty_metrics()
            else:
                allowance = min(config["budget_usd"] / len(manifest["trials"]), remaining)
                if allowance <= 0:
                    break
                answer, status, reason, metrics = ask(prompt(task, trial["variant"]), model,
                                                      allowance, config["timeout"])
                if metrics["cost_usd"] is not None:
                    remaining -= metrics["cost_usd"]
            checks = {}
            if status is None:
                status, checks = grade(task, answer)
                if status != "success":
                    reason = "answer-checks"
            if mode == "claude" and answer is not None:
                write_json(out / "answers" / (trial["id"] + ".json"),
                           dict(prompt_sha256=trial["prompt_sha256"], answer=answer))
            row = dict(trial, adapter=mode, model=model, runtime=runtime, status=status,
                       failure_category=reason, checks=checks, metrics=metrics,
                       answer_sha256=digest(encoded(answer)) if answer is not None else None)
            with (out / "results.jsonl").open("ab") as stream:
                stream.write(encoded(row) + b"\n")
            rows[row["id"]] = row
            if status == "safety-violation" or (mode == "claude" and (
                status == "infra-error" or metrics["cost_usd"] is None or reason == "error_max_budget_usd"
            )):
                break
    return report(manifest, rows)


def report(manifest, rows):
    print(f"# {CANDIDATE} / {manifest['adapter']} / 判定: 保留")
    print(f"固定コミット {manifest['source_commit']} / 採点済み {len(rows)}/{len(manifest['trials'])}")
    if rows:
        first = next(iter(rows.values()))
        print(f"モデル {first['model']} / ランタイム {first['runtime'] or '不明'}")
    print("常時入力の差分 " + str(manifest["context_lines"]["B"] - manifest["context_lines"]["A"]) + " 行")
    print("計測できなかった値は —。smoke は本番の削除採用に使わない。")
    print("| 課題 | 回 | 構成 | 結果 | 未達・理由 | 入力 | cache read | cache create | 出力 | 時間 ms | USD |")
    print("|---|---:|---|---|---|---:|---:|---:|---:|---:|---:|")
    for trial in manifest["trials"]:
        row = rows.get(trial["id"], {})
        metrics = row.get("metrics", {})
        unmet = [name for name, passed in row.get("checks", {}).items() if not passed]
        values = [trial["task_id"], trial["trial"], trial["variant"], row.get("status", "未実行"),
                  ", ".join(unmet) or row.get("failure_category") or "—"]
        for key in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens",
                    "wall_time_ms", "cost_usd"):
            values.append(metrics[key] if metrics.get(key) is not None else "—")
        print("| " + " | ".join(map(str, values)) + " |")
    for variant in "AB":
        counts = Counter(row["status"] for row in rows.values() if row["variant"] == variant)
        valid = counts["success"] + counts["task-failure"] + counts["safety-violation"]
        print(f"{variant} 成功 {counts['success']}/{valid}（有効試行）、環境エラー {counts['infra-error']} 件")
    pairs = {(row["task_id"], row["trial"], row["variant"]): row for row in rows.values()}
    print("\n| 課題 | 回 | 成功差 B−A | 入力トークン差 | 実行時間差 ms |")
    print("|---|---:|---:|---:|---:|")
    for task in TASKS:
        for number in range(1, manifest["repeat"] + 1):
            a = pairs.get((task, number, "A"), {})
            b = pairs.get((task, number, "B"), {})
            quality = "—"
            valid = {"success", "task-failure", "safety-violation"}
            if a.get("status") in valid and b.get("status") in valid:
                quality = int(b["status"] == "success") - int(a["status"] == "success")
            deltas = []
            for key in ("input_tokens", "wall_time_ms"):
                before = a.get("metrics", {}).get(key)
                after = b.get("metrics", {}).get(key)
                deltas.append("—" if before is None or after is None else str(after - before))
            print(f"| {task} | {number} | {quality} | " + " | ".join(deltas) + " |")
    complete = len(rows) == len(manifest["trials"])
    return 0 if complete and all(row["status"] == "success" for row in rows.values()) else 1


def execute(args, out):
    if args.command == "run":
        config = settings(args)
        manifest = prepare(out, args.repeat, args.adapter, config)
        return collect(out, manifest, config["model"], config["runtime"])
    manifest = checked_manifest(out)
    if args.command == "report":
        return report(manifest, stored_rows(out, manifest))
    if manifest["adapter"] != "external":
        raise ValueError("collect は prepare で配布した外部回答に使用してください")
    return collect(out, manifest, args.model, args.runtime)


def main():
    args = parser().parse_args()
    if args.command in ("inventory", "validate"):
        data = conditions()
        print(f"{CANDIDATE}  {data['target']}  配置と命名のディレクトリ例を6行削除")
        if args.command == "validate":
            print(json.dumps(data, ensure_ascii=False, indent=2))
        return 0
    out = run_dir(args.out)
    if args.command == "prepare":
        prepare(out, args.repeat, "external", {})
        print(out / "prompts")
        return 0
    return execute(args, out)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError) as err:
        print(f"実験を完了できません: {err}", file=sys.stderr)
        sys.exit(2)
