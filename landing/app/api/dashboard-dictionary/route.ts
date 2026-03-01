import { NextRequest, NextResponse } from 'next/server';
import dashboardEn from '@/dictionaries/dashboard-en.json';
import dashboardPl from '@/dictionaries/dashboard-pl.json';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lang = searchParams.get('lang') || 'en';

  const dict = lang === 'pl' ? dashboardPl : dashboardEn;

  return NextResponse.json(dict);
}
