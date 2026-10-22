import Prism from "prismjs"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-json"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-bash"

// Languages offered in the lesson editor (value = what the backend stores)
export const CODE_LANGUAGES = [
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "React (JSX)" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Terminal" },
  { value: "", label: "Plain text" },
]

// Only these run in the browser sandbox
export const RUNNABLE = new Set(["html", "css", "javascript"])

export const languageLabel = (lang) => CODE_LANGUAGES.find((l) => l.value === (lang ?? ""))?.label ?? lang

const grammarKey = (lang) => (lang === "html" ? "markup" : lang)

// Highlighted HTML for a code string (escaped plain text when the language is unknown)
export function highlight(code = "", lang) {
  const grammar = Prism.languages[grammarKey(lang)]
  if (!grammar) return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return Prism.highlight(code, grammar, grammarKey(lang))
}

// Guards against a mislabelled block (e.g. CSS saved as "html"): guess from the code itself
export function detectLanguage(code = "", lang) {
  if (!RUNNABLE.has(lang)) return lang
  const src = code.trim()
  const looksHtml = /^<|<\/?[a-z][\w-]*[\s>/]/i.test(src)
  const looksCss = /^[^{}<]*\{[^{}]*[\w-]+\s*:\s*[^;{}]+;?[^{}]*\}/.test(src) && !/\b(function|const|let|var|=>|console\.)/.test(src)
  if (lang === "html" && !looksHtml) return looksCss ? "css" : "javascript"
  if (lang === "css" && looksHtml) return "html"
  if (lang === "javascript" && looksHtml) return "html"
  return lang
}

// Sample markup so a CSS-only example has something to style
export const SAMPLE_HTML = `<h1>This is a heading</h1>
<p>This is a paragraph with a <a href="#">link</a>.</p>
<div class="box">A div with class="box"</div>
<button>Button</button>
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>`

// A code block → the three playground parts. The block's own code fills its language's tab.
export function playgroundParts(block) {
  const lang = detectLanguage(block.code ?? "", block.language)
  const parts = { html: block.html ?? "", css: block.css ?? "", js: block.js ?? "" }
  if (lang === "html") parts.html = block.code ?? ""
  if (lang === "css") parts.css = block.code ?? ""
  if (lang === "javascript") parts.js = block.code ?? ""
  if (lang === "css" && !parts.html.trim()) parts.html = SAMPLE_HTML
  return { parts, main: lang === "javascript" ? "js" : lang }
}

const CONSOLE_BRIDGE = `<script>(function(){
  var send=function(level,args){try{parent.postMessage({__tryit:true,level:level,text:Array.prototype.map.call(args,function(a){
    if(a instanceof Error) return a.name+": "+a.message;
    if(typeof a==="object"){try{return JSON.stringify(a,null,2)}catch(e){return String(a)}}
    return String(a)}).join(" ")},"*")}catch(e){}};
  ["log","info","warn","error"].forEach(function(l){var o=console[l];console[l]=function(){send(l,arguments);o.apply(console,arguments)}});
  window.addEventListener("error",function(e){send("error",[e.message+(e.lineno?" (line "+e.lineno+")":"")])});
})();<\/script>`

// HTML + CSS + JS → one sandbox page (works whether the HTML is a full document or a fragment)
export function buildPlaygroundDoc({ html = "", css = "", js = "" }) {
  const style = css.trim() ? `<style>\n${css}\n</style>` : ""
  const script = js.trim() ? `<script>\n${js.replace(/<\/script/gi, "<\\/script")}\n<\/script>` : ""
  const base = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;line-height:1.5;margin:16px;color:#111}</style>`
  if (/<html[\s>]/i.test(html)) {
    let doc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${CONSOLE_BRIDGE}`) : html.replace(/<html[^>]*>/i, (m) => `${m}<head>${CONSOLE_BRIDGE}</head>`)
    doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, `${style}</head>`) : style + doc
    return /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${script}</body>`) : doc + script
  }
  return `<!doctype html><html><head>${base}${CONSOLE_BRIDGE}${style}</head><body>\n${html}\n${script}</body></html>`
}
