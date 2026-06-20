import './globals.scss';

export const metadata = {
  title: 'LUMINARA VOYAGE',
  description: 'Прайс-лист авиабилетов LUMINARA VOYAGE',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
