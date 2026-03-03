import { supabase } from './supabase'

export type SignUpResult = {
  ok: boolean
  message: string
  userId?: string
}

export const signUp = async (
  email: string,
  password: string,
  role: string
): Promise<SignUpResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error('Signup error:', error)
      return { ok: false, message: error.message || 'Failed to sign up user.' }
    }

    const userId = data.user?.id
    if (!userId) {
      return { ok: false, message: 'Signup completed but no user ID was returned.' }
    }

    const { error: insertError } = await supabase.from('users').insert([
      {
        id: userId,
        email,
        role
      }
    ])

    if (insertError) {
      console.error('Users table insert error:', insertError)
      return { ok: false, message: insertError.message || 'Failed to create user profile.' }
    }

    return {
      ok: true,
      message: 'Signup successful. You can continue to the app.',
      userId
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected signup error.'
    console.error('Unexpected signup error:', err)
    return { ok: false, message }
  }
}
