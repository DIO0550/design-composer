import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DesignDocumentV1 } from "../index";

function setupRecord(formatVersion: string) {
  return {
    formatVersion,
    tokens: {},
    components: {},
    artboards: [],
  };
}

test("この版を名乗るデータモデルはドキュメントとして読み込める", () => {
  const decoded = Result.unwrap(
    DesignDocumentV1.fromJson(Json.create(setupRecord("1.0"))),
  );

  expect(decoded.formatVersion).toEqual({ major: 1, minor: 0 });
});

test("同じ major であれば新しい minor を名乗るデータモデルも読み込める", () => {
  const decoded = Result.unwrap(
    DesignDocumentV1.fromJson(Json.create(setupRecord("1.7"))),
  );

  expect(decoded.formatVersion).toEqual({ major: 1, minor: 7 });
});

test("違う major を名乗るデータモデルはこの版として読み込めない", () => {
  const decoded = DesignDocumentV1.fromJson(Json.create(setupRecord("0.9")));

  expect(decoded.ok ? [] : decoded.error).toEqual([
    expect.objectContaining({ kind: "invalid-type", path: "formatVersion" }),
  ]);
});

test("書き出した formatVersion は major.minor の文字列になる", () => {
  const document = Result.unwrap(
    DesignDocumentV1.fromJson(Json.create(setupRecord("1.7"))),
  );

  expect(DesignDocumentV1.toJson(document)).toMatchObject({
    formatVersion: "1.7",
  });
});
