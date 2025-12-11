"use client";

import { NavigationMenu } from "@base-ui-components/react/navigation-menu";
import Link from "next/link";
import styles from "./styles.module.css";

const LINKS = [
  { href: "/react/overview", title: "X (Twitter)" },
  { href: "/react/handbook", title: "GitHub" },
  { href: "", title: "Support   " },
];

export default function Navigation() {
  return (
    <NavigationMenu.Root className={styles.root}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          ui.wiki
        </Link>
        <NavigationMenu.List className={styles.list}>
          {LINKS.map((link) => (
            <NavigationMenu.Item key={link.title}>
              <NavigationMenu.Link className={styles.trigger} href={link.href}>
                {link.title}
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>
      </div>
    </NavigationMenu.Root>
  );
}
