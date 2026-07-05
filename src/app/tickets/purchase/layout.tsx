import { generatePageMetadata } from "@/common/utils/metaUtils";

export const metadata = generatePageMetadata('tickets-purchase');

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
