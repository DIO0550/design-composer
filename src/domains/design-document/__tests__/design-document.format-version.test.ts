import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("古い版のドキュメントを現在の形式にすると formatVersion が現在の値になる", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 0, minor: 3 },
  });

  expect(
    DesignDocument.withCurrentFormatVersion(document).formatVersion,
  ).toEqual({ major: 1, minor: 0 });
});

test("現在の形式にしたドキュメントは compatible と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 0, minor: 3 },
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
    formatVersion: { major: 0, minor: 3 },
    artboards,
  });

  expect(DesignDocument.withCurrentFormatVersion(document).artboards).toEqual(
    artboards,
  );
});

test("現在の形式にしても元のドキュメントは変わらない", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 0, minor: 3 },
  });

  DesignDocument.withCurrentFormatVersion(document);

  expect(document.formatVersion).toEqual({ major: 0, minor: 3 });
});
