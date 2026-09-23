import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { usersRouter } from './users.routes.js';
import { healthRouter } from './health.routes.js';
import { categoriesRouter, adminCategoriesRouter } from './categories.routes.js';
import { productsRouter, tagsRouter, adminProductsRouter } from './products.routes.js';
import { searchRouter } from './search.routes.js';
import { cartRouter } from './cart.routes.js';
import { checkoutRouter } from './checkout.routes.js';
import { ordersRouter, adminOrdersRouter } from './orders.routes.js';
import { promotionsPublicRouter, adminPromotionsRouter } from './promotions.routes.js';
import { cmsPublicRouter, blogPublicRouter, adminCmsRouter } from './cms.routes.js';
import { packagesRouter, adminPackagesRouter } from './packages.routes.js';
import { adminInventoryRouter } from './inventory.routes.js';
import { reviewsRouter, adminReviewsRouter } from './reviews.routes.js';
import { wishlistRouter } from './wishlist.routes.js';
import { refundsRouter, adminRefundsRouter } from './refunds.routes.js';
import { adminAnalyticsRouter } from './analytics.routes.js';
import { adminAuditRouter } from './audit.routes.js';
import { adminBulkRouter } from './bulk.routes.js';
import { seoRouter } from './seo.routes.js';
import { loyaltyRouter } from './loyalty.routes.js';
import { referralRouter } from './referral.routes.js';
import { newsletterRouter, adminNewsletterRouter } from './newsletter.routes.js';
import { contactRouter, adminContactRouter } from './contact.routes.js';
import { publicRouter, adminSettingsRouter } from './public.routes.js';
import { adminUsersRouter } from './admin-users.routes.js';
import { adminShippingRouter } from './shipping.routes.js';

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/categories', categoriesRouter);
v1Router.use('/products', productsRouter);
v1Router.use('/tags', tagsRouter);
v1Router.use('/search', searchRouter);
v1Router.use('/cart', cartRouter);
v1Router.use('/checkout', checkoutRouter);
v1Router.use('/orders', ordersRouter);
v1Router.use('/admin/categories', adminCategoriesRouter);
v1Router.use('/admin/products', adminProductsRouter);
v1Router.use('/admin/orders', adminOrdersRouter);
v1Router.use('/promotions', promotionsPublicRouter);
v1Router.use('/admin/promotions', adminPromotionsRouter);
v1Router.use('/cms', cmsPublicRouter);
v1Router.use('/blog', blogPublicRouter);
v1Router.use('/admin/cms', adminCmsRouter);
v1Router.use('/packages', packagesRouter);
v1Router.use('/admin/packages', adminPackagesRouter);
v1Router.use('/admin/inventory', adminInventoryRouter);
v1Router.use('/reviews', reviewsRouter);
v1Router.use('/admin/reviews', adminReviewsRouter);
v1Router.use('/wishlist', wishlistRouter);
v1Router.use('/refunds', refundsRouter);
v1Router.use('/admin/refunds', adminRefundsRouter);
v1Router.use('/admin/analytics', adminAnalyticsRouter);
v1Router.use('/admin/audit', adminAuditRouter);
v1Router.use('/admin/bulk', adminBulkRouter);
v1Router.use('/seo', seoRouter);
v1Router.use('/public', publicRouter);
v1Router.use('/loyalty', loyaltyRouter);
v1Router.use('/referral', referralRouter);
v1Router.use('/newsletter', newsletterRouter);
v1Router.use('/admin/newsletter', adminNewsletterRouter);
v1Router.use('/contact', contactRouter);
v1Router.use('/admin/contact-messages', adminContactRouter);
v1Router.use('/admin/settings', adminSettingsRouter);
v1Router.use('/admin/shipping', adminShippingRouter);
v1Router.use('/admin/users', adminUsersRouter);

v1Router.get('/', (_req, res) => {
  res.json({
    name: 'Abu Al-Nas API',
    version: '1.0.0',
    docs: '/api/docs',
  });
});
