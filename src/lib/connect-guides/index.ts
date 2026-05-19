export type PlatformWithGuide =
  | 'shopify'
  | 'trendyol'
  | 'hepsiburada'
  | 'etsy'
  | 'instagram';

export interface GuideStep {
  tr: string;
  en: string;
  screenshot?: string; // path under /public, e.g. /connect-guides/shopify-1.png
  copySnippet?: string;
}

export interface ConnectGuide {
  title:    { tr: string; en: string };
  blurb:    { tr: string; en: string };
  adminUrl: string;
  steps:    GuideStep[];
}

import { guide as shopify }     from './shopify';
import { guide as trendyol }    from './trendyol';
import { guide as hepsiburada } from './hepsiburada';
import { guide as etsy }        from './etsy';
import { guide as instagram }   from './instagram';

export const GUIDES: Record<PlatformWithGuide, ConnectGuide> = {
  shopify,
  trendyol,
  hepsiburada,
  etsy,
  instagram,
};
