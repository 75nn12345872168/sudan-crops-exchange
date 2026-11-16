import AdminUpdateForm from "@/components/AdminUpdateForm";

export const dynamic = "force-dynamic";

function getTodaySudanIso(): string {
  const now = new Date();
  const sudanMs = now.getTime() + 2 * 60 * 60 * 1000;
  return new Date(sudanMs).toISOString().slice(0, 10);
}

export default function AdminUpdatePage() {
  return <AdminUpdateForm defaultDate={getTodaySudanIso()} />;
}
