import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-Bq002N32.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{n as i,t as a}from"./selection-title-hrb9TQ_5.js";function o({children:e}){return(0,s.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white`,children:(0,s.jsx)(`div`,{className:`flex h-11 items-center gap-2 border-gray-300 border-b px-3`,children:e})})}var s,c,l,u,d,f,p;e((()=>{t(),i(),s=r(),c={title:`features/inspector/PropertyPanel/SelectionTitle`,component:a,parameters:{layout:`padded`},decorators:[e=>(0,s.jsx)(o,{children:(0,s.jsx)(e,{})})]},l={name:`Box を選択中`,args:{selection:{name:`overflow-wide`,kind:n.some(`Box`)}}},u={name:`インスタンスを選択中`,args:{selection:{name:`home-login`,kind:n.some(`component`)}}},d={name:`種別が分からないノードを選択中`,args:{selection:{name:`broken-node`,kind:n.none}}},f={name:`名前が長いノードを選択中`,args:{selection:{name:`very-long-node-name-that-does-not-fit-in-the-heading`,kind:n.some(`Box`)}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "Box を選択中",
  args: {
    selection: {
      name: "overflow-wide",
      kind: Option.some("Box")
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中",
  args: {
    selection: {
      name: "home-login",
      kind: Option.some("component")
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "種別が分からないノードを選択中",
  args: {
    selection: {
      name: "broken-node",
      kind: Option.none
    }
  }
}`,...d.parameters?.docs?.source},description:{story:"スキーマに無い `type`。分からない種別を既定へ寄せず、アイコンも綴りも出さない。",...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    selection: {
      name: "very-long-node-name-that-does-not-fit-in-the-heading",
      kind: Option.some("Box")
    }
  }
}`,...f.parameters?.docs?.source},description:{story:`帯の幅に収まらない名前。省略されることを視覚差分で見る。`,...f.parameters?.docs?.description}}},p=[`Box`,`Instance`,`UnknownKind`,`LongName`]}))();export{l as Box,u as Instance,f as LongName,d as UnknownKind,p as __namedExportsOrder,c as default};