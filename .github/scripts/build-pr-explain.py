#!/usr/bin/env python3
"""PR の解説(`explain.json`、version 1)を検査し、コード抜粋の中身を足して書き出す。

解説はセッションが `pr-explain` スキルで書き、ページの固定スクリプトが変更の地図(`change-map.json`)と
合わせて 5 画面に組む。ここが防ぐのはスクリプトの注入ではなく(それは `check-pr-explain-template.py` の
管轄)、**形の崩れと解説の中の参照切れ**(ページが黙って空欄を出す)。

報告する違反は次のとおり(並びが報告の順)。

- `pr-explain-shape` — 読めない・形が表と違う(必須の欠け・知らないキー・重複したキー・型・語彙・
  綴り・一意性・範囲・状況の表のマスの揃い・振る舞いの前後が同じ・振る舞いの仕様の場所と関連 Issue の重複・
  行の無い変わらないことの仕様・用語の印の書き方・強調の範囲・呼び出しの前後と線の端・手順の対応・手順の説明と注記の位置・
  アクターと concepts の綴り・やりとりの状態と手順の位置と対応の状態・選択肢の数と答えの範囲・クイズの答えの鍵の重なり)
- `pr-explain-meta` — `pr` が公開先の PR と違う
- `pr-explain-ref` — 解説の中の参照が解説の中に無い(message の from / to(concepts か actors)・flow の steps と beforeSteps・
  featureRanges の feature・calls の箱の module と線の from / to・Target(置いたすべての道筋)など)・用語の印が terms に無い・どの印からも指されない用語
- `pr-explain-code` — 解説時点の `sha` がこのリポジトリに無い・抜粋のパスがその sha に無い・範囲が
  ファイルに収まらない

種別の綴りは、この一覧と報告の行の頭(`[<種別>] `)にだけ書く(照合は `build-pr-explain-cases.sh`)。

**地図を指す参照(commitStory の sha・Note と FeatureRange のパスと行・Target の layer / file / module・LayerRole の layer・
concept・primers の出てくる場所の `path`・`lineRange`・`shas`・振る舞いの仕様の場所の `path`・`shas` が地図にあるか)は見ない。** 地図は push のたびに
作り直されるので、解説を書いた時点で合っていても後で外れる。外れたものはページが「地図に無い」と出す。

抜粋(Excerpt を指すすべての道筋。`tests[].excerpt`・`primers[].passages[].excerpt`)の中身は手で写させず、
`git cat-file blob <sha>:<path>` の行範囲をここで `text` として足す。行は改行で割って数える(末尾に改行の
無い最終行も 1 行)。入力に `text` を書いた解説は落とす(手で写した中身が黙って上書きされるのを、書いた側に
知らせるため)。強調の範囲(`emphasis`)は書いたまま残す。

埋め込み(script / style 要素・ヒアドキュメント)を読む拡張子の抜粋には、始まりの行の頭で効いている埋め込みを開いた行を
`openingLine` として足す。ページが抜粋を途中の行から色分けするためで、拡張子と規則は `lib/embedded_regions.py`。`text` と
同じく出力だけのキーで、入力に書いた解説は Excerpt の形に無いキーとして落とす。

見出し(`Heading` を使うキー)は、小文字と大文字の継ぎ目(`[a-z][A-Z]`)がある複合語を、docs に出る語の
ほかは落とす。大文字だけの略語(UI 案・VRT)はこのリポジトリの語彙なので通す。1 語の識別子・ファイル名・snake_case は
綴りで識別子と言い切れないので見ない(見出しには書かない)。

- 語は ASCII 英数字の並びで切り出し、単語の境界は見ない。日本語が空白なしで続く識別子も落とすため
- `` `…` `` の中も除かない。名前は書いたまま描かれ、囲んでも識別子がそのまま画面に出るため
- highlights の `title` は `` `…` `` をコードとして描くが、題も概念で書くので他の見出しと扱いを揃える
- docs(`docs/*.md`)に出る語は通す。`.dcmp` のキー名や製品名は仕様の語で、言い換えるとかえって伝わらない
  ため。一覧を手で持たず docs を正本にする

振る舞い(`impact`)の文字列は、仕様の場所の `path`(ファイルの場所)と `shas` を除いて、使う人の言葉(`UserText`)で書く。見出しと同じ継ぎ目の規則に加えて
`` ` `` も落とす。振る舞いの画面はコードの名前を出さずに読ませる画面で、文はどれも書いたまま描く。
「コードの名前を出さない」が何を守るかは、ここを正本にする(`pr-explain` スキルはここを指す)。

- **検査で守るのは `impact` の文字列。** ページはそれに固定の文言と、`impact` の値から導いた文(マスの状況の
  「行 · 列(注)」・件数・sha の頭 7 桁・「Issue #番号」)を足すだけで、コミットの件名は出さないので、そこにも名前は入らない
- 例外は根拠として添える名前で、テスト名(`tests[].name`。検査しない)とやりとりの名前(`messages[].name`。
  見出しの規則)と仕様の場所のパス(`changed.specs[].path`・`keptSpecs[].path`。`Text`)と技術の手引きの節の題
  (`primers[].label`。`` `…` `` はコードとして描く)はそのまま出る
- 1 語の識別子・ファイル名・snake_case は綴りで識別子と言い切れないので、この規則でも捕まらない。書き方の
  規則(`pr-explain` スキル)で受ける

技術の手引き(`primers`)の本文の用語の印 `[[表示|用語の id]]` は、`MarkedText` のキー(`gist`・text と注意メモの段の
`text`・引数の `text`)だけで読む。印の書き方は `pr-explain` スキルの「共通の規則」が持ち、ここには理由だけを置く。

- ページは印で先に割り、印の中と外でそれぞれ `` `…` `` をコードにするので、印をまたいで `` ` `` は対にならない。そのため
  `` ` `` は印の外の切れ端ごとに数える
- `` ` `` の中に書いた印の形は、コードのつもりでも印になる。`` ` `` の外の印でない `[[` / `]]` は、印の書き損じと見分けられない

使い方:
    build-pr-explain.py <explain.json> --pr <番号> --out <書き出す先> [--repo <リポジトリ>]

違反が無ければ書き出して終了コード 0。違反があれば標準出力へ報告して 1(書き出さない)。
引数の誤り・解説のファイルが無いときは 2。`--repo` の既定は今のフォルダ。
"""

import json
import re
import subprocess
import sys
from functools import reduce
from pathlib import Path
from typing import Callable, NamedTuple

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from embedded_regions import opening_lines

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


def repeated(values: list) -> list:
    """2 回以上出た値を、並べ替えて 1 つずつ返す。"""
    return sorted({value for value in values if values.count(value) > 1})


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


IdentifierJointPattern = re.compile(r"[a-z][A-Z]")
AsciiWordPattern = re.compile(r"[A-Za-z0-9]+")


def joint_words(text: str) -> set[str]:
    """ASCII 英数字の並びで切り出した語のうち、小文字と大文字の継ぎ目(`[a-z][A-Z]`)を含むものを集める。"""
    return {word for word in AsciiWordPattern.findall(text) if IdentifierJointPattern.search(word) is not None}


