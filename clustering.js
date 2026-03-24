// Clustering + Trending system

export function normalizeTitle(title){
  return title.toLowerCase().replace(/[^a-z0-9 ]/g,"").split(" ").filter(w=>w.length>3);
}

export function clusterArticles(articles){
  const clusters=[];

  articles.forEach(article=>{
    const words=normalizeTitle(article.title);

    let matchedCluster=null;

    for(const cluster of clusters){
      const common=cluster.keywords.filter(w=>words.includes(w));

      if(common.length>=2){
        matchedCluster=cluster;
        break;
      }
    }

    if(matchedCluster){
      matchedCluster.articles.push(article);
      matchedCluster.score++;
    }else{
      clusters.push({
        keywords:words,
        articles:[article],
        score:1
      });
    }
  });

  return clusters;
}

export function rankClusters(clusters){
  return clusters
    .map(c=>{
      const recency=Math.max(...c.articles.map(a=>a.date.getTime()));
      return {
        ...c,
        trendingScore:c.score*2 + recency/1e12
      };
    })
    .sort((a,b)=>b.trendingScore-a.trendingScore);
}
