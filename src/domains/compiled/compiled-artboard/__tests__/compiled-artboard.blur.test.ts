import { expect, test } from "vitest";
import { DefaultTokenRefs } from "@/domains/__tests__/token-refs";
import { Artboard } from "@/domains/dcmp/artboard";
import { CompiledArtboard } from "../index";

test("layerBlur を書いた artboard は filter の blur を出力する", () => {
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    props: { layerBlur: 4 },
  });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    DefaultTokenRefs,
  );

  expect(compiled.element.style.filter).toBe("blur(4px)");
});

test("backdropBlur を書いた artboard は backdrop-filter を出力しない", () => {
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    props: { backdropBlur: 4 },
  });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    DefaultTokenRefs,
  );

  expect("backdrop-filter" in compiled.element.style).toBe(false);
});
