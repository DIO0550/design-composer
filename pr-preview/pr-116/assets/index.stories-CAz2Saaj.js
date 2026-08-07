import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./node-edit-toolbar-CgiaiCdW.js";var i,a,o,s,c,l;e((()=>{n(),i=t(),a={title:`features/editor/NodeEditToolbar`,component:r,parameters:{layout:`padded`},args:{onInsert:()=>{},onRemove:()=>{}},decorators:[e=>(0,i.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,i.jsx)(e,{})})]},o={name:`子を持てるノードを選んでいる`,args:{isInsertEnabled:!0,isRemoveEnabled:!0}},s={name:`artboard を選んでいる`,args:{isInsertEnabled:!0,isRemoveEnabled:!1}},c={name:`何も選んでいない`,args:{isInsertEnabled:!1,isRemoveEnabled:!1}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "子を持てるノードを選んでいる",
  args: {
    isInsertEnabled: true,
    isRemoveEnabled: true
  }
}`,...o.parameters?.docs?.source},description:{story:`子を持てるノード（artboard / Box）を選んでいる状態。`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいる",
  args: {
    isInsertEnabled: true,
    isRemoveEnabled: false
  }
}`,...s.parameters?.docs?.source},description:{story:`artboard を選んでいる状態。artboard の削除は artboard 操作（#43）の担当。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "何も選んでいない",
  args: {
    isInsertEnabled: false,
    isRemoveEnabled: false
  }
}`,...c.parameters?.docs?.source},description:{story:`何も選んでいない状態。挿入先も削除の対象も決まらない。`,...c.parameters?.docs?.description}}},l=[`NodeSelected`,`ArtboardSelected`,`NoSelection`]}))();export{s as ArtboardSelected,c as NoSelection,o as NodeSelected,l as __namedExportsOrder,a as default};