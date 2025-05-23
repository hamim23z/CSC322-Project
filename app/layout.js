import { Inter } from "next/font/google";
import "./globals.css";
import AppTheme from "./shared-theme/AppTheme";

// Initialize the Inter font
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Smart Editor4U",
  description: "A LLM used for text editing and recognition.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="__variable_835dce" cz-shortcut-listen="true">
        <AppTheme> {/* Wrap children with AppTheme */}
          {children}
        </AppTheme>
      </body>
    </html>
  );
}