import { generatePageMetadata } from "@/common/utils/metaUtils";

export const metadata = generatePageMetadata('tickets-pin-change');

export default function PinChangeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
