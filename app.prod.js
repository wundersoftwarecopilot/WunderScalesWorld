// Production-ready version
const SOURCES=[{name:"NYTimes",url:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml",category:"world"},{name:"BBC",url:"http://feeds.bbci.co.uk/news/world/rss.xml",category:"world"},{name:"CNN",url:"http://rss.cnn.com/rss/edition_world.rss",category:"world"},{name:"TechCrunch",url:"http://feeds.feedburner.com/TechCrunch/",category:"tech"}];

const API="https://YOUR-CLOUDFLARE-WORKER.workers.dev?url=";

const container=document.getElementById("news-container");
const tabsContainer=document.getElementById("tabs");

let ALL_ARTICLES=[];
let CURRENT_CATEGORY="all";

async function fetchFeed(src){
 try{
  const res=await fetch(API+encodeURIComponent(src.url));
  if(!res.ok)throw new Error();

  const xml=await res.text();
  const doc=new DOMParser().parseFromString(xml,"text/xml");

  const items=[...doc.querySelectorAll("item")];

  return items.map(item=>({
    title:item.querySelector("title")?.textContent||"No title",
    link:item.querySelector("link")?.textContent||"#",
    date:new Date(item.querySelector("pubDate")?.textContent||Date.now()),
    source:src.name,
    category:src.category
  }));

 }catch(e){
  return[];
 }
}

function deduplicate(arr){
 const seen=new Set();
 return arr.filter(a=>{
  const k=a.title.toLowerCase();
  if(seen.has(k))return false;
  seen.add(k);
  return true;
 });
}

async function loadAllFeeds(){
 container.innerHTML="<p>Loading...</p>";

 const results=await Promise.all(SOURCES.map(fetchFeed));

 ALL_ARTICLES=deduplicate(results.flat());

 if(!ALL_ARTICLES.length){
  container.innerHTML="<p>No news available</p>";
  return;
 }

 ALL_ARTICLES.sort((a,b)=>b.date-a.date);
 renderArticles();
}

function renderArticles(){
 container.innerHTML="";

 const filtered=CURRENT_CATEGORY==="all"?ALL_ARTICLES:ALL_ARTICLES.filter(a=>a.category===CURRENT_CATEGORY);

 filtered.forEach(item=>{
  const el=document.createElement("div");
  el.className="article";
  el.innerHTML=`<h2>${item.title}</h2><div class="meta"><span>${item.source}</span><span>${item.date.toLocaleDateString()}</span></div><a href="${item.link}" target="_blank">Read →</a>`;
  container.appendChild(el);
 });
}

function setupTabs(){
 ["all","world","tech"].forEach(cat=>{
  const btn=document.createElement("button");
  btn.textContent=cat.toUpperCase();
  btn.onclick=()=>{
    CURRENT_CATEGORY=cat;
    renderArticles();
    document.querySelectorAll("#tabs button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  };
  tabsContainer.appendChild(btn);
 });
}

setupTabs();
loadAllFeeds();

if("serviceWorker" in navigator){
 navigator.serviceWorker.register("sw.js");
}