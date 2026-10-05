import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BfXl6WpD.js";import{i as r,r as i}from"./side-snap-uqCpPLd-.js";import{n as a,t as o}from"./snap-guide-overlay-DV56m6dU.js";import{n as s,t as c}from"./overlay-stage-Bqawc2GH.js";var l,u,d,f,p;e((()=>{r(),t(),s(),a(),l={title:`features/editor/features/canvas/ArtboardCanvas/SnapGuideOverlay`,component:o,parameters:{layout:`fullscreen`,docs:{description:{component:"揃った線（辺か中心線）に引くガイド線と、揃え先との隙間（映し方は `OverlayStage` の doc を参照）。"}}},decorators:[c]},u={name:`左右の辺が揃った`,args:{guides:{horizontal:n.some({guideLine:{left:159,top:40,width:2,height:140},gapLine:n.none}),vertical:n.none},view:i.create()}},d={name:`縦横の両方で揃った`,args:{guides:{horizontal:n.some({guideLine:{left:159,top:40,width:2,height:140},gapLine:n.none}),vertical:n.some({guideLine:{left:60,top:99,width:240,height:2},gapLine:n.none})},view:i.create()}},f={name:`揃え先との隙間の数値`,args:{guides:{horizontal:n.some({guideLine:{left:159,top:40,width:2,height:160},gapLine:n.some({left:179,top:80,width:2,height:64})}),vertical:n.some({guideLine:{left:60,top:199,width:280,height:2},gapLine:n.some({left:200,top:199,width:100,height:2})})},view:i.create()}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "左右の辺が揃った",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: {
          left: 159,
          top: 40,
          width: 2,
          height: 140
        },
        gapLine: Option.none
      }),
      vertical: Option.none
    },
    view: CanvasView.create()
  }
}`,...u.parameters?.docs?.source},description:{story:`左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。揃え先とは重なっている。`,...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "縦横の両方で揃った",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: {
          left: 159,
          top: 40,
          width: 2,
          height: 140
        },
        gapLine: Option.none
      }),
      vertical: Option.some({
        guideLine: {
          left: 60,
          top: 99,
          width: 240,
          height: 2
        },
        gapLine: Option.none
      })
    },
    view: CanvasView.create()
  }
}`,...d.parameters?.docs?.source},description:{story:`縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。揃え先とはどちらも重なっている。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "揃え先との隙間の数値",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: {
          left: 159,
          top: 40,
          width: 2,
          height: 160
        },
        gapLine: Option.some({
          left: 179,
          top: 80,
          width: 2,
          height: 64
        })
      }),
      vertical: Option.some({
        guideLine: {
          left: 60,
          top: 199,
          width: 280,
          height: 2
        },
        gapLine: Option.some({
          left: 200,
          top: 199,
          width: 100,
          height: 2
        })
      })
    },
    view: CanvasView.create()
  }
}`,...f.parameters?.docs?.source},description:{story:`揃え先と縦横それぞれに離れているとき。隙間に短い線が引かれ、その中点に隙間の数値が出る。
縦の隙間は向かい合う範囲の中央（ガイド線とは別の位置）、横の隙間はガイド線に重なる位置。`,...f.parameters?.docs?.description}}},p=[`AlongSideEdges`,`AlongBothAxes`,`WithGaps`]}))();export{d as AlongBothAxes,u as AlongSideEdges,f as WithGaps,p as __namedExportsOrder,l as default};