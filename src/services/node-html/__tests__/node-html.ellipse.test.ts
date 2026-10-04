import { expect, test } from "vitest";
import { DefaultTokenRefs } from "@/domains/__tests__/token-refs";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { NodeHtml } from "../index";
import { styleOf } from "./setup";

test("Ellipse のノードは楕円の要素にコンパイルされる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({ name: "dot", type: "Ellipse" }, DefaultTokenRefs),
  );

  expect([compiled.kind, compiled.style["border-radius"]]).toEqual([
    "ellipse",
    "50%",
  ]);
});

test("子を縦に並べる親の中で幅を fill にした Ellipse は横いっぱいに広がる", () => {
  const style = styleOf(
    { name: "dot", type: "Ellipse", props: { widthMode: "fill" } },
    Option.some("column"),
  );

  expect(style["align-self"]).toBe("stretch");
});
