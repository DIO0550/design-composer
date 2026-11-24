"""独立した CLI プロセスとの境界を小さな実行ファイルで確認する。"""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


CLI = Path(__file__).with_name("harness_eval.py")
MODEL = "claude-sonnet-4-5-20250929"
FAKE_CLI = """
import json
import os
from pathlib import Path
import sys

if sys.argv[1:] == ["--version"]:
    print("fixture-cli 1.0")
    sys.exit()
options = sys.argv[1:]
assert "--bare" in options and "--no-session-persistence" in options
assert options[options.index("--tools") + 1] == ""
assert options[options.index("--disallowedTools") + 1] == "mcp__*"
assert "--strict-mcp-config" in options
assert options[options.index("--max-turns") + 1] == "1"
assert float(options[options.index("--max-budget-usd") + 1]) == 0.25
assert "GITHUB_TOKEN" not in os.environ
assert Path.home() == Path.cwd() and not list(Path.cwd().iterdir())
model = options[options.index("--model") + 1]
packet = sys.stdin.read()
if "仮想モジュール src/domains/canvas/grid-step" in packet:
    path = "src/domains/canvas/grid-step/__tests__/grid-step.example.test.ts"
    cases = [(16, 24), (6, 8)]
else:
    path = "src/features/inspector/domains/label-limit/__tests__/label-limit.edge.test.ts"
    cases = [(0, False), (1, True), (12, True), (13, False)]
answer = {"path": path, "cases": [{"input": i, "expected": e} for i, e in cases]}
event = {"type": "result", "is_error": False, "subtype": "success", "modelUsage": {model: {}},
         "usage": {"input_tokens": 25, "cache_read_input_tokens": 8, "output_tokens": 19},
         "total_cost_usd": 0.05, "result": json.dumps(answer)}
"""


class ClaudeAdapterTest(unittest.TestCase):
    def call(self, ending):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cli = root / "claude"
            cli.write_text(f"#!{sys.executable}\n" + FAKE_CLI + ending)
            cli.chmod(0o755)
            out = root / "output"
            env = dict(os.environ, PATH=tmp + os.pathsep + os.environ["PATH"], GITHUB_TOKEN="fixture")
            result = subprocess.run(
                [sys.executable, str(CLI), "run", "--adapter", "claude", "--out", str(out),
                 "--model", MODEL, "--budget-usd", "1"], env=env, capture_output=True, timeout=30,
            )
            rows = [json.loads(line) for line in (out / "results.jsonl").read_bytes().splitlines()]
            return result.returncode, rows

    def test_four_independent_calls_preserve_observed_usage_and_missing_metrics(self):
        code, rows = self.call("print(json.dumps(event))")
        self.assertEqual(code, 0)
        self.assertEqual(len(rows), 4)
        self.assertTrue(all(r["runtime"] == "fixture-cli 1.0" for r in rows))
        self.assertTrue(all(r["metrics"]["input_tokens"] == 25 for r in rows))
        self.assertTrue(all(r["metrics"]["cache_read_input_tokens"] == 8 for r in rows))
        self.assertTrue(all(r["metrics"]["cache_creation_input_tokens"] is None for r in rows))

    def test_an_unparseable_answer_is_a_task_failure_even_if_the_cli_exits_zero(self):
        code, rows = self.call('event["result"] = "oops"\nprint(json.dumps(event))')
        self.assertNotEqual(code, 0)
        self.assertEqual([r["status"] for r in rows], ["task-failure"] * 4)

    def test_a_nonfinite_answer_is_recorded_without_interrupting_the_batch(self):
        code, rows = self.call('answer["extra"] = float("nan")\nevent["result"] = json.dumps(answer)\nprint(json.dumps(event))')
        self.assertEqual(code, 1)
        self.assertEqual([row["failure_category"] for row in rows], ["answer-json"] * 4)

    def test_model_substitution_stops_spending_and_preserves_the_incomplete_result(self):
        code, rows = self.call('event["modelUsage"] = {"different": {}}\nprint(json.dumps(event))')
        self.assertNotEqual(code, 0)
        self.assertEqual([r["failure_category"] for r in rows], ["unverified-model"])

    def test_cli_budget_failure_stops_the_remaining_calls(self):
        code, rows = self.call('event["subtype"] = "error_max_budget_usd"\nprint(json.dumps(event))')
        self.assertNotEqual(code, 0)
        self.assertEqual([r["failure_category"] for r in rows], ["error_max_budget_usd"])


if __name__ == "__main__":
    unittest.main()