# docs が仕様の語として使う、継ぎ目を含む語(`.dcmp` のキー名・製品名)。
DocsJointWords = frozenset(
    word
    for doc in sorted((Path(__file__).resolve().parents[2] / "docs").glob("*.md"))
    for word in joint_words(doc.read_text(encoding="utf-8"))
)


def is_text_with_only_docs_joints(value: object) -> bool:
    """空でない文字列で、継ぎ目を含む語がすべて docs に出る語か。"""
    return is_text(value) and joint_words(value) <= DocsJointWords


IdPattern = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}")
ShaPattern = re.compile(r"[0-9a-f]{40}")
# 用語の印 `[[表示|用語の id]]`。ページの `TermMarks.Pattern` と同じ綴りで、`pr-explain-core-cases.sh` が突き合わせる。
TermMarkPattern = re.compile(r"\[\[([^\[\]|]+)\|(" + IdPattern.pattern + r")\]\]")


def code_spans_of(text: str) -> list[tuple[bool, str]]:
    """文を `` ` `` で割り、コードか(奇数番目)と切れ端の組にする。閉じていない最後の `` ` `` はコードにせず文字のまま前の
    切れ端につなぐ。ページの `CodeSpans.create` と同じ割り方で、`pr-explain-core-cases.sh` が突き合わせる。
    """
    parts = text.split("`")
    has_unclosed = len(parts) % 2 == 0
    paired = [*parts[:-2], f"{parts[-2]}`{parts[-1]}"] if has_unclosed else parts
    return [(index % 2 == 1, part) for index, part in enumerate(paired)]


def plain_pieces_of(text: str) -> list[str]:
    """印で割った、印の外の切れ端。`n` 個目の切れ端は `n` 個目の印の前にある(ページの `TermMarks.piecesOf` と同じ割り方)。"""
    return TermMarkPattern.split(text)[0::3]


def has_stray_brackets(value: str) -> bool:
    """`` ` `` の外に、印になっていない `[[` / `]]` があるか。ページは印の外の切れ端ごとに `` ` `` を対にするので、切れ端ごとに見る。"""
    outside_code = [part for piece in plain_pieces_of(value) for is_code, part in code_spans_of(piece) if not is_code]
    return any("[[" in part or "]]" in part for part in outside_code)


def has_mark_in_code(value: str) -> bool:
    """`` ` `` の中に印の形を書いたか。印の始まりより前にある、印の外の `` ` `` が奇数なら、書き手はコードの中に書いている。"""
    plains = plain_pieces_of(value)
    ticks_before = [sum(piece.count("`") for piece in plains[:index + 1]) for index in range(len(plains) - 1)]
    return any(count % 2 == 1 for count in ticks_before)


def is_marked_text(value: object) -> bool:
    """空でない文字列で、用語の印の 2 つの規則(`has_stray_brackets` / `has_mark_in_code`)のどちらにも当たらないか。"""
    return is_text(value) and not has_stray_brackets(value) and not has_mark_in_code(value)


# 値の規則と、違反したときの説明。
ScalarRules: dict[str, tuple[Callable[[object], bool], str]] = {
    "text": (is_text, "空でない文字列"),
    "heading": (is_text_with_only_docs_joints, "見出し(小文字と大文字の継ぎ目がある複合語は、docs に出る語のほかは書かない)"),
    "user_text": (lambda value: is_text_with_only_docs_joints(value) and "`" not in value, "使う人の言葉(見出しの規則に加えて ` を書かない)"),
    "id": (lambda value: isinstance(value, str) and IdPattern.fullmatch(value) is not None, f"id({IdPattern.pattern})"),
    "sha": (lambda value: isinstance(value, str) and ShaPattern.fullmatch(value) is not None, "小文字 40 桁の sha"),
    "count": (is_count, "1 以上の整数"),
    "flag": (lambda value: isinstance(value, bool), "true か false"),
    "true": (lambda value: value is True, "true(偽なら書かない)"),
    "version": (lambda value: type(value) is int and value == 1, "1"),
    "marked_text": (
        is_marked_text,
        "空でない文字列(用語の印は [[表示|用語の id]]。` の中に印の形を書かない・` の外に印でない [[ / ]] を書かない・"
        "閉じていない ` の後ろはコードにならず、そこの [[ / ]] も ` の外として数える)",
    ),
}

Text = Scalar("text")
Heading = Scalar("heading")
UserText = Scalar("user_text")
Id = Scalar("id")
Sha = Scalar("sha")
Count = Scalar("count")
MarkedText = Scalar("marked_text")

# 技法・phase・やりとりの種類・方式・やりとりの状態・技術の節の状態・注意メモの種類・手順の重さ・流れ図のカードの絵の語彙。ページの表(固定スクリプトの
# 核の `Vocabulary`)と同じキーの集合で、`pr-explain-core-cases.sh` が突き合わせる。やりとりの状態と技術の節の状態は、
# 省けば前からあって変えていないもの。
Techniques = ("boundary", "equivalence", "error", "state", "regression", "idempotence", "type")
Phases = ("prep", "core", "hard", "revise", "fin")
MessageKinds = ("cmd", "qry", "evt")
Vias = ("call", "http", "state", "log", "exec", "file")
MessageStatuses = ("added", "changed", "removed")
PrimerStatuses = ("added", "changed")
RemarkKinds = ("caution", "memo", "rule", "spec", "history")
StepCosts = ("heavy", "skipped")
CardIcons = ("person", "widget", "store", "cache", "scan")

# 前後の組(振る舞いの変わったこと・増えた状況が同じ形で持つ)。これまでは 0 件でよく、これからは 1 件以上。
ImpactSides: dict[str, Field] = {
    "before": need(Many(Shape("ImpactLine"))),
    "after": need(Many(Shape("ImpactLine"), least=1)),
    "text": may(UserText),
}

# 根拠として挙げる仕様の場所(振る舞いの変わったこと・変わらないことが同じ形で持つ)。`locator` はファイルの中の位置を
# 見出しの言葉で書く(行番号は持たない)。
CitedSpec: dict[str, Field] = {
    "path": need(Text),
    "locator": need(UserText),
    "text": need(UserText),
}

