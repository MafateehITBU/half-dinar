import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
} from '@half-dinar/shared';

const prisma = new PrismaClient();

const ROLE_LABELS: Record<string, { nameAr: string; nameEn: string; description: string }> = {
  [ROLES.SUPER_ADMIN]: {
    nameAr: 'مدير عام',
    nameEn: 'Super Admin',
    description: 'Full system access',
  },
  [ROLES.ADMIN]: {
    nameAr: 'مدير',
    nameEn: 'Admin',
    description: 'Business management',
  },
  [ROLES.MANAGE_PRODUCT]: {
    nameAr: 'إدارة المنتجات',
    nameEn: 'Manage Product',
    description: 'Products, categories, packages, inventory',
  },
  [ROLES.SALES]: {
    nameAr: 'المبيعات',
    nameEn: 'Sales',
    description: 'Orders, customers, promotions',
  },
  [ROLES.INSIGHTS]: {
    nameAr: 'التحليلات',
    nameEn: 'Insights',
    description: 'Read-only analytics',
  },
  [ROLES.CUSTOMER]: {
    nameAr: 'عميل',
    nameEn: 'Customer',
    description: 'Storefront customer',
  },
};

const PERMISSION_LABELS: Record<
  string,
  { nameAr: string; nameEn: string; description: string }
