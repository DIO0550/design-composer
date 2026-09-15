import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CtQdU7_T.js";import{n as r,t as i}from"./Option-CPpfsGoD.js";import{t as a}from"./jsx-runtime-D16BNjX-.js";import{i as o,o as s,r as ee}from"./artboard-canvas-C99x2r17.js";import{i as te,t as ne}from"./document-open-failure-yDOxMaRq.js";import{n as c,t as l}from"./opened-documents-C1tVvglx.js";import{a as re,c as ie,i as ae,n as oe,o as se,t as ce}from"./document-start-BpaPH983.js";import{n as le,t as ue}from"./document-json-DXgpn1nV.js";import{i as de,n as fe,r as pe,t as u}from"./document-tab-bar-Cjg6PMyW.js";import{n as d,r as f,t as p}from"./document-error-list-DxFb5ZmZ.js";import{f as m,g as h,h as g,m as me}from"./editor-top-bar-DVDzueOT.js";import{a as he,i as ge,n as _e,o as ve,r as ye,t as be}from"./opened-document-editor-CwtEojyX.js";var _,v=e((()=>{_={create(e){let t=new Set,n=!1;return{ipc:{invoke(e){return Promise.reject(`Command ${e} not found`)},listen(r,i){return r===e?n?Promise.reject(`${r}: 購読を開始できない`):(t.add(i),Promise.resolve(()=>{t.delete(i)})):Promise.reject(`Event ${r} not emitted`)}},deliver(e){for(let n of t)n(e)},denySubscribe(){n=!0}}}}}));function xe(e){let t=Object.values(y).find(t=>t===e);return i.fromNullable(t)}var y,b,x,Se=e((()=>{r(),t(),y={Open:`open`,Create:`create`},b=`document-menu`,x={create(e){return{async subscribeCommand(t){try{let r=await e.listen(b,e=>{let n=xe(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),S,Ce=e((()=>{v(),Se(),S={create(){let e=_.create(b);return{menu:x.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));async function C(e){try{return n.ok(await e())}catch(e){return n.err({message:String(e)})}}var w,T,E,D=e((()=>{t(),w={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},T=`untitled.dcmp`,E={create(e){return{chooseOpenPath(){return C(()=>e.chooseOpenPath(w))},chooseSavePath(){return C(()=>e.chooseSavePath(w,T))}}}}}));function O(e){switch(e.kind){case`chosen`:return Promise.resolve(i.some(e.path));case`canceled`:return Promise.resolve(i.none);case`failed`:return Promise.reject(Error(e.message))}}var k,A,j,we=e((()=>{r(),D(),k={kind:`canceled`},A={Canceled:k,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},j={create(e){return{dialog:E.create({chooseOpenPath(){return O(e.open)},chooseSavePath(){return O(e.save)}})}}}}));function Te(e){if(typeof e!=`object`||!e)return i.none;let{paths:t}=e;return!Array.isArray(t)||!t.every(e=>typeof e==`string`)?i.none:i.some(t)}var M,N,Ee=e((()=>{r(),t(),M=`tauri://drag-drop`,N={create(e){return{async subscribeDropped(t){try{let r=await e.listen(M,e=>{let n=Te(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),P,De=e((()=>{v(),Ee(),P={create(){let e=_.create(M);return{drop:N.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),Oe=e((()=>{te(),oe(),fe(),ie(),ae()}));function ke({opened:e,clock:t,ipc:n}){let r=l.activePath(e);return(0,I.jsx)(`div`,{className:`min-h-0 flex-1`,children:l.documents(e).map(e=>{let i=e.path===r;return(0,I.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,I.jsx)(ee,{scope:i?o.Listening:o.Suspended,children:(0,I.jsx)(be,{clock:t,ipc:n,opened:e})})},e.path)})})}function F({clock:e,ports:t}){let{session:n,actions:r,tabActions:a,commandFailure:o}=re(t),s=se.failure(n);return i.isSome(n.documents)?(0,I.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,I.jsx)(u,{opened:n.documents.value,onSelect:a.activate,onClose:a.close}),i.isSome(s)&&(0,I.jsx)(ne,{failure:s.value}),(0,I.jsx)(ke,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,I.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,I.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,I.jsx)(ce,{attempt:n.attempt,actions:r,recentPaths:L,commandFailure:o,renderErrors:e=>(0,I.jsx)(p,{errors:e,origin:d.UnopenedFile})})})})}var I,L,Ae=e((()=>{c(),Oe(),f(),_e(),s(),r(),I=a(),L=[];try{F.displayName=`EditorScreen`,F.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: string): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: string, content: string): Promise<...>; watch(path: string): Promise<...>; unwatch(path: string): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) => void): ...`}}},tags:{}}}catch{}}));function R(e){let t=ye.create(e),n=j.create({open:A.chosen(H),save:A.chosen(`/work/untitled.dcmp`)}),r=P.create();return{ports:{ipc:t.ipc,dialog:n.dialog,menu:S.create().menu,drop:r.drop},drop:r}}var z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{de(),me(),h(),Ce(),ve(),we(),ge(),le(),De(),Ae(),{expect:z,screen:B,waitFor:V}=__STORYBOOK_MODULE_TEST__,H=`/work/sample.dcmp`,U=`/work/settings.dcmp`,W=`/work/missing.dcmp`,G={[H]:ue.serialize(g.document(m)),[U]:pe(`settings`)},K=R(G),q=R(G),J=R(G),Y={title:`features/editor/EditorScreen`,component:F,parameters:{layout:`fullscreen`},args:{clock:he.create().clock,ports:K.ports}},X={name:`開始画面`},Z={name:`複数開いている`,args:{ports:q.ports},play:async()=>{await V(()=>{z(B.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),q.drop.dropFiles([H,U]),await V(()=>{z(B.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:J.ports},play:async()=>{await V(()=>{z(B.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),J.drop.dropFiles([H]),await V(()=>{z(B.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),J.drop.dropFiles([W]),await V(()=>{z(B.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...X.parameters?.docs?.source},description:{story:`何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    ports: twoOpened.ports
  },
  play: async () => {
    // 購読が張られる前に落とすと指示が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    twoOpened.drop.dropFiles([SamplePath, SettingsPath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
  }
}`,...Z.parameters?.docs?.source},description:{story:`2 つ開いた状態。タブ列と上端の帯と 3 ペインの高さの配分は、ここでしか絵にならない
（タブ列だけのストーリーでは器との合わせ目が映らない）。`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "開いたまま開けなかった",
  args: {
    ports: openFailed.ports
  },
  play: async () => {
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    openFailed.drop.dropFiles([SamplePath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
    // 置かれていないファイルを落とす。タブは増えず、理由だけが帯に出る。
    openFailed.drop.dropFiles([MissingPath]);
    await waitFor(() => {
      expect(screen.getByRole("alert", {
        name: "ファイルを開けませんでした"
      })).toBeDefined();
    });
  }
}`,...Q.parameters?.docs?.source},description:{story:`開いているものがある状態で、別のファイルを開けなかったところ。タブは残したまま
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{X as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,$ as __namedExportsOrder,Y as default};