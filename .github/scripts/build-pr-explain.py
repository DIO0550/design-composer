#!/usr/bin/env python3
"""PR の解説(`explain.json`、version 1)を検査し、テストのコード抜粋の中身を足して書き出す。

解説はセッションが `pr-explain` スキルで書き、ページの固定スクリプトが変更の地図(`change-map.json`)と
合わせて 3 画面に組む。ここが防ぐのはスクリプトの注入ではなく(それは `check-pr-explain-template.py` の
管轄)、**形の崩れと解説の中の参照切れ**(ページが黙って空欄を出す)。報告する違反は 4 つ。

- `pr-explain-shape` — 読めない・形が表と違う(必須の欠け・知らないキー・重複したキー・型・語彙・
  綴り・一意性・範囲)
- `pr-explain-meta` — `pr` が公開先の PR と違う
- `pr-explain-ref` — 解説の中の参照が解説の中に無い(message の from / to・flow の steps など)
- `pr-explain-code` — 解説時点の `sha` がこのリポジトリに無い・抜粋のパスがその sha に無い・範囲が
  ファイルに収まらない

**地図を指す参照(commitStory の sha・Note のパスと行・Target の layer / file・LayerRole の layer・
concept が地図にあるか)は見ない。** 地図は push のたびに作り直されるので、解説を書いた時点で
合っていても後で外れる。外れたものはページが「地図に無い」と出す。

抜粋(`tests[].excerpt`)の中身は手で写させず、`git cat-file blob <sha>:<path>` の行範囲をここで
`text` として足す。行は改行で割って数える(末尾に改行の無い最終行も 1 行)。入力に `text` を
書いた解説は落とす(手で写した中身が黙って上書きされるのを、書いた側に知らせるため)。

使い方:
    build-pr-explain.py <explain.json> --pr <番号> --out <書き出す先> [--repo <リポジトリ>]

違反が無ければ書き出して終了コード 0。違反があれば標準出力へ報告して 1(書き出さない)。
引数の誤り・解説のファイルが無いときは 2。`--repo` の既定は今のフォルダ。
"""

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Callable, NamedTuple

# 抜粋の行数の上限。
MaxExcerptLines = 80


class Scalar(NamedTuple):
    """1 つの値の規則。`rule` は `ScalarRules` のキー。"""

    rule: str


class Word(NamedTuple):
    """決まった語のどれか。"""

    words: tuple[str, ...]


class Many(NamedTuple):
    """配列。`least` は最小の件数、`distinct` は要素の重複を許さないか。"""

    item: object
    least: int = 0
    distinct: bool = False


class Shape(NamedTuple):
    """`Shapes` に名前で定義したオブジェクト。"""

    name: str


class Variant(NamedTuple):
    """`kind` で持つキーが決まるオブジェクト(`Variants` に名前で定義)。"""

    name: str


class Field(NamedTuple):
    """オブジェクトの 1 つのキー。"""

    value: object
    required: bool


class Duplicated(NamedTuple):
    """同じキーが 2 回以上書かれたオブジェクト。読み込みの時点でこの値に置き換え、形の検査で報告する。"""

    keys: tuple[str, ...]


def need(value: object) -> Field:
    """欠けたら違反になるキー。"""
    return Field(value, True)


def may(value: object) -> Field:
    """省いてよいキー。"""
    return Field(value, False)


def is_text(value: object) -> bool:
    """空でない文字列か。"""
    return isinstance(value, str) and value != ""


def is_count(value: object) -> bool:
    """1 以上の整数か(真偽値は整数として扱わない)。"""
    return isinstance(value, int) and not isinstance(value, bool) and value >= 1


IdentifierJoint = re.compile(r"[a-z][A-Z]")


def is_concept_name(value: object) -> bool:
    """空でない文字列で、ASCII の小文字の直後に大文字が来る箇所(camelCase / PascalCase の継ぎ目)が無いか。

    単語の境界は見ない。日本語が空白なしで続く `TokenTemplateの規則` も落とすため。バッククォートの中も
    除かない。名前は書いたまま描かれ、`…` で囲んでも識別子がそのまま画面に出るため(highlights の title は
    `…` をコードとして描くが、題も概念で書くので扱いを揃える)。
    """
    has_identifier_joint = isinstance(value, str) and IdentifierJoint.search(value) is not None
    return is_text(value) and not has_identifier_joint


