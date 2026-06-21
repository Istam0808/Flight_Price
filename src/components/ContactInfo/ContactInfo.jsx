import styles from './ContactInfo.module.scss';

const CONTACT_GROUPS = [
  {
    title: 'По туризму',
    phones: ['+99891 550 56 76', '+99899 567 56 76'],
  },
  {
    title: 'По авиабилетам',
    phones: ['+99898 222 91 19', '+99891 553 81 15 (Тех поддержка)'],
  },
];

const TELEGRAM_LINKS = [
  {
    label: '@LUMINARA_VOYAGE_OFFICIAL',
    href: 'https://t.me/LUMINARA_VOYAGE_OFFICIAL',
  },
  {
    label: '@AirIata',
    href: 'https://t.me/AirIata',
  },
];

function phoneHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export default function ContactInfo() {
  return (
    <div className={styles.contacts}>
      <h2 className={styles.title}>Контакты для бесплатной консультации</h2>

      <div className={styles.groups}>
        {CONTACT_GROUPS.map((group) => (
          <section key={group.title} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <div className={styles.links}>
              {group.phones.map((phone) => (
                <a key={phone} className={styles.link} href={phoneHref(phone)}>
                  {phone}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Telegram</h3>
        <div className={styles.links}>
          {TELEGRAM_LINKS.map((link) => (
            <a key={link.href} className={styles.link} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
