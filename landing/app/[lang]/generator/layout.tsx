import React from "react";
import { getDictionary } from '../../../get-dictionary';
import type { Metadata } from 'next';
import '../../globals.css';
import GeneratorPage from './page'; // Directly import the client page component

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as 'en' | 'pl'); // Cast to known locales
  return {
    title: dict.generator.headerTitle,
    description: dict.generator.headerSubtitle,
  };
}

export default async function GeneratorLayout({ params }: Props) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as 'en' | 'pl'); // Cast to known locales
  const generatorDict = dict.generator; // Pass only the relevant part of the dictionary

  return (
    <>
      <GeneratorPage dict={generatorDict} lang={resolvedParams.lang} />
    </>
  );
}