# コミットの差分の行の範囲(注釈と機能の範囲が同じ形で持つ)。行番号はそのコミット時点の `side` の側(既定は変更後)。
DiffSpan: dict[str, Field] = {
    "path": need(Text),
    "side": may(Word(("new", "old"))),
    "start": need(Count),
    "end": need(Count),
}

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
        "actors": may(Many(Shape("Actor"))),
        "calls": need(Shape("Calls")),
        "commitStories": may(Many(Shape("CommitStory"))),
        "suites": may(Many(Shape("Suite"))),
        "tests": may(Many(Shape("Test"))),
        "impact": may(Shape("Impact")),
        "primers": may(Many(Variant("Primer"))),
        "terms": may(Many(Shape("Term"))),
        "quiz": may(Many(Variant("Question"))),
    },
    "Overview": {
        "title": need(Text),
        "lead": need(Text),
        "before": need(Many(Shape("Behavior"))),
        "after": need(Many(Shape("Behavior"), least=1)),
        "highlights": may(Many(Shape("Highlight"))),
    },
    "Behavior": {"text": need(Text), "message": may(Id)},
    "Impact": {
        "title": need(UserText),
        "lead": need(UserText),
        "changed": may(Shape("ImpactChange")),
        "tables": may(Many(Shape("SituationTable"))),
        "added": may(Many(Shape("AddedSituation"))),
        "kept": may(Many(Shape("KeptLine"))),
        "keptSpecs": may(Many(Shape("KeptSpec"))),
    },
    "ImpactChange": {
        **ImpactSides,
        "specs": may(Many(Shape("ChangedSpec"))),
        "relatedIssues": may(Many(Shape("RelatedIssue"))),
        "primers": may(Many(Id, distinct=True)),
    },
    "ImpactLine": {"text": need(UserText), "message": may(Id)},
    "SituationTable": {
        "label": need(UserText),
        "gist": may(UserText),
        "text": may(UserText),
        "rowHeads": need(Many(Shape("SituationRowHead"), least=1)),
        "columnHeads": need(Many(Shape("SituationColumnHead"), least=1)),
        "outcomes": need(Many(Shape("SituationOutcome"))),
    },
    "SituationRowHead": {"id": need(Id), "label": need(UserText), "note": may(UserText)},
    "SituationColumnHead": {"id": need(Id), "label": need(UserText)},
    "SituationOutcome": {
        "rowHead": need(Id),
        "columnHead": need(Id),
        "result": need(UserText),
        "was": may(UserText),
        "situation": may(UserText),
        "note": may(UserText),
        "tests": may(Many(Id, distinct=True)),
    },
    "AddedSituation": {
        "label": need(UserText),
        **ImpactSides,
        "tests": may(Many(Id, distinct=True)),
        "primers": may(Many(Id, distinct=True)),
    },
    "KeptLine": {"text": need(UserText), "tests": may(Many(Id, distinct=True))},
    # `shas` は地図と照合しない(地図を指す参照)。
    "ChangedSpec": {**CitedSpec, "shas": need(Many(Sha, least=1, distinct=True))},
    "KeptSpec": CitedSpec,
    "RelatedIssue": {"issue": need(Count), "text": need(UserText)},
    "Highlight": {"title": need(Heading), "text": need(Text), "go": need(Variant("Target"))},
    "Feature": {"id": need(Id), "label": need(Heading), "role": need(Text), "review": may(Many(Text))},
    "LayerRole": {"layer": need(Text), "role": need(Text)},
    "Concept": {
        "path": need(Text),
        "name": need(Heading),
        "role": need(Text),
        "feature": may(Id),
        "change": may(Text),
        "graph": may(Scalar("flag")),
        "icon": may(Word(CardIcons)),
    },
    # やりとりの端になる、concepts のファイルでないもの(人・外のサービス)。id は concepts の path と同じ綴りにしない
    # (`cross_collection_problems`)。
    "Actor": {"id": need(Id), "label": need(Heading), "role": need(Text), "icon": may(Word(CardIcons))},
    "Message": {
        "id": need(Id),
        "from": need(Text),
        "to": need(Text),
        "kind": need(Word(MessageKinds)),
        "name": need(Heading),
        "code": need(Text),
        "via": need(Word(Vias)),
        "payload": may(Text),
        "returns": may(Text),
        "status": may(Word(MessageStatuses)),
    },
    # `steps` は変更後の手順、`beforeSteps` は変更前の手順。どの手順も、ちょうど 1 つの対応(`stepChanges`)に属する
    # (`step_changes_problem`)。
    "Flow": {
        "id": need(Id),
        "label": need(Heading),
        "steps": need(Many(Id, least=1)),
        "gist": need(Text),
        "text": may(Text),
        "beforeSteps": need(Many(Id)),
        "stepChanges": need(Many(Shape("StepChange"), least=1)),
        "measure": may(Shape("Measure")),
    },
    # 変更前の手順と変更後の手順の対応。番号は 1 始まりで、status ごとに持つ側が決まる(`step_change_problem`)。
    "StepChange": {
        "status": may(Word(MessageStatuses)),
        "beforeStep": may(Count),
        "afterStep": may(Count),
        "beforeText": may(Text),
        "afterText": may(Text),
        "change": may(Text),
        "beforeCost": may(Word(StepCosts)),
        "afterCost": may(Word(StepCosts)),
    },
    "Measure": {"what": need(Text), "before": need(Text), "after": need(Text)},
    # 構成の前後の呼び出しの粒度の箱と線。箱と線をまたいで id は一意(`call_ids_problem`)。
    "Calls": {
        "boxes": need(Many(Shape("CallBox"))),
        "edges": need(Many(Shape("CallEdge"))),
        "gist": may(Text),
        "text": may(Text),
        "review": may(Many(Text)),
    },
    # 箱の名前は呼び出しの名前(識別子)なので、見出し(Heading)にしない。
    "CallBox": {
        "id": need(Id),
        "name": need(Text),
        "role": need(Text),
        "module": need(Text),
        "status": may(Word(MessageStatuses)),
        "was": may(Text),
        "now": may(Text),
    },
    "CallEdge": {
        "id": need(Id),
        "from": need(Id),
        "to": need(Id),
        "code": need(Text),
        "status": may(Word(MessageStatuses)),
        "was": may(Text),
        "now": may(Text),
    },
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
        "featureRanges": may(Many(Shape("FeatureRange"))),
    },
    "Note": {**DiffSpan, "text": need(Text)},
    # 範囲の行を 1 つでも含む hunk(消したファイルは本文)が、その機能になる(ページの `CommitDiff`)。
    "FeatureRange": {**DiffSpan, "feature": need(Id), "text": need(Text)},
    "Suite": {"id": need(Id), "label": need(Heading), "file": need(Text)},
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
    # `text` と `openingLine` はここが足す出力だけのキーなので、入力の形には無い。
    "Excerpt": {"path": need(Text), "start": need(Count), "end": need(Count), "emphasis": may(Many(Shape("LineRange")))},
    "Values": {"columns": need(Many(Text, least=1)), "rows": need(Many(Shape("Row")))},
    "Row": {"cells": need(Many(Text)), "boundary": may(Scalar("flag"))},
    "Parameter": {"name": need(Text), "type": need(Text), "text": need(MarkedText), "note": may(Text)},
    # `lineRange` は解説の sha の時点の行番号。`shas` は地図と照合しない(地図を指す参照)。
    "Occurrence": {"path": need(Text), "lineRange": may(Shape("LineRange")), "text": need(Text), "shas": may(Many(Sha, distinct=True))},
    "LineRange": {"start": need(Count), "end": need(Count)},
    # 用語の名前(`label`)は、継ぎ目のある複合語(`WebView`)や識別子を書くので見出し(Heading)にしない。
    "Term": {"id": need(Id), "label": need(Text), "text": need(Text)},
}

