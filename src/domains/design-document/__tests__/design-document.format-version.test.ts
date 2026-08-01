import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { DesignDocument } from "../index";

test("新しい minor を名乗るドキュメントを現在の形式にすると formatVersion が現在の値になる", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
  });

  expect(
    DesignDocument.withCurrentFormatVersion(document).formatVersion,
  ).toEqual({ major: 1, minor: 0 });
});

test("現在の形式にしたドキュメントは compatible と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
  });

  expect(
    DesignDocument.compatibility(
      DesignDocument.withCurrentFormatVersion(document),
    ),
  ).toBe("compatible");
});

test("現在の形式にしても formatVersion 以外は変わらない", () => {
  const artboards = [{ name: "screen", width: 375, height: 812, children: [] }];
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
    artboards,
  });

  expect(DesignDocument.withCurrentFormatVersion(document).artboards).toEqual(
    artboards,
  );
});

test("現在の形式にしても元のドキュメントは変わらない", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
  });

  DesignDocument.withCurrentFormatVersion(document);

  expect(document.formatVersion).toEqual({ major: 1, minor: 9 });
});

test("自分の版と違う major を名乗るテキストはデコードできない", () => {
  const record = {
    formatVersion: "0.9",
    tokens: {},
    components: {},
    artboards: [],
  };

  const decoded = DesignDocument.fromJson(Json.create(record));

  expect(decoded.ok ? [] : decoded.error).toEqual([
    expect.objectContaining({ kind: "invalid-type", path: "formatVersion" }),
  ]);
});