IdPattern = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}")
ShaPattern = re.compile(r"[0-9a-f]{40}")

# 値の規則と、違反したときの説明。
ScalarRules: dict[str, tuple[Callable[[object], bool], str]] = {
    "text": (is_text, "空でない文字列"),
    "name": (is_concept_name, "概念の名前(docs の語彙。camelCase / PascalCase の識別子や製品名は書かない)"),
    "id": (lambda value: isinstance(value, str) and IdPattern.fullmatch(value) is not None, f"id({IdPattern.pattern})"),
    "sha": (lambda value: isinstance(value, str) and ShaPattern.fullmatch(value) is not None, "小文字 40 桁の sha"),
    "count": (is_count, "1 以上の整数"),
    "flag": (lambda value: isinstance(value, bool), "true か false"),
    "true": (lambda value: value is True, "true(偽なら書かない)"),
    "version": (lambda value: type(value) is int and value == 1, "1"),
}

Text = Scalar("text")
# 図・一覧の見出しになる名前(concepts / messages の name、features / flows / suites の label、highlights の title)。
Name = Scalar("name")
Id = Scalar("id")
Sha = Scalar("sha")
Count = Scalar("count")

# 技法・phase・やりとりの種類・方式・やりとりの状態の語彙。ページの表(固定スクリプトの核の `Vocabulary`)と
# 同じキーの集合で、`pr-explain-core-cases.sh` が突き合わせる。やりとりの状態は、省けば前からあって変えていないもの。
Techniques = ("boundary", "equivalence", "error", "state", "regression", "idempotence", "type")
Phases = ("prep", "core", "hard", "revise", "fin")
MessageKinds = ("cmd", "qry", "evt")
Vias = ("call", "http", "state", "log", "exec", "file")
MessageStatuses = ("added", "changed", "removed")

# 解説の形(`pr-explain` スキルの「explain.json の形」の表を、検査が読む形にしたもの)。
Shapes: dict[str, dict[str, Field]] = {
    "Explain": {
        "version": need(Scalar("version")),
        "pr": need(Count),
        "sha": need(Sha),
        "issue": may(Count),
        "overview": need(Shape("Overview")),
        "features": may(Many(Shape("Feature"))),
        "layerRoles": may(Many(Shape("LayerRole"))),
        "concepts": may(Many(Shape("Concept"))),
        "messages": may(Many(Shape("Message"))),
        "flows": may(Many(Shape("Flow"))),
        "commitStories": may(Many(Shape("CommitStory"))),
        "suites": may(Many(Shape("Suite"))),
        "tests": may(Many(Shape("Test"))),
    },
    "Overview": {
        "title": need(Text),
        "lead": need(Text),
        "before": need(Many(Shape("Behavior"))),
        "after": need(Many(Shape("Behavior"), least=1)),
        "highlights": may(Many(Shape("Highlight"))),
    },
    "Behavior": {"text": need(Text), "message": may(Id)},
    "Highlight": {"title": need(Name), "text": need(Text), "go": need(Variant("Target"))},
    "Feature": {"id": need(Id), "label": need(Name), "role": need(Text)},
    "LayerRole": {"layer": need(Text), "role": need(Text)},
    "Concept": {
        "path": need(Text),
        "name": need(Name),
        "role": need(Text),
        "feature": may(Id),
        "change": may(Text),
        "graph": may(Scalar("flag")),
    },
    "Message": {
        "id": need(Id),
        "from": need(Text),
        "to": need(Text),
        "kind": need(Word(MessageKinds)),
        "name": need(Name),
        "code": need(Text),
        "via": need(Word(Vias)),
        "payload": may(Text),
        "returns": may(Text),
        "status": may(Word(MessageStatuses)),
    },
    "Flow": {"id": need(Id), "label": need(Name), "steps": need(Many(Id, least=1))},
    "CommitStory": {
        "sha": need(Sha),
        "phase": need(Word(Phases)),
        "role": need(Text),
        "why": need(Text),
        "flows": may(Many(Id)),
        "review": may(Many(Text)),
        "before": may(Many(Shape("Behavior"))),
        "after": may(Many(Shape("Behavior"))),
        "notes": may(Many(Shape("Note"))),
    },
    "Note": {
        "path": need(Text),
        "side": may(Word(("new", "old"))),
        "start": need(Count),
        "end": need(Count),
        "text": need(Text),
    },
    "Suite": {"id": need(Id), "label": need(Name), "file": need(Text)},
    "Test": {
        "id": need(Id),
        "suite": need(Id),
        "name": need(Text),
        "techniques": need(Many(Word(Techniques), least=1, distinct=True)),
        "why": need(Text),
        "given": need(Text),
        "when": need(Text),
        "then": need(Text),
        "todo": may(Scalar("true")),
        "commit": may(Sha),
        "excerpt": may(Shape("Excerpt")),
        "values": may(Shape("Values")),
        "targets": may(Many(Text)),
        "covers": may(Many(Id)),
    },
    # `text` はここが足す出力だけのキーなので、入力の形には無い。
    "Excerpt": {"path": need(Text), "start": need(Count), "end": need(Count)},
    "Values": {"columns": need(Many(Text, least=1)), "rows": need(Many(Shape("Row")))},
    "Row": {"cells": need(Many(Text)), "boundary": may(Scalar("flag"))},
}

