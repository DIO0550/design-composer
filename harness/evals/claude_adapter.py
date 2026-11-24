"""ツールを持たない Claude Code の単発呼び出しと usage の読み取り。"""

import json
import math
import os
import shutil
import subprocess
import tempfile
import time

from answer_json import decode_answer


TOKEN_FIELDS = ("input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens")


def empty_metrics():
    return dict.fromkeys((*TOKEN_FIELDS, "cost_usd", "wall_time_ms", "rework_count"))


def environment(home):
    env = {key: os.environ[key] for key in ("PATH", "ANTHROPIC_API_KEY") if key in os.environ}
    env.update(HOME=home, TMPDIR=home, CLAUDE_CONFIG_DIR=home, LANG="C.UTF-8",
               CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1", DISABLE_AUTOUPDATER="1")
    return env


def runtime_version():
    exe = shutil.which("claude")
    if not exe:
        return None
    with tempfile.TemporaryDirectory() as tmp:
        try:
            result = subprocess.run([exe, "--version"], cwd=tmp, env=environment(tmp),
                                    capture_output=True, text=True, timeout=10)
        except (OSError, subprocess.TimeoutExpired):
            return None
    if result.returncode:
        return None
    return result.stdout.strip().splitlines()[0][:120] if result.stdout.strip() else None


def measurement(value):
    if type(value) in (float, int) and math.isfinite(value) and value >= 0:
        return value
    return None


def ask(packet, model, budget, timeout):
    metrics = empty_metrics()
    cmd = ["claude", "--bare", "-p", "--tools", "", "--disallowedTools", "mcp__*",
           "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
           "--no-session-persistence", "--output-format", "json", "--max-turns", "1",
           "--max-budget-usd", str(budget), "--model", model]
    start = time.monotonic()
    with tempfile.TemporaryDirectory() as tmp:
        try:
            result = subprocess.run(cmd, input=packet, cwd=tmp, env=environment(tmp),
                                    capture_output=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            return None, "task-failure", "timeout", metrics
        except OSError:
            return None, "infra-error", "cli-unavailable", metrics
        finally:
            metrics["wall_time_ms"] = round((time.monotonic() - start) * 1000)
    try:
        event = json.loads(result.stdout)
    except (ValueError, RecursionError):
        return None, "infra-error", "cli-output", metrics
    if not isinstance(event, dict):
        return None, "infra-error", "cli-output", metrics
    usage = event.get("usage")
    if isinstance(usage, dict):
        for key in TOKEN_FIELDS:
            value = usage.get(key)
            if type(value) is int and value >= 0:
                metrics[key] = value
    metrics["cost_usd"] = measurement(event.get("total_cost_usd"))
    subtype = event.get("subtype")
    if subtype in ("error_max_budget_usd", "error_max_turns"):
        return None, "task-failure", subtype, metrics
    if (result.returncode or event.get("type") != "result" or subtype != "success"
            or event.get("is_error") is not False):
        return None, "infra-error", "cli-error", metrics
    model_usage = event.get("modelUsage")
    if not isinstance(model_usage, dict) or set(model_usage) != {model}:
        return None, "infra-error", "unverified-model", metrics
    try:
        answer = decode_answer(event["result"])
    except (KeyError, TypeError, ValueError, UnicodeError):
        return None, "task-failure", "answer-json", metrics
    return answer, None, None, metrics
