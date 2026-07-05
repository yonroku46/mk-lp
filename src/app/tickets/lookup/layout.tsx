import { generatePageMetadata } from "@/common/utils/metaUtils";

export const metadata = generatePageMetadata('tickets-lookup');

export default function LookupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
