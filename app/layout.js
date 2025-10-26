import './globals.css';

export const metadata = {
  title: 'The Butcher\'s Maze',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}