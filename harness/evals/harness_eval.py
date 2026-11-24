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

from presets import batch_inputs, catalog, read_preset, resolve_base, validate_preset
from answer_json import decode_answer
from experiment import CANDIDATE, ROOT, TASKS, conditions, digest, encoded, grade, prompt, replay


MEASUREMENTS = ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens",
                "output_tokens", "wall_time_ms", "cost_usd", "rework_count")


def measurements(raw):
    """回収者が観測した数値だけを受け取り、省略された項目を未取得とする。"""
    if not isinstance(raw, dict) or raw.keys() - set(MEASUREMENTS):
        raise ValueError("metrics の項目を確認してください")
    result = dict.fromkeys(MEASUREMENTS)
    for name, value in raw.items():
        if value is None:
            continue
        if type(value) is not int and not (name == "cost_usd" and type(value) is float and math.isfinite(value)):
            raise ValueError(f"metrics.{name} の数値が不正です")
        if value < 0:
            raise ValueError(f"metrics.{name} は0以上にしてください")
        result[name] = value
    return result


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


def selected_inputs(candidate, base):
    if candidate in (None, CANDIDATE):
        if base is not None:
            raise ValueError("基準コミットを変更するには inventory の追加候補を指定してください")
        return conditions(), {(task, v): prompt(task, v) for task in TASKS for v in "AB"}
    return batch_inputs(read_preset(candidate), resolve_base(base if base is not None else "origin/main"))


def prepare(out, repeat, adapter, candidate, base):
    if not 1 <= repeat <= 30:
        raise ValueError("反復回数は1〜30を指定してください")
    manifest, packets = selected_inputs(candidate, base)
    out.mkdir(mode=0o700)
    (out / "prompts").mkdir()
    (out / "answers").mkdir()
    trials = []
    for task, variant, number in schedule(repeat):
        packet = packets[task, variant]
        trial_id = uuid.uuid4().hex
        (out / "prompts" / f"{trial_id}.txt").write_bytes(packet)
        trials.append(dict(id=trial_id, task_id=task, variant=variant, trial=number,
                           prompt_sha256=digest(packet)))
    manifest.update(version=3 if "preset" in manifest else 2, adapter=adapter, repeat=repeat, trials=trials)
    write_json(out / "manifest.json", manifest)
    return manifest


def checked_manifest(out):
    manifest = json.loads((out / "manifest.json").read_bytes())
    version = manifest["version"]
    modes = ("external", "replay", "claude") if version == 1 else ("external", "replay")
    if type(version) is not int or version not in (1, 2, 3) or manifest["adapter"] not in modes:
        raise ValueError("未対応の実験記録です")
    if version == 3:
        preset = validate_preset(manifest["preset"], manifest["experiment"])
        definition, packets = batch_inputs(preset, manifest["source_commit"])
    else:
        definition, packets = selected_inputs(None, None)
    for key, value in definition.items():
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
        packet = packets[task, variant]
        expected = dict(id=trial_id, task_id=task, variant=variant, trial=number,
                        prompt_sha256=digest(packet))
        if row != expected or (out / "prompts" / f"{trial_id}.txt").read_bytes() != packet:
            raise ValueError("試行の入力・順番が元の実験と一致しません")
    return manifest


def parser():
    cli = argparse.ArgumentParser(description=__doc__)
    sub = cli.add_subparsers(dest="command", required=True)
    for command in ("inventory", "validate"):
        parser = sub.add_parser(command)
        if command == "validate":
            parser.add_argument("--candidate")
            parser.add_argument("--base")
    for name in ("prepare", "run"):
        cmd = sub.add_parser(name)
        cmd.add_argument("--out", type=Path, required=True)
        cmd.add_argument("--repeat", default=1, type=int)
        cmd.add_argument("--candidate")
        cmd.add_argument("--base")
        if name == "run":
            cmd.add_argument("--adapter", required=True, choices=("replay",))
    collect = sub.add_parser("collect")
    collect.add_argument("out", type=Path)
    collect.add_argument("--model", help="任意のモデル名")
    collect.add_argument("--agent", "--runtime", dest="runtime", help="任意のエージェント名")
    sub.add_parser("report").add_argument("out", type=Path)
    return cli


def captured_answer(out, row, manifest):
    file = out / "answers" / (row["id"] + ".json")
    if not file.exists():
        return None
    if manifest["adapter"] == "external" and file.stat().st_size > 256 * 1024:
        return None, "task-failure", "answer-too-large", measurements({})
    try:
        envelope = decode_answer(file.read_bytes())
    except (ValueError, UnicodeError):
        return None, "task-failure", "answer-json", measurements({})
    if not isinstance(envelope, dict) or envelope.get("prompt_sha256") != row["prompt_sha256"]:
        raise ValueError("外部回答と配布したプロンプトのハッシュが一致しません")
    if "answer" not in envelope:
        return None, "task-failure", "answer-json", measurements({})
    raw_metrics = envelope.get("metrics", {}) if manifest["version"] >= 2 else {}
    return envelope["answer"], None, None, measurements(raw_metrics)


