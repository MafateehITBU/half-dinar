import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { NewsletterForm } from '../NewsletterForm';

export function HomeBottomCta() {
  return (
    <section className="page-shell section-gap !pt-0">
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="panel-dark flex flex-col justify-between p-8 md:p-10"
        >
          <div>
            <span className="hero-badge">
              <Icon icon="mdi:shopping-outline" />
              ابدأ الآن
            </span>
            <h2 className="hero-text-shadow mt-4 font-display text-2xl font-extrabold text-white md:text-3xl">
              جاهز للتسوق؟
            </h2>
            <p className="hero-subtitle mt-3 text-sm">
              تصفّح آلاف المنتجات، أضف للسلة، وادفع بأمان — التوصيل لبابك.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/store" className="btn-accent">
              <Icon icon="mdi:store-outline" />
              المتجر
            </Link>
            <Link to="/contact" className="btn-secondary border-white/25 bg-white/10 !text-white hover:!bg-white/20">
              <Icon icon="mdi:message-text-outline" />
              تواصل
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="surface-elevated flex flex-col justify-center p-8 md:p-10"
        >
          <Icon icon="mdi:email-newsletter" className="text-4xl text-brand-green" />
          <h2 className="mt-4 font-display text-xl font-extrabold text-brand-ink">اشترك في النشرة</h2>
          <p className="mt-2 text-sm text-brand-muted">عروض حصرية ومنتجات جديدة — بدون إزعاج.</p>
          <div className="mt-6">
            <NewsletterForm variant="light" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
