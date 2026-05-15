import { ChatPanel } from '@/components/ChatPanel';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="h-[calc(100vh-8rem)] -m-8">
      <div className="grid grid-cols-3 h-full">
        <div className="col-span-2 border-r">
          <div className="p-4 border-b">
            <h1 className="font-semibold">Kaptan ile Sohbet</h1>
          </div>
          <ChatPanel locale={locale} />
        </div>
        <aside className="p-4">
          <h2 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Canlı Trace</h2>
          <p className="text-sm text-muted-foreground">Sorunu gönder, ajan zinciri burada görünür.</p>
        </aside>
      </div>
    </div>
  );
}
