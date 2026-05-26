import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ULTRA COACH - Treinamento Inteligente",
  description: "Treinador Virtual Inteligente de Carga e Periodização Esportiva. Conecte seu Garmin e otimize seus treinos com ciência.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ULTRA COACH",
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
};

export const viewport: Viewport = {
  themeColor: "#060913",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost') {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister().then(function() {
                        console.log('Service Worker local removido para evitar conflitos no desenvolvimento.');
                      });
                    }
                  });
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(reg) {
                        console.log('Service Worker registrado no escopo:', reg.scope);
                      },
                      function(err) {
                        console.log('Falha ao registrar Service Worker:', err);
                      }
                    );
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
