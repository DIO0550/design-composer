import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BfXl6WpD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{v as i,y as a}from"./design-document-tNkg7AUY.js";import{n as o,t as s}from"./resize-handle-overlay-BY6F4nJK.js";var c,l,u,d,f,p,m;e((()=>{a(),t(),o(),c=r(),l={title:`features/editor/features/canvas/ArtboardCanvas/ResizeHandleOverlay`,component:s,parameters:{layout:`fullscreen`,docs:{description:{component:`選択中の要素に重ねるリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。

選択されている体の箱と同じ矩形を props で渡し、ハンドルがその辺をまたいで置かれることを
見る。オーバーレイは箱の外側にあるので、はみ出した半分が切られない。

**このストーリーは新設で、視覚差分のベースラインを持たない。**
ずれていても赤くならないので、辺をまたいでいるかは絵を見て確かめる。`}}},args:{bounds:{unrotated:{left:40,top:40,width:220,height:120},rotation:0},isGrabbing:!1,onGrab:()=>{}},decorators:[(e,t)=>(0,c.jsxs)(`div`,{className:`relative h-56 bg-gray-100`,children:[(0,c.jsx)(`div`,{className:`absolute overflow-hidden bg-white shadow-sm outline-2 outline-blue-500`,style:{left:`${t.args.bounds.unrotated.left}px`,top:`${t.args.bounds.unrotated.top}px`,width:`${t.args.bounds.unrotated.width}px`,height:`${t.args.bounds.unrotated.height}px`,transform:`rotate(${t.args.bounds.rotation}deg)`}}),(0,c.jsx)(e,{})]})]},u={lengths:[i.create(`width`,220),i.create(`height`,120)],origin:n.some({x:0,y:0}),snapTargetNames:[],rotation:{own:0,total:0}},d={name:`2 軸とも掴める`,args:{resizable:u}},f={name:`回った要素`,args:{bounds:{unrotated:{left:50,top:70,width:160,height:80},rotation:30},resizable:{...u,rotation:{own:30,total:30}}}},p={name:`幅だけ掴める`,args:{resizable:{lengths:[i.create(`width`,220)],origin:n.some({x:0,y:0}),snapTargetNames:[],rotation:{own:0,total:0}}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "2 軸とも掴める",
  args: {
    resizable: BothAxesResizable
  }
}`,...d.parameters?.docs?.source},description:{story:`2 軸とも固定で位置も持つ要素。8 箇所すべてが掴め、箇所ごとにカーソルが変わる。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "回った要素",
  args: {
    bounds: {
      unrotated: {
        left: 50,
        top: 70,
        width: 160,
        height: 80
      },
      rotation: 30
    },
    resizable: {
      ...BothAxesResizable,
      rotation: {
        own: 30,
        total: 30
      }
    }
  }
}`,...f.parameters?.docs?.source},description:{story:`30 度回した要素。ハンドルは回った角・辺の中点に出て、四角も同じ角度だけ回る
（docs/06-ui.md「リサイズハンドル」）。

回すと外接矩形が広がるので、器（高さ 224px）からはみ出さない小さい箱にしてある。`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "幅だけ掴める",
  args: {
    resizable: {
      lengths: [AxisLength.create("width", 220)],
      origin: Option.some({
        x: 0,
        y: 0
      }),
      snapTargetNames: [],
      rotation: {
        own: 0,
        total: 0
      }
    }
  }
}`,...p.parameters?.docs?.source},description:{story:`幅だけが固定の要素。8 個とも描くが、掴めるのは幅を変えられる 6 箇所だけ。`,...p.parameters?.docs?.description}}},m=[`BothAxes`,`Rotated`,`WidthOnly`]}))();export{d as BothAxes,f as Rotated,p as WidthOnly,m as __namedExportsOrder,l as default};