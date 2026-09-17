import { openedAt } from "@/domains/__tests__/sample-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";

/** 並びを作るのに使うパス。中身は `openedAt` が固定で返す。 */
export const FirstPath = "/work/login.dcmp";
export const SecondPath = "/work/settings.dcmp";
export const ThirdPath = "/work/profile.dcmp";
/** 一度も開いていないパス。 */
export const UnopenedPath = "/work/unknown.dcmp";

/**
 * 3 つを開いて真ん中を見ている並びを作る。
 *
 * 前と後ろの両方に並びがあるので、片側だけの詰め替えで通るテストを弾ける。
 *
 * @returns 前に 1 つ、後ろに 1 つ並んでいる状態
 */
export function threeOpenedWithMiddleActive(): OpenedDocuments {
  const opened = OpenedDocuments.open(
    OpenedDocuments.open(
      OpenedDocuments.create(openedAt(FirstPath)),
      openedAt(SecondPath),
    ),
    openedAt(ThirdPath),
  );
  return OpenedDocuments.activate(opened, SecondPath);
}