# クイズの問い(Question)の、kind をまたいで同じキー。題(`title`)は一覧に出す短い題で、highlights の `title` と同じく見出し。
QuestionFields: dict[str, Field] = {
    "id": need(Id),
    "title": need(Heading),
    "prompt": need(Text),
    "why": need(Text),
    "go": need(Many(Variant("Target"), least=1)),
}

# 技術の節(Primer)の、kind をまたいで同じキー。
PrimerFields: dict[str, Field] = {
    "id": need(Id),
    "category": need(Text),
    # 技術の名前は識別子や継ぎ目のある複合語を書くので、見出し(Heading)にしない。
    "label": need(Text),
    "gist": need(MarkedText),
    "passages": may(Many(Variant("Passage"))),
    "occurrences": need(Many(Shape("Occurrence"), least=1)),
    "seeAlso": may(Many(Id, distinct=True)),
}

# `kind` ごとに持つキー。他の kind のキーが混ざるのも、知らないキーとして落とす。Target はどの kind も、ページ
# (固定スクリプトの核の `Target`)がここと同じキーを読んで移る先にすることを `pr-explain-core-cases.sh` が確かめる。
# 同じキーは kind をまたいで同じ規則にする(`routes_under` が kind のキーを合わせて辿るため。`build-pr-explain-cases.sh` の
# 「どの Variant も、kind をまたいで同じキーは同じ規則を持つ」が確かめる)。
Variants: dict[str, dict[str, dict[str, Field]]] = {
    "Target": {
        "feature": {"id": need(Id)},
        "layer": {"layer": need(Text)},
        "file": {"path": need(Text)},
        "message": {"id": need(Id)},
        "flow": {"id": need(Id)},
        "callBox": {"id": need(Id)},
        "callEdge": {"id": need(Id)},
        "module": {"path": need(Text)},
        "stepChange": {"flow": need(Id), "stepChange": need(Count)},
    },
    "Primer": {
        "language": PrimerFields,
        "codebase": {
            **PrimerFields,
            "status": may(Word(PrimerStatuses)),
            "tests": may(Many(Id, distinct=True)),
            "flows": may(Many(Id, distinct=True)),
        },
    },
    # choice の `answer` は 1 始まりの番号。order の `items` は正しい順に書く。
    "Question": {
        "choice": {**QuestionFields, "options": need(Many(Text, least=4, distinct=True)), "answer": need(Count)},
        "yesno": {**QuestionFields, "holds": need(Scalar("flag"))},
        "order": {**QuestionFields, "items": need(Many(Text, least=2, distinct=True))},
    },
    "Passage": {
        "text": {"text": need(MarkedText)},
        "declaration": {"code": need(Text)},
        "parameters": {"parameters": need(Many(Shape("Parameter"), least=1))},
        "excerpt": {"excerpt": need(Shape("Excerpt"))},
        **{kind: {"text": need(MarkedText)} for kind in RemarkKinds},
    },
}


def span_problem(value: dict) -> str | None:
    """`start` 〜 `end` の範囲が逆向きでないかを見る(Note・FeatureRange・Excerpt・LineRange)。"""
    if value["end"] < value["start"]:
        return f"end({value['end']})が start({value['start']})より前"
    return None


def excerpt_length_problem(value: dict) -> str | None:
    """抜粋が上限の行数に収まっているかを見る。"""
    length = value["end"] - value["start"] + 1
    if length > MaxExcerptLines:
        return f"抜粋は {MaxExcerptLines} 行まで(今は {length} 行)"
    return None


def emphasis_problem(value: dict) -> str | None:
    """抜粋の強調の範囲が、抜粋の行の中に収まっているかを見る。"""
    is_outside = lambda span: span["start"] < value["start"] or span["end"] > value["end"]
    outside = [index for index, span in enumerate(value.get("emphasis", [])) if is_outside(span)]
    if outside:
        return f"emphasis{outside} が抜粋の {value['start']}-{value['end']} 行目の外にある"
    return None


def cells_problem(value: dict) -> str | None:
    """値の表の各行が列と同じ数のセルを持つかを見る。"""
    width = len(value["columns"])
    uneven = [index for index, row in enumerate(value["rows"]) if len(row["cells"]) != width]
    if uneven:
        return f"rows{uneven} のセルの数が columns の {width} 個と違う"
    return None


def repeated_head_ids_problem(table: dict) -> str | None:
    """状況の表の見出しの id が、軸ごとに一意かを見る。行と列は別の名前空間なので、行と列で同じ id は書ける。"""
    problems = []
    for axis in ("rowHeads", "columnHeads"):
        twice = repeated([head["id"] for head in table[axis]])
        problems += [f"{axis} の id {', '.join(twice)} が 2 回以上ある"] if twice else []
    return " / ".join(problems) if problems else None


def outcome_grid_problem(table: dict) -> str | None:
    """状況の表のマスが、行の見出し × 列の見出しの組み合わせをちょうど 1 つずつ埋めているかを見る。

    @returns 見出しに無いマス・欠けた組み合わせ・2 回書いた組み合わせの説明。揃っていれば None
    """
    rows = [head["id"] for head in table["rowHeads"]]
    columns = [head["id"] for head in table["columnHeads"]]
    pairs = [(outcome["rowHead"], outcome["columnHead"]) for outcome in table["outcomes"]]
    spelled = lambda found: ", ".join(f"{row} × {column}" for row, column in found)
    stray = [pair for pair in pairs if pair[0] not in rows or pair[1] not in columns]
    missing = [(row, column) for row in rows for column in columns if (row, column) not in pairs]
    twice = repeated(pairs)
    problems = [
        *([f"見出しに無いマス {spelled(stray)}"] if stray else []),
        *([f"マス {spelled(missing)} が無い"] if missing else []),
        *([f"マス {spelled(twice)} を 2 回書いている"] if twice else []),
    ]
    return " / ".join(problems) if problems else None


def same_was_problem(outcome: dict) -> str | None:
    """マスの「これまで」(`was`)が今の結果(`result`)と同じでないかを見る。同じなら変わっていないので書かない。"""
    if outcome.get("was") == outcome["result"]:
        return "was が result と同じ(変わっていないマスには was を書かない)"
    return None


def same_sides_problem(value: dict) -> str | None:
    """前後(`before` / `after`)の文の並びがまったく同じでないかを見る。比べるのは文だけで、やりとり(`message`)は見ない。

    一部の行が同じなのは通す。変わらない行を文脈として並べるのは正しいため。
    """
    texts = lambda lines: [line["text"] for line in lines]
    if texts(value["before"]) == texts(value["after"]):
        return "before と after の文の並びが同じ(変わっていない)"
    return None


def repeated_specs_problem_in(value: dict, key: str) -> str | None:
    """`value[key]` の仕様の場所に、パスと位置(`path`・`locator`)の組を 2 回書いていないかを見る。書いていなければ None。"""
    twice = repeated([(spec["path"], spec["locator"]) for spec in value.get(key, [])])
    if twice:
        return f"{key} の {', '.join(f'{path}「{locator}」' for path, locator in twice)} を 2 回以上書いている"
    return None


