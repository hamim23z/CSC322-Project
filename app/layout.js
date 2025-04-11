import { Inter } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import "./globals.css";
import AppTheme from "./shared-theme/AppTheme"; // Import the AppTheme component

// Initialize the Inter font
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "CS322 - LLM",
  description: "Blank for now",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="__variable_835dce" cz-shortcut-listen="true"><StackProvider app={stackServerApp}><StackTheme>
        <AppTheme> {/* Wrap children with AppTheme */}
          {children}
        </AppTheme>
      </StackTheme></StackProvider></body>
    </html>
  );
}