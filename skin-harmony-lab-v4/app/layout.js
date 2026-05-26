export const metadata = {
  title: "Skin Harmony Lab",
  description: "Bilim bazlı, reklamsız, dürüst cilt bakımı asistanı",
};
export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Skin Harmony Lab" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#FDF5F8" }}>{children}</body>
    </html>
  );
}
