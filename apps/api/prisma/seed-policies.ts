/** Legal policy pages for payment-gateway / storefront compliance (AR + EN). */

export type PolicySeed = {
  slug: string;
  type: 'terms' | 'privacy' | 'shipping' | 'pricing' | 'cancellation';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

export const POLICY_PAGES: PolicySeed[] = [
  {
    slug: 'terms-and-conditions',
    type: 'terms',
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms & Conditions',
    bodyAr: `آخر تحديث: يوليو 2026

١. استخدام الموقع
• يتيح متجر أبو النص أون لاين للمستخدمين تصفح المنتجات وطلبها إلكترونيًا داخل المملكة الأردنية الهاشمية.
• باستخدام الموقع فإنك تقر بأن جميع المعلومات التي تقدمها صحيحة ودقيقة ومحدثة.
• يمنع استخدام الموقع لأي نشاط غير قانوني أو احتيالي أو يسبب ضررًا للموقع أو لمستخدميه.
• يحتفظ المتجر بحق إيقاف أو تقييد استخدام أي مستخدم يخالف هذه الشروط.

٢. إنشاء الطلبات
• تخضع جميع الطلبات لتوفر المنتجات في المخزون.
• يعتبر الطلب مؤكدًا بعد استلام العميل رسالة أو إشعار تأكيد الطلب.
• يحتفظ المتجر بحق رفض أو إلغاء أي طلب في حال وجود معلومات غير صحيحة أو الاشتباه بأي نشاط غير مشروع.
• في حال عدم توفر المنتج بعد إتمام الطلب، سيتم التواصل مع العميل لإيجاد البديل المناسب أو إلغاء الطلب.

٣. الأسعار والتوافر
• جميع الأسعار المعروضة على الموقع بالدينار الأردني (JOD).
• لا تشمل الأسعار رسوم التوصيل إلا إذا تم النص على ذلك بشكل صريح.
• يحتفظ المتجر بحقه الكامل في تعديل الأسعار أو العروض أو المنتجات دون إشعار مسبق.
• قد تختلف حالة توفر المنتجات بحسب المخزون الفعلي وقت معالجة الطلب.
• في حال وجود خطأ تقني أو مطبعي في السعر، يحتفظ المتجر بحق تصحيح الخطأ أو إلغاء الطلب وإبلاغ العميل.

٤. وسائل الدفع
• يوفر المتجر وسائل دفع إلكترونية آمنة بالإضافة إلى خيار الدفع عند الاستلام.
• تتم معالجة المدفوعات الإلكترونية من خلال مزودي خدمات دفع معتمدين.
• لا يحتفظ المتجر ببيانات البطاقات البنكية الخاصة بالعملاء.
• يلتزم العميل باستخدام وسيلة دفع يملك حق استخدامها قانونيًا.

٥. التوصيل والشحن
• يتم التوصيل داخل المملكة الأردنية الهاشمية فقط.
• المدة المتوقعة للتوصيل هي خلال 48 ساعة من تأكيد الطلب.
• رسوم التوصيل:
  - داخل عمّان: 2 دينار أردني.
  - خارج عمّان: من 3 إلى 4 دنانير أردنية حسب المنطقة.
• قد تتأثر مدة التوصيل بسبب الظروف الجوية أو العطل الرسمية أو أي ظروف خارجة عن إرادة المتجر.
• يتحمل العميل مسؤولية إدخال عنوان التوصيل بشكل صحيح.

٦. الإلغاء والاسترجاع
• يمكن للعميل طلب إلغاء الطلب خلال ساعة واحدة من تأكيده.
• لا يمكن إلغاء الطلب بعد بدء إجراءات التجهيز أو الشحن.
• يحق للعميل معاينة الطلب عند التسليم.
• بعد استلام الطلب وقبوله من العميل، لا يقبل المتجر أي طلبات استرجاع أو استبدال.
• في حال وجود تلف ظاهر أو خطأ في الطلب خلال فترة المعاينة وقبل استلام الطلب من العميل، يجب إبلاغ مندوب التوصيل مباشرة لاتخاذ الإجراء المناسب.

٧. الملكية الفكرية
• جميع المحتويات المعروضة على الموقع، بما في ذلك النصوص والصور والتصاميم والشعارات والرسومات، مملوكة لمتجر أبو النص أون لاين أو للجهات المرخصة له.
• يمنع نسخ أو إعادة نشر أو تعديل أو استغلال أي محتوى من الموقع دون موافقة خطية مسبقة.
• أي استخدام غير مصرح به للمحتوى قد يعرض صاحبه للمساءلة القانونية.

٨. حدود المسؤولية
• يبذل المتجر أقصى جهوده لضمان دقة المعلومات المعروضة على الموقع.
• لا يتحمل المتجر المسؤولية عن أي أضرار غير مباشرة أو خسائر ناتجة عن استخدام الموقع.
• لا يتحمل المتجر المسؤولية عن التأخير الناتج عن ظروف خارجة عن إرادته.
• تقتصر مسؤولية المتجر تجاه العميل على قيمة الطلب المدفوعة فقط.

٩. الخصوصية وحماية البيانات
• يخضع جمع واستخدام البيانات الشخصية لسياسة الخصوصية الخاصة بالموقع.
• باستخدام الموقع فإنك توافق على جمع واستخدام البيانات وفقًا لسياسة الخصوصية.

١٠. التعديلات والقانون المطبق
• يحتفظ متجر أبو النص أون لاين بحق تعديل هذه الشروط والأحكام في أي وقت.
• تصبح التعديلات نافذة بمجرد نشرها على الموقع.
• تخضع هذه الشروط والأحكام لقوانين المملكة الأردنية الهاشمية.
• تختص المحاكم الأردنية بالنظر في أي نزاع يتعلق باستخدام الموقع أو الخدمات المقدمة من خلاله.`,
    bodyEn: `Last updated: July 2026

1. Use of the Website
• Abu Al-Nas Online allows users to browse and order products electronically within the Hashemite Kingdom of Jordan.
• By using the website, you confirm that all information you provide is true, accurate, and up to date.
• Using the website for any illegal, fraudulent, or harmful activity is prohibited.
• The store may suspend or restrict any user who violates these terms.

2. Placing Orders
• All orders are subject to product availability in stock.
• An order is confirmed once the customer receives an order confirmation message or notification.
• The store may refuse or cancel any order if information is incorrect or suspicious activity is detected.
• If a product becomes unavailable after an order is placed, the store will contact the customer to arrange a suitable alternative or cancel the order.

3. Prices & Availability
• All prices on the website are in Jordanian Dinars (JOD).
• Prices do not include delivery fees unless explicitly stated.
• The store may change prices, offers, or products without prior notice.
• Availability may change based on actual stock when the order is processed.
• If a technical or typographical pricing error occurs, the store may correct the price or cancel the order and notify the customer.

4. Payment Methods
• The store offers secure electronic payments and cash on delivery.
• Electronic payments are processed through licensed payment providers.
• The store does not store customer bank card details.
• Customers must use a payment method they are legally authorized to use.

5. Delivery & Shipping
• Delivery is available within Jordan only.
• Expected delivery time is within 48 hours of order confirmation.
• Delivery fees:
  - Inside Amman: 2 JOD.
  - Outside Amman: 3 to 4 JOD depending on the area.
• Delivery times may be affected by weather, public holidays, or circumstances beyond the store’s control.
• Customers are responsible for providing a correct delivery address.

6. Cancellation & Returns
• Customers may request cancellation within one hour of order confirmation.
• Orders cannot be cancelled after preparation or shipping has started.
• Customers may inspect the order upon delivery.
• After the customer receives and accepts the order, returns or exchanges are not accepted.
• If there is visible damage or an error during inspection and before acceptance, the customer must inform the delivery agent immediately.

7. Intellectual Property
• All website content—including text, images, designs, logos, and graphics—is owned by Abu Al-Nas Online or its licensors.
• Copying, republishing, modifying, or exploiting any content without prior written consent is prohibited.
• Unauthorized use may result in legal action.

8. Limitation of Liability
• The store makes every effort to ensure information on the website is accurate.
• The store is not liable for indirect damages or losses arising from use of the website.
• The store is not liable for delays caused by circumstances beyond its control.
• The store’s liability to the customer is limited to the amount paid for the order.

9. Privacy & Data Protection
• Collection and use of personal data is governed by the website’s Privacy Policy.
• By using the website, you agree to data collection and use as described in the Privacy Policy.

10. Amendments & Governing Law
• Abu Al-Nas Online may amend these Terms & Conditions at any time.
• Amendments take effect once published on the website.
• These terms are governed by the laws of the Hashemite Kingdom of Jordan.
• Jordanian courts have jurisdiction over any dispute related to the website or its services.`,
  },
  {
    slug: 'privacy-policy',
    type: 'privacy',
    titleAr: 'سياسة الخصوصية',
    titleEn: 'Privacy Policy',
    bodyAr: `١. المعلومات التي نجمعها
• عند استخدامك لمتجر أبو النص أون لاين قد نقوم بجمع بعض المعلومات اللازمة لإتمام الطلبات وتقديم الخدمات.
• تشمل هذه المعلومات:
  - الاسم الكامل.
  - رقم الهاتف.
  - البريد الإلكتروني.
  - عنوان التوصيل.
  - بيانات الطلبات والمشتريات.

٢. كيفية استخدام المعلومات
• نستخدم المعلومات التي يتم جمعها للأغراض التالية:
  - معالجة الطلبات وإتمام عمليات الشراء.
  - التواصل مع العملاء بخصوص الطلبات.
  - تحسين جودة الخدمات وتجربة المستخدم.
  - إرسال التحديثات المتعلقة بالطلبات أو الخدمات.

٣. مشاركة المعلومات
• لا يقوم متجر أبو النص أون لاين ببيع أو تأجير أو مشاركة بيانات العملاء مع أي طرف ثالث لأغراض تسويقية.
• قد تتم مشاركة بعض البيانات مع:
  - شركات الشحن والتوصيل.
  - مزودي خدمات الدفع الإلكتروني.
  - الجهات الحكومية أو القانونية عند الطلب الرسمي.

٤. حماية البيانات
• نتخذ الإجراءات الأمنية المناسبة لحماية البيانات الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح غير المشروع.
• رغم ذلك، لا يمكن ضمان الحماية المطلقة لأي عملية نقل بيانات عبر الإنترنت.

٥. ملفات تعريف الارتباط (Cookies)
• قد يستخدم الموقع ملفات تعريف الارتباط لتحسين تجربة التصفح وتحليل أداء الموقع.
• يمكن للمستخدم التحكم بإعدادات ملفات تعريف الارتباط من خلال المتصفح الخاص به.

٦. حقوق المستخدم
• يحق للمستخدم طلب تحديث أو تصحيح بياناته الشخصية.
• يحق للمستخدم التواصل معنا للاستفسار عن كيفية استخدام بياناته.

٧. التعديلات على سياسة الخصوصية
• يحتفظ المتجر بحق تعديل سياسة الخصوصية في أي وقت.
• تصبح التعديلات نافذة فور نشرها على الموقع.

٨. التواصل معنا
لأي استفسارات تتعلق بسياسة الخصوصية يمكن التواصل معنا عبر صفحة اتصل بنا على الموقع.`,
    bodyEn: `1. Information We Collect
• When you use Abu Al-Nas Online, we may collect information needed to fulfill orders and provide services.
• This may include:
  - Full name.
  - Phone number.
  - Email address.
  - Delivery address.
  - Order and purchase details.

2. How We Use Information
• We use collected information to:
  - Process orders and complete purchases.
  - Contact customers about their orders.
  - Improve service quality and user experience.
  - Send updates related to orders or services.

3. Sharing Information
• Abu Al-Nas Online does not sell, rent, or share customer data with third parties for marketing purposes.
• Some data may be shared with:
  - Shipping and delivery companies.
  - Electronic payment providers.
  - Government or legal authorities upon official request.

4. Data Protection
• We take appropriate security measures to protect personal data from unauthorized access, alteration, or disclosure.
• Absolute security of any internet data transmission cannot be guaranteed.

5. Cookies
• The website may use cookies to improve browsing and analyze performance.
• Users can control cookie settings through their browser.

6. User Rights
• Users may request updates or corrections to their personal data.
• Users may contact us to inquire how their data is used.

7. Privacy Policy Changes
• The store may amend this Privacy Policy at any time.
• Changes take effect once published on the website.

8. Contact Us
For privacy-related inquiries, please use the Contact page on the website.`,
  },
  {
    slug: 'shipping-policy',
    type: 'shipping',
    titleAr: 'سياسة التوصيل والشحن',
    titleEn: 'Shipping & Delivery Policy',
    bodyAr: `١. نطاق التوصيل
• يوفر متجر أبو النص أون لاين خدمات التوصيل داخل المملكة الأردنية الهاشمية فقط.
• ويحتفظ المتجر بحقه في توسيع أو تعديل نطاق التوصيل مستقبلًا والإعلان عن ذلك من خلال الموقع الإلكتروني.

٢. مدة التوصيل
• يتم تسليم الطلبات خلال مدة متوقعة لا تتجاوز 48 ساعة من تأكيد الطلب في الظروف الاعتيادية.

٣. رسوم التوصيل
• داخل عمّان: 2 دينار أردني.
• خارج عمّان: من 3 إلى 4 دنانير أردنية بحسب المنطقة.

٤. مسؤولية العميل
• يتحمل العميل مسؤولية إدخال بيانات صحيحة وكاملة تشمل الاسم ورقم الهاتف وعنوان التوصيل.

٥. حالات التأخير
• قد تتأثر أوقات التسليم بسبب:
  - الأحوال الجوية.
  - العطل الرسمية.
  - الظروف اللوجستية الخارجة عن إرادة المتجر.

٦. تعذر التسليم
• في حال تعذر التواصل مع العميل أو رفض استلام الطلب، يحتفظ المتجر بحقه في إلغاء الطلب أو اتخاذ الإجراءات المناسبة للطلبات المستقبلية.

٧. تأكيد الاستلام
• يعتبر استلام العميل للطلب وموافقته على الاستلام إقرارًا بوصول الطلب بحالة جيدة ومطابقة للطلب المقدم.`,
    bodyEn: `1. Delivery Coverage
• Abu Al-Nas Online delivers within the Hashemite Kingdom of Jordan only.
• The store may expand or change delivery coverage in the future and will announce this on the website.

2. Delivery Time
• Orders are typically delivered within 48 hours of confirmation under normal conditions.

3. Delivery Fees
• Inside Amman: 2 JOD.
• Outside Amman: 3 to 4 JOD depending on the area.

4. Customer Responsibility
• Customers must provide accurate and complete details, including name, phone number, and delivery address.

5. Delays
• Delivery times may be affected by:
  - Weather conditions.
  - Public holidays.
  - Logistics issues beyond the store’s control.

6. Failed Delivery
• If the customer cannot be reached or refuses the order, the store may cancel the order or take appropriate action on future orders.

7. Confirmation of Receipt
• Accepting delivery confirms that the order arrived in good condition and matches what was ordered.`,
  },
  {
    slug: 'pricing-policy',
    type: 'pricing',
    titleAr: 'سياسة الأسعار والخدمات',
    titleEn: 'Pricing & Services Policy',
    bodyAr: `١. العملة المعتمدة
• جميع الأسعار المعروضة على الموقع بالدينار الأردني (JOD).

٢. رسوم التوصيل
• لا تشمل الأسعار رسوم التوصيل ما لم يتم توضيح ذلك صراحةً على صفحة المنتج أو أثناء إتمام الطلب.

٣. تعديل الأسعار
• يحتفظ المتجر بحق تعديل الأسعار أو العروض أو المنتجات المتاحة دون إشعار مسبق.

٤. أخطاء التسعير
• في حال وجود خطأ تقني أو مطبعي في عرض الأسعار، يحتفظ المتجر بحق تعديل السعر أو إلغاء الطلب وإبلاغ العميل.

٥. العروض والخصومات
• تخضع جميع العروض والخصومات لفترة زمنية محددة أو حتى نفاد الكمية.
• يحق للمتجر تعديل أو إيقاف أي عرض في أي وقت.

٦. توفر المنتجات
• تعتمد جميع الطلبات على التوفر الفعلي للمخزون.
• في حال عدم توفر المنتج بعد تأكيد الطلب، سيتم التواصل مع العميل لإيجاد بديل أو إلغاء الطلب.`,
    bodyEn: `1. Currency
• All prices on the website are in Jordanian Dinars (JOD).

2. Delivery Fees
• Prices do not include delivery fees unless clearly stated on the product page or at checkout.

3. Price Changes
• The store may change prices, offers, or available products without prior notice.

4. Pricing Errors
• If a technical or typographical pricing error occurs, the store may correct the price or cancel the order and notify the customer.

5. Offers & Discounts
• All offers and discounts are valid for a limited time or while stocks last.
• The store may modify or stop any offer at any time.

6. Product Availability
• All orders depend on actual stock availability.
• If a product becomes unavailable after confirmation, the store will contact the customer to arrange an alternative or cancel the order.`,
  },
  {
    slug: 'cancellation-policy',
    type: 'cancellation',
    titleAr: 'سياسة إلغاء الطلبات',
    titleEn: 'Order Cancellation Policy',
    bodyAr: `١. مدة الإلغاء
• يحق للعميل طلب إلغاء الطلب خلال ساعة واحدة فقط من وقت تأكيد الطلب.

٢. بدء تجهيز الطلب
• لا يمكن إلغاء الطلب بعد بدء إجراءات التجهيز أو التغليف أو الشحن.

٣. طريقة طلب الإلغاء
• يمكن تقديم طلب الإلغاء من خلال زر إلغاء الطلب المتوفر في المتجر الإلكتروني أو من خلال الاتصال على رقم خدمة العملاء المعتمد والمعلن على الموقع الإلكتروني.
• تخضع طلبات الإلغاء للشروط والأوقات المحددة في هذه السياسة.

٤. استرداد المدفوعات
• إذا تم قبول طلب الإلغاء قبل الشحن وتم الدفع إلكترونيًا، يتم استرداد المبلغ إلى وسيلة الدفع الأصلية.

٥. المدة الزمنية للاسترداد
• قد تستغرق عملية إعادة المبلغ بين 7 و14 يوم عمل وفقًا لسياسات البنك أو مزود خدمة الدفع.`,
    bodyEn: `1. Cancellation Window
• Customers may request order cancellation within one hour of order confirmation only.

2. Order Preparation
• Orders cannot be cancelled after preparation, packing, or shipping has started.

3. How to Cancel
• Cancellation can be requested via the cancel option in the online store or by calling the official customer service number published on the website.
• Cancellation requests are subject to the conditions and time limits in this policy.

4. Refunds
• If cancellation is approved before shipping and payment was made electronically, the amount will be refunded to the original payment method.

5. Refund Timeframe
• Refunds may take 7 to 14 business days depending on the bank or payment provider.`,
  },
];
