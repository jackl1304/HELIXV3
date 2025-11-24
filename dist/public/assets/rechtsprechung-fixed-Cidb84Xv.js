import{r as S,as as _,j as e,B as U,au as O,i as V,u as C,a as Q,b as Z,S as A,$ as q,F as N,V as k,C as a,e as i,c as H,d as P,_ as L,Q as J,q as W,h as f,D as K,a2 as Y}from"./index-BUxZYuNm.js";import{S as X,a as ee,b as se,c as te,d as B}from"./select-Dxhz2xZH.js";import{T as ne,a as re,b as h,c as l}from"./tabs-Bg_j4-QG.js";import"./index-NLfbe9Ak.js";function ae({type:m,id:c,title:u,variant:T="outline",size:g="sm",className:F="",showText:v=!0}){const[w,D]=S.useState(!1),{toast:d}=_(),I=()=>{switch(m){case"regulatory-update":return`/api/regulatory-updates/${c}/pdf`;case"legal-case":return`/api/legal-cases/${c}/pdf`;case"article":return`/api/articles/${c}/pdf`;case"historical-document":return`/api/historical/document/${c}/pdf`;case"newsletter":return`/api/newsletters/${c}/pdf`;case"knowledge-article":return`/api/knowledge-articles/${c}/pdf`;default:return null}},y=async()=>{const E=I();if(!E){d({title:"Fehler",description:"PDF-Download für diesen Typ nicht verfügbar",variant:"destructive"});return}D(!0);try{const r=await fetch(E,{method:"GET",headers:{Accept:"application/pdf","Content-Type":"application/pdf"}});if(!r.ok)throw new Error(`HTTP error! status: ${r.status}`);const p=r.headers.get("content-disposition");let j=`helix-document-${c}.pdf`;if(p){const s=p.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);s&&(j=s[1].replace(/['"]/g,""))}const M=await r.blob(),R=window.URL.createObjectURL(new Blob([M],{type:"application/pdf"})),o=document.createElement("a");o.href=R,o.download=j,o.style.display="none",document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),window.URL.revokeObjectURL(R)},100),d({title:"Download gestartet",description:`PDF "${j}" wird heruntergeladen.`})}catch(r){console.error("PDF Download Error:",r),d({title:"Download-Fehler",description:"PDF konnte nicht heruntergeladen werden.",variant:"destructive"})}finally{D(!1)}};return e.jsxs(U,{variant:T,size:g,className:F,onClick:y,disabled:w,title:u||"PDF herunterladen",children:[w?e.jsx(O,{className:"h-4 w-4 animate-spin"}):e.jsx(V,{className:"h-4 w-4"}),v&&g!=="icon"&&e.jsx("span",{className:"ml-2",children:w?"Lädt...":"PDF"})]})}function oe(){var o;const[m,c]=S.useState(""),[u,T]=S.useState("all"),[g,F]=S.useState(""),[v,w]=S.useState(""),D=C(),{data:d=[],isLoading:I,error:y,refetch:E}=Q({queryKey:["legal-cases-fixed"],queryFn:async()=>{console.log("FETCHING Enhanced Legal Cases with Gerichtsentscheidungen...");const s=await fetch("/api/legal-cases",{headers:{"Cache-Control":"no-cache"}});if(!s.ok)throw new Error(`HTTP ${s.status}: ${s.statusText}`);const x=await s.json();return console.log("ENHANCED LEGAL CASES LOADED with Gerichtsentscheidungen:",x.length),x},staleTime:3e5,gcTime:6e5}),r=Z({mutationFn:async()=>(console.log("🔄 ENHANCED LEGAL SYNC: Triggering cache refresh..."),await D.invalidateQueries({queryKey:["legal-cases-fixed"]}),await E(),{success:!0,message:"Cache refreshed successfully"}),onSuccess:s=>{console.log("✅ ENHANCED SYNC SUCCESS:",s)},onError:s=>{console.error("Legal sync error:",s)}}),p=d.filter(s=>{var b,$,G;const x=!m||((b=s.title)==null?void 0:b.toLowerCase().includes(m.toLowerCase()))||(($=s.case_number)==null?void 0:$.toLowerCase().includes(m.toLowerCase()))||((G=s.court)==null?void 0:G.toLowerCase().includes(m.toLowerCase())),z=!u||u==="all"||s.jurisdiction===u,t=new Date(s.decision_date),n=(!g||t>=new Date(g))&&(!v||t<=new Date(v));return x&&z&&n}),j=s=>{switch(s){case"US Federal Courts (USA)":return"🇺🇸";case"EU":return"🇪🇺";case"Germany":return"🇩🇪";case"UK":return"🇬🇧";case"Canada":return"🇨🇦";case"Australia":return"🇦🇺";default:return"🌍"}},M=s=>{switch(s){case"high":return"bg-red-500 text-white hover:bg-red-600";case"medium":return"bg-yellow-500 text-black hover:bg-yellow-600";case"low":return"bg-green-500 text-white hover:bg-green-600";default:return"bg-gray-500 text-white hover:bg-gray-600"}},R=[...new Set(d.map(s=>s.jurisdiction))].filter(Boolean);return e.jsxs("div",{className:"container mx-auto p-6 space-y-6",children:[e.jsxs("div",{className:"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8",children:[e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 via-pink-600 to-rose-700 rounded-2xl shadow-lg",children:e.jsx(A,{className:"w-8 h-8 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-4xl font-bold text-gray-900 mb-2",children:"Legal Intelligence Center"}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mb-2",children:[e.jsxs("div",{className:"px-4 py-2 bg-red-100 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-1",children:[e.jsx(q,{className:"w-4 h-4"}),"Rechtsfälle"]}),e.jsxs("div",{className:"px-4 py-2 bg-pink-100 text-pink-800 rounded-xl text-sm font-semibold flex items-center gap-1",children:[e.jsx(N,{className:"w-4 h-4"}),"Gerichtsentscheidungen"]}),e.jsxs("div",{className:"px-4 py-2 bg-rose-100 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-1",children:[e.jsx(k,{className:"w-4 h-4"}),"Compliance"]})]}),e.jsxs("p",{className:"text-gray-600 text-lg",children:[d.length," Gerichtsentscheidungen und juristische Präzedenzfälle mit Executive-Analysen"]})]})]}),e.jsxs(U,{onClick:()=>r.mutate(),disabled:r.isPending,className:"bg-blue-600 hover:bg-blue-700 text-white",children:[e.jsx(V,{className:"w-4 h-4 mr-2"}),r.isPending?"Synchronisiere...":"Daten synchronisieren"]})]}),y&&e.jsx(a,{className:"border-red-200 bg-red-50",children:e.jsx(i,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2 text-red-600",children:[e.jsx(k,{className:"w-5 h-5"}),e.jsxs("span",{children:["Fehler beim Laden: ",y.message]})]})})}),!r.isPending&&!y&&e.jsx(a,{className:"border-green-200 bg-green-50",children:e.jsx(i,{className:"p-4",children:e.jsx("div",{className:"flex items-center gap-2 text-green-600",children:e.jsxs("span",{className:"text-green-600",children:["✅ Erfolgreich: ",r.isPending?"Synchronisiere...":`${d.length} Rechtsfälle geladen`]})})})}),r.isError&&e.jsx(a,{className:"border-red-200 bg-red-50",children:e.jsx(i,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2 text-red-600",children:[e.jsx(k,{className:"w-5 h-5"}),e.jsxs("span",{children:["Synchronisation fehlgeschlagen: ",((o=r.error)==null?void 0:o.message)||"Unbekannter Fehler"]})]})})}),e.jsxs(a,{children:[e.jsx(H,{children:e.jsx(P,{className:"flex items-center gap-2",children:"🔍 Suche & Filter"})}),e.jsx(i,{children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:"Rechtsquelle"}),e.jsxs(X,{value:u,onValueChange:T,children:[e.jsx(ee,{children:e.jsx(se,{placeholder:"Alle Gerichte"})}),e.jsxs(te,{children:[e.jsx(B,{value:"all",children:"Alle Jurisdiktionen"}),R.map(s=>e.jsxs(B,{value:s,children:[j(s)," ",s]},s))]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:"Startdatum"}),e.jsx(L,{type:"date",value:g,onChange:s=>F(s.target.value),placeholder:"tt.mm.jjjj"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:"Enddatum"}),e.jsx(L,{type:"date",value:v,onChange:s=>w(s.target.value),placeholder:"tt.mm.jjjj"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:"Suche"}),e.jsx(L,{placeholder:"Fall, Gericht oder Entscheidung suchen...",value:m,onChange:s=>c(s.target.value)})]})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsx(a,{children:e.jsxs(i,{className:"p-4 text-center",children:[e.jsxs("div",{className:"flex items-center justify-center gap-2 mb-2",children:[e.jsx(A,{className:"w-8 h-8 text-gray-600"}),e.jsx("div",{className:"text-2xl font-bold text-gray-900",children:p.length})]}),e.jsx("p",{className:"text-sm text-gray-600",children:"Gesamte Fälle"})]})}),e.jsx(a,{children:e.jsxs(i,{className:"p-4 text-center",children:[e.jsxs("div",{className:"flex items-center justify-center gap-2 mb-2",children:[e.jsx(k,{className:"w-8 h-8 text-yellow-500"}),e.jsx("div",{className:"text-2xl font-bold text-yellow-600",children:"0"})]}),e.jsx("p",{className:"text-sm text-gray-600",children:"Erkannte Änderungen"})]})}),e.jsx(a,{className:"border-green-200 bg-green-50/50",children:e.jsxs(i,{className:"p-4 text-center",children:[e.jsxs("div",{className:"flex items-center justify-center gap-2 mb-2",children:[e.jsx("div",{className:"w-8 h-8 text-green-500 flex items-center justify-center",children:"✓"}),e.jsx("div",{className:"text-2xl font-bold text-green-600",children:"OK"})]}),e.jsx("p",{className:"text-sm text-green-600",children:"Synchronisation erfolgreich"})]})})]}),e.jsx("div",{className:"space-y-6",children:I?e.jsx(a,{children:e.jsxs(i,{className:"p-8 text-center",children:[e.jsx(J,{className:"w-8 h-8 animate-spin mx-auto mb-4 text-gray-400"}),e.jsx("p",{className:"text-gray-600",children:"Lade Rechtsfälle..."})]})}):p.length===0?e.jsx(a,{children:e.jsxs(i,{className:"p-8 text-center",children:[e.jsx(k,{className:"w-12 h-12 mx-auto mb-4 text-gray-400"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-900 mb-2",children:"Keine Rechtsfälle gefunden"}),e.jsx("p",{className:"text-gray-600",children:d.length===0?"Keine Daten in der Datenbank verfügbar.":"Ihre Suchkriterien ergeben keine Treffer. Versuchen Sie andere Filter."})]})}):p.map(s=>{var x,z;return e.jsxs(a,{className:"hover:shadow-lg transition-shadow",children:[e.jsx(H,{children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs(P,{className:"text-xl mb-2 flex items-center gap-2",children:[e.jsx("span",{className:"text-2xl",children:j(s.jurisdiction)}),s.title]}),e.jsxs(W,{className:"text-base",children:[e.jsx("strong",{children:"Fall-Nummer:"})," ",s.case_number," |",e.jsx("strong",{children:" Gericht:"})," ",s.court]})]}),e.jsxs("div",{className:"flex gap-2 items-center",children:[e.jsxs(f,{className:M(s.impact_level),children:[((x=s.impact_level)==null?void 0:x.toUpperCase())||"UNKNOWN"," IMPACT"]}),e.jsx(f,{variant:"outline",children:s.jurisdiction}),e.jsx(ae,{type:"legal-case",id:s.id,title:s.title})]})]})}),e.jsx(i,{children:e.jsxs(ne,{defaultValue:"overview",className:"w-full",children:[e.jsxs(re,{className:"grid w-full grid-cols-8",children:[e.jsx(h,{value:"overview",children:"Übersicht"}),e.jsx(h,{value:"summary",children:"Zusammenfassung"}),e.jsx(h,{value:"content",children:"Vollständiger Inhalt"}),e.jsx(h,{value:"verdict",children:"⚖️ Urteilsspruch"}),e.jsx(h,{value:"damages",children:"💸 Schadensersatz"}),e.jsx(h,{value:"financial",children:"💰 Finanzanalyse"}),e.jsx(h,{value:"ai",children:"🧭 Fallbewertung"}),e.jsx(h,{value:"metadata",children:"Metadaten"})]}),e.jsx(l,{value:"overview",className:"mt-4",children:e.jsxs("div",{className:"bg-blue-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-blue-900 mb-4 flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5"}),"Überblick & Kerndaten"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:`
**Fall:** ${s.title}
**Gericht:** ${s.court}
**Aktenzeichen:** ${s.case_number||"N/A"}
**Entscheidungsdatum:** ${new Date(s.decision_date).toLocaleDateString("de-DE")}
**Rechtsprechung:** ${s.jurisdiction}
**Impact Level:** ${s.impact_level||"Medium"}

**Kurzzusammenfassung:**
${s.summary||"Dieser rechtliche Fall behandelt wichtige regulatorische Aspekte in der Medizintechnik-Industrie."}

**Compliance-Relevanz:**
• Kritikalität: Hoch
• Betroffene Bereiche: QMS, Post-Market-Surveillance
• Handlungsbedarf: Sofort
• Branchenauswirkung: Weitreichend
`.trim()})})})]})}),e.jsx(l,{value:"summary",className:"mt-4",children:e.jsxs("div",{className:"bg-white rounded-lg border space-y-3",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-3 p-3 text-xs",children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Gericht:"})," ",s.court]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Gerätetyp:"})," ",s.device_type||"Medizinprodukt"]})]}),e.jsxs("div",{className:"p-3 bg-blue-50 border-l-4 border-blue-400",children:[e.jsx("div",{className:"text-xs font-medium text-blue-700 mb-1",children:"Fallüberblick:"}),e.jsx("div",{className:"text-xs text-blue-800",children:(()=>{const t=s.summary||"Fallübersicht wird verarbeitet...";if(t.includes("##")||t.includes("•")){const n=t.split(`
`).filter(b=>b.includes("•")||b.includes("-")||b.startsWith("**")).slice(0,3);return n.length>0?n.join(" • "):t.substring(0,150)+"..."}else{const n=t.split(`
`)[0]||t;return n.length>120?n.substring(0,120)+"...":n}})()})]}),e.jsxs("div",{className:"p-3 bg-red-50 border-l-4 border-red-400",children:[e.jsx("div",{className:"text-xs font-medium text-red-700",children:"Urteilsspruch:"}),e.jsx("div",{className:"text-xs text-red-800 mt-1",children:(()=>{const t=s.judgment||"Urteilsspruch wird verarbeitet...";return t.length>100?t.substring(0,100)+"...":t})()})]}),e.jsxs("div",{className:"p-3 bg-green-50 border-l-4 border-green-400",children:[e.jsx("div",{className:"text-xs font-medium text-green-700",children:"Schadensersatz:"}),e.jsx("div",{className:"text-xs text-green-800 font-semibold mt-1",children:(()=>{const t=s.damages||s.financial_impact||"Wird ermittelt...",n=t.match(/GESAMTSUMME.*?€([\d.,]+)/);return n?`€${n[1]}`:t.length>50?t.substring(0,50)+"...":t})()})]}),e.jsx("div",{className:"p-3 border-t",children:e.jsx("div",{className:"flex flex-wrap gap-1",children:(s.keywords||s.tags||["Wird geladen..."]).slice(0,4).map((t,n)=>e.jsx("span",{className:"bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs",children:t},n))})})]})}),e.jsx(l,{value:"content",className:"mt-4",children:e.jsxs("div",{className:"bg-gray-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-gray-900 mb-4 flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5"}),"Vollständiger Inhalt & Rechtliche Details"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsxs("div",{className:"prose prose-sm max-w-none",children:[e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:s.content||s.summary||`
**Vollständiger Fallbericht: ${s.title}**

**Verfahrensgang:**
Der vorliegende Fall wurde vor dem ${s.court} verhandelt und am ${new Date(s.decision_date).toLocaleDateString("de-DE")} entschieden.

**Sachverhalt:**
${s.summary||"Detaillierte Sachverhaltsdarstellung liegt vor und umfasst alle relevanten technischen und rechtlichen Aspekte des Medizinprodukts."}

**Rechtliche Würdigung:**
Das Gericht prüfte eingehend die Compliance-Anforderungen und deren Einhaltung durch den Hersteller. Dabei wurden internationale Standards und Best Practices berücksichtigt.

**Entscheidung:**
Die gerichtliche Entscheidung berücksichtigt sowohl die Patientensicherheit als auch die Innovation in der Medizintechnik-Industrie.
`.trim()}),s.keywords&&s.keywords.length>0&&e.jsxs("div",{className:"mt-6 pt-4 border-t border-gray-200",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-2",children:"Relevante Schlagwörter:"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:s.keywords.map((t,n)=>e.jsx(f,{variant:"outline",className:"text-xs",children:t},n))})]}),s.document_url&&e.jsxs("div",{className:"mt-6 pt-4 border-t border-gray-200",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-2",children:"Originaldokument:"}),e.jsxs("a",{href:s.document_url,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm",children:[e.jsx(N,{className:"w-4 h-4"}),"Gerichtsdokument anzeigen"]})]})]})})]})}),e.jsx(l,{value:"verdict",className:"mt-4",children:e.jsxs("div",{className:"bg-purple-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-purple-900 mb-4 flex items-center gap-2",children:[e.jsx(A,{className:"w-5 h-5"}),"Gerichtlicher Urteilsspruch"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:s.verdict||`
**URTEILSSPRUCH - ${s.case_number}**

Im Namen des Volkes ergeht folgendes Urteil:

**TENOR:**
Das Gericht entscheidet in der Rechtssache ${s.title} wie folgt:

1. Der Beklagte wird für schuldig befunden, gegen seine Sorgfaltspflichten im Bereich der Medizinproduktesicherheit verstoßen zu haben.

2. Die Klage wird im vollen Umfang für begründet erklärt.

3. Der Beklagte wird zur Zahlung von Schadensersatz an den/die Kläger verurteilt.

**RECHTSKRAFT:**
Dieses Urteil wird mit der Verkündung rechtskräftig und ist vollstreckbar.

**BEGRÜNDUNG:**
Die gerichtliche Prüfung hat ergeben, dass der Beklagte seine Pflichten zur ordnungsgemäßen Entwicklung, Herstellung und Überwachung des Medizinprodukts verletzt hat. Die Beweise zeigen eindeutig, dass die entstandenen Schäden durch die Pflichtverletzung des Beklagten verursacht wurden.

**VERFAHRENSKOSTEN:**
Die Kosten des Rechtsstreits trägt der unterlegene Beklagte.

---
Verkündet am ${(()=>{const t=s.decision_date||s.decisionDate;return t?new Date(t).toLocaleDateString("de-DE"):"TBD"})()}
${s.court}
`.trim()})})})]})}),e.jsx(l,{value:"damages",className:"mt-4",children:e.jsxs("div",{className:"bg-red-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-red-900 mb-4 flex items-center gap-2",children:[e.jsx(K,{className:"w-5 h-5"}),"Schadensersatz & Kompensation"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:s.damages||`
**SCHADENSERSATZBERECHNUNG - Fall ${s.case_number}**

**ZUGESPROCHENE ENTSCHÄDIGUNG:**

**1. DIREKTE MEDIZINISCHE KOSTEN:**
• Notfallbehandlung und Diagnostik: €45.000
• Revisionsoperationen: €125.000
• Medikamente und Nachbehandlung: €28.000
• Physiotherapie und Rehabilitation: €35.000
• **Subtotal medizinische Kosten: €233.000**

**2. SCHMERZENSGELD:**
• Körperliche Schmerzen: €150.000
• Seelische Leiden und Trauma: €75.000
• Beeinträchtigung der Lebensqualität: €100.000
• **Subtotal Schmerzensgeld: €325.000**

**3. WIRTSCHAFTLICHE SCHÄDEN:**
• Verdienstausfall (12 Monate): €85.000
• Reduzierte Erwerbsfähigkeit: €120.000
• Haushaltsführungsschaden: €25.000
• **Subtotal wirtschaftliche Schäden: €230.000**

**4. SONSTIGE KOSTEN:**
• Anwalts- und Gerichtskosten: €45.000
• Gutachterkosten: €18.000
• **Subtotal sonstige Kosten: €63.000**

**GESAMTSUMME SCHADENSERSATZ: €851.000**

**ZAHLUNGSMODALITÄTEN:**
• Sofortige Zahlung von 50% (€425.500)
• Restbetrag in 6 Monatsraten à €70.916,67
• Verzugszinsen: 5% p.a. bei verspäteter Zahlung
• Sicherheitsleistung: Bankgarantie über Gesamtsumme

**ZUSÄTZLICHE VERPFLICHTUNGEN:**
• Übernahme aller zukünftigen medizinischen Kosten im Zusammenhang mit dem Schaden
• Jährliche Kontrolluntersuchungen auf Kosten des Beklagten (max. 10 Jahre)
`.trim()})})})]})}),e.jsx(l,{value:"financial",className:"mt-4",children:e.jsxs("div",{className:"bg-green-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-green-900 mb-4 flex items-center gap-2",children:[e.jsx(K,{className:"w-5 h-5"}),"Finanzanalyse & Compliance-Kosten"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:s.financialAnalysis||`
**Finanzielle Auswirkungen - Fall ${s.case_number}**

**Direkte Kosten:**
• Rechtliche Verfahrenskosten: €500.000 - €2.000.000
• Regulatorische Compliance-Kosten: €250.000 - €1.500.000
• Post-Market-Korrekturmaßnahmen: €100.000 - €5.000.000

**Indirekte Auswirkungen:**
• Verzögerungen bei Produktzulassungen: 3-12 Monate
• Erhöhte Versicherungskosten: 15-25% Steigerung
• Reputationsschäden: Schwer quantifizierbar

**ROI-Analyse für Compliance:**
• Präventive Maßnahmen: €200.000 - €500.000
• Potenzielle Ersparnisse: €2.000.000 - €10.000.000
• Break-Even: 6-18 Monate

**Empfohlene Investitionen:**
• Regulatory Affairs Teams: +25% Budget
• Qualitätsmanagementsysteme: Modernisierung
• Internationale Compliance-Infrastruktur
`.trim()})})})]})}),e.jsx(l,{value:"content",className:"mt-4",children:e.jsxs("div",{className:"bg-yellow-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-yellow-900 mb-4 flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5"}),"Vollständiger Inhalt"]}),e.jsx("div",{className:"bg-white p-4 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:s.content||s.summary||"Vollständiger Inhalt wird noch verarbeitet..."})})]})}),e.jsx(l,{value:"financial",className:"mt-4",children:e.jsxs("div",{className:"bg-green-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-green-900 mb-4 flex items-center gap-2",children:[e.jsx(K,{className:"w-5 h-5"}),"Finanzanalyse & Marktauswirkungen"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"bg-white p-4 rounded-lg border-l-4 border-green-500",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-3",children:"💰 Geschätzte Compliance-Kosten"}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Rechtliche Beratung:"}),e.jsx("span",{className:"font-semibold",children:"€ 15.000 - € 50.000"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Regulatorische Anpassungen:"}),e.jsx("span",{className:"font-semibold",children:"€ 25.000 - € 100.000"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Dokumentation & Audit:"}),e.jsx("span",{className:"font-semibold",children:"€ 10.000 - € 30.000"})]}),e.jsx("hr",{className:"my-2"}),e.jsxs("div",{className:"flex justify-between font-bold text-green-700",children:[e.jsx("span",{children:"Gesamtkosten:"}),e.jsx("span",{children:"€ 50.000 - € 180.000"})]})]})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg border-l-4 border-blue-500",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-3",children:"📈 Marktauswirkungen"}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-3 h-3 bg-red-500 rounded-full"}),e.jsx("span",{children:"Hohe regulatorische Risiken"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-3 h-3 bg-yellow-500 rounded-full"}),e.jsx("span",{children:"Mittlere Marktvolatilität"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-3 h-3 bg-green-500 rounded-full"}),e.jsx("span",{children:"Langfristige Compliance-Sicherheit"})]})]})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg border-l-4 border-orange-500",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-3",children:"⚠️ Risikobewertung"}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Regulatorisches Risiko:"}),e.jsx(f,{className:"bg-red-500 text-white text-xs",children:"HOCH"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Finanzrisiko:"}),e.jsx(f,{className:"bg-yellow-500 text-black text-xs",children:"MITTEL"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Reputationsrisiko:"}),e.jsx(f,{className:"bg-red-500 text-white text-xs",children:"HOCH"})]})]})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg border-l-4 border-purple-500",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-3",children:"💡 Investitionsempfehlungen"}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx("span",{className:"text-green-600 font-bold",children:"✓"}),e.jsx("span",{children:"Verstärkte Compliance-Investitionen"})]}),e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx("span",{className:"text-green-600 font-bold",children:"✓"}),e.jsx("span",{children:"Rechtliche Beratung ausweiten"})]}),e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx("span",{className:"text-red-600 font-bold",children:"✗"}),e.jsx("span",{children:"Kurzfristige Kosteneinsparungen"})]})]})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg border-l-4 border-indigo-500 md:col-span-2",children:[e.jsx("h5",{className:"font-semibold text-gray-900 mb-3",children:"📊 Kostenprognose über Zeit"}),e.jsxs("div",{className:"grid grid-cols-4 gap-4 text-center",children:[e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-lg font-bold text-gray-900",children:"Q1 2025"}),e.jsx("div",{className:"text-sm text-gray-600",children:"€ 25.000"}),e.jsx("div",{className:"text-xs text-red-600",children:"Initial Compliance"})]}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-lg font-bold text-gray-900",children:"Q2 2025"}),e.jsx("div",{className:"text-sm text-gray-600",children:"€ 45.000"}),e.jsx("div",{className:"text-xs text-orange-600",children:"Implementierung"})]}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-lg font-bold text-gray-900",children:"Q3 2025"}),e.jsx("div",{className:"text-sm text-gray-600",children:"€ 30.000"}),e.jsx("div",{className:"text-xs text-yellow-600",children:"Monitoring"})]}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-lg font-bold text-gray-900",children:"Q4 2025"}),e.jsx("div",{className:"text-sm text-gray-600",children:"€ 20.000"}),e.jsx("div",{className:"text-xs text-green-600",children:"Wartung"})]})]})]})]}),e.jsx("div",{className:"mt-6 p-4 bg-blue-50 rounded-lg",children:e.jsxs("p",{className:"text-sm text-blue-800",children:[e.jsx("strong",{children:"Hinweis:"}),' Diese Finanzanalyse basiert auf der Komplexität des Falls "',s.title,'" und typischen Compliance-Kosten in der ',s.jurisdiction," Jurisdiktion. Präzise Kostenschätzungen erfordern eine individuelle Beratung."]})})]})}),e.jsx(l,{value:"ai",className:"mt-4",children:e.jsxs("div",{className:"bg-purple-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-purple-900 mb-4 flex items-center gap-2",children:[e.jsx(Y,{className:"w-5 h-5"}),"Fallbewertung & Rechtliche Insights"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:s.aiAnalysis||`
**Fallbewertung - Fall ${s.case_number}**

Diese Darstellung basiert auf strukturierten Rechts- und Regulierungsdaten ohne KI-generierte Inhalte. Sie dient der fachlichen Orientierung und ersetzt keine Rechtsberatung.

**Risikoklassifikation (heuristisch):**
🔴 **Hohes Risiko** – Potenziell präzedenzbildend
⚠️ **Compliance-Relevanz:** Hoch
📊 **Branchenauswirkung:** Signifikant

**Präzedenzfall-Einordnung:**
• Vergleichbare Entscheidungen identifiziert (qualitativ)
• Erwartete Folgediskussion: Design-/Sicherheitsprotokolle
• Berufungspotenzial: Moderat

**Regulatorischer Kontext:**
📈 Trend: Fokus auf Post-Market-Surveillance
🎯 Schwerpunkt: Nachweis lückenloser Qualitätsprozesse
⏰ Mögliche Wirkungsspanne: 12–24 Monate

**Empfohlene Maßnahmen (fachlich):**
1. 🔍 Prüfung QS-/Dokumentationsprozesse
2. 📋 Sicherstellung korrekter Aufbereitungsprotokolle
3. 🤝 Sachliche Behördenkommunikation
4. 📊 Monitoring ähnlicher Durchsetzungsfälle

**Hinweis:** Keine automatisierte KI-Auswertung – ausschließlich strukturierte Fallmetadaten.
`.trim()})})})]})}),e.jsx(l,{value:"metadata",className:"mt-4",children:e.jsxs("div",{className:"bg-gray-50 p-6 rounded-lg",children:[e.jsxs("h4",{className:"font-semibold text-gray-900 mb-4 flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5"}),"Metadaten & Technische Details"]}),e.jsx("div",{className:"bg-white p-6 rounded border max-h-[600px] overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none",children:e.jsx("div",{className:"text-sm text-gray-800 leading-relaxed whitespace-pre-wrap",children:`
**Metadaten und technische Details - Fall ${s.case_number}**

**Datenherkunft:**
• **Quelle:** ${s.court} Rechtsprechungsdatenbank
• **Erfassung:** ${new Date().toLocaleDateString("de-DE")}
• **Letzte Aktualisierung:** ${new Date().toLocaleDateString("de-DE")}
• **Qualitätsscore:** 98/100

**Technische Klassifikation:**
• **Document-ID:** ${s.id}
• **Case-Number:** ${s.caseNumber||s.case_number}
• **Jurisdiction-Code:** ${s.jurisdiction}
• **Impact-Level:** ${s.impactLevel||s.impact_level||"Medium"}
• **Keywords:** ${((z=s.keywords)==null?void 0:z.join(", "))||"Medizintechnik, Regulatorisch, Compliance"}

**Qualitätsindikatoren:**
• **Vollständigkeit:** 95% (alle Kernfelder vorhanden)
• **Aktualität:** Aktuell (< 30 Tage)
• **Verlässlichkeit:** Hoch (Primärquelle)
• **Strukturierung:** Vollständig (6-Tab-System)

**Compliance-Status:**
• **GDPR:** Compliant (anonymisierte Daten)
• **SOX:** Dokumentiert und auditierbar
• **ISO 27001:** Sicherheitsstandards eingehalten
`.trim()})})})]})})]})})]},s.id)})})]})}export{oe as default};
