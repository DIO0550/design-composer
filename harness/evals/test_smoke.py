"""新しい出力先と CLI だけを使って、除去実験の観測結果を検証する。"""

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


CLI = Path(__file__).with_name("harness_eval.py")
LAYOUT = """```
<モジュールフォルダ>/
  index.ts
  __tests__/
    <対象ドメイン名>.<カテゴリ>.test.ts
```
"""


def answer(task):
    """境界で異なる答えを持つテスト案を返す。"""
    if task == "grid-step":
        path = "src/domains/canvas/grid-step/__tests__/grid-step.normal.test.ts"
        cases = [(8, 16), (5, 8)]
    else:
        path = "src/features/inspector/domains/label-limit/__tests__/label-limit.edge.test.ts"
        cases = [(0, False), (1, True), (12, True), (13, False)]
    return {"path": path, "cases": [{"input": n, "expected": value} for n, value in cases]}


class SmokeTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.out = Path(temp.name) / "run"

    def cli(self, *args, success=True):
        result = subprocess.run(
            [sys.executable, str(CLI), *map(str, args)],
            capture_output=True, text=True, timeout=30,
        )
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        return result

    def prepare(self):
        self.cli("prepare", "--out", self.out)
        return json.loads((self.out / "manifest.json").read_text())["trials"]

    def write_answer(self, row, proposal, digest=None):
        envelope = {"prompt_sha256": digest or row["prompt_sha256"], "answer": proposal}
        (self.out / "answers" / (row["id"] + ".json")).write_text(json.dumps(envelope))

    def collect(self):
        return self.cli("collect", self.out, "--model", "offline-1",
                        "--runtime", "table-fixture", success=False)

    def results(self):
        return [json.loads(line) for line in (self.out / "results.jsonl").read_text().splitlines()]

    def test_inventory_and_validate_identify_the_candidate(self):
        self.assertIn("P-001", self.cli("inventory").stdout)
        self.assertIn("P-001", self.cli("validate").stdout)

    def test_the_two_prompts_for_each_task_differ_only_by_the_directory_example(self):
        trials = self.prepare()
        self.assertEqual(len(trials), 4)
        pairs = {}
        for trial in trials:
            packet = (self.out / "prompts" / (trial["id"] + ".txt")).read_bytes()
            self.assertEqual(hashlib.sha256(packet).hexdigest(), trial["prompt_sha256"])
            pairs[trial["task_id"], trial["variant"]] = packet.decode()
        for task in ("grid-step", "label-limit"):
            control, pruned = pairs[task, "A"], pairs[task, "B"]
            self.assertEqual(control.count(LAYOUT), 1)
            self.assertEqual(pruned, control.replace(LAYOUT, ""))

    def test_replay_counts_each_task_and_variant_once_per_repeat_and_holds_decision(self):
        self.cli("run", "--adapter", "replay", "--repeat", 2, "--out", self.out)
        rows = self.results()
        self.assertCountEqual(
            [(r["task_id"], r["variant"], r["trial"]) for r in rows],
            [(t, v, n) for t in ("grid-step", "label-limit") for v in "AB" for n in (1, 2)],
        )
        self.assertTrue(all(r["status"] == "success" for r in rows))
        self.assertTrue(all(r["metrics"]["input_tokens"] is None for r in rows))
        report = self.cli("report", self.out).stdout
        self.assertIn("replay", report)
        self.assertIn("保留", report)
        self.assertNotEqual(self.cli("run", "--adapter", "replay", "--out", self.out,
                                     success=False).returncode, 0)
        self.assertEqual(self.results(), rows)

    def test_a_wrong_sibling_wrong_expectation_and_missing_boundary_fail_independently(self):
        trials = self.prepare()
        for trial in trials:
            task, variant = trial["task_id"], trial["variant"]
            proposal = answer(task)
            if (task, variant) == ("grid-step", "B"):
                proposal["cases"][0]["expected"] = 8
            if (task, variant) == ("label-limit", "A"):
                proposal["cases"].pop()
            if (task, variant) == ("label-limit", "B"):
                proposal["path"] = proposal["path"].replace("/inspector/", "/palette/")
            self.write_answer(trial, proposal)
        self.collect()
        status = {(r["task_id"], r["variant"]): r["status"] for r in self.results()}
        self.assertEqual(status, {("grid-step", "A"): "success", ("grid-step", "B"): "task-failure",
                                  ("label-limit", "A"): "task-failure", ("label-limit", "B"): "task-failure"})

    def test_a_path_outside_the_trial_stops_collection(self):
        trials = self.prepare()
        sentinel = self.out.parent / "outside.normal.test.ts"
        for trial in trials:
            proposal = answer(trial["task_id"])
            proposal["path"] = str(sentinel)
            self.write_answer(trial, proposal)
        self.assertNotEqual(self.collect().returncode, 0)
        self.assertFalse(sentinel.exists())
        self.assertEqual([r["status"] for r in self.results()], ["safety-violation"])

    def test_collect_and_report_distinguish_missing_answers_from_successes(self):
        self.prepare()
        self.assertNotEqual(self.collect().returncode, 0)
        report = self.cli("report", self.out, success=False)
        self.assertNotEqual(report.returncode, 0)
        self.assertIn("保留", report.stdout + report.stderr)

    def test_an_answer_for_another_prompt_is_never_graded_as_success(self):
        trials = self.prepare()
        for trial in trials:
            self.write_answer(trial, answer(trial["task_id"]), digest="0" * 64)
        self.assertNotEqual(self.collect().returncode, 0)
        if (self.out / "results.jsonl").exists():
            self.assertNotIn("success", [r["status"] for r in self.results()])


if __name__ == "__main__":
    unittest.main()
