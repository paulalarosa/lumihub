import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

const envFile =
  process.env.SITEMAP_ENV_FILE ??
  (process.env.NODE_ENV === 'production' ? '.env.production' : '.env')
loadEnvFile(resolve(process.cwd(), envFile))
loadEnvFile(resolve(process.cwd(), '.env'))

const BASE_URL = 'https://khaoskontrol.com.br'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const today = new Date().toISOString().split('T')[0]

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/planos', priority: '0.9', changefreq: 'weekly' },
  { path: '/cadastro', priority: '0.9', changefreq: 'monthly' },
  { path: '/recursos', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'daily' },
  { path: '/ajuda', priority: '0.7', changefreq: 'weekly' },
  { path: '/contato', priority: '0.6', changefreq: 'monthly' },
  { path: '/login', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacidade', priority: '0.3', changefreq: 'yearly' },
  { path: '/termos', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies', priority: '0.3', changefreq: 'yearly' },
  { path: '/reembolso', priority: '0.3', changefreq: 'yearly' },
  { path: '/seguranca', priority: '0.3', changefreq: 'yearly' },
  { path: '/dpa', priority: '0.3', changefreq: 'yearly' },
]

async function fetchBlogPosts(supabase) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, published_at, updated_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.warn('[sitemap] Failed to fetch blog posts:', error.message)
    return []
  }
  return data ?? []
}

async function fetchHelpArticles(supabase) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('slug, updated_at')
    .eq('is_published', true)
    .not('slug', 'is', null)

  if (error) {
    console.warn('[sitemap] Failed to fetch help articles:', error.message)
    return []
  }
  return data ?? []
}

function urlXml(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function generate() {
  const staticXml = STATIC_ROUTES.map((r) =>
    urlXml(`${BASE_URL}${r.path}`, today, r.changefreq, r.priority),
  ).join('\n')

  let posts = []
  let articles = []
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    posts = await fetchBlogPosts(supabase)
    articles = await fetchHelpArticles(supabase)
  } else {
    console.warn('[sitemap] Supabase env missing, skipping dynamic URLs')
  }

  const postXml = posts
    .map((p) => {
      const lastmod = (p.updated_at ?? p.published_at ?? today).split('T')[0]
      return urlXml(`${BASE_URL}/blog/${p.slug}`, lastmod, 'monthly', '0.7')
    })
    .join('\n')

  const articleXml = articles
    .map((a) => {
      const lastmod = (a.updated_at ?? today).split('T')[0]
      return urlXml(`${BASE_URL}/ajuda/${a.slug}`, lastmod, 'monthly', '0.6')
    })
    .join('\n')

  const bodyParts = [staticXml, postXml, articleXml].filter(Boolean)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${bodyParts.join('\n')}
</urlset>
`

  const target = resolve(process.cwd(), 'public/sitemap.xml')
  writeFileSync(target, xml, 'utf8')
  console.log(
    `[sitemap] Wrote ${STATIC_ROUTES.length} static + ${posts.length} blog + ${articles.length} help URLs to public/sitemap.xml`,
  )
}

generate().catch((err) => {
  console.error('[sitemap] Generation failed:', err)
  process.exit(1)
})