def repeated_specs_problem(changed: dict) -> str | None:
    """変わったことの仕様の場所に、パスと位置の組を 2 回書いていないかを見る。"""
    return repeated_specs_problem_in(changed, "specs")


def repeated_issue_numbers_problem(changed: dict) -> str | None:
    """変わったことの関連 Issue に、同じ番号を 2 回書いていないかを見る。"""
    twice = repeated([related["issue"] for related in changed.get("relatedIssues", [])])
    if twice:
        return f"relatedIssues の Issue {', '.join(f'#{issue}' for issue in twice)} を 2 回以上書いている"
    return None


def kept_specs_problem(impact: dict) -> str | None:
    """変わらないことの仕様の場所が、行(`kept`)のある節にだけ書かれ、パスと位置の組を 2 回書いていないかを見る。

    行が 0 件なら変わらないことの節を作らないので、仕様の場所だけを書いても描かれない。
    """
    if "keptSpecs" not in impact:
        return None
    if not impact.get("kept"):
        return "keptSpecs は kept を 1 行以上書いたときだけ書く(行の無い変わらないことの節は作らない)"
    return repeated_specs_problem_in(impact, "keptSpecs")


def call_sides_problem(value: dict) -> str | None:
    """呼び出しの箱・線の前後の一言(`was` / `now`)が状態に合っているかを見る。増えたもの(added)は now だけ、消えたもの
    (removed)は was だけを持つ。変えたもの(changed)は違う 2 つを持つ。変えていないもの(status なし)は now を持ち、was は
    書くなら now と違う。
    """
    status = value.get("status")
    has_was = "was" in value
    has_now = "now" in value
    if status == "added":
        return None if has_now and not has_was else "増えたもの(added)は now だけを書く"
    if status == "removed":
        return None if has_was and not has_now else "消えたもの(removed)は was だけを書く"
    if not has_now:
        return "変えたもの(changed)と変えていないものは now を書く"
    if status == "changed" and not has_was:
        return "変えたもの(changed)は was も書く"
    if value.get("was") == value["now"]:
        return "was が now と同じ(前後で同じ一言なら was を書かない)"
    return None


def call_ids_problem(calls: dict) -> str | None:
    """箱と線の id が、箱と線をまたいで一意かを見る。構成の前後は、箱と線を id 1 つで選ぶ(選択と左の一覧)ため。"""
    boxes_and_edges = calls["boxes"] + calls["edges"]
    twice = repeated([item["id"] for item in boxes_and_edges])
    if twice:
        return f"箱と線の id {', '.join(twice)} が 2 回以上ある(箱と線をまたいで一意にする)"
    return None


def call_ends_problem(calls: dict) -> str | None:
    """線の端が、その線のある側の箱かを見る。変更後にある線(added・changed・status なし)の端は消えた箱(removed)でなく、
    変更前にある線(removed・changed・status なし)の端は増えた箱(added)でない。端が boxes に無い線は参照の検査に任せる。
    """
    status_of = {box["id"]: box.get("status") for box in calls["boxes"]}
    ends_of = lambda edge: [end for end in (edge["from"], edge["to"]) if end in status_of]
    stray_ends_of = lambda absent, gone: [
        f"{edge['id']} の {end}"
        for edge in calls["edges"]
        if edge.get("status") != gone
        for end in ends_of(edge)
        if status_of[end] == absent
    ]
    after = stray_ends_of("removed", "removed")
    before = stray_ends_of("added", "added")
    problems = [
        *([f"変更後にある線の端が消えた箱({', '.join(after)})"] if after else []),
        *([f"変更前にある線の端が増えた箱({', '.join(before)})"] if before else []),
    ]
    return " / ".join(problems) if problems else None


# 対応の status ごとに持つ番号(変更前の手順の番号・変更後の手順の番号)。省いたもの(そのまま)は changed と同じく両方。
StepSides = {"added": (False, True), "removed": (True, False), "changed": (True, True), None: (True, True)}


def step_change_problem(value: dict) -> str | None:
    """手順の対応 1 つが、status に合った番号と説明を持つかを見る。added は afterStep だけ、removed は beforeStep だけ、changed と
    省いたものは両方を持つ。`beforeText` / `beforeCost` は beforeStep があるとき、`afterText` / `afterCost` は afterStep が
    あるときだけ書ける。`change` は status があるときだけ書ける。
    """
    status = value.get("status")
    has_before, has_after = StepSides[status]
    if ("beforeStep" in value, "afterStep" in value) != (has_before, has_after):
        return "added は afterStep だけ、removed は beforeStep だけ、changed と省いたもの(そのまま)は両方を書く"
    stray_before = [key for key in ("beforeText", "beforeCost") if key in value and not has_before]
    stray_after = [key for key in ("afterText", "afterCost") if key in value and not has_after]
    if stray_before or stray_after:
        return f"{', '.join(stray_before + stray_after)} は、その側の手順の番号(beforeStep / afterStep)があるときだけ書く"
    if "change" in value and status is None:
        return "change は status のある対応(この PR で増えた・消えた・変わった手順)にだけ書く"
    return None


def numbering_problem(numbers: list[int], count: int, side: str) -> str | None:
    """対応に書いた一方の側の番号が、1〜count をちょうど 1 回ずつ、書いた順に増えるように使っているかを見る。"""
    if sorted(numbers) != list(range(1, count + 1)):
        return f"{side} は 1〜{count} をちょうど 1 回ずつ使う(今は {numbers})"
    if numbers != sorted(numbers):
        return f"{side} は書いた順に増えていく(今は {numbers})"
    return None


def step_changes_problem(flow: dict) -> str | None:
    """流れの対応が、変更前と変更後の手順をちょうど 1 回ずつ、手順の順に指しているかを見る。そのまま(status なし)の対応は、
    前後で同じやりとりを指す。
    """
    changes = flow["stepChanges"]
    before = [change["beforeStep"] for change in changes if "beforeStep" in change]
    after = [change["afterStep"] for change in changes if "afterStep" in change]
    problems = [
        problem
        for problem in (numbering_problem(before, len(flow["beforeSteps"]), "beforeStep"), numbering_problem(after, len(flow["steps"]), "afterStep"))
        if problem
    ]
    if problems:
        return " / ".join(problems)
    is_moved = lambda change: flow["beforeSteps"][change["beforeStep"] - 1] != flow["steps"][change["afterStep"] - 1]
    moved = [index for index, change in enumerate(changes) if "status" not in change and is_moved(change)]
    if moved:
        return f"stepChanges{moved} はそのまま(status なし)なのに、前後のやりとりが違う(違うなら changed にする)"
    return None


