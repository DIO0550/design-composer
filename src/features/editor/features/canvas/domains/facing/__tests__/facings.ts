import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import type { Facing } from "../index";

export const Right: Facing = { pair: SidePairs.Horizontal, end: AxisEnds.End };
export const Left: Facing = { pair: SidePairs.Horizontal, end: AxisEnds.Start };
export const Up: Facing = { pair: SidePairs.Vertical, end: AxisEnds.Start };
export const Down: Facing = { pair: SidePairs.Vertical, end: AxisEnds.End };
