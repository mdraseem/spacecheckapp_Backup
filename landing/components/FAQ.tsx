import { Plus, Minus } from 'lucide-react';
import SectionTracker from './SectionTracker';

export default function FAQ({ dict }: { dict: any }) {
  const faqs = [
    {
      question: dict.faq.q1,
      answer: dict.faq.a1
    },
    {
      question: dict.faq.q2,
      answer: dict.faq.a2
    },
    {
      question: dict.faq.q3,
      answer: dict.faq.a3
    },
    {
      question: dict.faq.q4,
      answer: dict.faq.a4
    },
    {
      question: dict.faq.q5,
      answer: dict.faq.a5
    }
  ];

  return (
    <SectionTracker sectionName="faq" event="faq_section_viewed">
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">{dict.faq.title}</h2>
            <p className="text-gray-600">
              {dict.faq.subtitle}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-primary mb-2 flex items-start gap-3">
                  <span className="text-secondary font-mono">Q.</span>
                  {faq.question}
                </h3>
                <p className="text-gray-600 pl-8 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionTracker>
  );
}