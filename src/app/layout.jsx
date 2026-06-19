import './globals.scss';

export const metadata = {
  title: 'Flight Price List',
  description: 'Прайс-лист авиабилетов по выбранной авиакомпании',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
