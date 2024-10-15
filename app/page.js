import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const VideoAnalyzer = dynamic(() => import('@/components/VideoAnalyzer'), { ssr: false });
const ClientComponent = dynamic(() => import('@/components/ClientComponent'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Video Analyzer</h1>
      <Suspense fallback={<div>Loading Video Analyzer...</div>}>
        <VideoAnalyzer />
      </Suspense>
      <Suspense fallback={<div>Loading Client Component...</div>}>
        <ClientComponent />
      </Suspense>
    </main>
  );
}