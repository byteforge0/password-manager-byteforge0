import './globals.css';

export const metadata = {
  title: 'Local Password Manager',
  description: 'A local-first password manager with browser-side encryption.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
