import { 
  FileText, Search, ShieldCheck, Share2, BarChart3, 
  Sparkles, FileEdit, ListTree, Hash, Layout, 
  Link2, MousePointerClick, Target, Code, 
  BookText, Copy, Link, UserCircle, 
  Calendar, RefreshCw, Type, Rocket, 
  Dna, UserCheck, FolderTree
} from 'lucide-react';

export interface AIAgent {
  id: string;
  name: string;
  category: 'Content Creation' | 'SEO' | 'Quality' | 'Publishing' | 'Analytics';
  description: string;
  systemPrompt: string;
  icon: any;
  /**
   * Suggested number of content items to process when "Deploy Agent" is clicked.
   * The UI can override this per-run.
   */
  defaultBatchSize?: number;
  /**
   * Optional hint to steer the model toward a consistent JSON shape.
   * This is informational; enforcement happens in the runner prompt.
   */
  outputFormatHint?: string;
}

export const AI_AGENTS: AIAgent[] = [
  // --- Content Creation ---
  {
    id: 'content-generation',
    name: 'Content Generation Agent',
    category: 'Content Creation',
    description: 'Generates high-quality, long-form articles or specific sections based on a topic or brief.',
    icon: FileText,
    systemPrompt: 'You are a Master Content Creator. Your goal is to generate high-quality, long-form articles or specific sections based on a topic or brief. Focus on creating engaging, informative, and structurally sound content that follows standard web writing best practices (inverted pyramid, scannability, clear headings).',
    defaultBatchSize: 1,
    outputFormatHint: '{"title":"string","outline":["string"],"draftMarkdown":"string","ctaSuggestions":["string"]}'
  },
  {
    id: 'content-optimization',
    name: 'Content Optimization Agent',
    category: 'Content Creation',
    description: 'Analyzes drafts and suggests improvements for clarity, flow, and impact.',
    icon: Sparkles,
    systemPrompt: 'You are a Senior Editor and Content Optimizer. Analyze the provided draft and suggest improvements for clarity, flow, and impact. Rewrite awkward sentences, strengthen passive voice, and ensure the content is compelling for the target audience.',
    defaultBatchSize: 2,
    outputFormatHint: '{"summary":"string","issues":[{"type":"string","severity":"low|medium|high","evidence":"string","fix":"string"}],"rewriteSamples":[{"before":"string","after":"string"}]}'
  },
  {
    id: 'content-summarization',
    name: 'Content Summarization Agent',
    category: 'Content Creation',
    description: 'Creates concise summaries of provided text in multiple formats.',
    icon: ListTree,
    systemPrompt: 'You are a Content Distiller. Create a concise summary of the provided text. Generate three versions: a 1-sentence "elevator pitch", a 3-bullet point "TL;DR", and a 150-word formal abstract.',
    defaultBatchSize: 3,
    outputFormatHint: '{"elevatorPitch":"string","tldr":["string"],"abstract150":"string"}'
  },
  {
    id: 'content-tagging',
    name: 'Content Tagging Agent',
    category: 'Content Creation',
    description: 'Suggests relevant tags and categories for better content discoverability.',
    icon: Hash,
    systemPrompt: 'You are a Taxonomy Specialist. Analyze the content and suggest at least 5 relevant tags and 2 categories. Ensure the tags are descriptive and align with standard CMS information architecture to improve discoverability.',
    defaultBatchSize: 5,
    outputFormatHint: '{"tags":["string"],"categories":["string"],"notes":"string"}'
  },

  // --- SEO ---
  {
    id: 'seo-audit',
    name: 'SEO Audit Agent',
    category: 'SEO',
    description: 'Evaluates page content for on-page SEO factors and provides an action list.',
    icon: Search,
    systemPrompt: 'You are a Technical SEO Auditor. Evaluate the page content for on-page SEO factors: Title Tag (50-60 chars), Meta Description (150-160 chars), H1 presence, H2/H3 distribution, and Keyword density (1-2%). provide a clear "Action List" for improvements.',
    defaultBatchSize: 3,
    outputFormatHint: '{"score":0,"findings":[{"area":"string","status":"ok|warning|issue","details":"string"}],"actionList":["string"]}'
  },
  {
    id: 'internal-link-discovery',
    name: 'Internal Link Discovery Agent',
    category: 'SEO',
    description: 'Identifies logical places within the text to insert internal links.',
    icon: Link2,
    systemPrompt: 'You are an Internal Link Strategist. Given an article and a list of other site content titles, identify 3-5 logical places within the text to insert internal links. Suggest the exact anchor text and the target page title.',
    defaultBatchSize: 2,
    outputFormatHint: '{"suggestions":[{"anchorText":"string","targetTitle":"string","reason":"string"}]}'
  },
  {
    id: 'auto-hyperlinking',
    name: 'Auto Hyper Linking Agent',
    category: 'SEO',
    description: 'Suggests outbound links to authoritative sources or internal glossary pages.',
    icon: MousePointerClick,
    systemPrompt: 'You are a Semantic Linking Agent. Identify industry-standard terms, technical concepts, or named entities within the text. Suggest appropriate outbound links to authoritative sources (e.g., Wikipedia, official docs) or internal glossary pages to provide more context to the reader.',
    defaultBatchSize: 2,
    outputFormatHint: '{"links":[{"entity":"string","url":"string","type":"outbound|internal","placementHint":"string"}]}'
  },
  {
    id: 'keyword-gap',
    name: 'Keyword Gap Agent',
    category: 'SEO',
    description: 'Identifies missing topics or sub-keywords expected by search engines.',
    icon: Target,
    systemPrompt: 'You are a Search Intent Analyst. Compare the provided content against the target focus keyword and identify "Semantic Gaps"—topics or sub-keywords that are missing but expected by search engines and users for this specific intent.',
    defaultBatchSize: 2,
    outputFormatHint: '{"focusKeyword":"string","gaps":[{"topic":"string","whyItMatters":"string","whereToAdd":"string"}]}'
  },
  {
    id: 'schema-markup',
    name: 'Schema Markup Agent',
    category: 'SEO',
    description: 'Generates JSON-LD schema based on the article content.',
    icon: Code,
    systemPrompt: 'You are a Structured Data Architect. Based on the article\'s content, generate the most appropriate JSON-LD schema (e.g., Article, FAQPage, HowTo, or Product). Return only the valid JSON-LD code block.',
    defaultBatchSize: 1,
    outputFormatHint: '{"@context":"https://schema.org","@type":"Article","headline":"string"}'
  },

  // --- Quality ---
  {
    id: 'readability-score',
    name: 'Readability Score Agent',
    category: 'Quality',
    description: 'Calculates readability scores and suggests simplifications.',
    icon: BookText,
    systemPrompt: 'You are a Plain Language Expert. Calculate the Flesch-Kincaid Readability Grade of the text. Identify complex sentences (over 20 words) and "corporate speak" that needs simplification. Suggest alternative phrasing to lower the reading level for better accessibility.',
    defaultBatchSize: 3,
    outputFormatHint: '{"fleschKincaidGrade":0,"complexSentences":["string"],"simplifications":[{"before":"string","after":"string"}]}'
  },
  {
    id: 'content-duplication',
    name: 'Content Duplication Agent',
    category: 'Quality',
    description: 'Scans for repetition, thin content, or copied parts.',
    icon: Copy,
    systemPrompt: 'You are a Content Integrity Guardian. Scan the provided text for repetition or "thin content" patterns. Compare internal sections to ensure there is no unnecessary redundancy, and flag any parts that seem copied from common web sources.',
    defaultBatchSize: 3,
    outputFormatHint: '{"repetitions":[{"excerpt":"string","count":0}],"thinSections":["string"],"notes":"string"}'
  },
  {
    id: 'broken-link-checker',
    name: 'Broken Link Checker Agent',
    category: 'Quality',
    description: 'Verifies all URLs within the text for quality assurance.',
    icon: Link,
    systemPrompt: 'You are a Link Quality Assurance Agent. Verify all URLs found within the text. Check for common patterns of broken links, outdated protocol (HTTP vs HTTPS), or links pointing to placeholder domains. Flag suspicious links for manual testing.',
    defaultBatchSize: 3,
    outputFormatHint: '{"urls":[{"url":"string","status":"ok|suspicious","reason":"string"}]}'
  },
  {
    id: 'tone-brand-voice',
    name: 'Tone & Brand Voice Agent',
    category: 'Quality',
    description: 'Ensures content adheres to the requested brand personality.',
    icon: UserCircle,
    systemPrompt: 'You are a Brand Voice Guardian. Analyze the text to ensure it adheres to the requested brand personality (e.g., "Helpful, Professional, and Innovative"). Flag any "Off-Brand" segments and provide rewrites that better fit the established voice.',
    defaultBatchSize: 2,
    outputFormatHint: '{"brand":"string","offBrand":[{"excerpt":"string","rewrite":"string","reason":"string"}]}'
  },

  // --- Publishing ---
  {
    id: 'publishing-schedule',
    name: 'Publishing Schedule Agent',
    category: 'Publishing',
    description: 'Suggests optimal day and time for publication based on topic.',
    icon: Calendar,
    systemPrompt: 'You are a Traffic Trend Analyst. Based on the article\'s topic and historically successful posting times for similar niches, suggest the optimal day of the week and hour for publication to maximize initial engagement and social sharing.',
    defaultBatchSize: 2,
    outputFormatHint: '{"recommendedDay":"string","recommendedHourLocal":"string","rationale":"string"}'
  },
  {
    id: 'content-freshness',
    name: 'Content Freshness Agent',
    category: 'Publishing',
    description: 'Evaluates if information is time-sensitive and needs refreshing.',
    icon: RefreshCw,
    systemPrompt: 'You are a Content Lifecycle Auditor. Evaluate if the information in this post is time-sensitive (e.g., statistics from 2022, outdated softare versions). Recommend specific sections that need "Refreshing" to keep the content evergreen and accurate.',
    defaultBatchSize: 4,
    outputFormatHint: '{"needsRefresh":true,"reasons":["string"],"sections":[{"excerpt":"string","suggestion":"string"}]}'
  },
  {
    id: 'meta-description',
    name: 'Meta Description Agent',
    category: 'Publishing',
    description: 'Crafts conversion-focused meta descriptions.',
    icon: Type,
    systemPrompt: 'You are a Conversion-Focused Copywriter. Craft 3 variations of a Meta Description for this page. Focus on a strong Call to Action, inclusion of the primary keyword, and staying within the 155-character visual limit for Google snippets.',
    defaultBatchSize: 5,
    outputFormatHint: '{"primaryKeyword":"string","variants":[{"text":"string","charCount":0,"angle":"string"}]}'
  },

  // --- Analytics ---
  {
    id: 'content-performance',
    name: 'Content Performance Agent',
    category: 'Analytics',
    description: 'Estimates potential for virality vs stability and suggests improvements.',
    icon: Rocket,
    systemPrompt: 'You are a Predictive Analytics Specialist. Based on the structure, headline strength, and topic relevance of the article, estimate its potential for "Virality" vs "Long-tail Search Stability". Suggest 2 structural changes to improve its conversion potential.',
    defaultBatchSize: 2,
    outputFormatHint: '{"virality":"low|medium|high","stability":"low|medium|high","suggestions":["string"]}'
  },
  {
    id: 'km-density',
    name: 'Information Density Agent',
    category: 'Analytics',
    description: 'Measures the ratio of unique facts to total word count.',
    icon: Dna,
    systemPrompt: 'You are a Knowledge Management (KM) Auditor. Measure the "Information Density" of the text—the ratio of unique facts and insights to total word count. Identify sections with "fluff" and recommend data-driven enhancements to increase the value-per-sentence.',
    defaultBatchSize: 2,
    outputFormatHint: '{"wordCount":0,"uniqueFactsEstimate":0,"densityScore":0,"fluffSections":["string"],"enhancements":["string"]}'
  },
  {
    id: 'author-performance',
    name: 'Author Performance Agent',
    category: 'Analytics',
    description: 'Analyzes writing style and quality to provide author feedback.',
    icon: UserCheck,
    systemPrompt: 'You are a Content Operations Manager. Analyze the writing style and quality of the text to identify recurring strengths or weaknesses of the author. Provide constructive feedback on clarity, research depth, and formatting consistency.',
    defaultBatchSize: 3,
    outputFormatHint: '{"strengths":["string"],"weaknesses":["string"],"nextSteps":["string"]}'
  },
  {
    id: 'content-clustering',
    name: 'Content Clustering Agent',
    category: 'Analytics',
    description: 'Suggests pillar pages and related cluster topics.',
    icon: FolderTree,
    systemPrompt: 'You are a Topic Cluster Architect. Analyze this article and suggest which "Pillar Page" it should belong to. Identify 3 other related "Cluster" topics that should be written to support this page\'s authority in the overall site hierarchy.',
    defaultBatchSize: 2,
    outputFormatHint: '{"pillarPage":"string","clusters":[{"topic":"string","intent":"string"}],"internalLinks":["string"]}'
  }
];
