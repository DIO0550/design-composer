import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { controlNamed, instanceOf } from "./setup";

test("上書きしていない constructor という公開 prop の編集欄は、今の値を持たない", () => {
  const selection = DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: {
        button: {
          type: "Box",
          children: [{ name: "button-label", type: "Text" }],
          publicProps: {
            constructor: { node: "button-label", prop: "content" },
          },
        },
      },
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "action", ref: "button" }],
        },
      ],
    }),
    ["action"],
  );

  expect(
    controlNamed(instanceOf(selection).publicProps, "constructor").value,
  ).toEqual(Option.none);
});
