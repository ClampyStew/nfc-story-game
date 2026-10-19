import './globals.css';

export const metadata = {
  title: "The Butcher's Maze",
  description: 'Horror story generator with NFC',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}