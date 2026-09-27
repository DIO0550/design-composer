import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{n,t as r}from"./tab-bar-CEiiX5rc.js";var i,a,o,s,c,l,u,d;e((()=>{n(),i=t(),a=`/work/login.dcmp`,o=`/work/settings.dcmp`,s=`/work/design-system/tokens.dcmp`,c={title:`components/TabBar`,component:r,parameters:{layout:`fullscreen`},args:{label:`開いているもの`,children:(0,i.jsx)(r.Tab,{name:a,isCurrent:!0,onSelect:()=>{},onClose:()=>{},children:`login.dcmp`})}},l={name:`1 枚だけ`},u={name:`複数並んでいる`,args:{children:[(0,i.jsx)(r.Tab,{name:a,isCurrent:!1,onSelect:()=>{},onClose:()=>{},children:`login.dcmp`},a),(0,i.jsx)(r.Tab,{name:o,isCurrent:!0,onSelect:()=>{},onClose:()=>{},children:`settings.dcmp`},o),(0,i.jsx)(r.Tab,{name:s,isCurrent:!1,onSelect:()=>{},onClose:()=>{},children:`tokens.dcmp`},s)]}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "1 枚だけ"
}`,...l.parameters?.docs?.source},description:{story:`1 枚だけの状態。閉じるボタンはこのときも出る。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "複数並んでいる",
  args: {
    children: [<TabBar.Tab key={LoginPath} name={LoginPath} isCurrent={false} onSelect={() => {}} onClose={() => {}}>
        login.dcmp
      </TabBar.Tab>, <TabBar.Tab key={SettingsPath} name={SettingsPath} isCurrent={true} onSelect={() => {}} onClose={() => {}}>
        settings.dcmp
      </TabBar.Tab>, <TabBar.Tab key={TokensPath} name={TokensPath} isCurrent={false} onSelect={() => {}} onClose={() => {}}>
        tokens.dcmp
      </TabBar.Tab>]
  }
}`,...u.parameters?.docs?.source},description:{story:`複数並んだ状態。見ているものだけ地が敷かれる。長い字は幅で切り詰める。`,...u.parameters?.docs?.description}}},d=[`Single`,`Multiple`]}))();export{u as Multiple,l as Single,d as __namedExportsOrder,c as default};