# `kind` ごとに持つキー。他の kind のキーが混ざるのも、知らないキーとして落とす。Target はどの kind も、ページ
# (固定スクリプトの核の `Target`)がここと同じキーを読んで移る先にすることを `pr-explain-core-cases.sh` が確かめる。
Variants: dict[str, dict[str, dict[str, Field]]] = {
    "Target": {
        "feature": {"id": need(Id)},
        "layer": {"layer": need(Text)},
        "file": {"path": need(Text)},
        "message": {"id": need(Id)},
        "flow": {"id": need(Id)},
    },
}


def span_problem(value: dict) -> str | None:
    """`start` 〜 `end` の範囲が逆向きでないかを見る(Note と Excerpt)。"""
    if value["end"] < value["start"]:
        return f"end({value['end']})が start({value['start']})より前"
    return None


def excerpt_length_problem(value: dict) -> str | None:
    """抜粋が上限の行数に収まっているかを見る。"""
    length = value["end"] - value["start"] + 1
    if length > MaxExcerptLines:
        return f"抜粋は {MaxExcerptLines} 行まで(今は {length} 行)"
    return None


def cells_problem(value: dict) -> str | None:
    """値の表の各行が列と同じ数のセルを持つかを見る。"""
    width = len(value["columns"])
    uneven = [index for index, row in enumerate(value["rows"]) if len(row["cells"]) != width]
    if uneven:
        return f"rows{uneven} のセルの数が columns の {width} 個と違う"
    return None


# キーごとの形が合ったオブジェクトに、キーをまたいで当てる規則。
CrossChecks: dict[str, tuple[Callable[[dict], str | None], ...]] = {
    "Note": (span_problem,),
    "Excerpt": (span_problem, excerpt_length_problem),
    "Values": (cells_problem,),
}

# 一意でなければならない値(トップの一覧と、その中のキー)。
UniqueKeys = (
    ("features", "id"),
    ("layerRoles", "layer"),
    ("concepts", "path"),
    ("messages", "id"),
    ("flows", "id"),
    ("commitStories", "sha"),
    ("suites", "id"),
    ("tests", "id"),
)


class Reference(NamedTuple):
    """解説の中の参照。`source` の値が、トップの一覧 `collection` のどれかの `key` と一致する。

    `source` はトップからの道筋で、`[]` は配列の各要素を指す。
    """

    source: str
    collection: str
    key: str


