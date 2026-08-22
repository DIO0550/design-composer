import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./text-inline-editor-CBt3w_bi.js";var i,a,o,s,c,l;e((()=>{n(),i=t(),{fn:a}=__STORYBOOK_MODULE_TEST__,o={title:`features/canvas/ArtboardCanvas/TextInlineEditor`,component:r,parameters:{layout:`fullscreen`,docs:{description:{component:`編集中の Text に重ねる入力欄（docs/06-ui.md「Text のインライン編集」）。

**キャンバスのストーリーには出てこない。** 開くにはダブルクリックが要り、
\`ArtboardCanvas\` のストーリーは静止した状態しか撮れないため。枠の色・最小の大きさを
確かめる手段はここだけになる。`}}},args:{onChange:a(),onCommit:a(),onCancel:a()},decorators:[e=>(0,i.jsx)(`div`,{className:`h-48 w-full bg-gray-100`,children:(0,i.jsx)(e,{})})]},s={name:`文言を編集中`,args:{edit:{draft:`ようこそ`,bounds:{left:40,top:40,width:200,height:28}}}},c={name:`文言が空の Text を編集中`,args:{edit:{draft:``,bounds:{left:40,top:40,width:0,height:0}}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "文言を編集中",
  args: {
    edit: {
      draft: "ようこそ",
      bounds: {
        left: 40,
        top: 40,
        width: 200,
        height: 28
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`文言のある Text を編集しているところ。実測した矩形にぴったり重なる。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "文言が空の Text を編集中",
  args: {
    edit: {
      draft: "",
      bounds: {
        left: 40,
        top: 40,
        width: 0,
        height: 0
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`文言が空の Text を編集しているところ。

矩形が潰れている（幅も高さも 0）ので、最小の幅と高さが効かないと掴めない入力欄になる。
**この最小値を落としてもテストは落ちない**ので、見る手段はこのストーリーだけ。`,...c.parameters?.docs?.description}}},l=[`Editing`,`EmptyText`]}))();export{s as Editing,c as EmptyText,l as __namedExportsOrder,o as default};