import { expect, test } from "vitest";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      "primary-button": {
        publicProps: { label: { node: "button-label", prop: "content" } },
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        props: { background: "white" },
        children: [
          { name: "home-title", type: "Text", props: { content: "ホーム" } },
          { name: "home-action", ref: "primary-button" },
        ],
      },
    ],
  });
}

test("ノードの prop を設定すると そのノードの props に入る", () => {
  const edited = Result.unwrap(
    DesignDocument.applyPropEdit(setupDocument(), "home-title", {
      names: ["align"],
      value: Option.some("center"),
    }),
  );

  const node = Option.unwrap(DesignDocument.findNode(edited, "home-title"));
  expect(Node.isPrimitive(node) && node.props).toEqual({
    content: "ホーム",
    align: "center",
  });
});

test("ノードの prop を消すとその prop が未設定に戻る", () => {
  const edited = Result.unwrap(
    DesignDocument.applyPropEdit(setupDocument(), "home-title", {
      names: ["content"],
      value: Option.none,
    }),
  );

  const node = Option.unwrap(DesignDocument.findNode(edited, "home-title"));
  expect(Node.isPrimitive(node) && node.props).toEqual({});
});

test("参照ノードの prop を設定すると overrides に入る", () => {
  const edited = Result.unwrap(
    DesignDocument.applyPropEdit(setupDocument(), "home-action", {
      names: ["label"],
      value: Option.some("送信"),
    }),
  );

  const node = Option.unwrap(DesignDocument.findNode(edited, "home-action"));
  expect(Node.isRef(node) && node.overrides).toEqual({ label: "送信" });
});

test("artboard の prop を設定すると artboard の props に入る", () => {
  const edited = Result.unwrap(
    DesignDocument.applyPropEdit(setupDocument(), "home", {
      names: ["gap"],
      value: Option.some("md"),
    }),
  );

  const artboard = Option.unwrap(DesignDocument.findArtboard(edited, "home"));
  expect(artboard.props).toEqual({ background: "white", gap: "md" });
});

test("存在しない名前を指した prop の編集は失敗する", () => {
  const edited = DesignDocument.applyPropEdit(setupDocument(), "missing", {
    names: ["gap"],
    value: Option.some("md"),
  });

  expect(edited).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "missing" },
  });
});

test("prop を編集しても元のドキュメントは変わらない", () => {
  const document = setupDocument();

  DesignDocument.applyPropEdit(document, "home", {
    names: ["gap"],
    value: Option.some("md"),
  });

  const artboard = Option.unwrap(DesignDocument.findArtboard(document, "home"));
  expect(artboard.props).toEqual({ background: "white" });
});
