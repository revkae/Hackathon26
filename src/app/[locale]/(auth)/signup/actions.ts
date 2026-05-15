'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resend } from '@/lib/resend';
import { env } from '@/lib/env';
import Welcome from '../../../../../emails/welcome';

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const businessName = formData.get('businessName') as string;

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { business_name: businessName } },
  });
  if (error) return { error: error.message };

  // Send welcome email (Resend) - non-blocking on failure
  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'KOBİ Kaptanı\'na hoş geldin ⚓',
      react: Welcome({ businessName }),
    });
  } catch (e) {
    console.error('Welcome email failed:', e);
  }

  redirect('/tr/dashboard');
}
