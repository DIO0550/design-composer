import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-Bq002N32.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{n as i,t as a}from"./pane-heading-D5e91x9m.js";import{n as o,t as s}from"./selection-title-BOIJj_Hl.js";function c({children:e}){return(0,l.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white`,children:(0,l.jsx)(a,{children:e})})}var l,u,d,f,p,m,h;e((()=>{i(),t(),o(),l=r(),u={title:`features/inspector/PropertyPanel/SelectionTitle`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(c,{children:(0,l.jsx)(e,{})})]},d={name:`Box を選択中`,args:{selection:{name:`overflow-wide`,kind:n.some(`Box`)}}},f={name:`インスタンスを選択中`,args:{selection:{name:`home-login`,kind:n.some(`component`)}}},p={name:`種別が分からないノードを選択中`,args:{selection:{name:`broken-node`,kind:n.none}}},m={name:`名前が長いノードを選択中`,args:{selection:{name:`very-long-node-name-that-does-not-fit-in-the-heading`,kind:n.some(`Box`)}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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