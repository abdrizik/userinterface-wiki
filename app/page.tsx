import { HomeLayout } from "@/components/layout/home";
import { formatPages, source } from "@/lib/modules/content";

export default function Page() {
  const pages = formatPages(source.getPages());

  return <HomeLayout pages={pages} />;
}
