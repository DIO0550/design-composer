import { expect, test } from "vitest";
import { BoxSchema, RefOwnPropDefinitions } from "../index";

test("部品インスタンスのロックは、プリミティブのロックと同じ値域と既定を持つ", () => {
  expect(RefOwnPropDefinitions.locking).toEqual(BoxSchema.props.locking);
});
