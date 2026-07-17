import { expect, test } from "vitest";
import { DesignDocument } from "../design-document";

test("ファイルの formatVersion がアプリと同じとき compatible と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 0 },
  });
  expect(DesignDocument.compatibility(document)).toBe("compatible");
});

test("ファイルの formatVersion の major がアプリより小さいとき needs-migration と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 0, minor: 9 },
  });
  expect(DesignDocument.compatibility(document)).toBe("needs-migration");
});

test("ファイルの formatVersion の major がアプリより大きいとき unsupported と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 99, minor: 0 },
  });
  expect(DesignDocument.compatibility(document)).toBe("unsupported");
});
