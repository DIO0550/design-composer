import type { Meta, StoryObj } from "@storybook/react-vite";
import { TabBar } from "./index";

const LoginPath = "/work/login.dcmp";
const SettingsPath = "/work/settings.dcmp";
const TokensPath = "/work/design-system/tokens.dcmp";

const meta = {
  title: "components/TabBar",
  component: TabBar,
  parameters: { layout: "fullscreen" },
  args: {
    label: "開いているもの",
    children: (
      <TabBar.Tab
        name={LoginPath}
        isCurrent={true}
        onSelect={() => {}}
        onClose={() => {}}
      >
        login.dcmp
      </TabBar.Tab>
    ),
  },
} satisfies Meta<typeof TabBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 1 枚だけの状態。閉じるボタンはこのときも出る。 */
export const Single: Story = {
  name: "1 枚だけ",
};

/** 複数並んだ状態。見ているものだけ地が敷かれる。長い字は幅で切り詰める。 */
export const Multiple: Story = {
  name: "複数並んでいる",
  args: {
    children: [
      <TabBar.Tab
        key={LoginPath}
        name={LoginPath}
        isCurrent={false}
        onSelect={() => {}}
        onClose={() => {}}
      >
        login.dcmp
      </TabBar.Tab>,
      <TabBar.Tab
        key={SettingsPath}
        name={SettingsPath}
        isCurrent={true}
        onSelect={() => {}}
        onClose={() => {}}
      >
        settings.dcmp
      </TabBar.Tab>,
      <TabBar.Tab
        key={TokensPath}
        name={TokensPath}
        isCurrent={false}
        onSelect={() => {}}
        onClose={() => {}}
      >
        tokens.dcmp
      </TabBar.Tab>,
    ],
  },
};
