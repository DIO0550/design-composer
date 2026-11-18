import { expect, test } from "vitest";
import { setupCompiledArtboard } from "./compiled-artboard-setup";

test("layerBlur を書いた artboard は filter の blur を出力する", () => {
  const compiled = setupCompiledArtboard({ layerBlur: 4 });

  expect(compiled.element.style.filter).toBe("blur(4px)");
});

test("backdropBlur を書いた artboard は backdrop-filter を出力しない", () => {
  const compiled = setupCompiledArtboard({ backdropBlur: 4 });

  expect("backdrop-filter" in compiled.element.style).toBe(false);
});
