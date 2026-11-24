"""候補の差し替えと過去の試行の再読を、独立した検証用リポジトリで確かめる。"""

import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

from test_smoke import CLI, LAYOUT


class PresetTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.work = Path(tmp.name)
        self.repo = self.work / "repo"
        subprocess.run(["git", "clone", "--quiet", "--local", "--no-checkout", str(CLI.parents[2]),
                        str(self.repo)], check=True)
        self.cli_path = self.repo / "harness/evals/harness_eval.py"
        shutil.copytree(CLI.parent, self.cli_path.parent, ignore=shutil.ignore_patterns("__pycache__"))
        self.base = self.git("rev-parse", "HEAD")
        self.git("read-tree", self.base)
        self.git("config", "user.email", "test@example.com")
        self.git("config", "user.name", "Test")

    def git(self, *args):
        return subprocess.check_output(["git", "-C", str(self.repo), *args], text=True).strip()

    def cli(self, *args):
        return subprocess.run([sys.executable, str(self.cli_path), *map(str, args)], text=True,
                              capture_output=True, timeout=30)

    def batch(self, label="batch", *, candidate="P-001-short", base="HEAD", replay=False):
        directory = self.work / label
        command = ["run", "--adapter", "replay"] if replay else ["prepare"]
        result = self.cli(*command, "--candidate", candidate, "--base", base, "--out", directory)
        self.assertEqual(result.returncode, 0, result.stderr)
        return directory, json.loads((directory / "manifest.json").read_text())

    def test_short_preset_changes_only_the_directory_example(self):
        out, manifest = self.batch()
        self.assertEqual(manifest["version"], 3)
        self.assertEqual(manifest["source_commit"], self.base)
        self.assertEqual(manifest["experiment"], "P-001-short")
        self.assertRegex(manifest["condition_fingerprint"], r"^[0-9a-f]{64}$")
        packets = {(t["task_id"], t["variant"]): (out / "prompts" / (t["id"] + ".txt")).read_text()
                   for t in manifest["trials"]}
        for task in ("grid-step", "label-limit"):
            old, new = packets[task, "A"], packets[task, "B"]
            self.assertTrue(old.startswith("# AGENTS.md\n"))
            self.assertEqual(old.count(LAYOUT), 1)
            before, after = old.split(LAYOUT)
            self.assertTrue(new.startswith(before) and new.endswith(after))
            replacement = new[len(before):-len(after)].strip()
            self.assertTrue(replacement)
            self.assertLess(len(replacement.splitlines()), len(LAYOUT.splitlines()))
            self.assertIn("ドメイン名", replacement)

    def test_irrelevant_changes_keep_the_fingerprint_and_rule_changes_update_it(self):
        _, first = self.batch("before")
        self.assertEqual(first["version"], 3)
        self.git("commit", "-q", "--allow-empty", "-m", "unrelated")
        _, same = self.batch("after")
        self.assertNotEqual(first["source_commit"], same["source_commit"])
        self.assertEqual(first["condition_fingerprint"], same["condition_fingerprint"])
        target = self.repo / "rules/testing.md"
        target.parent.mkdir(exist_ok=True)
        target.write_text(self.git("show", "HEAD:rules/testing.md") + "\n追加された規範。\n")
        self.git("add", "--", "rules/testing.md")
        self.git("commit", "-q", "-m", "rules changed")
        _, changed = self.batch("changed")
        self.assertNotEqual(first["condition_fingerprint"], changed["condition_fingerprint"])
        _, pinned = self.batch("pinned", base=self.base)
        self.assertEqual(first["condition_fingerprint"], pinned["condition_fingerprint"])

    def test_a_saved_run_uses_its_preset_snapshot_after_catalog_removal(self):
        out, manifest = self.batch(replay=True)
        self.assertEqual(manifest["version"], 3)
        preset = self.cli_path.parent / "presets/P-001-short.json"
        self.assertEqual(manifest["preset"], json.loads(preset.read_text()))
        preset.unlink()
        result = self.cli("report", out)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("P-001-short", result.stdout)
        manifest["condition_fingerprint"] = "0" * 64
        (out / "manifest.json").write_text(json.dumps(manifest))
        self.assertEqual(self.cli("report", out).returncode, 2)

    def test_adding_another_preset_requires_only_catalog_data(self):
        result = self.cli("inventory")
        self.assertIn("P-001-short", result.stdout)
        folder = self.cli_path.parent / "presets"
        alternate = json.loads((folder / "P-001-short.json").read_text())
        alternate["id"] = "P-002-test"
        (folder / "P-002-test.json").write_text(json.dumps(alternate))
        self.assertIn("P-002-test", self.cli("inventory").stdout)
        out, manifest = self.batch(candidate="P-002-test", replay=True)
        self.assertEqual(manifest["experiment"], "P-002-test")
        self.assertEqual(self.cli("report", out).returncode, 0)

    def test_a_missing_or_repeated_target_is_rejected_before_creating_output(self):
        for label, body in (("missing", ""), ("twice", LAYOUT * 2)):
            target = self.repo / "rules/testing.md"
            target.parent.mkdir(exist_ok=True)
            target.write_text("# テスト規約\n\n## 配置と命名\n\n" + body)
            self.git("add", "--", "rules/testing.md")
            self.git("commit", "-q", "-m", label)
            out = self.work / label
            result = self.cli("prepare", "--candidate", "P-001-short", "--base", "HEAD", "--out", out)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertFalse(out.exists())

    def test_nested_and_tabbed_imports_are_included_and_their_contents_fingerprinted(self):
        entry = self.repo / "AGENTS.md"
        entry.write_text(self.git("show", "HEAD:AGENTS.md") + "\n\t*\t@rules/extra/example.md\n")
        extra = self.repo / "rules/extra/example.md"
        extra.parent.mkdir(parents=True)
        extra.write_text("Additional naming rule.\n")
        self.git("add", "--", "AGENTS.md", "rules/extra/example.md")
        self.git("commit", "-q", "-m", "nested import")
        out, before = self.batch("extra")
        for packet in (out / "prompts").iterdir():
            self.assertIn("# rules/extra/example.md\nAdditional naming rule.\n", packet.read_text())
        extra.write_text("Revised naming rule.\n")
        self.git("add", "--", "rules/extra/example.md")
        self.git("commit", "-q", "-m", "change imported body")
        _, after = self.batch("changed")
        self.assertNotEqual(before["condition_fingerprint"], after["condition_fingerprint"])

    def test_mentions_and_scoped_packages_in_prose_are_not_imports(self):
        entry = self.repo / "AGENTS.md"
        line = "- Ask @maintainer before changing `@typescript-eslint/parser`."
        entry.write_text(self.git("show", "HEAD:AGENTS.md") + "\n" + line + "\n")
        self.git("add", "--", "AGENTS.md")
        self.git("commit", "-q", "-m", "document contact and package")
        out, _ = self.batch()
        for packet in (out / "prompts").iterdir():
            self.assertIn(line, packet.read_text())

    def test_unsupported_or_ambiguous_imports_reject_the_batch(self):
        entry = self.repo / "AGENTS.md"
        original = self.git("show", "HEAD:AGENTS.md")
        for i, line in enumerate(("- @docs/example.md", "@rules/naming.md", "- @rules/../other.md",
                                  "- @rules/extra.md @rules/next.md", "- more `@rules/example.md`")):
            with self.subTest(line=line):
                entry.write_text(original + "\n" + line + "\n")
                self.git("add", "--", "AGENTS.md")
                self.git("commit", "-q", "-m", "unsupported import")
                out = self.work / f"bad-{i}"
                result = self.cli("prepare", "--candidate", "P-001-short", "--base", "HEAD", "--out", out)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("import", result.stderr)
                self.assertFalse(out.exists())

    def test_manifest_versions_require_an_integer(self):
        for stored, invalid in ((2, (True, 2.0)), (3, (3.0,))):
            out = self.work / str(stored)
            args = ["--candidate", "P-001-short", "--base", "HEAD"] if stored == 3 else []
            result = self.cli("run", "--adapter", "replay", "--out", out, *args)
            self.assertEqual(result.returncode, 0, result.stderr)
            path = out / "manifest.json"
            manifest = json.loads(path.read_bytes())
            for version in invalid:
                with self.subTest(version=version):
                    path.write_text(json.dumps(dict(manifest, version=version)))
                    self.assertEqual(self.cli("report", out).returncode, 2)


if __name__ == "__main__":
    unittest.main()
