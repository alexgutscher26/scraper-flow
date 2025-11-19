import { HandleCheckoutSessionCompleted } from '@/lib/stripe/handleCheckoutSessionCompleted';
import { headers } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { createLogger } from '@/lib/log';
import { getEnv, formatEnvError } from '@/lib/env';
import Stripe from 'stripe';

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

/**
 * Handles incoming POST requests for Stripe webhooks.
 *
 * The function retrieves the request body and the Stripe signature from the headers, validates the signature,
 * and constructs a Stripe event. It processes the event based on its type, logging relevant information and
 * handling specific events like 'checkout.session.completed'. In case of errors, it logs the error and returns
 * appropriate HTTP responses based on the error type.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @returns A NextResponse indicating the result of the webhook processing.
 * @throws Error If there is an issue with the request processing or event handling.
 */
export async function POST(req: NextRequest) {
  const logger = createLogger('api/webhooks/stripe');
  try {
    const env = getEnv();
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    if (!signature) {
      return new NextResponse('No signature found', { status: 400 });
    }
    const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    });

    const event = stripeClient.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    logger.info(`@event... ${event.type}`);

    switch (event?.type) {
      case 'checkout.session.completed':
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
    if (message.toLowerCase().includes('aborted') || (error as any)?.name === 'AbortError') {
      return new NextResponse('Request aborted', { status: 408 });
    }
    const envMsg = formatEnvError(error);
    if (envMsg.includes('Environment validation failed')) {
      return new NextResponse(envMsg, { status: 500 });
    }
    return new NextResponse('Webhook error', { status: 400 });
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
