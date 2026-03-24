// Next-level UI version with image fallback + skeleton loading + better UX
const SOURCES=[{name:"NYTimes",url:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml",category:"world"},{name:"BBC",url:"http://feeds.bbci.co.uk/news/world/rss.xml",category:"world"},{name:"CNN",url:"http://rss.cnn.com/rss/edition_world.rss",category:"world"},{name:"TechCrunch",url:"http://feeds.feedburner.com/TechCrunch/",category:"tech"}];

const API="https://YOUR-CLOUDFLARE-WORKER.workers.dev?url=";

const container=document.getElementById("news-container");
const tabsContainer=document.getElementById("tabs");

let ALL_ARTICLES=[];
let CURRENT_CATEGORY="all";

function extractImage(item){
 return item.querySelector("media\\:content")?.getAttribute("url")||item.querySelector("enclosure")?.getAttribute("url")||"https://via.placeholder.com/400x200?text=News";
}

async function fetchFeed(src){
 try{
  const res=await fetch(API+encodeURIComponent(src.url));
  const xml=await res.text();
  const doc=new DOMParser().parseFromString(xml,"text/xml");
  const items=[...doc.querySelectorAll("item")];

  return items.map(item=>({
    title:item.querySelector("title")?.textContent||"No title",
    link:item.querySelector("link")?.textContent||"#",
    date:new Date(item.querySelector("pubDate")?.textContent||Date.now()),
    image:extractImage(item),
    source:src.name,
    category:src.category
  }));
 }catch(e){return[]}
}

function skeleton(){
 container.innerHTML="";
 for(let i=0;i<5;i++){
  const el=document.createElement("div");
  el.className="card skeleton";
  el.innerHTML=`<div class="img"></div><div class="content"><div class="line"></div><div class="line short"></div></div>`;
  container.appendChild(el);
 }
}

function deduplicate(arr){
 const seen=new Set();
 return arr.filter(a=>{const k=a.title.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
}

async function loadAllFeeds(){
 skeleton();
 const results=await Promise.all(SOURCES.map(fetchFeed));
 ALL_ARTICLES=deduplicate(results.flat());
 ALL_ARTICLES.sort((a,b)=>b.date-a.date);
 renderArticles();
}

function renderArticles(){
 container.innerHTML="";
 const filtered=CURRENT_CATEGORY==="all"?ALL_ARTICLES:ALL_ARTICLES.filter(a=>a.category===CURRENT_CATEGORY);

 filtered.forEach(item=>{
  const el=document.createElement("div");
  el.className="card";
  el.innerHTML=`
   <img src="${item.image}" loading="lazy" />
   <div class="card-content">
    <h2>${item.title}</h2>
    <div class="meta"><span>${item.source}</span><span>${item.date.toLocaleDateString()}</span></div>
    <a href="${item.link}" target="_blank">Read →</a>
   </div>`;
  container.appendChild(el);
 });
}

function setupTabs(){
 ["all","world","tech"].forEach(cat=>{
  const btn=document.createElement("button");
  btn.textContent=cat.toUpperCase();
  btn.onclick=()=>{CURRENT_CATEGORY=cat;renderArticles();document.querySelectorAll("#tabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");};
  tabsContainer.appendChild(btn);
 });
}

setupTabs();
loadAllFeeds();

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js");}