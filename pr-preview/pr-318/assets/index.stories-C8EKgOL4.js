import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./right-pane-shell-DPVwNv8c.js";import{n as i,t as a}from"./pane-heading-DEpc67Ua.js";import{n as o,t as s}from"./Option-CEQn841D.js";import{n as c,t as l}from"./selection-title-CId5PJOC.js";var u,d,f,p,m,h,g;e((()=>{n(),i(),o(),c(),u=t(),d={title:`features/inspector/PropertyPanel/SelectionTitle`,component:l,parameters:{layout:`padded`,docs:{description:{component:`帯の中身（型アイコン + 名前 + 右端に種別）。

器は帯そのもの（44px・両端まで届く）なので、本文には入れず、編集画面が着せるのと
同じ帯（\`PaneHeading\`）に入れて見る。外側の殻が持つのは幅だけ。`}}},decorators:[e=>(0,u.jsx)(r,{height:`content`,children:(0,u.jsx)(a,{children:(0,u.jsx)(e,{})})})]},f={name:`Box を選択中`,args:{selection:{name:`overflow-wide`,kind:s.some(`Box`)}}},p={name:`インスタンスを選択中`,args:{selection:{name:`home-login`,kind:s.some(`component`)}}},m={name:`種別が分からないノードを選択中`,args:{selection:{name:`broken-node`,kind:s.none}}},h={name:`名前が長いノードを選択中`,args:{selection:{name:`very-long-node-name-that-does-not-fit-in-the-heading`,kind:s.some(`Box`)}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "Box を選択中",
  args: {
    selection: {
      name: "overflow-wide",
      kind: Option.some("Box")
    }
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中",
  args: {
    selection: {
      name: "home-login",
      kind: Option.some("component")
    }
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "種別が分からないノードを選択中",
  args: {
    selection: {
      name: "broken-node",
      kind: Option.none
    }
  }
}`,...m.parameters?.docs?.source},description:{story:"スキーマに無い `type`。分からない種別を既定へ寄せず、アイコンも綴りも出さない。",...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    selection: {
      name: "very-long-node-name-that-does-not-fit-in-the-heading",
      kind: Option.some("Box")
    }
  }
}`,...h.parameters?.docs?.source},description:{story:`帯の幅に収まらない名前。省略されることを視覚差分で見る。`,...h.parameters?.docs?.description}}},g=[`Box`,`Instance`,`UnknownKind`,`LongName`]}))();export{f as Box,p as Instance,h as LongName,m as UnknownKind,g as __namedExportsOrder,d as default};