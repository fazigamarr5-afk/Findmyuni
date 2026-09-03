import { supabase } from '../supabase';

/**
 * Blog Service — CRUD + SEO queries for the blog section.
 */
class BlogService {
  /**
   * Get all published posts (paginated).
   */
  async getPosts({ page = 1, limit = 12, category = null, search = null } = {}) {
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      posts: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get a single post by slug.
   */
  async getPostBySlug(slug) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Get a single post by ID (admin).
   */
  async getPostById(id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Get featured posts for homepage.
   */
  async getFeaturedPosts(limit = 3) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent posts.
   */
  async getRecentPosts(limit = 5, excludeSlug = null) {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (excludeSlug) {
      query = query.neq('slug', excludeSlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get all categories with counts.
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('published', true);
    if (error) throw error;

    const counts = {};
    (data || []).forEach(post => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  /**
   * Increment view count.
   */
  async incrementViews(postId) {
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('views')
        .eq('id', postId)
        .single();
      
      if (data) {
        await supabase
          .from('blog_posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', postId);
      }
    } catch (e) {
      console.warn('Failed to increment blog views:', e);
    }
  }

  /**
   * Admin: create post.
   */
  async createPost(postData) {
    const slug = this._generateSlug(postData.title);
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ ...postData, slug, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Admin: update post.
   */
  async updatePost(id, postData) {
    if (postData.title && !postData.slug) {
      postData.slug = this._generateSlug(postData.title);
    }
    postData.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('blog_posts')
      .update(postData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Admin: delete post.
   */
  async deletePost(id) {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
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

export const blogService = new BlogService();
export default blogService;
