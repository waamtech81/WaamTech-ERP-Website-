export type NavItem = {
  title: string;
  href: string;
  description?: string;
  icon?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  status: "available" | "coming-soon";
};

export type Industry = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  benefits: string[];
};

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  popular?: boolean;
  cta: string;
  href: string;
  features: string[];
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
};

export type CaseStudy = {
  id: string;
  title: string;
  industry: string;
  result: string;
  metric: string;
  description: string;
};

export type DocCategory = {
  id: string;
  title: string;
  description: string;
  articles: { title: string; href: string }[];
};

export type KbArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  popular?: boolean;
};
