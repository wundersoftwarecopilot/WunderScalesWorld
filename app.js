const SOURCES = [
  { name: "NYTimes", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: "world" },
  { name: "BBC", url: "http://feeds.bbci.co.uk/news/world/rss.xml", category: "world" },
  { name: "CNN", url: "http://rss.cnn.com/rss/edition_world.rss", category: "world" },
  { name: "TechCrunch", url: "http://feeds.feedburner.com/TechCrunch/", category: "tech" }
];

const API = "https://api.rss2json.com/v1/api.json?rss_url=";

const container = document.getElementById("news-container");
const tabsContainer = document.getElementById("tabs");

let ALL_ARTICLES = [];
let CURRENT_CATEGORY = "all";

async function loadAllFeeds() {
  container.innerHTML = "<p>Loading news...</p>";

  try {
    const requests = SOURCES.map(src =>
      fetch(API + encodeURIComponent(src.url))
        .then(res => res.json())
        .then(data => data.items.map(item => ({
          title: item.title,
          link: item.link,
          date: new Date(item.pubDate),
          source: src.name,
          category: src.category
        })))
    );

    const results = await Promise.all(requests);
    ALL_ARTICLES = results.flat();
    ALL_ARTICLES.sort((a, b) => b.date - a.date);
    renderArticles();

  } catch (err) {
    container.innerHTML = "<p>Failed to load news.</p>";
    console.error(err);
  }
}

function renderArticles() {
  container.innerHTML = "";

  const filtered = CURRENT_CATEGORY === "all"
    ? ALL_ARTICLES
    : ALL_ARTICLES.filter(a => a.category === CURRENT_CATEGORY);

  filtered.forEach(item => {
    const el = document.createElement("div");
    el.className = "article";

    el.innerHTML = `
      <h2>${item.title}</h2>
      <div class="meta">
        <span>${item.source}</span>
        <span>${item.date.toLocaleDateString()}</span>
      </div>
      <a href="${item.link}" target="_blank">Read →</a>
    `;

    container.appendChild(el);
  });
}

function setupTabs() {
  const categories = ["all", "world", "tech"];

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat.toUpperCase();

    btn.onclick = () => {
      CURRENT_CATEGORY = cat;
      renderArticles();

      document.querySelectorAll("#tabs button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
    };

    tabsContainer.appendChild(btn);
  });
}

setupTabs();
loadAllFeeds();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}