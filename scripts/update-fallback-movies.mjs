// GitHub Actionsから定期的に実行し、TMDbの人気作品をもとに fallback-movies.json を自動生成するスクリプト。
// 生成したJSONは、アプリ側(TMDb/iTunesの両方が失敗した場合の最終フォールバック)に読み込まれる。
//
// 使い方: TMDB_API_KEY環境変数を渡して実行する。
//   TMDB_API_KEY=xxxx node update-fallback-movies.mjs

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("環境変数 TMDB_API_KEY が設定されていません。");
  process.exit(1);
}

// index.html側の TMDB_GENRE_MAP と同じ対応表
const GENRE_MAP = {
  anxiety:    [18],
  sadness:    [18],
  tired:      [18, 10751],
  loneliness: [18],
  anger:      [53, 80],
  stagnation: [18, 10749],
  adventure:  [12, 28],
  calm:       [18, 10751],
  confusion:  [18, 9648],
  gratitude:  [10751, 18],
  joy:        [35, 10751],
  fun:        [35, 16]
};

const MOVIES_PER_CATEGORY = 6;

function timeBucketFromRuntime(minutes) {
  if (!minutes) return "medium";
  if (minutes <= 100) return "short";
  if (minutes <= 140) return "medium";
  return "long";
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDb API error ${res.status} for ${url}`);
  }
  return res.json();
}

// カテゴリごとに人気順で映画候補を取得する
async function discoverPopularMovies(genres) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=ja-JP&region=JP&sort_by=popularity.desc&include_adult=false&vote_count.gte=100&with_genres=${genres.join('|')}&page=1`;
  const data = await fetchJson(url);
  return data.results || [];
}

// 監督名・上映時間など、一覧APIには含まれない詳細情報を1回の呼び出しでまとめて取得する
async function fetchMovieDetail(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=ja-JP&append_to_response=credits`;
  return fetchJson(url);
}

function pickDirector(detail) {
  const crew = (detail.credits && detail.credits.crew) || [];
  const director = crew.find(c => c.job === "Director");
  return director ? director.name : null;
}

function truncate(text, max) {
  if (!text) return null;
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function buildCategory(catKey, genres) {
  console.log(`[${catKey}] 人気作品を取得中...`);
  const candidates = await discoverPopularMovies(genres);
  const picked = candidates.slice(0, MOVIES_PER_CATEGORY);

  const movies = [];
  for (const c of picked) {
    try {
      const detail = await fetchMovieDetail(c.id);
      movies.push({
        title: detail.title,
        director: pickDirector(detail),
        year: detail.release_date ? detail.release_date.slice(0, 4) : "",
        why: truncate(detail.overview, 90) || "TMDbにあらすじの登録がありませんでした。",
        time: timeBucketFromRuntime(detail.runtime),
        outcome: null,
        cover: detail.poster_path ? `https://image.tmdb.org/t/p/w200${detail.poster_path}` : null,
        link: `https://www.themoviedb.org/movie/${detail.id}?language=ja-JP`,
        tmdbId: detail.id
      });
    } catch (err) {
      console.warn(`  - id=${c.id} の詳細取得に失敗: ${err.message}`);
    }
  }
  console.log(`[${catKey}] ${movies.length}件取得完了`);
  return movies;
}

async function main() {
  const categories = {};
  for (const [catKey, genres] of Object.entries(GENRE_MAP)) {
    categories[catKey] = await buildCategory(catKey, genres);
    // TMDbのレート制限に配慮して少し間隔をあける
    await new Promise(r => setTimeout(r, 250));
  }

  const output = {
    updatedAt: new Date().toISOString().slice(0, 10),
    source: "TMDb popularity ranking (auto-generated)",
    categories
  };

  const fs = await import("node:fs/promises");
  await fs.writeFile("fallback-movies.json", JSON.stringify(output, null, 2), "utf-8");
  console.log("fallback-movies.json を書き出しました。");
}

main().catch(err => {
  console.error("更新に失敗しました:", err);
  process.exit(1);
});
