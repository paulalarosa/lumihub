import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Google_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
    console.error('❌ Missing environment variables. Please check .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function ingestKnowledgeBase() {
    const docsDir = path.join(process.cwd(), 'docs/kb');

    if (!fs.existsSync(docsDir)) {
        console.error(`❌ Docs directory not found: ${docsDir}`);
        process.exit(1);
    }

    const files = getAllMarkdownFiles(docsDir);
    console.log(`📚 Found ${files.length} documents for ingestion...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            const { data: frontmatter, content: markdown } = matter(content);

            if (!frontmatter.title) {
                console.warn(`⚠️ Skipping ${path.basename(file)}: Missing title in frontmatter`);
                continue;
            }

            console.log(`Processing: ${frontmatter.title}...`);

            // Generate embedding
            const result = await model.embedContent(markdown);
            const embedding = result.embedding.values;

            // Upsert to Supabase
            const { error } = await supabase
                .from('knowledge_base')
                .upsert({
                    title: frontmatter.title,
                    category: frontmatter.category || 'general',
                    tags: frontmatter.tags || [],
                    content: markdown,
                    embedding,
                    metadata: { file_path: path.relative(process.cwd(), file) },
                }, { onConflict: 'title' }); // Assuming title is unique enough for now, or use ID if available in frontmatter

            if (error) {
                console.error(`❌ Error inserting ${frontmatter.title}:`, error.message);
                failCount++;
            } else {
                console.log(`✅ Ingested: ${frontmatter.title}`);
                successCount++;
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error(`❌ Fatal error processing ${file}:`, errorMessage);
            failCount++;
        }
    }

    console.log(`\n🎉 Ingestion Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

function getAllMarkdownFiles(dir: string): string[] {
    let files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getAllMarkdownFiles(fullPath));
        } else if (item.endsWith('.md')) {
            files.push(fullPath);
        }
    }

    return files;
}

ingestKnowledgeBase();
