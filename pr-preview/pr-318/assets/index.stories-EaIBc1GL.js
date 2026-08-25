import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./prop-row-Bo-xuG5w.js";import{f as i,i as a,p as o,t as s}from"./panel-controls-Mqhb8Kz1.js";import{n as c,t as l}from"./panel-frame-D96YAbiJ.js";var u,d,f,p,m,h,g;e((()=>{o(),c(),n(),u=t(),{fn:d}=__STORYBOOK_MODULE_TEST__,f={title:`features/inspector/PropertyPanel/PropRow`,component:r,parameters:{layout:`padded`,docs:{description:{component:`1 prop 分の行。

ラベル欄の幅・条件付きの行の字下げ・未指定の注記はいずれも class の違いにしか
出ないので、崩れに気づける手段は視覚差分だけ。`}}},decorators:[e=>(0,u.jsx)(l,{children:(0,u.jsx)(e,{})})],args:{onEdit:d()}},p={name:`値の入った行`,args:{control:s}},m={name:`未指定の enum（既定の注記が付く）`,args:{control:a}},h={name:`条件付きの行（ラベルを出さず字下げする）`,args:{control:i}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "値の入った行",
  args: {
    control: BackgroundControl
  }
}`,...p.parameters?.docs?.source},description:{story:`ラベル左・コントロール右の並び。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "未指定の enum（既定の注記が付く）",
  args: {
    control: DirectionControl
  }
}`,...m.parameters?.docs?.source},description:{story:`セグメントには「未指定」の選択肢が無いので、同じ綴りを行の下に出す。`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "条件付きの行（ラベルを出さず字下げする）",
  args: {
    control: WidthControl
  }
}`,...h.parameters?.docs?.source},description:{story:`条件を出している行の下にぶら下がる欄。ラベルを出さず、コントロールの左端へ揃える。`,...h.parameters?.docs?.description}}},g=[`Normal`,`Unset`,`Dependent`]}))();export{h as Dependent,p as Normal,m as Unset,g as __namedExportsOrder,f as default};