import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./instance-body-BwLW4o8B.js";import{c as i,u as a,y as o}from"./panel-controls-D-EJiYDi.js";import{n as s,t as c}from"./panel-frame-F0-MFyPm.js";var l,u,d,f,p,m,h,g;e((()=>{o(),s(),n(),l=t(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`features/editor/features/inspector/PropertyPanel/InstanceBody`,component:r,parameters:{layout:`padded`,docs:{description:{component:"インスタンスを選んだときの本文（UI 案 docs/Design Composer.html の\n`Assets · Instance` の右ペイン）。"}}},decorators:[e=>(0,l.jsx)(c,{children:(0,l.jsx)(e,{})})],args:{onEdit:u(),actions:{goToSource:u(),selectAllInstances:u(),detach:u(),editRefOwnProp:u()}}},f={name:`インスタンスを選択中`,args:{controls:i}},p={name:`解除できないインスタンス`,args:{controls:{...i,isDetachable:!1}}},m={name:`同じ部品のインスタンスが 1 つだけ`,args:{controls:{...i,sourceInstanceCount:1}}},h={name:`ロックしたインスタンス`,args:{controls:{...i,refOwnProps:[a]}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中",
  args: {
    controls: InstanceControls
  }
}`,...f.parameters?.docs?.source},description:{story:`上書きしている公開 prop（既定値の知らせが付く）と、上書きしていない公開 prop。`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "解除できないインスタンス",
  args: {
    controls: {
      ...InstanceControls,
      isDetachable: false
    }
  }
}`,...p.parameters?.docs?.source},description:{story:`参照先の部品が見つからないとき。解除のボタンだけが押せなくなる。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "同じ部品のインスタンスが 1 つだけ",
  args: {
    controls: {
      ...InstanceControls,
      sourceInstanceCount: 1
    }
  }
}`,...m.parameters?.docs?.source},description:{story:`そのインスタンスしか無いとき。まとめて選んでも選択が変わらないので押せない。`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "ロックしたインスタンス",
  args: {
    controls: {
      ...InstanceControls,
      refOwnProps: [LockedControl]
    }
  }
}`,...h.parameters?.docs?.source},description:{story:"ロックしたインスタンス。`Instance` 節のロックの行に `locked` が入る。",...h.parameters?.docs?.description}}},g=[`Default`,`NotDetachable`,`OnlyInstance`,`Locked`]}))();export{f as Default,h as Locked,p as NotDetachable,m as OnlyInstance,g as __namedExportsOrder,d as default};