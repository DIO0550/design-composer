"""CLI から回収した回答と採点記録の対応を確かめる。"""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from test_smoke import CLI, answer


class CaptureTest(unittest.TestCase):
    def setUp(self):
        storage = tempfile.TemporaryDirectory()
        self.addCleanup(storage.cleanup)
        self.out = Path(storage.name) / "batch"
        self.assertEqual(self.cli("prepare", "--out", self.out).returncode, 0)
        self.trials = json.loads((self.out / "manifest.json").read_text())["trials"]
        for row in self.trials:
            envelope = dict(prompt_sha256=row["prompt_sha256"], answer=answer(row["task_id"]))
            self.file(row).write_text(json.dumps(envelope))

    def cli(self, *args):
        return subprocess.run([sys.executable, str(CLI), *args], capture_output=True, timeout=30)

    def file(self, row):
        return self.out / "answers" / (row["id"] + ".json")

    def collect(self):
        return self.cli("collect", self.out, "--model", "test", "--runtime", "external")

    def test_report_and_recollect_detect_a_changed_or_missing_scored_answer(self):
        self.assertEqual(self.collect().returncode, 0)
        file = self.file(self.trials[0])
        envelope = json.loads(file.read_text())
        envelope["answer"]["cases"] = []
        file.write_text(json.dumps(envelope))
        self.assertEqual(self.cli("report", self.out).returncode, 2)
        self.assertEqual(self.collect().returncode, 2)
        file.unlink()
        self.assertEqual(self.cli("report", self.out).returncode, 2)

    def test_invalid_json_values_and_deep_nesting_are_one_failure_each(self):
        invalid = ["NaN", "1e9999", '"\\ud800"', "[" * 2000 + "]" * 1999]
        for row, extra in zip(self.trials, invalid):
            file = self.file(row)
            file.write_text(file.read_text()[:-1] + ', "extra":' + extra + "}")
        self.assertEqual(self.collect().returncode, 1)
        rows = [json.loads(line) for line in (self.out / "results.jsonl").read_text().splitlines()]
        self.assertEqual([row["failure_category"] for row in rows], ["answer-json"] * 4)
        self.assertEqual(self.cli("report", self.out).returncode, 1)

    def test_report_rejects_results_inconsistent_with_the_recorded_answer(self):
        self.assertEqual(self.collect().returncode, 0)
        path = self.out / "results.jsonl"
        rows = [json.loads(line) for line in path.read_text().splitlines()]
        rows[0]["checks"] = {}
        path.write_text("".join(json.dumps(row) + "\n" for row in rows))
        self.assertEqual(self.cli("report", self.out).returncode, 2)

    def test_index_filename_only_fails_the_domain_name_check(self):
        control, changed = [row for row in self.trials if row["task_id"] == "grid-step"]
        file = self.file(changed)
        envelope = json.loads(file.read_text())
        original = Path(envelope["answer"]["path"])
        envelope["answer"]["path"] = original.with_name("index.normal.test.ts").as_posix()
        file.write_text(json.dumps(envelope))
        self.assertEqual(self.collect().returncode, 1)
        rows = [json.loads(line) for line in (self.out / "results.jsonl").read_text().splitlines()]
        by_id = {row["id"]: row for row in rows}
        self.assertEqual(by_id[control["id"]]["status"], "success")
        self.assertEqual(by_id[changed["id"]]["status"], "task-failure")
        self.assertEqual(by_id[changed["id"]]["checks"], dict(
            placement=True, naming=False, rules=True, expectations=True, coverage=True,
        ))

    def test_an_equally_valid_answer_cannot_replace_the_scored_answer(self):
        self.assertEqual(self.collect().returncode, 0)
        grid = next(row for row in self.trials if row["task_id"] == "grid-step")
        file = self.file(grid)
        envelope = json.loads(file.read_text())
        envelope["answer"]["cases"].append({"input": 16, "expected": 24})
        file.write_text(json.dumps(envelope))
        self.assertEqual(self.cli("report", self.out).returncode, 2)


    def test_agent_and_model_can_be_omitted(self):
        result = self.cli("collect", self.out)
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = [json.loads(line) for line in (self.out / "results.jsonl").read_text().splitlines()]
        self.assertTrue(all(row["model"] is None and row["runtime"] is None for row in rows))
        self.assertNotIn(b"None", self.cli("report", self.out).stdout)

    def test_labels_are_free_and_resumed_collection_inherits_them(self):
        file = self.file(self.trials[-1])
        capture = file.read_bytes()
        file.unlink()
        partial = self.cli("collect", self.out, "--agent", "My local runner", "--model", "my/model@abc")
        self.assertEqual(partial.returncode, 1, partial.stderr)
        file.write_bytes(capture)
        self.assertEqual(self.cli("collect", self.out, "--agent", "Other").returncode, 2)
        self.assertEqual(self.cli("collect", self.out).returncode, 0)
        rows = [json.loads(line) for line in (self.out / "results.jsonl").read_text().splitlines()]
        self.assertEqual({(row["runtime"], row["model"]) for row in rows}, {("My local runner", "my/model@abc")})

    def test_optional_measurements_keep_zero_missing_and_detect_changes(self):
        file = self.file(self.trials[0])
        envelope = json.loads(file.read_text())
        envelope["metrics"] = {"input_tokens": 0, "cost_usd": 0.02, "wall_time_ms": 10}
        file.write_text(json.dumps(envelope))
        self.assertEqual(self.collect().returncode, 0)
        metrics = json.loads((self.out / "results.jsonl").read_text().splitlines()[0])["metrics"]
        self.assertEqual(metrics["input_tokens"], 0)
        self.assertEqual(metrics["cost_usd"], 0.02)
        self.assertEqual(metrics["wall_time_ms"], 10)
        self.assertIsNone(metrics["output_tokens"])
        envelope["metrics"]["wall_time_ms"] = 5
        file.write_text(json.dumps(envelope))
        self.assertEqual(self.cli("report", self.out).returncode, 2)

    def test_invalid_measurements_are_rejected_before_scoring(self):
        file = self.file(self.trials[0])
        envelope = json.loads(file.read_text())
        for metrics in ({"input_tokens": True}, {"output_tokens": -1}, {"wall_time_ms": "10"},
                        {"input_tokens": 1.5}, {"unknown": 2}):
            with self.subTest(metrics=metrics):
                file.write_text(json.dumps(dict(envelope, metrics=metrics)))
                self.assertEqual(self.collect().returncode, 2)
                self.assertFalse((self.out / "results.jsonl").exists())

    def test_v1_extra_measurements_remain_unmeasured_on_report_and_resume(self):
        manifest_path = self.out / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["version"] = 1
        manifest_path.write_text(json.dumps(manifest))
        pending = self.file(self.trials[-1])
        last_envelope = json.loads(pending.read_text())
        pending.unlink()
        self.assertEqual(self.collect().returncode, 1)

        extra = {"ignored-in-v1": "example", "input_tokens": 9}
        scored = self.file(self.trials[0])
        scored.write_text(json.dumps(dict(json.loads(scored.read_text()), metrics=extra)))
        self.assertEqual(self.cli("report", self.out).returncode, 1)
        pending.write_text(json.dumps(dict(last_envelope, metrics=extra)))
        self.assertEqual(self.cli("collect", self.out).returncode, 0)
        self.assertEqual(self.cli("report", self.out).returncode, 0)
        rows = [json.loads(line) for line in (self.out / "results.jsonl").read_text().splitlines()]
        self.assertTrue(all(row["metrics"]["input_tokens"] is None for row in rows))

    def test_earlier_runtime_error_can_be_reported_without_its_runner(self):
        manifest_path = self.out / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest.update(version=1, adapter="claude")
        manifest_path.write_text(json.dumps(manifest))
        row = dict(self.trials[0], adapter="claude", model="old", runtime=None, status="infra-error",
                   failure_category="cli-unavailable", checks={}, metrics={}, answer_sha256=None)
        (self.out / "results.jsonl").write_text(json.dumps(row) + "\n")
        self.file(row).unlink()
        result = self.cli("report", self.out)
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn(b"infra-error", result.stdout)


if __name__ == "__main__":
    unittest.main()
