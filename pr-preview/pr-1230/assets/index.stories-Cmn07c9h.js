import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,r}from"./ArrayEx-CPm6lBTJ.js";import{n as i,t as a}from"./Option-BeyCqz6s.js";import{n as o,r as s,t as ee}from"./document-error-list-BDOvqbDw.js";import{i as c,n as l,r as u,t as d}from"./file-paths-C0jg4qUK.js";import{n as te,t as ne}from"./document-json-9VSGagBK.js";import{i as re,n as ie,r as ae,t as oe}from"./document-tab-bar-X1wueOqi.js";import{f as se,g as ce,h as le,m as ue}from"./elapsed-CRMHzXLc.js";import{a as de,c as f,i as fe,l as p,n as pe,o as me,r as he,s as m,t as ge}from"./opened-document-editor-DPzQp2b-.js";import{a as h,i as g}from"./document-ipc-kWZMSDwV.js";import{a as _e,c as ve,i as ye,l as be,n as xe,o as _,t as Se,u as Ce}from"./document-start-bGqs3dla.js";import{n as we,t as v}from"./opened-documents-DaIagv4J.js";import{a as Te,c as y,o as b,s as Ee,u as De}from"./use-canvas-view-CGVAcoDO.js";import{i as Oe,t as ke}from"./document-open-failure-BQ2IDE5q.js";function Ae(e){let t=Object.values(x).find(t=>t===e);return a.fromNullable(t)}function je(e){return{async subscribeCommand(t){try{let n=await e.listen(S,e=>{let n=Ae(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}var x,S,Me=e((()=>{i(),n(),x={Open:`open`,Create:`create`,CloseTab:`close-tab`},S=`document-menu`})),Ne,Pe=e((()=>{f(),Me(),Ne={create(){let e=m.create(S);return{menu:je(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Fe(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Ie(e){return Fe(e)?e:{message:String(e)}}function Le(e){return e===null?r.ok(a.none):typeof e==`string`?r.ok(a.some(e)):r.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}function Re(e){let t=g.caller(e,Ie);return{async load(){return r.flatMap(await t(`load_app_state`,{}),Le)},async save(e){return r.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}var ze=e((()=>{h(),i(),n()}));function C(e){return Promise.reject({message:`app-state.json: ${e}`})}var w,Be=e((()=>{f(),i(),ze(),w={create(e){let t=e,n=!1,r=!1,i=()=>n?C(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?C(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):p(`save_app_state: content が文字列でない`);return{ipc:Re({invoke(e,t){switch(e){case`load_app_state`:return i();case`save_app_state`:return o(t.content);default:return p(`Command ${e} not found`)}},listen(e){return p(`Event ${e} not emitted`)}}),storedContent(){return a.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}}));function Ve(e){let t=g.caller(e,e=>({message:String(e)}));return{async close(){return r.map(await t(`close_current_window`,{}),()=>void 0)}}}var He=e((()=>{h(),n()})),T,Ue=e((()=>{f(),He(),T={create(){let e=!1,t=!1,n=()=>t?p(`close_current_window: ウィンドウを閉じられない`):(e=!0,Promise.resolve(void 0));return{appWindow:Ve({invoke(e){return e===`close_current_window`?n():p(`Command ${e} not found`)},listen(e){return p(`Event ${e} not emitted`)}}),isWindowClosed(){return e},denyClose(){t=!0}}}}}));function We(e){if(!a.isSome(e))return r.ok(a.none);let t=u.create(e.value);return a.isSome(t)?r.ok(t):r.err({message:`選ばれたパスがファイル名を持たない: ${e.value}`})}async function E(e){try{return We(await e())}catch(e){return r.err({message:String(e)})}}function Ge(e){return{chooseOpenPath(){return E(()=>e.chooseOpenPath(D))},chooseSavePath(){return E(()=>e.chooseSavePath(D,O))}}}var D,O,Ke=e((()=>{c(),i(),n(),D={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},O=`untitled.dcmp`}));function k(e){switch(e.kind){case`chosen`:return Promise.resolve(a.some(e.path));case`canceled`:return Promise.resolve(a.none);case`failed`:return Promise.reject(Error(e.message))}}var A,j,M,qe=e((()=>{i(),Ke(),A={kind:`canceled`},j={Canceled:A,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},M={create(e){return{dialog:Ge({chooseOpenPath(){return k(e.open)},chooseSavePath(){return k(e.save)}})}}}}));function Je(e){if(typeof e!=`object`||!e)return a.none;let{paths:t}=e;if(!Array.isArray(t)||!t.every(e=>typeof e==`string`))return a.none;let n=t.flatMap(e=>{let t=u.create(e);return a.isSome(t)?[t.value]:[]});return n.length>0?a.some(n):a.none}function Ye(e){return{async subscribeDropped(t){try{let n=await e.listen(N,e=>{let n=Je(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}var N,Xe=e((()=>{c(),i(),n(),N=`tauri://drag-drop`})),P,Ze=e((()=>{f(),Xe(),P={create(){let e=m.create(N);return{drop:Ye(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),Qe=e((()=>{Oe(),xe(),ie(),ve(),ye()}));function $e(e){De(Array.from({length:F},(t,n)=>({shortcut:{kind:Ee.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var F,et=e((()=>{y(),F=9}));function tt({opened:e,clock:t,ipc:n}){let r=v.activePath(e);return(0,L.jsx)(`div`,{className:`min-h-0 flex-1`,children:v.documents(e).map(e=>{let i=e.path===r;return(0,L.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,L.jsx)(Te,{scope:i?b.Listening:b.Suspended,children:(0,L.jsx)(ge,{clock:t,ipc:n,opened:e})})},e.path)})})}function I({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:i,actions:s,tabActions:c,commandFailure:l}=_e(t),u=_.failure(n);return $e(c.activateAt),_.hasOpenedDocuments(n)?(0,L.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,L.jsx)(oe,{opened:n.documents.value,onSelect:c.activate,onClose:c.close,onReorder:c.reorder}),a.isSome(u)&&(0,L.jsx)(ke,{failure:u.value}),(0,L.jsx)(tt,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,L.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,L.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,L.jsx)(Se,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:i,commandFailure:l,renderErrors:e=>(0,L.jsx)(ee,{errors:e,origin:o.UnopenedFile})})})})}var L,nt=e((()=>{we(),s(),pe(),Qe(),et(),y(),i(),L=t();try{I.displayName=`EditorScreen`,I.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ canonicalize(path: FilePath): Promise<Result<FilePath, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; ... 4 more ...; subscribeChanged(listener: (changed: Readonly<...>) => void): Promise<...>; }>; ... 4 more ...; appWindow: Readonly<...>; }>`}}},tags:{}}}catch{}}));function R(e,t){let n=he.create(e),r=M.create({open:j.chosen(H),save:j.chosen(`/work/untitled.dcmp`)}),i=P.create(),a=w.create(t===void 0?void 0:be.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:Ne.create().menu,drop:i.drop,appState:a.ipc,appWindow:T.create().appWindow},drop:i}}var z,B,V,H,U,W,G,K,q,J,rt,it,Y,X,Z,Q,$;e((()=>{l(),re(),ue(),ce(),Pe(),Be(),Ce(),Ue(),me(),qe(),fe(),te(),Ze(),nt(),{expect:z,screen:B,waitFor:V}=__STORYBOOK_MODULE_TEST__,H=d(`/work/sample.dcmp`),U=d(`/work/settings.dcmp`),W=d(`/work/missing.dcmp`),G={[H]:ne.serialize(le.document(se)),[U]:ae(`settings`)},K=R(G),q=R(G),J=R(G),rt=R(G,[H]),it={title:`features/editor/EditorScreen`,component:I,parameters:{layout:`fullscreen`},args:{clock:de.create().clock,ports:K.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:rt.ports}},Z={name:`複数開いている`,args:{ports:q.ports},play:async()=>{await V(()=>{z(B.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),q.drop.dropFiles([H,U]),await V(()=>{z(B.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:J.ports},play:async()=>{await V(()=>{z(B.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),J.drop.dropFiles([H]),await V(()=>{z(B.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),J.drop.dropFiles([W]),await V(()=>{z(B.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,it as default};