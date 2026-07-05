import { generatePageMetadata } from "@/common/utils/metaUtils";

export const metadata = generatePageMetadata('tickets');

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
