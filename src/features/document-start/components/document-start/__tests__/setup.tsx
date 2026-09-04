import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DocumentError } from "@/domains/session/document-error";
import { DocumentStart } from "@/features/document-start/components/document-start";
import type { UnopenedSession } from "@/features/document-start/domains/document-session";
import type {
  CommandSourceFailure,
  DocumentSessionActions,
} from "@/features/document-start/hooks/use-document-session";
import { Option } from "@/utils/Option";

/** エラーの一覧を出さない状態を見るときの、渡す描き方。 */
function renderNothing(): ReactNode {
  return null;
}

/** 押した先を記録するだけの導線。 */
export type RecordedActions = Readonly<{
  actions: DocumentSessionActions;
  /** `openDocumentAt` に渡されたパス。 */
  openedPaths: string[];
  /** `openDocument` が呼ばれた回数。 */
  openCount: () => number;
}>;

/**
 * 押された導線を記録する手続きを作る。
 *
 * @returns 記録つきの導線
 */
export function recordActions(): RecordedActions {
  const openedPaths: string[] = [];
  let opened = 0;

  return {
    actions: {
      openDocument: () => {
        opened += 1;
      },
      createDocument: () => {},
      openDocumentAt: (path) => {
        openedPaths.push(path);
      },
    },
    openedPaths,
    openCount: () => opened,
  };
}

/** 開始画面を描くときに、既定から変えたいもの。 */
export type StartOverrides = Readonly<{
  session?: UnopenedSession;
  actions?: DocumentSessionActions;
  recentPaths?: readonly string[];
  commandFailure?: Option<CommandSourceFailure>;
  renderErrors?: (errors: readonly DocumentError[]) => ReactNode;
}>;

/**
 * 何も開いていない状態の開始画面を描く。
 *
 * @param overrides 既定から変えたいもの
 */
export function renderDocumentStart(overrides: StartOverrides = {}): void {
  render(
    <DocumentStart
      session={overrides.session ?? { kind: "closed" }}
      actions={overrides.actions ?? recordActions().actions}
      recentPaths={overrides.recentPaths ?? []}
      commandFailure={overrides.commandFailure ?? Option.none}
      renderErrors={overrides.renderErrors ?? renderNothing}
    />,
  );
}
