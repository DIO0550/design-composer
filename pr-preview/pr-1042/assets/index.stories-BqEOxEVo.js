import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CE0exUpK.js";import{n as r,t as i}from"./Option-BfXl6WpD.js";import{t as a}from"./jsx-runtime-D16BNjX-.js";import{n as o,r as s,t as ee}from"./document-error-list-ChatStTL.js";import{n as c,t as l}from"./document-json-D11noLvx.js";import{i as u,n as te,r as ne,t as re}from"./document-tab-bar-lp0ztfcT.js";import{f as ie,g as ae,h as oe,m as se}from"./elapsed-C2uh3G9B.js";import{a as ce,c as d,i as le,l as f,n as ue,o as de,r as fe,s as p,t as pe}from"./opened-document-editor-BV5vRjRN.js";import{a as me,i as he}from"./document-ipc-BSqh6jq3.js";import{a as ge,c as _e,i as ve,l as ye,n as be,o as xe,t as Se,u as Ce}from"./document-start-CPkIcDN1.js";import{n as we,t as m}from"./opened-documents-lKwZglfZ.js";import{a as Te,c as h,o as g,s as Ee,u as De}from"./use-canvas-view-ZLRfLes0.js";import{i as Oe,t as ke}from"./document-open-failure-DV1RjkN5.js";function Ae(e){let t=Object.values(_).find(t=>t===e);return i.fromNullable(t)}var _,v,y,je=e((()=>{r(),t(),_={Open:`open`,Create:`create`,CloseTab:`close-tab`},v=`document-menu`,y={create(e){return{async subscribeCommand(t){try{let r=await e.listen(v,e=>{let n=Ae(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),b,Me=e((()=>{d(),je(),b={create(){let e=p.create(v);return{menu:y.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Ne(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Pe(e){return Ne(e)?e:{message:String(e)}}function Fe(e){return e===null?n.ok(i.none):typeof e==`string`?n.ok(i.some(e)):n.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}var x,Ie=e((()=>{me(),r(),t(),x={create(e){let t=he.caller(e,Pe);return{async load(){return n.flatMap(await t(`load_app_state`,{}),Fe)},async save(e){return n.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}}}));function S(e){return Promise.reject({message:`app-state.json: ${e}`})}var C,Le=e((()=>{d(),r(),Ie(),C={create(e){let t=e,n=!1,r=!1,a=()=>n?S(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?S(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):f(`save_app_state: content が文字列でない`);return{ipc:x.create({invoke(e,t){switch(e){case`load_app_state`:return a();case`save_app_state`:return o(t.content);default:return f(`Command ${e} not found`)}},listen(e){return f(`Event ${e} not emitted`)}}),storedContent(){return i.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}}));async function w(e){try{return n.ok(await e())}catch(e){return n.err({message:String(e)})}}var T,E,D,Re=e((()=>{t(),T={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},E=`untitled.dcmp`,D={create(e){return{chooseOpenPath(){return w(()=>e.chooseOpenPath(T))},chooseSavePath(){return w(()=>e.chooseSavePath(T,E))}}}}}));function O(e){switch(e.kind){case`chosen`:return Promise.resolve(i.some(e.path));case`canceled`:return Promise.resolve(i.none);case`failed`:return Promise.reject(Error(e.message))}}var k,A,j,ze=e((()=>{r(),Re(),k={kind:`canceled`},A={Canceled:k,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},j={create(e){return{dialog:D.create({chooseOpenPath(){return O(e.open)},chooseSavePath(){return O(e.save)}})}}}}));function Be(e){if(typeof e!=`object`||!e)return i.none;let{paths:t}=e;return!Array.isArray(t)||!t.every(e=>typeof e==`string`)?i.none:i.some(t)}var M,N,Ve=e((()=>{r(),t(),M=`tauri://drag-drop`,N={create(e){return{async subscribeDropped(t){try{let r=await e.listen(M,e=>{let n=Be(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),P,He=e((()=>{d(),Ve(),P={create(){let e=p.create(M);return{drop:N.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),Ue=e((()=>{Oe(),be(),te(),_e(),ve()}));function We(e){De(Array.from({length:F},(t,n)=>({shortcut:{kind:Ee.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var F,Ge=e((()=>{h(),F=9}));function Ke({opened:e,clock:t,ipc:n}){let r=m.activePath(e);return(0,L.jsx)(`div`,{className:`min-h-0 flex-1`,children:m.documents(e).map(e=>{let i=e.path===r;return(0,L.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,L.jsx)(Te,{scope:i?g.Listening:g.Suspended,children:(0,L.jsx)(pe,{clock:t,ipc:n,opened:e})})},e.path)})})}function I({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:a,actions:s,tabActions:c,commandFailure:l}=ge(t),u=xe.failure(n);return We(c.activateAt),i.isSome(n.documents)?(0,L.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,L.jsx)(re,{opened:n.documents.value,onSelect:c.activate,onClose:c.close,onReorder:c.reorder}),i.isSome(u)&&(0,L.jsx)(ke,{failure:u.value}),(0,L.jsx)(Ke,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,L.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,L.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,L.jsx)(Se,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:a,commandFailure:l,renderErrors:e=>(0,L.jsx)(ee,{errors:e,origin:o.UnopenedFile})})})})}var L,qe=e((()=>{we(),s(),ue(),Ue(),Ge(),h(),r(),L=a();try{I.displayName=`EditorScreen`,I.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: string): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: string, content: string): Promise<...>; watch(path: string): Promise<...>; unwatch(path: string): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) => void): ...`}}},tags:{}}}catch{}}));function R(e,t){let n=fe.create(e),r=j.create({open:A.chosen(H),save:A.chosen(`/work/untitled.dcmp`)}),i=P.create(),a=C.create(t===void 0?void 0:ye.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:b.create().menu,drop:i.drop,appState:a.ipc},drop:i}}var z,B,V,H,U,W,G,K,q,J,Je,Ye,Y,X,Z,Q,$;e((()=>{u(),se(),ae(),Me(),Le(),Ce(),de(),ze(),le(),c(),He(),qe(),{expect:z,screen:B,waitFor:V}=__STORYBOOK_MODULE_TEST__,H=`/work/sample.dcmp`,U=`/work/settings.dcmp`,W=`/work/missing.dcmp`,G={[H]:l.serialize(oe.document(ie)),[U]:ne(`settings`)},K=R(G),q=R(G),J=R(G),Je=R(G,[H]),Ye={title:`features/editor/EditorScreen`,component:I,parameters:{layout:`fullscreen`},args:{clock:ce.create().clock,ports:K.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:Je.ports}},Z={name:`複数開いている`,args:{ports:q.ports},play:async()=>{await V(()=>{z(B.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),q.drop.dropFiles([H,U]),await V(()=>{z(B.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:J.ports},play:async()=>{await V(()=>{z(B.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),J.drop.dropFiles([H]),await V(()=>{z(B.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),J.drop.dropFiles([W]),await V(()=>{z(B.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...Y.parameters?.docs?.source},description:{story:`何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "前回のファイルを開いた直後",
  args: {
    ports: restored.ports
  }
}`,...X.parameters?.docs?.source},description:{story:`前回開いていたファイルが起動時にそのまま開いた状態。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,Ye as default};