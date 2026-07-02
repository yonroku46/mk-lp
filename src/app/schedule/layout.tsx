import { generatePageMetadata } from "@/common/utils/metaUtils";

export const metadata = generatePageMetadata('schedule');

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
