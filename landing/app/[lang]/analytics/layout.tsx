import React from "react";
import type { Metadata } from 'next';
import '../../globals.css';
import AnalyticsPage from './page';

type Props = {
  params: Promise<{ lang: string }>;
};

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Furnite AR',
  description: 'Track AR furniture scanning analytics and user behavior',
};

export default async function AnalyticsLayout({ params }: Props) {
  const resolvedParams = await params;

  return (
    <>
      <AnalyticsPage lang={resolvedParams.lang} />
    </>
  );
}
