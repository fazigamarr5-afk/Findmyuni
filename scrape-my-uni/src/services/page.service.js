import { supabase } from '../supabase';

/**
 * PageService — CRUD for CMS site pages (About, Contact, FAQ, etc.)
 */
class PageService {
  /**
   * Get all pages (admin — includes unpublished).
   */
  async getAllPages() {
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .order('nav_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  /**
   * Get published pages only (public).
   */
  async getPublishedPages() {
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('published', true)
      .order('nav_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  /**
   * Get pages shown in navigation.
   */
  async getNavPages() {
    const { data, error } = await supabase
      .from('site_pages')
      .select('id, title, slug')
      .eq('published', true)
      .eq('show_in_nav', true)
      .order('nav_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single page by slug.
   */
  async getPageBySlug(slug) {
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Get a single page by ID (admin).
   */
  async getPageById(id) {
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Create a new page.
   */
  async createPage(pageData) {
    const slug = pageData.slug || this._generateSlug(pageData.title);
    const { data, error } = await supabase
      .from('site_pages')
      .insert({ ...pageData, slug, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Update an existing page.
   */
  async updatePage(id, pageData) {
    if (pageData.title && !pageData.slug) {
      pageData.slug = this._generateSlug(pageData.title);
    }
    pageData.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('site_pages')
      .update(pageData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Delete a page.
   */
  async deletePage(id) {
    const { error } = await supabase.from('site_pages').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Generate SEO-friendly slug from title.
   */
  _generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 120);
  }
}

export const pageService = new PageService();
export default pageService;
