import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

test("hex でない色トークンは、そのトークン名で prop を持たない invalid-color エラーになる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { brand: "red" } },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "invalid-color", nodeName: "brand" }),
  ]);
  expect(errors[0]).not.toHaveProperty("prop");
});

test("短縮形で書かれた色トークンは読み込み時に展開されるのでエラーにならない", () => {
  const tokens = Result.unwrap(
    TokenSet.fromJson(Json.create({ colors: { brand: "#FFF" } }, "tokens")),
  );

  const document = DesignDocument.create({ tokens });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("影の中の hex でない色は、影のトークン名と color の位置で invalid-color エラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "red" } },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "invalid-color",
      nodeName: "sm",
      prop: "color",
    }),
  ]);
});

test("グラデーションの中の hex でない stop の色は、トークン名と stop の添字の位置で invalid-color エラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      gradients: {
        hero: {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "#3b82f6", ratio: 0 },
            { color: "red", ratio: 1 },
          ],
        },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "invalid-color",
      nodeName: "hero",
      prop: "stops[1].color",
    }),
  ]);
});

test("1 つのグラデーションに hex でない stop の色が 2 つあれば、stop ごとに 1 件ずつ報告される", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      gradients: {
        hero: {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "red", ratio: 0 },
            { color: "#3b82f6", ratio: 0.5 },
            { color: "blue", ratio: 1 },
          ],
        },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({ nodeName: "hero", prop: "stops[0].color" }),
    expect.objectContaining({ nodeName: "hero", prop: "stops[2].color" }),
  ]);
});

test("影・グラデーションの中の短縮形の色は読み込み時に展開されるのでエラーにならない", () => {
  const tokens = Result.unwrap(
    TokenSet.fromJson(
      Json.create(
        {
          shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0008" } },
          gradients: {
            hero: {
              shape: "linear",
              angle: 90,
              stops: [
                { color: "#FFF", ratio: 0 },
                { color: "#000", ratio: 1 },
              ],
            },
          },
        },
        "tokens",
      ),
    ),
  );

  const document = DesignDocument.create({ tokens });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});
