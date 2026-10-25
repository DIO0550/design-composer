import { expect, test } from "vitest";
import { BoxSchema, RefNodeSchema } from "../index";

test("部品インスタンスのロックは、プリミティブのロックと同じ値域と既定を持つ", () => {
  expect(RefNodeSchema.props.locking).toEqual(BoxSchema.props.locking);
});
