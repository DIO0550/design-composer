import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./stale-canvas-overlay-DIfwjo32.js";var i,a,o,s,c;e((()=>{n(),i=t(),a={title:`features/canvas/ArtboardCanvas/StaleCanvasOverlay`,component:r,parameters:{layout:`fullscreen`,docs:{description:{component:`ファイルが不正な間キャンバスへ重ねるもの（#135）。

\`ArtboardCanvas\` の「ファイルが不正」ストーリーにも出るが、そちらでは artboard の
上に薄く掛かるだけで斜線の間隔・角度を読み取れない。**斜線を落としてもバッジは残り、
テストは 1 件も落ちない**ので、斜線そのものを見る手段はこのストーリーになる。`}}},decorators:[e=>(0,i.jsx)(`div`,{className:`relative h-64 w-full bg-white`,children:(0,i.jsx)(e,{})})]},o={name:`斜線とバッジ`},s={name:`キャンバスの中身に重なる`,decorators:[e=>(0,i.jsxs)(`div`,{className:`relative h-64 w-full bg-gray-100 p-8`,children:[(0,i.jsx)(`div`,{className:`h-40 w-64 bg-white shadow-sm outline outline-gray-300`}),(0,i.jsx)(e,{})]})]},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "斜線とバッジ"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "キャンバスの中身に重なる",
  decorators: [Story => <div className="relative h-64 w-full bg-gray-100 p-8">
        <div className="h-40 w-64 bg-white shadow-sm outline outline-gray-300" />
        <Story />
      </div>]
}`,...s.parameters?.docs?.source},description:{story:`下に中身がある状態。斜線が中身を覆っても読めることと、バッジが右上で浮くことを見る。`,...s.parameters?.docs?.description}}},c=[`Default`,`OverContent`]}))();export{o as Default,s as OverContent,c as __namedExportsOrder,a as default};