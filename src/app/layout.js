import "./globals.css";

export const metadata = {
  title: "Financeiro 2026",
  description: "Controle Pessoal Financeiro Monólito",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