References = (
    Reference("messages[].from", "concepts", "path"),
    Reference("messages[].to", "concepts", "path"),
    Reference("flows[].steps[]", "messages", "id"),
    Reference("commitStories[].flows[]", "flows", "id"),
    Reference("overview.before[].message", "messages", "id"),
    Reference("overview.after[].message", "messages", "id"),
    Reference("commitStories[].before[].message", "messages", "id"),
    Reference("commitStories[].after[].message", "messages", "id"),
    Reference("tests[].suite", "suites", "id"),
    Reference("tests[].covers[]", "messages", "id"),
    Reference("tests[].targets[]", "concepts", "path"),
    Reference("concepts[].feature", "features", "id"),
)

# Target の kind のうち、解説の中の一覧を指すもの(layer / file は地図を指す参照)。
TargetCollections = {"feature": "features", "message": "messages", "flow": "flows"}


def keep_first_or_mark(pairs: list[tuple[str, object]]) -> dict | Duplicated:
    """`json.loads` の `object_pairs_hook`。キーが重複していれば `Duplicated` に置き換える。"""
    keys = [key for key, _ in pairs]
    repeated = tuple(sorted({key for key in keys if keys.count(key) > 1}))
    return Duplicated(repeated) if repeated else dict(pairs)


def parse(raw: bytes) -> tuple[object, str | None]:
    """解説の JSON を読む。

    @param raw 解説のファイルの中身
    @returns 読んだ値と、読めなかった理由(読めたら None)
    """
    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=keep_first_or_mark), None
    except UnicodeDecodeError as error:
        return None, f"UTF-8 として読めない({error})"
    except json.JSONDecodeError as error:
        return None, f"JSON として読めない({error})"


def value_problems(value: object, rule: object, where: str) -> list[str]:
    """値が規則に合わない理由を集める。

    @param value 検査する値
    @param rule `Scalar` / `Word` / `Many` / `Shape` / `Variant` のどれか
    @param where 報告に出す、トップからの道筋
    @returns 違反の説明。無ければ空
    """
    if isinstance(value, Duplicated):
        return [f"{where}: キー {', '.join(value.keys)} が重複している"]
    if isinstance(rule, Scalar):
        holds, description = ScalarRules[rule.rule]
        return [] if holds(value) else [f"{where}: {description}で書く(今は {json.dumps(value, ensure_ascii=False)})"]
    if isinstance(rule, Word):
        return [] if value in rule.words else [f"{where}: {' / '.join(rule.words)} のどれか(今は {json.dumps(value, ensure_ascii=False)})"]
    if isinstance(rule, Many):
        return list_problems(value, rule, where)
    if isinstance(rule, Variant):
        return variant_problems(value, Variants[rule.name], where)
    return object_problems(value, rule.name, where)


def list_problems(value: object, rule: Many, where: str) -> list[str]:
    """配列の規則(件数・重複・各要素)に合わない理由を集める。"""
    if not isinstance(value, list):
        return [f"{where}: 配列で書く"]
    if len(value) < rule.least:
        return [f"{where}: {rule.least} 件以上書く"]
    items = [problem for index, item in enumerate(value) for problem in value_problems(item, rule.item, f"{where}[{index}]")]
    repeated = rule.distinct and len({json.dumps(item) for item in value}) != len(value)
    return items + ([f"{where}: 同じ値を 2 回書かない"] if repeated else [])


def fields_problems(value: dict, fields: dict[str, Field], where: str) -> list[str]:
    """オブジェクトのキーが表と合わない理由(欠け・知らないキー・各値)を集める。"""
    missing = [f"{where}: {key} が無い" for key, field in fields.items() if field.required if key not in value]
    unknown = [f"{where}: 知らないキー {key}" for key in value if key not in fields]
    values = [problem for key, field in fields.items() if key in value for problem in value_problems(value[key], field.value, f"{where}.{key}")]
    return missing + unknown + values


def object_problems(value: object, name: str, where: str) -> list[str]:
    """`Shapes` の名前のオブジェクトに合わない理由を集める。キーごとに合っていれば、キーをまたぐ規則も当てる。"""
    if not isinstance(value, dict):
        return [f"{where}: オブジェクト({name})で書く"]
    problems = fields_problems(value, Shapes[name], where)
    if problems:
        return problems
    crossed = [check(value) for check in CrossChecks.get(name, ())]
    return [f"{where}: {problem}" for problem in crossed if problem]


