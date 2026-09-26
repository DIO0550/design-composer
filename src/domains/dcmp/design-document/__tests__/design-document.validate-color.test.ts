import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

test("hex でない色トークンは、そのトークン名で invalid-color エラーになる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { brand: "red" } },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({ kind: "invalid-color", nodeName: "brand" }),
  ]);
});

test("短縮形で書かれた色トークンは読み込み時に展開されるのでエラーにならない", () => {
  const tokens = Result.unwrap(
    TokenSet.fromJson(Json.create({ colors: { brand: "#FFF" } }, "tokens")),
  );

  const document = DesignDocument.create({ tokens });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("影の中の hex でない色は invalid-color エラーにならない", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { brand: "#112233" },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "red" } },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});
