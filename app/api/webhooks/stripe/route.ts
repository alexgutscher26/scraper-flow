import { HandleCheckoutSessionCompleted } from "@/lib/stripe/handleCheckoutSessionCompleted";
import { stripe } from "@/lib/stripe/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createLogger } from "@/lib/log";

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

export async function POST(req: Request, res: Response) {
  const logger = createLogger("api/webhooks/stripe");
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature") as string;

    if (!signature) {
      return new NextResponse("No signature found", { status: 400 });
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse("Webhook secret not configured", { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    logger.info(`@event... ${event.type}`);

    switch (event?.type) {
      case "checkout.session.completed":
        // handle checkout session completed event      
        HandleCheckoutSessionCompleted(event.data.object);
        break;
      // case "payment_intent.payment_failed ":

      default:
        logger.warning(`Unhandled event type: ${event.type}`);
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`stripe webhook error: ${message}`);
    if (message.toLowerCase().includes("aborted") || (error as any)?.name === "AbortError") {
      return new NextResponse("Request aborted", { status: 408 });
    }
    return new NextResponse("Webhook error", { status: 400 });
  }
}

// import { HandleCheckoutSessionCompleted } from "@/lib/stripe/handleCheckoutSessionCompleted";
// import { stripe } from "@/lib/stripe/stripe";
// import { NextApiRequest, NextApiResponse } from "next";
// import { Stripe } from "stripe";

// const buffer = (req: NextApiRequest) => {
//   return new Promise<Buffer>((resolve, reject) => {
//     const chunks: Buffer[] = [];

//     req.on("data", (chunk: Buffer) => {
//       chunks.push(chunk);
//     });

//     req.on("end", () => {
//       resolve(Buffer.concat(chunks));
//     });

//     req.on("error", reject);
//   });
// };

// export async function POST(req: NextApiRequest, res: NextApiResponse<any>) {
//   const signature = req.headers["stripe-signature"] as string;

//   if (!signature) {
//     return res.status(400).json({ error: "No signature found" });
//   }

//   if (!process.env.STRIPE_WEBHOOK_SECRET) {
//     return res.status(500).json({ error: "Webhook secret not configured" });
//   }

//   try {
//     const body = await buffer(req);
//     console.log("@body...", body);
//     console.log("@signature...", signature);
//     const event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );

//     switch (event.type) {
//       case "checkout.session.completed":
//         const session = event.data.object as Stripe.Checkout.Session;
//         await HandleCheckoutSessionCompleted(session);
//         break;

//       default:
//         console.log(`Unhandled event type: ${event.type}`);
//     }
//     return res.status(200).json({ received: true });
//   } catch (error) {
//     console.error("Stripe webhook error:", error);
//     return res.status(400).json({
//       error: "Webhook signature verification failed",
//     });
//   }
// }

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
