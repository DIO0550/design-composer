import { expectTypeOf, test } from "vitest";
import type { DesignDocumentValidationErrorKind } from "@/domains/dcmp/design-document";
import type { DocumentErrorKind } from "@/domains/document-error";
import type { DocumentMigrationError } from "@/libs/document-migration";
import type { JsonScanErrorKind } from "@/libs/json-lexical-scanner";
import type { JsonDecodeErrorKind } from "@/utils/Json";

test("画面に出すエラーの種別は、報告しうる 4 系統をちょうど網羅する", () => {
  expectTypeOf<DocumentErrorKind>().toEqualTypeOf<
    | JsonScanErrorKind
    | DocumentMigrationError["kind"]
    | JsonDecodeErrorKind
    | DesignDocumentValidationErrorKind
  >();
});
