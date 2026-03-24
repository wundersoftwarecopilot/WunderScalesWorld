import {clusterArticles,rankClusters} from './clustering.js';

// reuse previous config
const SOURCES=[{name:"NYTimes",url:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml",category:"world"},{name:"BBC",url:"http://feeds.bbci.co.uk/news/world/rss.xml",category:"world"},{name:"CNN",url:"http://rss.cnn.com/rss/edition_world.rss",category:"world"},{name:"TechCrunch",url:"http://feeds.feedburner.com/TechCrunch/",category:"tech"}];

const API="https://YOUR-CLOUDFLARE-WORKER.workers.dev?url=";

const container=document.getElementById("news-container");

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
    source:src.name
  }));
 }catch(e){return[]}
}

async function load(){
 container.innerHTML="<p>Loading...</p>";

 const results=await Promise.all(SOURCES.map(fetchFeed));
 const articles=results.flat();

 const clusters=rankClusters(clusterArticles(articles));

 renderClusters(clusters);
}

function renderClusters(clusters){
 container.innerHTML="";

 clusters.slice(0,10).forEach(cluster=>{
  const main=cluster.articles[0];

  const el=document.createElement("div");
  el.className="card";

  el.innerHTML=`
   <img src="${main.image}" />
   <div class="card-content">
    <h2>${main.title}</h2>
    <div class="meta">🔥 ${cluster.articles.length} sources</div>
    <a href="${main.link}" target="_blank">Read main story →</a>
   </div>
  `;

  container.appendChild(el);
 });
}

load();