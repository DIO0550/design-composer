import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CPpfsGoD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{b as i,y as a}from"./design-document-BLHu3E4t.js";import{n as o,t as s}from"./resize-handle-overlay-DBmgkRKP.js";var c,l,u,d,f,p;e((()=>{i(),t(),o(),c=r(),l={left:40,top:40,width:220,height:120},u={title:`features/editor/features/canvas/ArtboardCanvas/ResizeHandleOverlay`,component:s,parameters:{layout:`fullscreen`,docs:{description:{component:`選択中の要素に重ねるリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。

選択されている体の箱と同じ矩形を props で渡し、ハンドルがその辺をまたいで置かれることを
見る。オーバーレイは箱の外側にあるので、はみ出した半分が切られない。

**このストーリーは新設で、視覚差分のベースラインを持たない。**
ずれていても赤くならないので、辺をまたいでいるかは絵を見て確かめる。`}}},args:{bounds:l,isGrabbing:!1,onGrab:()=>{}},decorators:[e=>(0,c.jsxs)(`div`,{className:`relative h-56 bg-gray-100`,children:[(0,c.jsx)(`div`,{className:`absolute overflow-hidden bg-white shadow-sm outline-2 outline-blue-500`,style:{left:`${l.left}px`,top:`${l.top}px`,width:`${l.width}px`,height:`${l.height}px`}}),(0,c.jsx)(e,{})]})]},d={name:`2 軸とも掴める`,args:{resizable:{lengths:[a.create(`width`,220),a.create(`height`,120)],origin:n.some({x:0,y:0})}}},f={name:`幅だけ掴める`,args:{resizable:{lengths:[a.create(`width`,220)],origin:n.some({x:0,y:0})}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "2 軸とも掴める",
  args: {
    resizable: {
      lengths: [AxisLength.create("width", 220), AxisLength.create("height", 120)],
      origin: Option.some({
        x: 0,
        y: 0
      })
    }
  }
}`,...d.parameters?.docs?.source},description:{story:`2 軸とも固定で位置も持つ要素。8 箇所すべてが掴め、箇所ごとにカーソルが変わる。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "幅だけ掴める",
  args: {
    resizable: {
      lengths: [AxisLength.create("width", 220)],
      origin: Option.some({
        x: 0,
        y: 0
      })
    }
  }
}`,...f.parameters?.docs?.source},description:{story:`幅だけが固定の要素。8 個とも描くが、掴めるのは幅を変えられる 6 箇所だけ。`,...f.parameters?.docs?.description}}},p=[`BothAxes`,`WidthOnly`]}))();export{d as BothAxes,f as WidthOnly,p as __namedExportsOrder,u as default};