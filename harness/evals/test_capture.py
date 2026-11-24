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


if __name__ == "__main__":
    unittest.main()
