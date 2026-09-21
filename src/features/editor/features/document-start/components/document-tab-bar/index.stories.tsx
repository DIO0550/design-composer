import type { Meta, StoryObj } from "@storybook/react-vite";
import { openedAt } from "@/domains/__tests__/sample-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import { DocumentTabBar } from "./index";

const LoginPath = "/work/login.dcmp";
const SettingsPath = "/work/settings.dcmp";
const TokensPath = "/work/design-system/tokens.dcmp";

/** 3 つ開いて真ん中を見ている状態。前後の詰まり方と、見ている印の出方を同時に見る。 */
const ThreeOpened = OpenedDocuments.activate(
  OpenedDocuments.open(
    OpenedDocuments.open(
      OpenedDocuments.create(openedAt(LoginPath)),
      openedAt(SettingsPath),
    ),
    openedAt(TokensPath),
  ),
  SettingsPath,
);

const meta = {
  title: "features/documentStart/DocumentTabBar",
  component: DocumentTabBar,
  parameters: { layout: "fullscreen" },
  args: {
    opened: OpenedDocuments.create(openedAt(LoginPath)),
    onSelect: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof DocumentTabBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 1 つだけ開いている状態。閉じるボタンはこのときも出る。 */
export const Single: Story = {
  name: "1 つだけ開いている",
};

/** 複数開いている状態。見ているものだけ地が敷かれる。 */
export const Multiple: Story = {
  name: "複数開いている",
  args: { opened: ThreeOpened },
};
