import "@supabase/functions-js/edge-runtime.d.ts"

const deno = (globalThis as any).Deno as {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  const secretKey = deno.env.get("PAYSTACK_SECRET_KEY")
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: "Missing PAYSTACK_SECRET_KEY" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }

  const { amount, email } = await req.json()

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Number(amount) * 100, // Paystack uses kobo/pesewas
    }),
  })

  const data = await response.json()

  return new Response(JSON.stringify(data), {
    status: response.ok ? 200 : response.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})
