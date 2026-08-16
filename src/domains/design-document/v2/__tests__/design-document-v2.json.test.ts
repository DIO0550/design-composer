import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DesignDocumentV2 } from "../index";

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
    DesignDocumentV2.fromJson(Json.create(setupRecord("2.0"))),
  );

  expect(decoded.formatVersion).toEqual({ major: 2, minor: 0 });
});

test("同じ major であれば新しい minor を名乗るデータモデルも読み込める", () => {
  const decoded = Result.unwrap(
    DesignDocumentV2.fromJson(Json.create(setupRecord("2.7"))),
  );

  expect(decoded.formatVersion).toEqual({ major: 2, minor: 7 });
});

test("違う major を名乗るデータモデルはこの版として読み込めない", () => {
  const decoded = DesignDocumentV2.fromJson(Json.create(setupRecord("1.0")));

  expect(decoded.ok ? [] : decoded.error).toEqual([
    expect.objectContaining({ kind: "invalid-type", path: "formatVersion" }),
  ]);
});

test("書き出した formatVersion は major.minor の文字列になる", () => {
  const document = Result.unwrap(
    DesignDocumentV2.fromJson(Json.create(setupRecord("2.7"))),
  );

  expect(DesignDocumentV2.toJson(document)).toMatchObject({
    formatVersion: "2.7",
  });
});