def choice_problem(question: dict) -> str | None:
    """4 択の選択肢が 4 つまでで、答えの番号が選択肢の数を超えていないかを見る(4 つ以上は配列の規則が見る)。"""
    count = len(question["options"])
    if count > 4:
        return f"options は 4 つ(今は {count} つ)"
    if question["answer"] > count:
        return f"answer({question['answer']})が options の数({count})を超える"
    return None


# キーごとの形が合ったオブジェクトに、キーをまたいで当てる規則。Variant は `<名前>.<kind>` のキーで当てる。
CrossChecks: dict[str, tuple[Callable[[dict], str | None], ...]] = {
    "Note": (span_problem,),
    "FeatureRange": (span_problem,),
    "Excerpt": (span_problem, excerpt_length_problem, emphasis_problem),
    "LineRange": (span_problem,),
    "Values": (cells_problem,),
    "SituationTable": (repeated_head_ids_problem, outcome_grid_problem),
    "SituationOutcome": (same_was_problem,),
    "Impact": (kept_specs_problem,),
    "ImpactChange": (same_sides_problem, repeated_specs_problem, repeated_issue_numbers_problem),
    "AddedSituation": (same_sides_problem,),
    "Calls": (call_ids_problem, call_ends_problem),
    "CallBox": (call_sides_problem,),
    "CallEdge": (call_sides_problem,),
    "StepChange": (step_change_problem,),
    "Flow": (step_changes_problem,),
    "Question.choice": (choice_problem,),
}

# 一意でなければならない値(トップの一覧と、その中のキー)。
UniqueKeys = (
    ("features", "id"),
    ("layerRoles", "layer"),
    ("concepts", "path"),
    ("messages", "id"),
    ("flows", "id"),
    ("actors", "id"),
    ("commitStories", "sha"),
    ("suites", "id"),
    ("tests", "id"),
    ("primers", "id"),
    ("terms", "id"),
    ("terms", "label"),
    ("quiz", "id"),
)

# クイズの答えの鍵の元にする問いのキー(無いキーは空の配列)。ページの `Quiz.KeyParts` と同じで、`pr-explain-core-cases.sh` が突き合わせる。
# ページは答え・今の問い・途中の並びをこの組の鍵で覚えるので、重なると 2 問が答えを共有する。
QuizKeyParts = ("prompt", "options", "items")


class Reference(NamedTuple):
    """解説の中の参照。`source` の値が、一覧 `collection` のどれかの `key`(`also` があれば、その一覧のどれかのキーでもよい)と一致する。

    `source` はトップからの道筋で、`[]` は配列の各要素を指す。`collection` もトップからの一覧の道筋(`calls.boxes`)で、
    `[]` は付けない。`also` は、ほかに照合する一覧とキーの組(道筋の書き方は `collection` と同じ)。
    """

    source: str
    collection: str
    key: str
    also: tuple[tuple[str, str], ...] = ()


References = (
    Reference("messages[].from", "concepts", "path", (("actors", "id"),)),
    Reference("messages[].to", "concepts", "path", (("actors", "id"),)),
    Reference("flows[].steps[]", "messages", "id"),
    Reference("flows[].beforeSteps[]", "messages", "id"),
    Reference("commitStories[].flows[]", "flows", "id"),
    Reference("commitStories[].featureRanges[].feature", "features", "id"),
    Reference("calls.boxes[].module", "concepts", "path"),
    Reference("calls.edges[].from", "calls.boxes", "id"),
    Reference("calls.edges[].to", "calls.boxes", "id"),
    Reference("overview.before[].message", "messages", "id"),
    Reference("overview.after[].message", "messages", "id"),
    Reference("commitStories[].before[].message", "messages", "id"),
    Reference("commitStories[].after[].message", "messages", "id"),
    Reference("tests[].suite", "suites", "id"),
    Reference("tests[].covers[]", "messages", "id"),
    Reference("tests[].targets[]", "concepts", "path"),
    Reference("concepts[].feature", "features", "id"),
    Reference("impact.changed.before[].message", "messages", "id"),
    Reference("impact.changed.after[].message", "messages", "id"),
    Reference("impact.changed.primers[]", "primers", "id"),
    Reference("impact.tables[].outcomes[].tests[]", "tests", "id"),
    Reference("impact.added[].before[].message", "messages", "id"),
    Reference("impact.added[].after[].message", "messages", "id"),
    Reference("impact.added[].tests[]", "tests", "id"),
    Reference("impact.added[].primers[]", "primers", "id"),
    Reference("impact.kept[].tests[]", "tests", "id"),
    Reference("primers[].seeAlso[]", "primers", "id"),
    Reference("primers[].tests[]", "tests", "id"),
    Reference("primers[].flows[]", "flows", "id"),
)

# Target の kind のうち、解説の中の一覧を指すものと、その一覧の道筋(layer / file / module は地図を指す参照。stepChange は
# 流れの中の番号なので `target_problems` が見る)。
TargetCollections = {"feature": "features", "message": "messages", "flow": "flows", "callBox": "calls.boxes", "callEdge": "calls.edges"}


def keep_first_or_mark(pairs: list[tuple[str, object]]) -> dict | Duplicated:
    """`json.loads` の `object_pairs_hook`。キーが重複していれば `Duplicated` に置き換える。"""
    twice = tuple(repeated([key for key, _ in pairs]))
    return Duplicated(twice) if twice else dict(pairs)


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
        return variant_problems(value, rule.name, where)
    return object_problems(value, rule.name, where)


def list_problems(value: object, rule: Many, where: str) -> list[str]:
    """配列の規則(件数・重複・各要素)に合わない理由を集める。"""
    if not isinstance(value, list):
        return [f"{where}: 配列で書く"]
    if len(value) < rule.least:
        return [f"{where}: {rule.least} 件以上書く"]
    items = [problem for index, item in enumerate(value) for problem in value_problems(item, rule.item, f"{where}[{index}]")]
    has_twice = rule.distinct and len({json.dumps(item) for item in value}) != len(value)
    return items + ([f"{where}: 同じ値を 2 回書かない"] if has_twice else [])


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
    return problems if problems else crossed_problems(value, name, where)


def crossed_problems(value: dict, name: str, where: str) -> list[str]:
    """キーごとの形が合ったオブジェクトに、キーをまたぐ規則(`CrossChecks` の `name`)を当てた違反を集める。"""
    crossed = [check(value) for check in CrossChecks.get(name, ())]
    return [f"{where}: {problem}" for problem in crossed if problem]


def variant_problems(value: object, name: str, where: str) -> list[str]:
    """`Variants` の名前の、`kind` で形が決まるオブジェクトに合わない理由を集める。kind ごとのキーが合っていれば、キーをまたぐ規則
    (`CrossChecks` の `<名前>.<kind>`)も当てる。
    """
    if not isinstance(value, dict):
        return [f"{where}: オブジェクトで書く"]
    variants = Variants[name]
    kind = value.get("kind")
    if kind not in variants:
        return [f"{where}.kind: {' / '.join(variants)} のどれか(今は {json.dumps(kind, ensure_ascii=False)})"]
    fields = {"kind": need(Word(tuple(variants))), **variants[kind]}
    problems = fields_problems(value, fields, where)
    return problems if problems else crossed_problems(value, f"{name}.{kind}", where)


