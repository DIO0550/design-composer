import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "panel", type: "Box", props: { layout: "row" } },
          { name: "home-card", ref: "card" },
        ],
      },
    ],
  });
}

test("artboard は自分の幅と高さを持つ fixed の Box として読める", () => {
  const props = Option.unwrap(
    DesignDocument.boxPropsOf(setupDocument(), "home"),
  );

  expect(props).toMatchObject({
    widthMode: "fixed",
    width: 375,
    heightMode: "fixed",
    height: 812,
  });
});

test("Box のノードは書いていない prop を既定で補って読める", () => {
  const props = Option.unwrap(
    DesignDocument.boxPropsOf(setupDocument(), "panel"),
  );

  expect(props).toMatchObject({ layout: "row", align: "stretch" });
});

test("Text のノードは Box として読めない", () => {
  expect(DesignDocument.boxPropsOf(setupDocument(), "title")).toEqual(
    Option.none,
  );
});

test("部品インスタンスは Box として読めない", () => {
  expect(DesignDocument.boxPropsOf(setupDocument(), "home-card")).toEqual(
    Option.none,
  );
});

test("ドキュメントに無い名前は Box として読めない", () => {
  expect(DesignDocument.boxPropsOf(setupDocument(), "missing")).toEqual(
    Option.none,
  );
});