def variant_problems(value: object, variants: dict[str, dict[str, Field]], where: str) -> list[str]:
    """`kind` で形が決まるオブジェクトに合わない理由を集める。"""
    if not isinstance(value, dict):
        return [f"{where}: オブジェクトで書く"]
    kind = value.get("kind")
    if kind not in variants:
        return [f"{where}.kind: {' / '.join(variants)} のどれか(今は {json.dumps(kind, ensure_ascii=False)})"]
    fields = {"kind": need(Word(tuple(variants))), **variants[kind]}
    return fields_problems(value, fields, where)


def uniqueness_problems(explain: dict) -> list[str]:
    """一意でなければならない値の重複を集める。

    @param explain 形の検査を通った解説
    """
    problems = []
    for collection, key in UniqueKeys:
        values = [item[key] for item in explain.get(collection, [])]
        repeated = sorted({value for value in values if values.count(value) > 1})
        problems += [f"{collection}[].{key}: {value} が 2 回以上ある" for value in repeated]
    return problems


def shape_problems(explain: object) -> list[str]:
    """解説の形の違反を集める。"""
    problems = value_problems(explain, Shape("Explain"), "explain")
    return problems if problems else uniqueness_problems(explain)


def values_at(value: object, route: list[str], where: str) -> list[tuple[str, object]]:
    """道筋の先にある値を、道筋の綴りと一緒に集める。途中で欠けているものは飛ばす。

    @param value 道筋の起点
    @param route `.` で割った道筋(`[]` で終わる段は配列の各要素へ進む)
    @param where 起点までの綴り
    """
    if not route:
        return [(where, value)]
    step, rest = route[0], route[1:]
    key = step.removesuffix("[]")
    if key not in value:
        return []
    inner, inner_where = value[key], f"{where}.{key}" if where else key
    if not step.endswith("[]"):
        return values_at(inner, rest, inner_where)
    return [found for index, item in enumerate(inner) for found in values_at(item, rest, f"{inner_where}[{index}]")]


def reference_problems(explain: dict) -> list[str]:
    """解説の中の参照切れと、未実装のテストが持てないキーを集める。

    @param explain 形の検査を通った解説
    """
    known = lambda collection, key: {item[key] for item in explain.get(collection, [])}
    problems = [
        f"{where}: {value} が {reference.collection} に無い"
        for reference in References
        for where, value in values_at(explain, reference.source.split("."), "")
        if value not in known(reference.collection, reference.key)
    ]
    for where, go in values_at(explain, ["overview", "highlights[]", "go"], ""):
        collection = TargetCollections.get(go["kind"])
        is_dangling = collection is not None and go["id"] not in known(collection, "id")
        problems += [f"{where}.id: {go['id']} が {collection} に無い"] if is_dangling else []
    todo_with_code = [
        f"tests[{index}]: todo のテストは commit も excerpt も持たない"
        for index, test in enumerate(explain.get("tests", []))
        if is_todo_with_code(test)
    ]
    return problems + todo_with_code


def is_todo_with_code(test: dict) -> bool:
    """未実装(`todo`)のテストが、実装を指すキー(`commit` / `excerpt`)を持っているか。"""
    points_at_code = "commit" in test or "excerpt" in test
    return test.get("todo", False) and points_at_code


def git(repo: str, *args: str) -> subprocess.CompletedProcess:
    """`repo` で git を走らせる。"""
    return subprocess.run(["git", "-C", repo, *args], capture_output=True)


def lines_at(repo: str, sha: str, path: str) -> list[str] | None:
    """そのコミットのファイルを行に割って返す。

    @returns 行の並び(末尾に改行の無い最終行も 1 行)。そのコミットにファイルとして無ければ None
    """
    kind = git(repo, "cat-file", "-t", f"{sha}:{path}")
    is_file = kind.returncode == 0 and kind.stdout.strip() == b"blob"
    if not is_file:
        return None
    text = git(repo, "cat-file", "blob", f"{sha}:{path}").stdout.decode("utf-8", errors="replace")
    lines = text.split("\n")
    return lines[:-1] if lines[-1] == "" else lines


