import { generatePageMetadata } from "@/common/utils/metaUtils";

export const metadata = generatePageMetadata('benkyo');

export default function BenkyoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
