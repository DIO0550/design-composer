import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest の globals を有効にしていないため、Testing Library の自動 cleanup は
// 登録されない。テスト間で DOM が残らないようここで解除する。
afterEach(cleanup);