def excerpt_text(repo: str, sha: str, excerpt: dict) -> tuple[str | None, str | None]:
    """抜粋の範囲の中身を読む。

    @returns 中身(行を改行でつないだもの)と、読めなかった理由。どちらか一方だけが None でない
    """
    lines = lines_at(repo, sha, excerpt["path"])
    if lines is None:
        return None, f"{excerpt['path']} は {sha} に無い"
    if excerpt["end"] > len(lines):
        return None, f"{excerpt['path']} は {len(lines)} 行で、{excerpt['start']}-{excerpt['end']} 行目は収まらない"
    return "\n".join(lines[excerpt["start"] - 1:excerpt["end"]]), None


def with_excerpt_texts(explain: dict, repo: str) -> tuple[dict, list[str]]:
    """抜粋に中身(`text`)を足した解説と、読めなかった抜粋の違反を返す。

    @param explain 形と参照の検査を通った解説
    @param repo 解説時点の sha を持つリポジトリ
    """
    sha = explain["sha"]
    if git(repo, "cat-file", "-e", f"{sha}^{{commit}}").returncode != 0:
        return explain, [f"sha {sha} がこのリポジトリに無い(解説時点の head を push・fetch してから)"]
    if "tests" not in explain:
        return explain, []
    read = [(test, *excerpt_text(repo, sha, test["excerpt"])) if "excerpt" in test else (test, None, None) for test in explain["tests"]]
    problems = [f"tests[{index}].excerpt: {problem}" for index, (_, _, problem) in enumerate(read) if problem]
    tests = [test if text is None else {**test, "excerpt": {**test["excerpt"], "text": text}} for test, text, _ in read]
    return {**explain, "tests": tests}, problems


def collect_violations(explain: object, pr: int, repo: str) -> tuple[dict | None, list[str]]:
    """解説を検査し、書き出す値と報告の行を返す。

    @param explain 読んだ解説(読めなかったら None)
    @param pr 公開先の PR 番号
    @param repo 解説時点の sha を持つリポジトリ
    @returns 抜粋の中身を足した解説(違反があれば None)と、報告の行
    """
    shape = shape_problems(explain)
    if shape:
        return None, [f"[pr-explain-shape] {problem}" for problem in shape]
    meta = [] if explain["pr"] == pr else [f"[pr-explain-meta] pr が公開先の PR #{pr} と違う(今は {explain['pr']})"]
    refs = [f"[pr-explain-ref] {problem}" for problem in reference_problems(explain)]
    written, code = with_excerpt_texts(explain, repo)
    violations = meta + refs + [f"[pr-explain-code] {problem}" for problem in code]
    return (None if violations else written), violations


def parse_args(argv: list[str]) -> dict[str, str] | None:
    """`<explain.json> --pr <番号> --out <先> [--repo <リポジトリ>]` を読む。読めなければ None。"""
    if len(argv) < 2:
        return None
    options = dict(zip(argv[2::2], argv[3::2]))
    is_complete = len(argv) % 2 == 0 and set(options) <= {"--pr", "--out", "--repo"} and {"--pr", "--out"} <= set(options)
    is_valid = is_complete and re.fullmatch(r"[1-9][0-9]*", options["--pr"]) is not None and Path(argv[1]).is_file()
    return {**options, "explain": argv[1]} if is_valid else None


def main(argv: list[str]) -> int:
    options = parse_args(argv)
    if options is None:
        print("使い方: build-pr-explain.py <explain.json> --pr <番号> --out <書き出す先> [--repo <リポジトリ>]", file=sys.stderr)
        return 2
    explain, unreadable = parse(Path(options["explain"]).read_bytes())
    if unreadable:
        print(f"[pr-explain-shape] {unreadable}")
        return 1
    written, violations = collect_violations(explain, int(options["--pr"]), options.get("--repo", "."))
    for violation in violations:
        print(violation)
    if violations:
        return 1
    Path(options["--out"]).write_text(json.dumps(written, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
