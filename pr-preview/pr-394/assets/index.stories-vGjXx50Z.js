import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{c as n,s as r}from"./artboard-frame-BKxurr3k.js";import{n as i,t as a}from"./resize-handle-overlay-CPFy7V1F.js";var o,s,c,l,u,d;e((()=>{n(),i(),o=t(),s={left:40,top:40,width:220,height:120},c={title:`features/canvas/ArtboardCanvas/ResizeHandleOverlay`,component:a,parameters:{layout:`fullscreen`},args:{bounds:s,isGrabbing:!1,onGrab:()=>{}},decorators:[e=>(0,o.jsxs)(`div`,{className:`relative h-56 bg-gray-100`,children:[(0,o.jsx)(`div`,{className:`absolute overflow-hidden bg-white shadow-sm outline-2 outline-blue-500`,style:{left:`${s.left}px`,top:`${s.top}px`,width:`${s.width}px`,height:`${s.height}px`}}),(0,o.jsx)(e,{})]})]},l={name:`2 軸とも掴める`,args:{handles:[r.create(`width`,220),r.create(`height`,120)]}},u={name:`幅だけ掴める`,args:{handles:[r.create(`width`,220)]}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "2 軸とも掴める",
  args: {
    handles: [AxisLength.create("width", 220), AxisLength.create("height", 120)]
  }
}`,...l.parameters?.docs?.source},description:{story:`2 軸とも固定の要素。右辺中央と下辺中央が掴め、そこだけカーソルが変わる。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "幅だけ掴める",
  args: {
    handles: [AxisLength.create("width", 220)]
  }
}`,...u.parameters?.docs?.source},description:{story:`幅だけが固定の要素。8 個とも描くが、掴めるのは右辺中央だけ。`,...u.parameters?.docs?.description}}},d=[`BothAxes`,`WidthOnly`]}))();export{l as BothAxes,u as WidthOnly,d as __namedExportsOrder,c as default};