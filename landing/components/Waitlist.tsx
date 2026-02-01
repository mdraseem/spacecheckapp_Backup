'use client'

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { joinWaitlist } from '../app/actions';

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20 disabled:opacity-70 disabled:cursor-not-allowed sm:flex-shrink-0 whitespace-nowrap"
    >
      {pending ? <Loader2 className="animate-spin" /> : <>{text} <ArrowRight size={20} /></>}
    </button>
  );
}

export default function Waitlist({ ctaText, placeholderText }: { ctaText: string, placeholderText: string }) {
  const [state, formAction] = useActionState(joinWaitlist, null);

  if (state?.success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl text-lg font-medium inline-block animate-in fade-in zoom-in duration-300">
        🎉 {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-4 justify-center w-full mx-auto">
      <div className="flex-1 min-w-0 relative">
        <input
          type="email"
          name="email"
          placeholder={placeholderText}
          required
          className="w-full px-6 py-4 rounded-full border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent shadow-sm"
        />
        {state?.message && !state.success && (
            <div className="absolute left-6 -bottom-6 text-sm text-red-500">
                {state.message}
            </div>
        )}
      </div>
      <SubmitButton text={ctaText} />
    </form>
  );
}
