import { expect, test } from "vitest";
import { documentWithChildInEachArtboard } from "@/domains/__tests__/sample-document";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

test("artboard と、別の artboard の中のノードを同時に取り除ける", () => {
  const removed = Result.unwrap(
    DesignDocument.removeAll(documentWithChildInEachArtboard(), [
      "home",
      "about-title",
    ]),
  );

  expect(removed.artboards).toEqual([
    { name: "about", width: 360, height: 240, children: [] },
  ]);
});

test("artboard を先に、その中のノードを後に指すと、artboard ごと取り除く", () => {
  const removed = Result.unwrap(
    DesignDocument.removeAll(documentWithChildInEachArtboard(), [
      "home",
      "home-title",
    ]),
  );

  expect(DesignDocument.collectArtboardNames(removed)).toEqual(["about"]);
});

test("artboard の中のノードを先に、その artboard を後に指しても、artboard ごと取り除く", () => {
  const removed = Result.unwrap(
    DesignDocument.removeAll(documentWithChildInEachArtboard(), [
      "home-title",
      "home",
    ]),
  );

  expect(DesignDocument.collectArtboardNames(removed)).toEqual(["about"]);
});

test("同じ名前が 2 回並んでいても 1 回だけ取り除く", () => {
  const removed = DesignDocument.removeAll(documentWithChildInEachArtboard(), [
    "home-title",
    "home-title",
  ]);

  expect(Result.isOk(removed)).toBe(true);
});

test("artboard を先に、その孫のノードを後に指すと、artboard ごと取り除く", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "body",
            type: "Box",
            children: [{ name: "body-text", type: "Text" }],
          },
        ],
      },
    ],
  });

  const removed = Result.unwrap(
    DesignDocument.removeAll(document, ["home", "body-text"]),
  );

  expect(removed.artboards).toEqual([]);
});
