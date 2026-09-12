import './globals.css';

export const metadata = {
  title: 'Duet — a little photo booth for two',
  description: 'An internet photo booth that turns a video call into a physical memory. For besties, couples, and long-distance relationships.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Duet Photobooth',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Duet Photobooth" />
      </head>
      <body data-act="1" data-pelmet="on">
        {children}
      </body>
    </html>
  );
}
