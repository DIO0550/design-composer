import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./pane-heading-CMKY7S1-.js";import{n as i,t as a}from"./Option-C3mEU70o.js";import{n as o,t as s}from"./selection-title-CPM3SwTk.js";function c({children:e}){return(0,l.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white`,children:(0,l.jsx)(r,{children:e})})}var l,u,d,f,p,m,h;e((()=>{n(),i(),o(),l=t(),u={title:`features/inspector/PropertyPanel/SelectionTitle`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(c,{children:(0,l.jsx)(e,{})})]},d={name:`Box を選択中`,args:{selection:{name:`overflow-wide`,kind:a.some(`Box`)}}},f={name:`インスタンスを選択中`,args:{selection:{name:`home-login`,kind:a.some(`component`)}}},p={name:`種別が分からないノードを選択中`,args:{selection:{name:`broken-node`,kind:a.none}}},m={name:`名前が長いノードを選択中`,args:{selection:{name:`very-long-node-name-that-does-not-fit-in-the-heading`,kind:a.some(`Box`)}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "Box を選択中",
  args: {
    selection: {
      name: "overflow-wide",
      kind: Option.some("Box")
    }
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中",
  args: {
    selection: {
      name: "home-login",
      kind: Option.some("component")
    }
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "種別が分からないノードを選択中",
  args: {
    selection: {
      name: "broken-node",
      kind: Option.none
    }
  }
}`,...p.parameters?.docs?.source},description:{story:"スキーマに無い `type`。分からない種別を既定へ寄せず、アイコンも綴りも出さない。",...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    selection: {
      name: "very-long-node-name-that-does-not-fit-in-the-heading",
      kind: Option.some("Box")
    }
  }
}`,...m.parameters?.docs?.source},description:{story:`帯の幅に収まらない名前。省略されることを視覚差分で見る。`,...m.parameters?.docs?.description}}},h=[`Box`,`Instance`,`UnknownKind`,`LongName`]}))();export{d as Box,f as Instance,m as LongName,p as UnknownKind,h as __namedExportsOrder,u as default};