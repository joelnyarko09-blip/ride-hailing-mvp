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

  const payload = await req.json()
  const reference = payload?.reference

  if (!reference || typeof reference !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing payment reference" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }

  const paystackResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    },
  )

  const data = await paystackResponse.json()
  const paid = Boolean(
    paystackResponse.ok &&
    data?.status === true &&
    data?.data?.status === "success",
  )

  return new Response(
    JSON.stringify({ paid, data }),
    {
      status: paystackResponse.ok ? 200 : paystackResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  )
})