def cross_collection_problems(explain: dict) -> list[str]:
    """一覧をまたぐ形の違反を集める。アクターの id が concepts の path と同じ綴りか、流れの変更前の手順に増えた(added)やりとり・
    変更後の手順に消えた(removed)やりとりがあるか、前後が同じやりとりの対応の状態がやりとりの状態と合わないか(changed のやりとり
    なら changed、そうでなければ省く)を見る。messages に無いやりとりは参照の検査に任せる。

    @param explain キーごとの形が合った解説(手順の番号は範囲に収まっている)
    """
    paths = {concept["path"] for concept in explain.get("concepts", [])}
    actors = [f"actors[{index}].id: {actor['id']} が concepts の path と同じ" for index, actor in enumerate(explain.get("actors", [])) if actor["id"] in paths]
    status_of = {message["id"]: message.get("status") for message in explain.get("messages", [])}
    placed = lambda ids, status: [step for step in ids if step in status_of and status_of[step] == status]
    problems = []
    for index, flow in enumerate(explain.get("flows", [])):
        added = placed(flow["beforeSteps"], "added")
        removed = placed(flow["steps"], "removed")
        problems += [f"flows[{index}].beforeSteps: 増えたやりとり({', '.join(added)})は変更前の手順に書かない"] if added else []
        problems += [f"flows[{index}].steps: 消えたやりとり({', '.join(removed)})は変更後の手順に書かない"] if removed else []
        problems += same_message_problems(flow, status_of, f"flows[{index}]")
    return actors + problems


def same_message_problems(flow: dict, status_of: dict, where: str) -> list[str]:
    """前後が同じやりとりの対応の状態が、そのやりとりの状態に合わないものを集める。"""
    message_of = lambda change: flow["steps"][change["afterStep"] - 1]
    is_same = lambda change: "beforeStep" in change and "afterStep" in change and flow["beforeSteps"][change["beforeStep"] - 1] == message_of(change)
    expected_of = lambda change: "changed" if status_of[message_of(change)] == "changed" else None
    return [
        f"{where}.stepChanges[{index}]: 前後が同じやりとり({message_of(change)})の対応は、やりとりの status に合わせる(changed なら changed、そうでなければ省く)"
        for index, change in enumerate(flow["stepChanges"])
        if is_same(change) and message_of(change) in status_of and change.get("status") != expected_of(change)
    ]


def uniqueness_problems(explain: dict) -> list[str]:
    """一意でなければならない値の重複を集める。

    @param explain 形の検査を通った解説
    """
    problems = []
    for collection, key in UniqueKeys:
        twice = repeated([item[key] for item in explain.get(collection, [])])
        problems += [f"{collection}[].{key}: {value} が 2 回以上ある" for value in twice]
    return problems + quiz_key_problems(explain.get("quiz", []))


def quiz_key_problems(questions: list[dict]) -> list[str]:
    """答えの鍵の元の組(`QuizKeyParts`)が同じ問いを集める。"""
    key_of = lambda question: json.dumps([question.get(part, []) for part in QuizKeyParts], ensure_ascii=False)
    keys = [key_of(question) for question in questions]
    return [
        f"quiz[]: 問いの文・選択肢・並べる項目が同じ問いが 2 回以上ある({', '.join(question['id'] for question in questions if key_of(question) == key)})"
        for key in repeated(keys)
    ]


def shape_problems(explain: object) -> list[str]:
    """解説の形の違反を集める。"""
    problems = value_problems(explain, Shape("Explain"), "explain")
    return problems if problems else uniqueness_problems(explain) + cross_collection_problems(explain)


def fields_of(rule: Shape | Variant) -> dict[str, Field]:
    """オブジェクトの規則が持つキー。Variant は kind のキーを kind の順に合わせる(同じキーは kind をまたいで同じ規則)。"""
    if isinstance(rule, Shape):
        return Shapes[rule.name]
    return {key: field for fields in Variants[rule.name].values() for key, field in fields.items()}


def routes_under(rule: object, route: str) -> list[tuple[str, object, bool]]:
    """規則の下にある道筋を、外側から書いた順に集める(`Shapes` と `Variants` を辿る)。判定表と、印・抜粋・Target の道筋を導く
    検査(`term_mark_problems`・`with_read_excerpts`・`reference_problems`)が使う。

    @param rule `Field` の `value` に書く規則
    @param route その規則の道筋(`impact` など)。配列の中へ進む段には `[]` を付ける
    @returns `(道筋, 配列なら要素の規則, 配列か)` の並び
    """
    is_many = isinstance(rule, Many)
    inner = rule.item if is_many else rule
    if not isinstance(inner, (Shape, Variant)):
        return [(route, inner, is_many)]
    prefix = f"{route}[]" if is_many else route
    nested = [found for key, field in fields_of(inner).items() for found in routes_under(field.value, f"{prefix}.{key}")]
    return [(route, inner, is_many), *nested]


def routes_with(rule: object) -> list[str]:
    """解説(Explain)の下で、規則が `rule` の道筋を、外側から書いた順に集める。配列なら要素の規則で見る。"""
    return [route for key, field in Shapes["Explain"].items() for route, inner, _ in routes_under(field.value, key) if inner == rule]


class Step(NamedTuple):
    """道筋(`a[].b`)の 1 段。`key` はキー、`is_each` は配列の各要素へ進むか、`where` は起点からそのキーまでの綴り。"""

    key: str
    is_each: bool
    where: str

    def item_where(self, index: int) -> str:
        """配列の `index` 番目の要素までの綴り。"""
        return f"{self.where}[{index}]"


def step_of(step: str, where: str) -> Step:
    """道筋の 1 段を読む(`[]` で終わる段は配列の各要素へ進む)。

    @param where 起点からその段の手前までの綴り
    """
    key = step.removesuffix("[]")
    return Step(key, step.endswith("[]"), f"{where}.{key}" if where else key)


def values_at(value: object, route: list[str], where: str) -> list[tuple[str, object]]:
    """道筋の先にある値を、道筋の綴りと一緒に集める。途中で欠けているものは飛ばす。

    @param value 道筋の起点
    @param route `.` で割った道筋
    @param where 起点までの綴り
    """
    if not route:
        return [(where, value)]
    step = step_of(route[0], where)
    if step.key not in value:
        return []
    inner = value[step.key]
    if not step.is_each:
        return values_at(inner, route[1:], step.where)
    return [found for index, item in enumerate(inner) for found in values_at(item, route[1:], step.item_where(index))]


def target_routes() -> list[str]:
    """解説(Explain)の下で Target を置く道筋。配列の Target は `[]` を付けて、各要素を指す道筋にする。"""
    return [
        f"{route}[]" if is_many else route
        for key, field in Shapes["Explain"].items()
        for route, inner, is_many in routes_under(field.value, key)
        if inner == Variant("Target")
    ]


