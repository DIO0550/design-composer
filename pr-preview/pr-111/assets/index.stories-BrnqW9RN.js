import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./node-edit-toolbar-C28EwwkM.js";function i({isInsertEnabled:e,isCopyEnabled:t,isPasteEnabled:n,isRemoveEnabled:i}){return(0,a.jsxs)(r,{children:[(0,a.jsx)(r.Insert,{isEnabled:e,onInsert:()=>{}}),(0,a.jsx)(r.Copy,{isEnabled:t,onCopy:()=>{}}),(0,a.jsx)(r.Paste,{isEnabled:n,onPaste:()=>{}}),(0,a.jsx)(r.Remove,{isEnabled:i,onRemove:()=>{}})]})}var a,o,s,c,l,u,d;e((()=>{n(),a=t(),o={title:`features/editor/NodeEditToolbar`,component:i,parameters:{layout:`padded`},decorators:[e=>(0,a.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,a.jsx)(e,{})})]},s={name:`子を持てるノードを選んでいる`,args:{isInsertEnabled:!0,isCopyEnabled:!0,isPasteEnabled:!1,isRemoveEnabled:!0}},c={name:`コピー済みのノードがある`,args:{isInsertEnabled:!0,isCopyEnabled:!0,isPasteEnabled:!0,isRemoveEnabled:!0}},l={name:`artboard を選んでいる`,args:{isInsertEnabled:!0,isCopyEnabled:!1,isPasteEnabled:!1,isRemoveEnabled:!1}},u={name:`何も選んでいない`,args:{isInsertEnabled:!1,isCopyEnabled:!1,isPasteEnabled:!1,isRemoveEnabled:!1}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "子を持てるノードを選んでいる",
  args: {
    isInsertEnabled: true,
    isCopyEnabled: true,
    isPasteEnabled: false,
    isRemoveEnabled: true
  }
}`,...s.parameters?.docs?.source},description:{story:`子を持てるノード（artboard / Box）を選んでいて、まだ何もコピーしていない状態。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "コピー済みのノードがある",
  args: {
    isInsertEnabled: true,
    isCopyEnabled: true,
    isPasteEnabled: true,
    isRemoveEnabled: true
  }
}`,...c.parameters?.docs?.source},description:{story:`コピー済みで、貼り付け先も決まっている状態。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいる",
  args: {
    isInsertEnabled: true,
    isCopyEnabled: false,
    isPasteEnabled: false,
    isRemoveEnabled: false
  }
}`,...l.parameters?.docs?.source},description:{story:`artboard を選んでいる状態。artboard の削除・コピーは artboard 操作（#43）の担当。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "何も選んでいない",
  args: {
    isInsertEnabled: false,
    isCopyEnabled: false,
    isPasteEnabled: false,
    isRemoveEnabled: false
  }
}`,...u.parameters?.docs?.source},description:{story:`何も選んでいない状態。挿入先も削除の対象も決まらない。`,...u.parameters?.docs?.description}}},d=[`NodeSelected`,`NodeCopied`,`ArtboardSelected`,`NoSelection`]}))();export{l as ArtboardSelected,u as NoSelection,c as NodeCopied,s as NodeSelected,d as __namedExportsOrder,o as default};