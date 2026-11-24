"""モデルから受け取った JSON を、記録可能な UTF-8 データに限定する。"""

import json

from experiment import encoded


def decode_answer(raw):
    """ハッシュに使う表現まで検証し、不正な回答を採点の前に分類する。"""
    try:
        value = json.loads(raw)
        encoded(value)
    except (TypeError, ValueError, RecursionError) as err:
        raise ValueError("回答を UTF-8 JSON として記録できません") from err
    return value
