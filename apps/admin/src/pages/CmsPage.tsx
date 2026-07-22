import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { RichTextEditor } from '../components/RichTextEditor';
import { adminApi } from '../lib/api';
import { confirmDelete } from '../lib/confirm';

type Tab = 'slides' | 'policies' | 'pages' | 'blog';

type CmsPageRow = {
  id: string;
  slug: string;
  type?: string;
  titleAr: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
};

const LEGAL_TYPES = new Set(['terms', 'privacy', 'shipping', 'pricing', 'cancellation', 'refund']);

const POLICY_LABELS: Record<string, string> = {
  'terms-and-conditions': 'الشروط والأحكام',
  'privacy-policy': 'سياسة الخصوصية',
  'shipping-policy': 'التوصيل والشحن',
  'pricing-policy': 'الأسعار والخدمات',
  'cancellation-policy': 'إلغاء الطلبات',
};

export function CmsPage() {
  const [tab, setTab] = useState<Tab>('policies');
  const [slides, setSlides] = useState<Array<{ id: string; titleAr?: string; imageUrl: string; ctaText?: string; ctaLink?: string }>>([]);
  const [pages, setPages] = useState<CmsPageRow[]>([]);
  const [posts, setPosts] = useState<
    Array<{ id: string; slug: string; titleAr: string; bodyAr?: string; isPublished: boolean }>
  >([]);

  const [slideForm, setSlideForm] = useState({ imageUrl: '', titleAr: '', ctaText: 'تسوق الآن', ctaLink: '/store' });
  const [pageForm, setPageForm] = useState({ slug: '', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' });
  const [blogForm, setBlogForm] = useState({ slug: '', titleAr: '', bodyAr: '' });

  const [editSlide, setEditSlide] = useState<(typeof slides)[0] | null>(null);
  const [editPage, setEditPage] = useState<CmsPageRow | null>(null);
  const [editPost, setEditPost] = useState<(typeof posts)[0] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const policies = useMemo(
    () =>
      pages
        .filter((p) => LEGAL_TYPES.has(p.type ?? '') || POLICY_LABELS[p.slug])
        .sort((a, b) => a.slug.localeCompare(b.slug)),
    [pages],
  );

  const customPages = useMemo(
    () => pages.filter((p) => !LEGAL_TYPES.has(p.type ?? '') && !POLICY_LABELS[p.slug]),
    [pages],
  );

  const load = async () => {
    const [s, p, b] = await Promise.all([adminApi.getHeroSlides(), adminApi.getCmsPages(), adminApi.getBlogPosts()]);
    setSlides(s.data as typeof slides);
    setPages(p.data as CmsPageRow[]);
    setPosts(b.data as typeof posts);
  };

  useEffect(() => {
    load();
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'policies', label: 'السياسات القانونية', icon: 'mdi:scale-balance' },
    { id: 'slides', label: 'شرائح الرئيسية', icon: 'mdi:image-multiple-outline' },
    { id: 'pages', label: 'صفحات ثابتة', icon: 'mdi:file-document-outline' },
    { id: 'blog', label: 'المدونة', icon: 'mdi:post-outline' },
  ];

  const savePage = async (page: CmsPageRow) => {
    setSaving(true);
    setSaveMsg('');
    try {
      await adminApi.updateCmsPage(page.id, {
        titleAr: page.titleAr,
        titleEn: page.titleEn ?? page.titleAr,
        bodyAr: page.bodyAr ?? '',
        bodyEn: page.bodyEn ?? page.bodyAr ?? '',
      });
      setSaveMsg('تم الحفظ');
      setEditPage(null);
      await load();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="إدارة المحتوى"
        description="السياسات القانونية (عربي / إنجليزي)، الشرائح، الصفحات، والمدونة"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-primary text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
            }`}
          >
            <Icon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'policies' && (
        <section className="space-y-4">
          <p className="text-sm text-slate-600">
            صفحات مطلوبة لبوابات الدفع ومتاجر الأردن — عدّل النص بالعربية والإنجليزية. الروابط العامة:{' '}
            <code className="rounded bg-slate-100 px-1 text-xs" dir="ltr">
              /pages/&#123;slug&#125;
            </code>
          </p>
          {policies.length === 0 ? (
            <div className="admin-card p-6 text-sm text-slate-600">
              لا توجد سياسات بعد. شغّل على الخادم:{' '}
              <code className="rounded bg-slate-100 px-1" dir="ltr">
                npm run db:seed-policies -w @half-dinar/api
              </code>
            </div>
          ) : (
            <ul className="space-y-2">
              {policies.map((p) => (
                <li key={p.id} className="admin-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{POLICY_LABELS[p.slug] ?? p.titleAr}</p>
                    <p className="mt-0.5 text-xs text-slate-500" dir="ltr">
                      /pages/{p.slug} · {p.titleEn || '—'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={`https://mawjood.online/pages/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:underline"
                    >
                      معاينة
                    </a>
                    <button type="button" className="font-medium text-primary-700 hover:underline" onClick={() => setEditPage(p)}>
                      تعديل عربي / إنجليزي
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'slides' && (
        <section className="space-y-6">
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              await adminApi.createHeroSlide(slideForm);
              setSlideForm({ imageUrl: '', titleAr: '', ctaText: 'تسوق الآن', ctaLink: '/store' });
              load();
            }}
            className="admin-card grid gap-4 p-6 sm:grid-cols-2"
          >
            <h3 className="sm:col-span-2 font-bold">شريحة جديدة</h3>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-600">رابط الصورة *</span>
              <input
                required
                className="input-field"
                dir="ltr"
                placeholder="https://..."
                value={slideForm.imageUrl}
                onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">العنوان</span>
              <input className="input-field" value={slideForm.titleAr} onChange={(e) => setSlideForm({ ...slideForm, titleAr: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">رابط الزر</span>
              <input className="input-field" dir="ltr" value={slideForm.ctaLink} onChange={(e) => setSlideForm({ ...slideForm, ctaLink: e.target.value })} />
            </label>
            <button type="submit" className="btn-primary sm:col-span-2">
              إضافة شريحة
            </button>
          </form>
          <ul className="space-y-2">
            {slides.map((s) => (
              <li key={s.id} className="admin-card flex items-center justify-between gap-4 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <img src={s.imageUrl} alt="" className="h-12 w-20 rounded object-cover" />
                  <span>{s.titleAr || s.imageUrl.slice(0, 48)}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-primary-700 hover:underline" onClick={() => setEditSlide(s)}>
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={async () => {
                      if (await confirmDelete('حذف الشريحة؟')) {
                        await adminApi.deleteHeroSlide(s.id);
                        load();
                      }
                    }}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'pages' && (
        <section className="space-y-6">
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              await adminApi.createCmsPage({
                ...pageForm,
                titleEn: pageForm.titleEn || pageForm.titleAr,
                bodyEn: pageForm.bodyEn || pageForm.bodyAr,
                type: 'custom',
                isPublished: true,
              });
              setPageForm({ slug: '', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' });
              load();
            }}
            className="admin-card space-y-4 p-6"
          >
            <h3 className="font-bold">صفحة جديدة</h3>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">المعرّف (slug) *</span>
              <input
                required
                className="input-field font-mono"
                dir="ltr"
                placeholder="about-us"
                value={pageForm.slug}
                onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">العنوان بالعربية *</span>
                <input
                  required
                  className="input-field"
                  value={pageForm.titleAr}
                  onChange={(e) => setPageForm({ ...pageForm, titleAr: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Title (English)</span>
                <input
                  className="input-field"
                  dir="ltr"
                  value={pageForm.titleEn}
                  onChange={(e) => setPageForm({ ...pageForm, titleEn: e.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">المحتوى بالعربية</span>
              <RichTextEditor
                value={pageForm.bodyAr}
                onChange={(html) => setPageForm({ ...pageForm, bodyAr: html })}
                minHeight="120px"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Content (English)</span>
              <RichTextEditor
                value={pageForm.bodyEn}
                onChange={(html) => setPageForm({ ...pageForm, bodyEn: html })}
                dir="ltr"
                minHeight="120px"
              />
            </label>
            <button type="submit" className="btn-primary">
              إضافة صفحة
            </button>
          </form>
          <ul className="space-y-2">
            {customPages.map((p) => (
              <li key={p.id} className="admin-card flex justify-between p-4 text-sm">
                <span>
                  <span className="font-medium">{p.titleAr}</span>
                  <span className="text-slate-500"> /{p.slug}</span>
                </span>
                <div className="flex gap-2">
                  <button type="button" className="text-primary-700 hover:underline" onClick={() => setEditPage(p)}>
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={async () => {
                      if (await confirmDelete('حذف الصفحة؟')) {
                        await adminApi.deleteCmsPage(p.id);
                        load();
                      }
                    }}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'blog' && (
        <section className="space-y-6">
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              await adminApi.createBlogPost({
                ...blogForm,
                titleEn: blogForm.titleAr,
                bodyEn: blogForm.bodyAr,
                isPublished: true,
              });
              setBlogForm({ slug: '', titleAr: '', bodyAr: '' });
              load();
            }}
            className="admin-card space-y-4 p-6"
          >
            <h3 className="font-bold">مقال جديد</h3>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">slug *</span>
              <input
                required
                className="input-field font-mono"
                dir="ltr"
                value={blogForm.slug}
                onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">العنوان *</span>
              <input
                required
                className="input-field"
                value={blogForm.titleAr}
                onChange={(e) => setBlogForm({ ...blogForm, titleAr: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">المحتوى</span>
              <RichTextEditor
                value={blogForm.bodyAr}
                onChange={(html) => setBlogForm({ ...blogForm, bodyAr: html })}
                minHeight="140px"
              />
            </label>
            <button type="submit" className="btn-primary">
              نشر مقال
            </button>
          </form>
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.id} className="admin-card flex justify-between p-4 text-sm">
                <span>{p.titleAr}</span>
                <div className="flex gap-2">
                  <button type="button" className="text-primary-700 hover:underline" onClick={() => setEditPost(p)}>
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={async () => {
                      if (await confirmDelete('حذف المقال؟')) {
                        await adminApi.deleteBlogPost(p.id);
                        load();
                      }
                    }}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={Boolean(editSlide)} title="تعديل الشريحة" onClose={() => setEditSlide(null)}>
        {editSlide && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await adminApi.updateHeroSlide(editSlide.id, {
                imageUrl: editSlide.imageUrl,
                titleAr: editSlide.titleAr,
                ctaText: editSlide.ctaText,
                ctaLink: editSlide.ctaLink,
              });
              setEditSlide(null);
              load();
            }}
            className="space-y-3"
          >
            <input
              className="input-field"
              dir="ltr"
              value={editSlide.imageUrl}
              onChange={(e) => setEditSlide({ ...editSlide, imageUrl: e.target.value })}
            />
            <input
              className="input-field"
              value={editSlide.titleAr ?? ''}
              onChange={(e) => setEditSlide({ ...editSlide, titleAr: e.target.value })}
            />
            <input
              className="input-field"
              dir="ltr"
              value={editSlide.ctaLink ?? '/store'}
              onChange={(e) => setEditSlide({ ...editSlide, ctaLink: e.target.value })}
            />
            <button type="submit" className="btn-primary">
              حفظ
            </button>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(editPage)}
        title={editPage ? `تعديل: ${POLICY_LABELS[editPage.slug] ?? editPage.titleAr}` : 'تعديل الصفحة'}
        onClose={() => setEditPage(null)}
        wide
      >
        {editPage && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await savePage(editPage);
            }}
            className="space-y-4"
          >
            <p className="text-xs text-slate-500" dir="ltr">
              /pages/{editPage.slug}
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-800">العربية</p>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">العنوان</span>
                  <input
                    className="input-field"
                    required
                    value={editPage.titleAr}
                    onChange={(e) => setEditPage({ ...editPage, titleAr: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">المحتوى</span>
                  <RichTextEditor
                    value={editPage.bodyAr ?? ''}
                    onChange={(html) => setEditPage({ ...editPage, bodyAr: html })}
                    minHeight="280px"
                  />
                </label>
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 p-4" dir="ltr">
                <p className="text-sm font-bold text-slate-800">English</p>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Title</span>
                  <input
                    className="input-field"
                    required
                    value={editPage.titleEn ?? ''}
                    onChange={(e) => setEditPage({ ...editPage, titleEn: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Body</span>
                  <RichTextEditor
                    value={editPage.bodyEn ?? ''}
                    onChange={(html) => setEditPage({ ...editPage, bodyEn: html })}
                    dir="ltr"
                    minHeight="280px"
                  />
                </label>
              </div>
            </div>
            {saveMsg && <p className="text-sm text-slate-600">{saveMsg}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(editPost)} title="تعديل المقال" onClose={() => setEditPost(null)} wide>
        {editPost && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await adminApi.updateBlogPost(editPost.id, {
                titleAr: editPost.titleAr,
                titleEn: editPost.titleAr,
                bodyAr: editPost.bodyAr,
                bodyEn: editPost.bodyAr,
              });
              setEditPost(null);
              load();
            }}
            className="space-y-3"
          >
            <input
              className="input-field"
              value={editPost.titleAr}
              onChange={(e) => setEditPost({ ...editPost, titleAr: e.target.value })}
            />
            <RichTextEditor
              value={editPost.bodyAr ?? ''}
              onChange={(html) => setEditPost({ ...editPost, bodyAr: html })}
              minHeight="220px"
            />
            <button type="submit" className="btn-primary">
              حفظ
            </button>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