def verify_answer(out, row, manifest):
    """過去に採点した回答を照合し、変更や欠落のある結果を集計から除く。"""
    mode = row["adapter"]
    status = row["status"]
    if mode == "replay":
        if measurements(row["metrics"]) != measurements({}):
            raise ValueError("既知回答の再生に実測値が記録されています")
        answer = replay(row["task_id"])
    elif mode == "claude" and row["answer_sha256"] is None:
        if status not in ("task-failure", "infra-error") or row["checks"] or not row["failure_category"]:
            raise ValueError("回答のない試行の結果が不正です")
        return
    else:
        reply = captured_answer(out, row, manifest)
        if reply is None:
            raise ValueError("採点済みの回答がありません。元の回答ファイルを復元してください")
        answer, parse_status, reason, metrics = reply
        if mode == "external" and metrics != measurements(row["metrics"]):
            raise ValueError("採点時の計測値と回答ファイルが一致しません")
        if parse_status is not None:
            if (status, row["failure_category"], row["answer_sha256"], row["checks"]) == (parse_status, reason, None, {}):
                return
            raise ValueError("採点済みの回答と記録が一致しません")
    if digest(encoded(answer)) != row["answer_sha256"]:
        raise ValueError("採点済みの回答が変更されました。元の回答ファイルを復元してください")
    if (status, row["checks"]) != grade(row["task_id"], answer):
        raise ValueError("保存した採点結果と回答が一致しません")


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
        verify_answer(out, row, manifest)
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
        if rows:
            first = next(iter(rows.values()))
            model = first["model"] if model is None else model
            runtime = first["runtime"] if runtime is None else runtime
        if any((r["model"], r["runtime"]) != (model, runtime) for r in rows.values()):
            raise ValueError("採点済みの結果とモデルまたはランタイムが異なります")
        if any(r["status"] == "safety-violation" for r in rows.values()):
            return 1
        for trial in manifest["trials"]:
            if trial["id"] in rows:
                continue
            task = trial["task_id"]
            if mode == "external":
                reply = captured_answer(out, trial, manifest)
                if reply is None:
                    continue
                answer, status, reason, metrics = reply
            else:
                answer, status, reason, metrics = replay(task), None, None, measurements({})
            checks = {}
            has_answer = status is None
            if has_answer:
                status, checks = grade(task, answer)
                if status != "success":
                    reason = "answer-checks"
            row = dict(trial, adapter=mode, model=model, runtime=runtime, status=status,
                       failure_category=reason, checks=checks, metrics=metrics,
                       answer_sha256=digest(encoded(answer)) if has_answer else None)
            with (out / "results.jsonl").open("ab") as stream:
                stream.write(encoded(row) + b"\n")
            rows[row["id"]] = row
            if status == "safety-violation":
                break
    return report(manifest, rows)


def report(manifest, rows):
    print(f"# {manifest['experiment']} / {manifest['adapter']} / 判定: 保留")
    if "condition_fingerprint" in manifest:
        print(f"比較条件 {manifest['condition_fingerprint']}")
    print(f"固定コミット {manifest['source_commit']} / 採点済み {len(rows)}/{len(manifest['trials'])}")
    if rows:
        first = next(iter(rows.values()))
        print(f"エージェント {first['runtime'] or '不明'} / モデル {first['model'] or '不明'}")
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
        for key in MEASUREMENTS[:-1]:
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
        manifest = prepare(out, args.repeat, "replay", args.candidate, args.base)
        return collect(out, manifest, "fixture", "replay-v1")
    manifest = checked_manifest(out)
    if args.command == "report":
        return report(manifest, stored_rows(out, manifest))
    if manifest["adapter"] != "external":
        raise ValueError("collect は prepare で配布した外部回答に使用してください")
    return collect(out, manifest, args.model, args.runtime)


def main():
    args = parser().parse_args()
    if args.command == "inventory":
        print(f"{CANDIDATE}  rules/testing.md  配置と命名のディレクトリ例を6行削除")
        for preset in catalog():
            print(f"{preset['id']}  {preset['target']}  {preset['hypothesis']}")
        return 0
    if args.command == "validate":
        data, _ = selected_inputs(args.candidate, args.base)
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return 0
    out = run_dir(args.out)
    if args.command == "prepare":
        prepare(out, args.repeat, "external", args.candidate, args.base)
        print(out / "prompts")
        return 0
    return execute(args, out)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError) as err:
        print(f"実験を完了できません: {err}", file=sys.stderr)
        sys.exit(2)