def target_problems(where: str, go: dict, explain: dict) -> list[str]:
    """Target 1 つの参照切れを集める。解説の中の一覧を指す kind(`TargetCollections`)と、流れの中の対応を指す stepChange だけを見る。

    @param where Target までの道筋の綴り
    @param explain 形の検査を通った解説
    """
    if go["kind"] == "stepChange":
        return step_change_target_problems(where, go, explain)
    collection = TargetCollections.get(go["kind"])
    if collection is None or go["id"] in known_values(explain, collection, "id"):
        return []
    return [f"{where}.id: {go['id']} が {collection} に無い"]


def step_change_target_problems(where: str, go: dict, explain: dict) -> list[str]:
    """stepChange の Target の流れが flows にあり、番号がその流れの対応の数を超えていないかを見る。"""
    flows = {flow["id"]: flow for flow in explain.get("flows", [])}
    if go["flow"] not in flows:
        return [f"{where}.flow: {go['flow']} が flows に無い"]
    count = len(flows[go["flow"]]["stepChanges"])
    if go["stepChange"] > count:
        return [f"{where}.stepChange: {go['stepChange']} が流れ {go['flow']} の stepChanges の数({count})を超える"]
    return []


def lists_of(reference: Reference) -> list[tuple[str, str]]:
    """参照を照合する一覧とキーの組(`collection` と `also`)。"""
    return [(reference.collection, reference.key), *reference.also]


def missing_place_of(reference: Reference) -> str:
    """参照切れの報告の「〜に無い」(一覧が 2 つ以上なら「a にも b にも無い」)。"""
    collections = [collection for collection, _ in lists_of(reference)]
    if len(collections) == 1:
        return f"{collections[0]} に無い"
    return f"{' にも '.join(collections)} にも無い"


def known_values(explain: dict, collection: str, key: str) -> set:
    """一覧の道筋(`calls.boxes`)の各要素の、そのキーの値の集合。"""
    return {item[key] for _, item in values_at(explain, f"{collection}[]".split("."), "")}


def reference_problems(explain: dict) -> list[str]:
    """解説の中の参照切れ(Target は置いたすべての道筋)と、未実装のテストが持てないキーを集める。

    @param explain 形の検査を通った解説
    """
    problems = [
        f"{where}: {value} が {missing_place_of(reference)}"
        for reference in References
        for where, value in values_at(explain, reference.source.split("."), "")
        if not any(value in known_values(explain, collection, key) for collection, key in lists_of(reference))
    ]
    targets = [
        problem
        for route in target_routes()
        for where, go in values_at(explain, route.split("."), "")
        for problem in target_problems(where, go, explain)
    ]
    todo_with_code = [
        f"tests[{index}]: todo のテストは commit も excerpt も持たない"
        for index, test in enumerate(explain.get("tests", []))
        if is_todo_with_code(test)
    ]
    return problems + targets + todo_with_code + term_mark_problems(explain)


def term_mark_problems(explain: dict) -> list[str]:
    """用語の印が terms に無いものと、どの印からも指されない用語を集める。

    @param explain 形の検査を通った解説
    """
    known = {term["id"] for term in explain.get("terms", [])}
    marks = [
        (where, term_id)
        for route in routes_with(MarkedText)
        for where, text in values_at(explain, route.split("."), "")
        for _, term_id in TermMarkPattern.findall(text)
    ]
    dangling = [f"{where}: 用語の印 {term_id} が terms に無い" for where, term_id in marks if term_id not in known]
    marked = {term_id for _, term_id in marks}
    unmarked = [f"terms[{index}]: 用語 {term['id']} を指す印が無い" for index, term in enumerate(explain.get("terms", [])) if term["id"] not in marked]
    return dangling + unmarked


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


def read_excerpt(repo: str, sha: str, excerpt: dict) -> tuple[dict, None] | tuple[None, str]:
    """抜粋の範囲の中身を読む。

    @returns 読めたら、中身(`text`。行を改行でつないだもの)を足した抜粋と None。埋め込みの中から始まるなら、開いた行
        (`openingLine`)も足す。ファイルが無い・範囲が収まらないときは、None と読めなかった理由
    """
    lines = lines_at(repo, sha, excerpt["path"])
    if lines is None:
        return None, f"{excerpt['path']} は {sha} に無い"
    if excerpt["end"] > len(lines):
        return None, f"{excerpt['path']} は {len(lines)} 行で、{excerpt['start']}-{excerpt['end']} 行目は収まらない"
    filled = {**excerpt, "text": "\n".join(lines[excerpt["start"] - 1:excerpt["end"]])}
    opening = opening_lines(excerpt["path"], lines)[excerpt["start"] - 1]
    return (filled if opening is None else {**filled, "openingLine": opening}), None


def read_along(value: object, route: str, read: Callable[[dict, str], tuple[dict, list[str]]]) -> tuple[object, list[str]]:
    """道筋の先の抜粋を `read` で読み直した写しと、読めなかった違反を返す。途中で欠けているものはそのまま残す。

    @param route 解説の起点からの道筋(`[]` で終わる段は配列の各要素へ進む)
    @param read 抜粋と、その道筋の綴りを受け取り、中身を足した抜粋と違反を返す
    """

    def walk(value: object, steps: list[str], where: str) -> tuple[object, list[str]]:
        if not steps:
            return read(value, where)
        step = step_of(steps[0], where)
        if step.key not in value:
            return value, []
        if not step.is_each:
            inner, problems = walk(value[step.key], steps[1:], step.where)
            return {**value, step.key: inner}, problems
        read_items = [walk(item, steps[1:], step.item_where(index)) for index, item in enumerate(value[step.key])]
        return {**value, step.key: [item for item, _ in read_items]}, [problem for _, problems in read_items for problem in problems]

    return walk(value, route.split("."), "")


def with_read_excerpts(explain: dict, repo: str) -> tuple[dict, list[str]]:
    """抜粋(Excerpt を指すすべての道筋)に中身(`text`)と、埋め込みの中から始まるものには開いた行(`openingLine`)を足した
    解説と、読めなかった抜粋の違反を返す。抜粋の無い解説は、キーの順まで同じまま返す。

    @param explain 形と参照の検査を通った解説
    @param repo 解説時点の sha を持つリポジトリ
    """
    sha = explain["sha"]
    if git(repo, "cat-file", "-e", f"{sha}^{{commit}}").returncode != 0:
        return explain, [f"sha {sha} がこのリポジトリに無い(解説時点の head を push・fetch してから)"]

    def read(excerpt: dict, where: str) -> tuple[dict, list[str]]:
        filled_excerpt, problem = read_excerpt(repo, sha, excerpt)
        return (excerpt, [f"{where}: {problem}"]) if filled_excerpt is None else (filled_excerpt, [])

    def read_route(sofar: tuple[dict, list[str]], route: str) -> tuple[dict, list[str]]:
        written, problems = read_along(sofar[0], route, read)
        return written, sofar[1] + problems

    return reduce(read_route, routes_with(Shape("Excerpt")), (explain, []))


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
    written, code = with_read_excerpts(explain, repo)
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
