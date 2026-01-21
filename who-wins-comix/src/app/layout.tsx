import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "who-wins comix by Skye <3",
  description: "Cross-universe superhero debates + legal comic reading with kthoom.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