> = {
  [PERMISSIONS.PRODUCTS_READ]: { nameAr: 'قراءة المنتجات', nameEn: 'Read Products', description: '' },
  [PERMISSIONS.PRODUCTS_WRITE]: { nameAr: 'كتابة المنتجات', nameEn: 'Write Products', description: '' },
  [PERMISSIONS.CATEGORIES_READ]: { nameAr: 'قراءة التصنيفات', nameEn: 'Read Categories', description: '' },
  [PERMISSIONS.CATEGORIES_WRITE]: { nameAr: 'كتابة التصنيفات', nameEn: 'Write Categories', description: '' },
  [PERMISSIONS.PACKAGES_READ]: { nameAr: 'قراءة الباقات', nameEn: 'Read Packages', description: '' },
  [PERMISSIONS.PACKAGES_WRITE]: { nameAr: 'كتابة الباقات', nameEn: 'Write Packages', description: '' },
  [PERMISSIONS.INVENTORY_READ]: { nameAr: 'قراءة المخزون', nameEn: 'Read Inventory', description: '' },
  [PERMISSIONS.INVENTORY_WRITE]: { nameAr: 'كتابة المخزون', nameEn: 'Write Inventory', description: '' },
  [PERMISSIONS.ORDERS_READ]: { nameAr: 'قراءة الطلبات', nameEn: 'Read Orders', description: '' },
  [PERMISSIONS.ORDERS_WRITE]: { nameAr: 'كتابة الطلبات', nameEn: 'Write Orders', description: '' },
  [PERMISSIONS.CUSTOMERS_READ]: { nameAr: 'قراءة العملاء', nameEn: 'Read Customers', description: '' },
  [PERMISSIONS.CUSTOMERS_WRITE]: { nameAr: 'كتابة العملاء', nameEn: 'Write Customers', description: '' },
  [PERMISSIONS.PROMOTIONS_READ]: { nameAr: 'قراءة العروض', nameEn: 'Read Promotions', description: '' },
  [PERMISSIONS.PROMOTIONS_WRITE]: { nameAr: 'كتابة العروض', nameEn: 'Write Promotions', description: '' },
  [PERMISSIONS.CMS_READ]: { nameAr: 'قراءة المحتوى', nameEn: 'Read CMS', description: '' },
  [PERMISSIONS.CMS_WRITE]: { nameAr: 'كتابة المحتوى', nameEn: 'Write CMS', description: '' },
  [PERMISSIONS.ANALYTICS_READ]: { nameAr: 'قراءة التحليلات', nameEn: 'Read Analytics', description: '' },
  [PERMISSIONS.USERS_READ]: { nameAr: 'قراءة المستخدمين', nameEn: 'Read Users', description: '' },
  [PERMISSIONS.USERS_WRITE]: { nameAr: 'كتابة المستخدمين', nameEn: 'Write Users', description: '' },
  [PERMISSIONS.SETTINGS_READ]: { nameAr: 'قراءة الإعدادات', nameEn: 'Read Settings', description: '' },
  [PERMISSIONS.SETTINGS_WRITE]: { nameAr: 'كتابة الإعدادات', nameEn: 'Write Settings', description: '' },
  [PERMISSIONS.AUDIT_READ]: { nameAr: 'قراءة السجلات', nameEn: 'Read Audit Logs', description: '' },
  [PERMISSIONS.REFUNDS_READ]: { nameAr: 'قراءة المرتجعات', nameEn: 'Read Refunds', description: '' },
  [PERMISSIONS.REFUNDS_WRITE]: { nameAr: 'كتابة المرتجعات', nameEn: 'Write Refunds', description: '' },
};

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function main() {
  console.log('Seeding permissions...');
  const permissionRecords = await Promise.all(
    Object.values(PERMISSIONS).map((slug) =>
      prisma.permission.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          nameAr: PERMISSION_LABELS[slug].nameAr,
          nameEn: PERMISSION_LABELS[slug].nameEn,
          description: PERMISSION_LABELS[slug].description,
        },
      }),
    ),
  );

  const permissionBySlug = Object.fromEntries(
    permissionRecords.map((p) => [p.slug, p]),
  );

  console.log('Seeding roles...');
  for (const [slug, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const labels = ROLE_LABELS[slug];
    const role = await prisma.role.upsert({
      where: { slug },
      update: {
        nameAr: labels.nameAr,
        nameEn: labels.nameEn,
        description: labels.description,
      },
      create: {
        slug,
        nameAr: labels.nameAr,
        nameEn: labels.nameEn,
        description: labels.description,
        isSystem: true,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (perms.length > 0) {
      await prisma.rolePermission.createMany({
        data: perms.map((permSlug) => ({
          roleId: role.id,
          permissionId: permissionBySlug[permSlug].id,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log('Seeding default settings...');
  const defaultSettings = [
    { key: 'free_shipping_threshold', value: 50 },
    { key: 'default_low_stock_threshold', value: 5 },
    { key: 'refund_window_days', value: 14 },
    { key: 'loyalty_earn_rate', value: 1 },
    { key: 'loyalty_redeem_rate', value: 100 },
    { key: 'referral_referrer_reward_jod', value: 5 },
    { key: 'referral_referee_discount_jod', value: 5 },
    { key: 'ga4_measurement_id', value: '' },
    { key: 'meta_pixel_id', value: '' },
    { key: 'cookie_banner_text_ar', value: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل الزيارات.' },
    { key: 'cookie_banner_text_en', value: 'We use cookies to improve your experience and analyze traffic.' },
    { key: 'store_name_ar', value: 'موجود' },
    { key: 'store_name_en', value: 'MawJooD' },
    { key: 'currency', value: 'JOD' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@abou-al-nas.local';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'Admin123!ChangeMe';

  console.log('Seeding super admin user...');
  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { slug: ROLES.SUPER_ADMIN },
  });
  const customerRole = await prisma.role.findUniqueOrThrow({
    where: { slug: ROLES.CUSTOMER },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      ageConfirmed: true,
      emailVerifiedAt: new Date(),
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      locale: 'ar',
      ageConfirmed: true,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({ where: { userId: adminUser.id } });
  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: superAdminRole.id },
      { userId: adminUser.id, roleId: customerRole.id },
    ],
    skipDuplicates: true,
  });

  await prisma.loyaltyAccount.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id, pointsBalance: 0 },
  });

  console.log('Seeding catalog...');
  const homeCat = await prisma.category.upsert({
    where: { slug: 'home-essentials' },
    update: {},
    create: {
      slug: 'home-essentials',
      nameAr: 'مستلزمات المنزل',
      nameEn: 'Home Essentials',
      descriptionAr: 'كل ما تحتاجه للمنزل يومياً',
      descriptionEn: 'Everything you need for daily home use',
      sortOrder: 1,
      isActive: true,
    },
  });

  const cleaningCat = await prisma.category.upsert({
    where: { slug: 'cleaning' },
    update: {},
    create: {
      slug: 'cleaning',
      nameAr: 'التنظيف',
      nameEn: 'Cleaning',
      parentId: homeCat.id,
      sortOrder: 1,
      isActive: true,
    },
  });

  const kitchenCat = await prisma.category.upsert({
    where: { slug: 'kitchen' },
    update: {},
    create: {
      slug: 'kitchen',
      nameAr: 'المطبخ',
      nameEn: 'Kitchen',
      parentId: homeCat.id,
      sortOrder: 2,
      isActive: true,
    },
  });

  const bathroomCat = await prisma.category.upsert({
    where: { slug: 'bathroom' },
    update: {},
    create: {
      slug: 'bathroom',
      nameAr: 'الحمام والعناية',
      nameEn: 'Bathroom & Personal Care',
      parentId: homeCat.id,
      sortOrder: 3,
      isActive: true,
    },
  });

  const tagBest = await prisma.tag.upsert({
    where: { slug: 'best-seller' },
    update: {},
    create: { slug: 'best-seller', nameAr: 'الأكثر مبيعاً', nameEn: 'Best Seller' },
  });

  const tagNew = await prisma.tag.upsert({
    where: { slug: 'new' },
    update: {},
    create: { slug: 'new', nameAr: 'جديد', nameEn: 'New' },
  });

  const { SEED_CATALOG_PRODUCTS } = await import('./seed-catalog.js');
  const categoryBySlug = {
    cleaning: cleaningCat.id,
    kitchen: kitchenCat.id,
    'home-essentials': homeCat.id,
    bathroom: bathroomCat.id,
  } as const;
  const tagBySlug = { 'best-seller': tagBest.id, new: tagNew.id };

  for (const p of SEED_CATALOG_PRODUCTS) {
    const categoryId = categoryBySlug[p.categorySlug];
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stockQuantity: p.stock,
        isFeatured: p.featured,
        categoryId,
        isActive: true,
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        categoryId,
        stockQuantity: p.stock,
        isFeatured: p.featured,
        isActive: true,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: { productId: product.id, url: p.image, sortOrder: 0 },
    });

    await prisma.productTag.deleteMany({ where: { productId: product.id } });
    if (p.tagSlugs.length) {
      await prisma.productTag.createMany({
        data: p.tagSlugs.map((slug) => ({
          productId: product.id,
          tagId: tagBySlug[slug],
        })),
      });
    }
  }

  const prod1 = await prisma.product.findFirst({ where: { sku: 'HD-001' } });
  const prod2 = await prisma.product.findFirst({ where: { sku: 'HD-002' } });
  if (prod1 && prod2) {
    const bundle = await prisma.package.upsert({
      where: { slug: 'cleaning-bundle' },
      update: {
        price: 6.5,
        isActive: true,
        imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/juice/thumbnail.webp',
      },
      create: {
        slug: 'cleaning-bundle',
        nameAr: 'باقة التنظيف',
        nameEn: 'Cleaning Bundle',
        descriptionAr: 'سائل جلي + منظف متعدد الأسطح — وفر أكثر',
        descriptionEn: 'Dish soap + multi-surface cleaner bundle',
        imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/juice/thumbnail.webp',
        price: 6.5,
        isActive: true,
      },
    });
    await prisma.packageItem.upsert({
      where: { packageId_productId: { packageId: bundle.id, productId: prod1.id } },
      update: { quantity: 1 },
      create: { packageId: bundle.id, productId: prod1.id, quantity: 1 },
    });
    await prisma.packageItem.upsert({
      where: { packageId_productId: { packageId: bundle.id, productId: prod2.id } },
      update: { quantity: 1 },
      create: { packageId: bundle.id, productId: prod2.id, quantity: 1 },
    });
  }

  const prod3 = await prisma.product.findFirst({ where: { sku: 'HD-003' } });
  const prod11 = await prisma.product.findFirst({ where: { sku: 'HD-011' } });
  if (prod3 && prod11) {
    const kitchenBundle = await prisma.package.upsert({
      where: { slug: 'kitchen-essentials' },
      update: {
        price: 6.99,
        isActive: true,
        imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/tissue-paper-box/thumbnail.webp',
      },
      create: {
        slug: 'kitchen-essentials',
        nameAr: 'باقة أساسيات المطبخ',
        nameEn: 'Kitchen Essentials Bundle',
        descriptionAr: 'مناديل مطبخ + ورق ألومنيوم — عرض عائلي',
        descriptionEn: 'Kitchen towels + aluminum foil bundle',
        imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/tissue-paper-box/thumbnail.webp',
        price: 6.99,
        isActive: true,
      },
    });
    await prisma.packageItem.upsert({
      where: { packageId_productId: { packageId: kitchenBundle.id, productId: prod3.id } },
      update: { quantity: 1 },
      create: { packageId: kitchenBundle.id, productId: prod3.id, quantity: 1 },
    });
    await prisma.packageItem.upsert({
      where: { packageId_productId: { packageId: kitchenBundle.id, productId: prod11.id } },
      update: { quantity: 1 },
      create: { packageId: kitchenBundle.id, productId: prod11.id, quantity: 1 },
    });
  }

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      minOrderValue: 5,
      perUserLimit: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      type: 'free_shipping',
      value: 0,
      minOrderValue: 20,
      perUserLimit: 3,
      isActive: true,
    },
  });

  const flashProduct = await prisma.product.findFirst({ where: { sku: 'HD-001' } });
  if (flashProduct) {
    const campaign = await prisma.campaign.upsert({
      where: { id: '00000000-0000-4000-8000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Flash Sale — تنظيف',
        type: 'flash',
        startsAt: new Date(Date.now() - 86400000),
        endsAt: new Date(Date.now() + 7 * 86400000),
        isActive: true,
      },
    });
    await prisma.campaignProduct.upsert({
      where: { campaignId_productId: { campaignId: campaign.id, productId: flashProduct.id } },
      update: { discountPercent: 15 },
      create: { campaignId: campaign.id, productId: flashProduct.id, discountPercent: 15 },
    });
  }

  await prisma.heroSlide.deleteMany({});
  await prisma.heroSlide.createMany({
    data: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
        titleAr: 'منتجات يومية بأسعار مميزة',
        titleEn: 'Daily essentials at great prices',
        ctaText: 'تسوق الآن',
        ctaLink: '/store',
        sortOrder: 0,
        isActive: true,
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80',
        titleAr: 'توصيل لجميع أنحاء الأردن',
        titleEn: 'Delivery across Jordan',
        ctaText: 'اكتشف العروض',
        ctaLink: '/store',
        sortOrder: 1,
        isActive: true,
      },
    ],
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      slug: 'about',
      type: 'about',
      titleAr: 'من نحن',
      titleEn: 'About Us',
      bodyAr: 'ابو النص — متجر أردني للمنتجات اليومية بجودة عالية وأسعار مناسبة.',
      bodyEn: 'Abu Al-Nas — a Jordanian store for quality daily products at fair prices.',
    },
  });

  const { POLICY_PAGES } = await import('./seed-policies.js');
  console.log('Seeding legal policy pages...');
  for (const page of POLICY_PAGES) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {
        type: page.type,
        titleAr: page.titleAr,
        titleEn: page.titleEn,
        bodyAr: page.bodyAr,
        bodyEn: page.bodyEn,
      },
      create: page,
    });
  }

  await prisma.faq.deleteMany({});
  await prisma.faq.createMany({
    data: [
      {
        questionAr: 'ما مدة التوصيل؟',
        questionEn: 'How long is delivery?',
        answerAr: 'عادة 1-3 أيام عمل داخل عمان، 2-5 أيام للمحافظات الأخرى.',
        answerEn: 'Usually 1-3 business days in Amman, 2-5 for other governorates.',
        sortOrder: 0,
      },
      {
        questionAr: 'هل يمكن الدفع عند الاستلام؟',
        questionEn: 'Is COD available?',
        answerAr: 'نعم، الدفع عند الاستلام متاح لجميع الطلبات.',
        answerEn: 'Yes, cash on delivery is available for all orders.',
        sortOrder: 1,
      },
    ],
  });

  await prisma.blogPost.upsert({
    where: { slug: 'welcome-abou-al-nas' },
    update: {},
    create: {
      slug: 'welcome-abou-al-nas',
      titleAr: 'مرحباً بكم في ابو النص',
      titleEn: 'Welcome to Abu Al-Nas',
      excerptAr: 'افتتاح متجرنا الإلكتروني',
      excerptEn: 'Our online store launch',
      bodyAr: 'نحن سعداء بإطلاق متجر ابو النص الإلكتروني لخدمتكم في جميع أنحاء الأردن.',
      bodyEn: 'We are happy to launch Abu Al-Nas online store to serve you across Jordan.',
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.setting.upsert({
    where: { key: 'footer_phone' },
    update: { value: '+962 79 000 0000' },
    create: { key: 'footer_phone', value: '+962 79 000 0000' },
  });
  await prisma.setting.upsert({
    where: { key: 'footer_email' },
    update: { value: 'info@abou-al-nas.local' },
    create: { key: 'footer_email', value: 'info@abou-al-nas.local' },
  });
  await prisma.setting.upsert({
    where: { key: 'footer_address_ar' },
    update: { value: 'عمان، الأردن' },
    create: { key: 'footer_address_ar', value: 'عمان، الأردن' },
  });

  console.log('Seeding shipping zones (Jordan)...');
  const governorates = [
    { code: 'AM', nameAr: 'عمان', nameEn: 'Amman', rate: 2.5 },
    { code: 'IR', nameAr: 'إربد', nameEn: 'Irbid', rate: 3.5 },
    { code: 'ZA', nameAr: 'الزرقاء', nameEn: 'Zarqa', rate: 3 },
    { code: 'BA', nameAr: 'البلقاء', nameEn: 'Balqa', rate: 3 },
    { code: 'MA', nameAr: 'المفرق', nameEn: 'Mafraq', rate: 4 },
    { code: 'AJ', nameAr: 'عجلون', nameEn: 'Ajloun', rate: 3.5 },
    { code: 'JR', nameAr: 'جرش', nameEn: 'Jerash', rate: 3.5 },
    { code: 'MD', nameAr: 'مادبا', nameEn: 'Madaba', rate: 3 },
    { code: 'KA', nameAr: 'الكرك', nameEn: 'Karak', rate: 4.5 },
    { code: 'AT', nameAr: 'الطفيلة', nameEn: 'Tafilah', rate: 5 },
    { code: 'MN', nameAr: 'معان', nameEn: 'Ma\'an', rate: 5 },
    { code: 'AQ', nameAr: 'العقبة', nameEn: 'Aqaba', rate: 4.5 },
  ];

  for (const gov of governorates) {
    const zone = await prisma.shippingZone.upsert({
      where: { governorateCode: gov.code },
      update: { nameAr: gov.nameAr, nameEn: gov.nameEn, isActive: true },
      create: {
        nameAr: gov.nameAr,
        nameEn: gov.nameEn,
        governorateCode: gov.code,
        isActive: true,
      },
    });

    const existingRate = await prisma.shippingRate.findFirst({ where: { zoneId: zone.id } });
    if (existingRate) {
      await prisma.shippingRate.update({
        where: { id: existingRate.id },
        data: { flatRate: gov.rate },
      });
    } else {
      await prisma.shippingRate.create({
        data: { zoneId: zone.id, flatRate: gov.rate },
      });
    }
  }

  console.log('Indexing products in Meilisearch...');
  const { searchService } = await import('../src/application/services/search.service.js');
  await searchService.init();
  await searchService.reindexAll();

  console.log('Seed complete.');
  console.log(`Super Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
