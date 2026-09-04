import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./instance-body-D0cJ5Qiy.js";import{o as i,p as a}from"./panel-controls-NsF2Okvu.js";import{n as o,t as s}from"./panel-frame-DKPeG766.js";var c,l,u,d,f,p,m;e((()=>{a(),o(),n(),c=t(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/inspector/PropertyPanel/InstanceBody`,component:r,parameters:{layout:`padded`,docs:{description:{component:"インスタンスを選んだときの本文（UI 案 docs/Design Composer.html の\n`Assets · Instance` の右ペイン）。\n\n押せないボタンを 2 通り並べるのは、`disabled` の見た目と `title` の理由が\n出どころ違いの 2 つの条件で決まるため。"}}},decorators:[e=>(0,c.jsx)(s,{children:(0,c.jsx)(e,{})})],args:{onEdit:l(),actions:{goToSource:l(),selectAllInstances:l(),detach:l()}}},d={name:`インスタンスを選択中`,args:{controls:i}},f={name:`解除できないインスタンス`,args:{controls:{...i,isDetachable:!1}}},p={name:`同じ部品のインスタンスが 1 つだけ`,args:{controls:{...i,sourceInstanceCount:1}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中",
  args: {
    controls: InstanceControls
  }
}`,...d.parameters?.docs?.source},description:{story:`上書きしている公開 prop（既定値の知らせが付く）と、上書きしていない公開 prop。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "解除できないインスタンス",
  args: {
    controls: {
      ...InstanceControls,
      isDetachable: false
    }
  }
}`,...f.parameters?.docs?.source},description:{story:`参照先の部品が見つからないとき。解除のボタンだけが押せなくなる。`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "同じ部品のインスタンスが 1 つだけ",
  args: {
    controls: {
      ...InstanceControls,
      sourceInstanceCount: 1
    }
  }
}`,...p.parameters?.docs?.source},description:{story:`そのインスタンスしか無いとき。まとめて選んでも選択が変わらないので押せない。`,...p.parameters?.docs?.description}}},m=[`Default`,`NotDetachable`,`OnlyInstance`]}))();export{d as Default,f as NotDetachable,p as OnlyInstance,m as __namedExportsOrder,u as default};